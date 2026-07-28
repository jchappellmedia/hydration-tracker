// ===========================================================================
// stripe-checkout — creates a Stripe Checkout Session for the signed-in user.
//
// The browser only ever sends a *plan key* ("sprint" / "lifetime"). The price
// is defined RIGHT HERE, server-side, as inline price_data — a tampered client
// cannot invent its own amount, and no products or price ids have to be
// created in the Stripe dashboard first. Changing a price means editing PLANS
// below and redeploying this function; keep js/config.js's display copy in
// step when you do. The caller's Supabase JWT is verified in-handler (see
// getUser below), which is what lets the webhook later attribute the payment
// to a real user id.
//
// Deployed with verify_jwt = false so the CORS preflight can reach the handler;
// the getUser() check below is the real gate and rejects anonymous callers.
//
// Required secrets:
//   STRIPE_SECRET_KEY        sk_live_… / sk_test_…
//   ALLOWED_ORIGINS          comma-separated list of site origins
// ===========================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
  apiVersion: "2025-02-24.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

// Amounts are in cents. These are the prices actually charged — the numbers in
// js/config.js are only what the pricing page displays.
const PLANS: Record<string, { amount: number; name: string; description: string }> = {
  sprint: {
    amount: 900,
    name: "CCAT Prep — 7-Day Sprint",
    description: "7 days of Pro: unlimited simulations, the full question bank, endless drills and answer review.",
  },
  lifetime: {
    amount: 2900,
    name: "CCAT Prep — Lifetime Pro",
    description: "Pro forever on one account: unlimited simulations, the full question bank, endless drills, answer review and progress sync.",
  },
};

const ALLOWED_ORIGINS = (Deno.env.get("ALLOWED_ORIGINS") ?? "")
  .split(",").map((o) => o.trim()).filter(Boolean);

function corsHeaders(origin: string | null) {
  const allow = origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0] ?? "*";
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(origin), "Content-Type": "application/json" },
  });
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin");

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders(origin) });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405, origin);
  }

  try {
    // --- who is asking? ---------------------------------------------------
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Sign in before starting checkout." }, 401, origin);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) {
      return json({ error: "Your session expired. Sign in again." }, 401, origin);
    }

    // --- what are they buying? -------------------------------------------
    const body = await req.json().catch(() => ({}));
    const plan = String(body.plan ?? "");
    const planDef = PLANS[plan];
    if (!planDef) {
      return json({ error: `Unknown plan "${plan}".` }, 400, origin);
    }

    // Already paid for life? Don't let them buy twice by accident.
    const { data: existing } = await supabase
      .from("ccat_entitlements")
      .select("plan, status, expires_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing && existing.status === "active" && existing.plan === "lifetime") {
      return json({ error: "You already have Lifetime Pro on this account." }, 409, origin);
    }

    // --- where do we send them back? -------------------------------------
    // Never trust a client-supplied redirect target verbatim; an open redirect
    // through a payment flow is a phishing gift.
    const requested = String(body.returnUrl ?? "");
    let site = ALLOWED_ORIGINS[0] ?? "";
    try {
      const parsed = new URL(requested);
      if (ALLOWED_ORIGINS.includes(parsed.origin)) site = parsed.origin + parsed.pathname;
    } catch { /* fall through to the configured default */ }
    if (!site) return json({ error: "ALLOWED_ORIGINS is not configured." }, 500, origin);

    const sep = site.includes("?") ? "&" : "?";

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          unit_amount: planDef.amount,
          product_data: { name: planDef.name, description: planDef.description },
        },
        quantity: 1,
      }],
      customer_email: user.email ?? undefined,
      client_reference_id: user.id,
      // The webhook reads these back. client_reference_id alone would do, but
      // metadata survives more event shapes.
      metadata: { supabase_user_id: user.id, plan },
      payment_intent_data: {
        metadata: { supabase_user_id: user.id, plan },
      },
      allow_promotion_codes: true,
      success_url: `${site}${sep}checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${site}${sep}checkout=cancelled`,
    });

    return json({ url: session.url }, 200, origin);
  } catch (err) {
    console.error("stripe-checkout failed:", err);
    return json({ error: "Could not start checkout. Please try again." }, 500, origin);
  }
});
