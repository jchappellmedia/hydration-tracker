/* ===========================================================================
   CCAT Prep — public configuration.

   Everything here is safe to ship to the browser. The Supabase publishable key
   only grants what row-level security allows, and the plans below carry no
   Stripe price ids — the `stripe-checkout` Edge Function resolves a plan key to
   a real price server-side, so the amount charged can't be edited from the
   client.
   =========================================================================== */
window.CCAT_CONFIG = {
  SUPABASE_URL: "https://utupgcayrwocavdmhyle.supabase.co",
  SUPABASE_KEY: "sb_publishable_dfuSJkpp1yZy5yg4tlKsGw_ync0kLXy",

  // Stripe Payment Links — public by design; the price lives on Stripe's side.
  // The site appends ?client_reference_id=<user id> before redirecting, which
  // is how the webhook knows whose account to upgrade.
  PAYMENT_LINKS: {
    sprint:   "https://buy.stripe.com/fZu6oH8DG0od0MVdQg2oE06",
    lifetime: "https://buy.stripe.com/4gMdR94nqb2R9jrcMc2oE07",
  },

  // Order matters — this drives the pricing table.
  PLANS: [
    {
      id: "sprint",
      name: "7-Day Sprint",
      price: "$9",
      cadence: "one-time",
      tagline: "Test this week? This is the one.",
      features: [
        "All of Pro, for 7 days",
        "Unlimited full timed tests",
        "Every one of the 240+ questions",
        "See why each wrong answer was wrong",
        "Drills with the cap off",
      ],
    },
    {
      id: "lifetime",
      name: "Lifetime Pro",
      price: "$29",
      cadence: "one-time · best value",
      badge: "Most popular",
      highlight: true,
      tagline: "Because this probably isn't your last job hunt.",
      features: [
        "Everything in the Sprint, forever",
        "Nothing renews, nothing to cancel",
        "Progress follows you across devices",
        "Watch your percentile climb over time",
        "Every future question included",
      ],
    },
  ],

  // What a free visitor gets before the paywall appears.
  FREE_LIMITS: {
    fullSims: 1,        // lifetime count of full 50-question simulations
    topicQuestions: 10, // max questions per topic practice session
    drillQuestions: 10, // max questions per untimed drill session
    bankFraction: 0.4,  // share of the question bank available for free
  },
};
