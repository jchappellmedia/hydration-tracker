/* ===========================================================================
   CCAT Prep — accounts, entitlements and checkout.

   Exposes window.Account. The rest of the app asks it one question —
   Account.isPro() — and never talks to Supabase or Stripe directly.

   Honest caveat: this file runs in the user's browser, so the *gate* is
   client-side and someone determined can edit it away. What is not fakeable is
   the *payment*: entitlement rows are written only by the Stripe webhook using
   the service-role key, and RLS lets a user read their own row and nothing
   else. So "did this person pay?" is always a server-side fact.
   =========================================================================== */
(function () {
  "use strict";

  const CFG = window.CCAT_CONFIG || {};
  const listeners = [];

  let sb = null;
  let readyResolve;

  const Account = {
    user: null,
    entitlement: null,
    /** Resolves once the initial session + entitlement lookup has settled. */
    ready: new Promise((r) => { readyResolve = r; }),
    /** True when the backend is unreachable or unconfigured. */
    offline: false,

    /* ---------------- state ---------------- */

    isSignedIn() { return !!this.user; },

    isPro() {
      const e = this.entitlement;
      if (!e || e.status !== "active") return false;
      if (!e.expires_at) return true; // lifetime
      return new Date(e.expires_at) > new Date();
    },

    planLabel() {
      if (!this.isPro()) return "Free";
      return this.entitlement.plan === "lifetime" ? "Lifetime Pro" : "Pro · Sprint";
    },

    /** Days left on a sprint pass, or null for lifetime / free. */
    daysLeft() {
      const e = this.entitlement;
      if (!this.isPro() || !e.expires_at) return null;
      const ms = new Date(e.expires_at) - new Date();
      return Math.max(0, Math.ceil(ms / 86400000));
    },

    onChange(fn) { listeners.push(fn); return fn; },

    /* ---------------- auth ---------------- */

    async signUp(email, password) {
      requireBackend();
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) throw new Error(friendly(error));
      // Projects with email confirmation on return a user but no session.
      if (!data.session) {
        return { needsConfirmation: true };
      }
      return { needsConfirmation: false };
    },

    async signIn(email, password) {
      requireBackend();
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw new Error(friendly(error));
    },

    async signOut() {
      if (sb) await sb.auth.signOut();
    },

    async resetPassword(email) {
      requireBackend();
      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: location.origin + location.pathname,
      });
      if (error) throw new Error(friendly(error));
    },

    /* ---------------- billing ---------------- */

    /**
     * Sends the user to the Stripe Payment Link for `plan`. The link carries
     * the price on Stripe's side; we attach the buyer's user id as
     * client_reference_id so the webhook knows whose account to upgrade.
     */
    async checkout(plan) {
      if (!this.user) throw new Error("Create an account first — it's how we attach your purchase to you.");

      const link = (CFG.PAYMENT_LINKS || {})[plan];
      if (!link) throw new Error("This plan isn't available right now.");

      const url = new URL(link);
      url.searchParams.set("client_reference_id", this.user.id);
      if (this.user.email) url.searchParams.set("prefilled_email", this.user.email);
      location.href = url.toString();
    },

    /** Re-reads the entitlement — used after returning from Stripe. */
    async refresh() {
      await loadEntitlement();
      emit();
      return this.isPro();
    },

    /**
     * After Stripe redirects back, the webhook may still be in flight. Poll
     * briefly rather than telling a paying customer they aren't Pro.
     */
    async waitForEntitlement(attempts = 8) {
      for (let i = 0; i < attempts; i++) {
        if (await this.refresh()) return true;
        await new Promise((r) => setTimeout(r, 1000 + i * 500));
      }
      return false;
    },

    /* ---------------- progress sync (Pro perk) ---------------- */

    async pushProgress(data) {
      if (!sb || !this.user || !this.isPro()) return;
      const { error } = await sb.from("ccat_progress").upsert({
        user_id: this.user.id, data, updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" });
      if (error) console.warn("progress push failed", error);
    },

    async pullProgress() {
      if (!sb || !this.user || !this.isPro()) return null;
      const { data, error } = await sb.from("ccat_progress")
        .select("data").eq("user_id", this.user.id).maybeSingle();
      if (error) { console.warn("progress pull failed", error); return null; }
      return data ? data.data : null;
    },
  };

  /* ---------------- internals ---------------- */

  function requireBackend() {
    if (!sb) throw new Error("Can't reach the accounts service. Check your connection and reload.");
  }

  function friendly(error) {
    const m = (error && error.message) || "Something went wrong.";
    if (/invalid login credentials/i.test(m)) return "That email and password don't match an account.";
    if (/user already registered/i.test(m))   return "There's already an account with that email — sign in instead.";
    if (/password should be/i.test(m))        return "Passwords need to be at least 6 characters.";
    return m;
  }

  function emit() {
    listeners.forEach((fn) => { try { fn(Account); } catch (e) { console.warn(e); } });
  }

  async function loadEntitlement() {
    if (!sb || !Account.user) { Account.entitlement = null; return; }
    const { data, error } = await sb.from("ccat_entitlements")
      .select("plan, status, expires_at")
      .eq("user_id", Account.user.id)
      .maybeSingle();
    if (error) { console.warn("entitlement lookup failed", error); Account.entitlement = null; return; }
    Account.entitlement = data || null;
  }

  async function init() {
    if (!window.supabase || !CFG.SUPABASE_URL) {
      Account.offline = true;
      readyResolve();
      emit();
      return;
    }

    try {
      sb = window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_KEY);
    } catch (e) {
      console.warn("supabase init failed", e);
      Account.offline = true;
      readyResolve();
      emit();
      return;
    }

    let settled = false;
    sb.auth.onAuthStateChange(async (_event, session) => {
      Account.user = session ? session.user : null;
      await loadEntitlement();
      emit();
      if (!settled) { settled = true; readyResolve(); }
    });

    // onAuthStateChange fires immediately for signed-out visitors too, but guard
    // against a backend that never answers so the UI is never stuck loading.
    setTimeout(() => { if (!settled) { settled = true; readyResolve(); emit(); } }, 4000);
  }

  window.Account = Account;
  init();
})();
