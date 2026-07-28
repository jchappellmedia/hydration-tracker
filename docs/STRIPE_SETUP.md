# Going live with payments

The code is finished, and it no longer needs any products or prices created in
Stripe — the checkout function defines the $9 / $29 amounts itself, server-side,
as inline `price_data`. What's left is three secrets and one webhook. Budget
about **8 minutes**, no CLI required.

Nothing below can be committed to the repo: every value is a secret.

---

## 1. Add two repository secrets on GitHub

GitHub repo → **Settings → Secrets and variables → Actions → New repository
secret**:

| Name | Where it comes from |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | https://supabase.com/dashboard/account/tokens → Generate new token |
| `STRIPE_SECRET_KEY` | https://dashboard.stripe.com/acct_1OlkAQDIgK32JhoU/apikeys — `sk_test_…` to trial the flow, `sk_live_…` to take real money |

## 2. Run the deploy workflow

**Actions → Deploy payments backend → Run workflow.** It deploys both Edge
Functions and pushes the secrets into the Supabase project. (It will warn that
`STRIPE_WEBHOOK_SECRET` is missing — expected on the first run.)

## 3. Register the webhook, then re-run

Stripe Dashboard → **Developers → Webhooks → Add endpoint** (same test/live
mode as your key):

- **URL:** `https://utupgcayrwocavdmhyle.supabase.co/functions/v1/stripe-webhook`
- **Events:** `checkout.session.completed`,
  `checkout.session.async_payment_succeeded`, `charge.refunded`

Copy the endpoint's **Signing secret**, add it as a third repository secret
named `STRIPE_WEBHOOK_SECRET`, and run the workflow once more. Without it the
webhook rejects every delivery and paid customers never get their access —
it's the single most common thing to forget.

<details>
<summary>Prefer the Supabase CLI instead of the workflow?</summary>

```bash
supabase login
supabase link --project-ref utupgcayrwocavdmhyle
supabase functions deploy stripe-checkout --no-verify-jwt
supabase functions deploy stripe-webhook  --no-verify-jwt
supabase secrets set \
  STRIPE_SECRET_KEY=sk_test_xxx \
  ALLOWED_ORIGINS=https://jchappellmedia.github.io \
  STRIPE_WEBHOOK_SECRET=whsec_xxx
```

`--no-verify-jwt` matters on both functions, for different reasons: the webhook
is called by Stripe (no Supabase JWT — its authenticity is the signature check
inside the function), and the checkout function must let the browser's CORS
preflight through (its real gate is the in-handler `getUser()` check).
`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are
injected by the platform — don't set them yourself.

</details>

## 4. Test the loop

1. Open https://jchappellmedia.github.io/hydration-tracker/ → **Upgrade** → pick a plan.
2. Create an account when prompted.
3. Pay with `4242 4242 4242 4242` (any future expiry, any CVC) if you used a test key.
4. You should land back on the site, see "Confirming your payment…", then "Pro unlocked".

If it hangs on confirming, check `supabase functions logs stripe-webhook` and
the endpoint's delivery attempts in the Stripe dashboard. A `400 Invalid
signature` means `STRIPE_WEBHOOK_SECRET` is wrong or belongs to the other mode.

Confirm the grant landed:

```sql
select user_id, plan, status, expires_at from public.ccat_entitlements;
```

When you're happy, repeat steps 3–4 with the live key and a live-mode webhook
endpoint.

---

## How the money path works

```
browser                stripe-checkout          Stripe            stripe-webhook
   │                         │                     │                     │
   ├─ "I want 'lifetime'" ──▶│                     │                     │
   │   (+ Supabase JWT)      │                     │                     │
   │                    verify JWT                 │                     │
   │                    plan → $ amount            │                     │
   │                    (constant in code,         │                     │
   │                     not from the client)      │                     │
   │                         ├─ create session ───▶│                     │
   │◀── checkout URL ────────┤                     │                     │
   ├──────────── card details go only to Stripe ──▶│                     │
   │                         │                     ├─ signed event ─────▶│
   │                         │                     │            verify signature
   │                         │                     │            write entitlement
   │◀─ redirect back, poll until the row appears ──┤            (service role)
```

Properties worth keeping if you change this:

- **The amount never comes from the client.** The browser sends `"sprint"` or
  `"lifetime"`; the function maps that to a hard-coded amount. Changing a price
  means editing `PLANS` in `stripe-checkout/index.ts` and redeploying — update
  the display copy in `js/config.js` at the same time, or the page will
  advertise a price it doesn't charge.
- **Only the webhook grants access.** `ccat_entitlements` has an RLS policy for
  `select` and none for `insert`/`update` — the anon and authenticated keys
  cannot write to it. The webhook uses the service-role key, which never
  reaches a browser.
- **Retries are idempotent.** Each Stripe event id is recorded before
  processing, so redeliveries are no-ops rather than duplicate grants.

### The honest limitation

The *paywall UI* is client-side: someone in devtools can unlock the interface,
and the question bank ships in the page anyway. What's not forgeable is the
payment record. If you later want a wall that holds against a determined user,
serve Pro questions from an authenticated Edge Function that checks
`ccat_entitlements` — a content-delivery change; the billing side is already
right.
