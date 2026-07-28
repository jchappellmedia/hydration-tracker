# Going live with payments

The code is finished. What's left is account setup — creating the products in
Stripe and handing the two Edge Functions their secrets. Budget about 20
minutes.

Nothing here can be committed to the repo: every value below is a secret.

---

## 1. Create the two products in Stripe

In the [Stripe Dashboard](https://dashboard.stripe.com/products) → **Products**
→ **Add product**. Create two, both **one-time** prices (not recurring):

| Product name | Price | Notes |
|---|---|---|
| CCAT Prep — 7-Day Sprint | $9.00 USD | One time |
| CCAT Prep — Lifetime Pro | $29.00 USD | One time |

Copy each **price ID** — they look like `price_1Q...`. You need both.

> Start in **Test mode** (the toggle in the dashboard). Everything below works
> identically; you just use `sk_test_…` keys and Stripe's
> [test cards](https://docs.stripe.com/testing) (`4242 4242 4242 4242`, any
> future expiry, any CVC). Repeat with live keys when you're happy.

---

## 2. Deploy the Edge Functions

`stripe-checkout` is already deployed. `stripe-webhook` is not — deploy it with
the [Supabase CLI](https://supabase.com/docs/guides/local-development):

```bash
supabase login
supabase link --project-ref utupgcayrwocavdmhyle
supabase functions deploy stripe-webhook --no-verify-jwt
```

`--no-verify-jwt` is required: Stripe calls this endpoint, and Stripe does not
carry a Supabase JWT. The function authenticates the request by verifying
Stripe's signature instead, which is strictly stronger for this purpose.

To redeploy the checkout function later:

```bash
supabase functions deploy stripe-checkout --no-verify-jwt
```

(Also `--no-verify-jwt`, but for a different reason: the browser's CORS
preflight arrives without an `Authorization` header, so the platform gate would
reject it before the handler runs. The handler calls `getUser()` on the caller's
token itself and returns 401 for anonymous callers.)

---

## 3. Set the secrets

```bash
supabase secrets set \
  STRIPE_SECRET_KEY=sk_test_xxx \
  STRIPE_PRICE_SPRINT=price_xxx \
  STRIPE_PRICE_LIFETIME=price_xxx \
  ALLOWED_ORIGINS=https://jchappellmedia.github.io
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are injected
by the platform — don't set them yourself.

**`ALLOWED_ORIGINS`** is the allowlist of sites permitted to start a checkout and
be redirected back to. Comma-separate to add more (e.g. a local dev server):

```
ALLOWED_ORIGINS=https://jchappellmedia.github.io,http://localhost:8000
```

The first entry is the fallback used when a request's origin isn't recognised.
A redirect target that isn't on this list is discarded — that's what stops the
payment flow being turned into an open redirect.

---

## 4. Register the webhook

Stripe Dashboard → **Developers** → **Webhooks** → **Add endpoint**.

**Endpoint URL:**

```
https://utupgcayrwocavdmhyle.supabase.co/functions/v1/stripe-webhook
```

**Events to send** — these three:

- `checkout.session.completed`
- `checkout.session.async_payment_succeeded`
- `charge.refunded`

Then copy the endpoint's **Signing secret** (`whsec_…`) and set it:

```bash
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxx
```

Without this the webhook rejects every delivery, and paid customers never get
their access. It's the single most common thing to forget.

---

## 5. Check your Supabase auth settings

Supabase Dashboard → **Authentication** → **Providers** → Email.

- **Confirm email ON** (safer, but a buyer must click a link before they can
  purchase — the app handles this and tells them to check their inbox).
- **Confirm email OFF** gives the smoothest funnel: sign up → pay → done.

Under **URL Configuration**, set the Site URL to
`https://jchappellmedia.github.io/hydration-tracker/` so password-reset links
come back to the right place.

---

## 6. Test the whole loop

1. Open the site, click **Upgrade**, pick a plan.
2. Create an account when prompted.
3. Pay with `4242 4242 4242 4242`.
4. You should land back on the site, see "Confirming your payment…", and then
   "🎉 Pro unlocked".

If it hangs on confirming, the webhook is the thing to check:

```bash
supabase functions logs stripe-webhook
```

Stripe's dashboard also shows every delivery attempt and its response under the
endpoint's **Events** tab. A `400 Invalid signature` means
`STRIPE_WEBHOOK_SECRET` is wrong or belongs to a different endpoint.

You can confirm the grant landed:

```sql
select user_id, plan, status, expires_at from public.ccat_entitlements;
```

---

## How the money path actually works

```
browser                stripe-checkout          Stripe            stripe-webhook
   │                         │                     │                     │
   ├─ "I want 'lifetime'" ──▶│                     │                     │
   │   (+ Supabase JWT)      │                     │                     │
   │                    verify JWT                 │                     │
   │                    plan → price id            │                     │
   │                    (from env, not the client) │                     │
   │                         ├─ create session ───▶│                     │
   │◀── checkout URL ────────┤                     │                     │
   ├──────────── card details go only to Stripe ──▶│                     │
   │                         │                     ├─ signed event ─────▶│
   │                         │                     │            verify signature
   │                         │                     │            write entitlement
   │◀─ redirect back, poll until the row appears ──┤            (service role)
```

Two properties worth keeping if you change this:

- **The price never comes from the client.** The browser sends `"sprint"` or
  `"lifetime"`; the function maps that to a price ID held in its environment. A
  user editing the request can't pay $0.
- **Only the webhook grants access.** `ccat_entitlements` has an RLS policy for
  `select` and none for `insert`/`update`, so the anon and authenticated keys
  cannot write to it at all. The webhook uses the service-role key, which
  bypasses RLS — and that key never reaches a browser.

### The honest limitation

The *paywall* is client-side. `Access.isPro()` runs in the visitor's browser, so
somebody who opens devtools can flip it and unlock the UI. The question bank
ships in `js/questions.js`, so it was never secret to begin with.

What is *not* bypassable is the payment record itself. Nobody can manufacture an
entitlement row, and any server-side feature you add later (emailed reports,
generated question sets, an API) can trust that table completely.

If you later want a paywall that holds against a determined user, the move is to
serve Pro questions from an authenticated Edge Function that checks
`ccat_entitlements` before responding, rather than shipping them in the bundle.
That's a content-delivery change, not a billing change — the billing side is
already right.

---

## Changing the prices

`js/config.js` holds the *display* copy (`$9`, `$29`, feature bullets). The
amount actually charged comes from the Stripe price IDs in the function's
environment. Change one without the other and the page will advertise a price it
doesn't charge — always update both.
