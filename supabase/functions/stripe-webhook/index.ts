// ===========================================================================
// stripe-webhook — the only thing in the system that can grant Pro access.
//
// Runs with verify_jwt = false because Stripe calls it, not a logged-in user.
// Authenticity comes from the Stripe signature check instead; an unsigned or
// mis-signed request is rejected before any database write happens.
//
// Required secrets:
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET       whsec_… from the endpoint in the Stripe dashboard
//   SUPABASE_SERVICE_ROLE_KEY   injected automatically by Supabase
// ===========================================================================

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Stripe from "npm:stripe@17.7.0";
import { createClient } from "npm:@supabase/supabase-js@2.49.4";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") ?? "", {
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

Deno.serve(async (req: Request) => {
  const signature = req.headers.get("Stripe-Signature");
  if (!signature) return new Response("Missing Stripe-Signature", { status: 400 });

  const raw = await req.text();

  let event: Stripe.Event;
  try {
    // Async variant: Deno's SubtleCrypto has no synchronous HMAC.
    event = await stripe.webhooks.constructEventAsync(
      raw,
      signature,
      Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "",
    );
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
  const userId = session.metadata?.supabase_user_id ?? session.client_reference_id;
  const plan = session.metadata?.plan;

  if (!userId || (plan !== "sprint" && plan !== "lifetime")) {
    console.error("Paid session without a usable user id / plan:", session.id);
    return; // 200 anyway — retrying will not fix missing metadata
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
