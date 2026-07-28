// ===========================================================================
// stripe-webhook — the only thing in the system that can grant Pro access.
//
// Runs with verify_jwt = false because Stripe calls it, not a logged-in user.
// Authenticity comes from the Stripe signature check instead; an unsigned or
// mis-signed request is rejected before any database write happens.
//
// Checkout happens on Stripe Payment Links, so this function never calls the
// Stripe API — signature verification is pure crypto and needs only the
// endpoint's signing secret. That secret is read from the service-role-only
// public.ccat_config table (falling back to a STRIPE_WEBHOOK_SECRET env var if
// one is set), which means going live requires no CLI secret-setting at all.
// ===========================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

// Only used for Stripe.webhooks.constructEventAsync — no API calls are made,
// so no secret API key is required.
const stripe = new Stripe("sk_unused_signature_verification_only", {
  apiVersion: "2025-02-24.acacia",
  httpClient: Stripe.createFetchHttpClient(),
});

// Service role: bypasses RLS, which is exactly why no browser ever sees this key.
const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const SPRINT_DAYS = 7;

// Amounts double as plan identification if a session arrives without metadata
// (belt and braces — payment-link metadata normally carries the plan).
const PLAN_BY_AMOUNT: Record<number, "sprint" | "lifetime"> = {
  900: "sprint",
  2900: "lifetime",
};

let cachedSecret: string | null = null;
async function webhookSecret(): Promise<string> {
  const env = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  if (env) return env;
  if (cachedSecret) return cachedSecret;
  const { data, error } = await admin
    .from("ccat_config")
    .select("value")
    .eq("key", "stripe_webhook_secret")
    .maybeSingle();
  if (error || !data) {
    console.error("Could not load stripe_webhook_secret from ccat_config:", error);
    return "";
  }
  cachedSecret = data.value;
  return cachedSecret;
}

Deno.serve(async (req: Request) => {
  const signature = req.headers.get("Stripe-Signature");
  if (!signature) return new Response("Missing Stripe-Signature", { status: 400 });

  const raw = await req.text();

  let event: Stripe.Event;
  try {
    // Async variant: Deno's SubtleCrypto has no synchronous HMAC.
    event = await stripe.webhooks.constructEventAsync(raw, signature, await webhookSecret());
  } catch (err) {
    console.error("Signature verification failed:", err);
    return new Response("Invalid signature", { status: 400 });
  }

  // --- idempotency ---------------------------------------------------------
  // Stripe retries on any non-2xx, and can deliver the same event more than
  // once even on success. The primary key on id makes the second attempt a
  // no-op rather than a duplicate grant.
  const { error: logErr } = await admin
    .from("ccat_stripe_events")
    .insert({ id: event.id, type: event.type, payload: event as unknown as Record<string, unknown> });

  if (logErr) {
    if (logErr.code === "23505") {
      return new Response(JSON.stringify({ received: true, duplicate: true }), { status: 200 });
    }
    console.error("Could not record event:", logErr);
    return new Response("Storage error", { status: 500 }); // let Stripe retry
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.payment_status !== "paid") break;
        await grantAccess(session);
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        const userId = charge.metadata?.supabase_user_id;
        if (userId) {
          await admin.from("ccat_entitlements")
            .update({ status: "refunded" })
            .eq("user_id", userId);
        }
        break;
      }
    }
  } catch (err) {
    console.error(`Handling ${event.type} failed:`, err);
    return new Response("Handler error", { status: 500 }); // Stripe will retry
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});

async function grantAccess(session: Stripe.Checkout.Session) {
  // Payment links carry the buyer's Supabase user id via the
  // ?client_reference_id= URL parameter the site appends before redirecting.
  const userId = session.metadata?.supabase_user_id ?? session.client_reference_id;

  let plan = session.metadata?.plan as "sprint" | "lifetime" | undefined;
  if (plan !== "sprint" && plan !== "lifetime") {
    plan = session.amount_total != null ? PLAN_BY_AMOUNT[session.amount_total] : undefined;
  }

  if (!userId || !plan) {
    console.error("Paid session without a usable user id / plan:", session.id,
      "client_reference_id:", session.client_reference_id,
      "amount_total:", session.amount_total);
    return; // 200 anyway — retrying will not fix missing attribution
  }

  // A sprint buyer who already has time left should have it extended, not
  // reset; a lifetime buyer must never be downgraded by a later sprint.
  const { data: current } = await admin
    .from("ccat_entitlements")
    .select("plan, status, expires_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (current?.plan === "lifetime" && current.status === "active" && plan === "sprint") {
    return;
  }

  let expiresAt: string | null = null;
  if (plan === "sprint") {
    const base = current?.expires_at && new Date(current.expires_at) > new Date()
      ? new Date(current.expires_at)
      : new Date();
    base.setUTCDate(base.getUTCDate() + SPRINT_DAYS);
    expiresAt = base.toISOString();
  }

  const { error } = await admin.from("ccat_entitlements").upsert({
    user_id: userId,
    plan,
    status: "active",
    expires_at: expiresAt,
    stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
    stripe_session_id: session.id,
    amount_total: session.amount_total,
    currency: session.currency,
  }, { onConflict: "user_id" });

  if (error) throw error;
  console.log(`Granted ${plan} to ${userId} (session ${session.id})`);
}
