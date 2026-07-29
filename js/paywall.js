/* ===========================================================================
   CCAT Prep — free-tier limits, the upgrade wall, and the auth modal.

   window.Access  — "what is this visitor allowed to do?"
   window.Paywall — the upgrade modal + pricing markup
   window.AuthUI  — the sign-in / sign-up modal
   =========================================================================== */
(function () {
  "use strict";

  const CFG    = window.CCAT_CONFIG || {};
  const LIMITS = CFG.FREE_LIMITS || {};
  const $ = (s, r = document) => r.querySelector(s);

  /* ======================= Access =========================================
     The free tier is generous on purpose: a visitor can sit one complete
     50-question simulation and see their real percentile. That number is the
     whole sales pitch, so it should never be the thing behind the wall.
     ====================================================================== */
  const USAGE_KEY = "ccat-usage-v1";

  function usage() {
    try { return JSON.parse(localStorage.getItem(USAGE_KEY)) || {}; }
    catch { return {}; }
  }
  function setUsage(u) { localStorage.setItem(USAGE_KEY, JSON.stringify(u)); }

  // Stable per-question hash so the free slice of the bank never reshuffles
  // between sessions — otherwise a free user would see "new" questions each
  // visit and the upgrade would feel pointless.
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) % 1000;
  }

  const Access = {
    isPro() { return !!(window.Account && window.Account.isPro()); },

    freeSimsUsed() { return usage().fullSims || 0; },

    /** Record that a full simulation was consumed (free tier only). */
    recordFullSim() {
      if (this.isPro()) return;
      const u = usage();
      u.fullSims = (u.fullSims || 0) + 1;
      setUsage(u);
    },

    canFullSim() {
      if (this.isPro()) return { ok: true };
      const used = this.freeSimsUsed();
      const allowed = LIMITS.fullSims || 1;
      if (used < allowed) return { ok: true, free: true, remaining: allowed - used };
      return {
        ok: false,
        title: "That was the free test",
        body: "Here's the honest part: your first score is rarely your best, because the format does half the damage. The people who walk in calm are the ones who took this thing until it got boring. Pro makes retakes unlimited.",
      };
    },

    maxTopicQuestions()  { return this.isPro() ? Infinity : (LIMITS.topicQuestions || 10); },
    maxDrillQuestions()  { return this.isPro() ? Infinity : (LIMITS.drillQuestions || 10); },

    /** The slice of the question bank this visitor can practise with. */
    pool(questions) {
      if (this.isPro()) return questions;
      const cut = Math.round((LIMITS.bankFraction ?? 0.4) * 1000);
      return questions.filter((q) => hash(q.id || "") < cut);
    },

    /** { free, total } counts for a category, for the "locked" messaging. */
    bankCounts(cat) {
      const all = window.QUESTIONS.filter((q) => q.category === cat);
      return { free: this.pool(all).length, total: all.length };
    },
  };

  /* ======================= Pricing markup ================================ */

  function planCard(plan) {
    const feats = plan.features.map((f) => `<li>${f}</li>`).join("");
    return `
      <div class="plan ${plan.highlight ? "featured" : ""}">
        ${plan.badge ? `<span class="plan-badge">${plan.badge}</span>` : ""}
        <h3>${plan.name}</h3>
        <div class="plan-price"><b>${plan.price}</b><span>${plan.cadence}</span></div>
        <p class="plan-tag">${plan.tagline}</p>
        <ul class="plan-feats">${feats}</ul>
        <button class="btn ${plan.highlight ? "primary" : ""} lg buy-btn" data-plan="${plan.id}">
          Get ${plan.name} →
        </button>
      </div>`;
  }

  const Paywall = {
    /** The pricing table, reused by the Pricing view and the upgrade modal. */
    pricingHTML(compact) {
      const plans = (CFG.PLANS || []).map(planCard).join("");
      return `
        <div class="plans ${compact ? "compact" : ""}">${plans}</div>
        <p class="plan-note">
          Secure payment by <b>Stripe</b> · one-time charge, no subscription ·
          cards, Apple&nbsp;Pay and Google&nbsp;Pay accepted
        </p>`;
    },

    /** Wire the buy buttons inside `root` to Stripe Checkout. */
    bindBuyButtons(root) {
      [...root.querySelectorAll(".buy-btn")].forEach((btn) => {
        btn.addEventListener("click", async () => {
          const original = btn.textContent;
          btn.disabled = true;
          btn.textContent = "Opening secure checkout…";
          try {
            if (!window.Account.isSignedIn()) {
              btn.disabled = false;
              btn.textContent = original;
              AuthUI.open("signup", {
                message: "Ten seconds first — an account is just so the purchase lands on you and not on a stranger's browser.",
                then: () => window.Account.checkout(btn.dataset.plan).catch((e) => alert(e.message)),
              });
              return;
            }
            await window.Account.checkout(btn.dataset.plan);
          } catch (e) {
            alert(e.message);
            btn.disabled = false;
            btn.textContent = original;
          }
        });
      });
    },

    /** The "this is a Pro feature" interstitial. */
    open(info) {
      this.close();
      const el = document.createElement("div");
      el.className = "modal-backdrop";
      el.id = "paywall-modal";
      el.innerHTML = `
        <div class="modal wide">
          <button class="modal-x" aria-label="Close">✕</button>
          <div class="modal-head">
            <span class="lock-ic">§</span>
            <h2>${info.title || "That's a Pro feature"}</h2>
            <p>${info.body || ""}</p>
          </div>
          ${this.pricingHTML(true)}
          <button class="btn ghost block" id="pw-later">Keep practising for free</button>
        </div>`;
      document.body.appendChild(el);
      document.body.classList.add("modal-open");

      this.bindBuyButtons(el);
      el.querySelector(".modal-x").onclick = () => this.close();
      el.querySelector("#pw-later").onclick = () => this.close();
      el.addEventListener("click", (e) => { if (e.target === el) this.close(); });
    },

    close() {
      const el = $("#paywall-modal");
      if (el) el.remove();
      if (!$(".modal-backdrop")) document.body.classList.remove("modal-open");
    },
  };

  /* ======================= Auth modal ==================================== */

  const AuthUI = {
    open(mode, opts) {
      opts = opts || {};
      this.close();
      const el = document.createElement("div");
      el.className = "modal-backdrop";
      el.id = "auth-modal";
      document.body.appendChild(el);
      document.body.classList.add("modal-open");

      const draw = (m) => {
        const isSignup = m === "signup";
        el.innerHTML = `
          <div class="modal">
            <button class="modal-x" aria-label="Close">✕</button>
            <div class="modal-head">
              <span class="logo lg">C</span>
              <h2>${isSignup ? "Create your account" : "Welcome back"}</h2>
              <p>${opts.message || (isSignup
                ? "Takes ten seconds. It's just somewhere for your scores — and Pro, if you buy it — to live."
                : "Welcome back. Your progress and your Pro access are where you left them.")}</p>
            </div>
            <form id="auth-form" novalidate>
              <label>Email
                <input type="email" id="auth-email" required autocomplete="email" placeholder="you@example.com" />
              </label>
              <label>Password
                <input type="password" id="auth-pass" required minlength="6"
                       autocomplete="${isSignup ? "new-password" : "current-password"}" placeholder="••••••••" />
              </label>
              <p class="auth-msg" id="auth-msg"></p>
              <button class="btn primary lg block" type="submit">
                ${isSignup ? "Create account" : "Sign in"}
              </button>
            </form>
            <div class="auth-alt">
              ${isSignup
                ? `Already have an account? <button class="linkish" data-mode="signin">Sign in</button>`
                : `New here? <button class="linkish" data-mode="signup">Create an account</button>
                   · <button class="linkish" id="auth-forgot">Forgot password?</button>`}
            </div>
          </div>`;

        el.querySelector(".modal-x").onclick = () => this.close();
        const alt = el.querySelector("[data-mode]");
        if (alt) alt.onclick = () => draw(alt.dataset.mode);

        const forgot = el.querySelector("#auth-forgot");
        if (forgot) forgot.onclick = async () => {
          const email = el.querySelector("#auth-email").value.trim();
          const msg = el.querySelector("#auth-msg");
          if (!email) { msg.className = "auth-msg err"; msg.textContent = "Enter your email above first."; return; }
          try {
            await window.Account.resetPassword(email);
            msg.className = "auth-msg ok";
            msg.textContent = "Reset link sent — check your inbox.";
          } catch (e) { msg.className = "auth-msg err"; msg.textContent = e.message; }
        };

        el.querySelector("#auth-form").onsubmit = async (ev) => {
          ev.preventDefault();
          const email = el.querySelector("#auth-email").value.trim();
          const pass  = el.querySelector("#auth-pass").value;
          const msg   = el.querySelector("#auth-msg");
          const submit = el.querySelector('button[type="submit"]');

          if (!email || pass.length < 6) {
            msg.className = "auth-msg err";
            msg.textContent = "Enter an email and a password of at least 6 characters.";
            return;
          }

          submit.disabled = true;
          msg.className = "auth-msg";
          msg.textContent = isSignup ? "Creating your account…" : "Signing in…";

          try {
            if (isSignup) {
              const { needsConfirmation } = await window.Account.signUp(email, pass);
              if (needsConfirmation) {
                msg.className = "auth-msg ok";
                msg.textContent = "Check your email to confirm your address, then sign in.";
                submit.disabled = false;
                return;
              }
            } else {
              await window.Account.signIn(email, pass);
            }
            this.close();
            if (opts.then) opts.then();
          } catch (e) {
            msg.className = "auth-msg err";
            msg.textContent = e.message;
            submit.disabled = false;
          }
        };
      };

      draw(mode || "signin");
      el.addEventListener("click", (e) => { if (e.target === el) this.close(); });
    },

    close() {
      const el = $("#auth-modal");
      if (el) el.remove();
      if (!$(".modal-backdrop")) document.body.classList.remove("modal-open");
    },
  };

  window.Access  = Access;
  window.Paywall = Paywall;
  window.AuthUI  = AuthUI;
})();
