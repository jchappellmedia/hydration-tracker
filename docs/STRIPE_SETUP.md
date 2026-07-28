# Payments — how it works (already live)

Payments went live on 2026-07-28. Nothing needs setting up; this document
records how the pieces fit and how to operate them.

## The architecture

Checkout runs on **Stripe Payment Links** — hosted pages owned by Stripe — so
no Stripe secret key exists anywhere in this project's infrastructure.

```
browser                          Stripe                     stripe-webhook (Supabase)
   │                                │                                │
   ├─ click "Get Lifetime Pro"      │                                │
   │  (must be signed in)           │                                │
   ├─ redirect to payment link ────▶│                                │
   │  ?client_reference_id=<uid>    │                                │
   │                                ├─ card charged on Stripe's page │
   │                                ├─ signed event ────────────────▶│
   │                                │                    verify signature
   │                                │                    (secret from ccat_config)
   │                                │                    upsert ccat_entitlements
   │◀─ redirect ?checkout=success ──┤                    (service role)
   ├─ poll own entitlement until the row appears → "Pro unlocked"
```

## The live pieces

| Piece | Value |
|---|---|
| 7-Day Sprint link ($9) | `https://buy.stripe.com/fZu6oH8DG0od0MVdQg2oE06` |
| Lifetime Pro link ($29) | `https://buy.stripe.com/4gMdR94nqb2R9jrcMc2oE07` |
| Webhook endpoint (Stripe side) | `we_1TyKXIDIgK32JhoUdPpcRT3k` → `…/functions/v1/stripe-webhook` |
| Webhook events | `checkout.session.completed`, `checkout.session.async_payment_succeeded`, `charge.refunded` |
| Signing secret | row `stripe_webhook_secret` in the service-role-only `public.ccat_config` table |
| Frontend config | `js/config.js` → `PAYMENT_LINKS` |

## Why it's safe

- **Prices live on Stripe.** The payment links carry the amounts; nothing a
  visitor can edit changes what they're charged.
- **Only the webhook grants access.** `ccat_entitlements` has a `select` RLS
  policy and no write policies — browsers can read their own row, never create
  one. The webhook verifies Stripe's signature before touching the database and
  writes with the service-role key.
- **Buyer attribution:** the site appends `?client_reference_id=<supabase user
  id>` to the link, and the webhook maps the plan from the link's metadata with
  an amount fallback (900¢ → sprint, 2900¢ → lifetime).
- **Retries are idempotent:** every Stripe event id is recorded in
  `ccat_stripe_events` before processing; redeliveries are no-ops.

## Operating it

**Change a price** — create a new payment link in the Stripe dashboard (or ask
Claude to), put its URL in `js/config.js`, and update the displayed price in
the same file. If the amount changes, add it to `PLAN_BY_AMOUNT` in
`supabase/functions/stripe-webhook/index.ts` and redeploy.

**Redeploy the webhook** — Actions → *Deploy payments backend* (needs the
`SUPABASE_ACCESS_TOKEN` repository secret), or:

```bash
supabase functions deploy stripe-webhook --no-verify-jwt --project-ref utupgcayrwocavdmhyle
```

**Rotate the webhook signing secret** — Stripe dashboard → the endpoint → roll
secret, then update the row:

```sql
update public.ccat_config
   set value = 'whsec_NEW'
 where key = 'stripe_webhook_secret';
```

**Refund someone** — refund the charge in the Stripe dashboard; the
`charge.refunded` event flips their entitlement to `refunded` automatically.
(Note: metadata-based refund revocation applies to charges carrying a
`supabase_user_id`; for payment-link purchases, revoke manually if needed:
`update ccat_entitlements set status='revoked' where user_id='…'`.)

**Watch it** — `supabase functions logs stripe-webhook`, the endpoint's
delivery log in the Stripe dashboard, and:

```sql
select user_id, plan, status, amount_total, created_at
  from public.ccat_entitlements order by created_at desc;
```

## The honest limitation

The paywall *UI* is client-side: a determined visitor can unlock the interface
in devtools, and the question bank ships in the page anyway. What's not
forgeable is the payment record. If you later want a wall that holds against
that, serve Pro questions from an authenticated Edge Function that checks
`ccat_entitlements` — a content-delivery change; the billing side is already
right.
