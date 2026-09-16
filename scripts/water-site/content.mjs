/* ===========================================================================
   Content model.

   Every page's unique copy lives here. The build script owns layout; this file
   owns words. Two conventions matter for search and for AI answer engines:

     · `answer` — a 40–70 word direct answer to the page's question, rendered
       first, in plain prose, above the fold. This is the span an LLM lifts
       when it cites you. Never bury it.
     · `faqs`   — real questions in the customer's own words. They become both
       visible <details> blocks and FAQPage structured data.
   =========================================================================== */

/* --- Services -------------------------------------------------------------- */
export const services = [
  {
    slug: 'water-softener-installation',
    nav: 'Softener installation',
    name: 'Water Softener Installation',
    title: 'Water Softener Installation — Mesa, Gilbert & Chandler AZ',
    description:
      'Flat-rate water softener installation across the East Valley: $495–$645 at an existing loop. We install any unit you bought, from any store, any brand.',
    answer:
      'Water softener installation in the East Valley costs $495–$645 when your home already has a softener loop, and $950–$1,650 when a loop has to be built. The job takes two to three hours. We install any brand, including a softener you bought yourself from Costco, Home Depot, Lowe\'s or online.',
    jobs: ['softener-loop', 'softener-noloop', 'softener-swap'],
    sections: [
      {
        h: 'Why this costs less than a dealer quote',
        p: [
          'A water treatment dealer sells you a system. The install is folded into a single number — often $4,000 to $8,000 — and the technician who arrives is paid a fraction of it. Because the whole model depends on that margin, dealers will not install equipment you bought somewhere else, and they will not take small jobs like a swap-out or a relocation.',
          'We do the opposite. We publish the price of the labour, we install whatever hardware you want, and we pay the licensed plumber who does the work a fair, posted rate. If you already bought a 48,000-grain softener on sale, that is a good thing — not a reason for us to walk.',
        ],
      },
      {
        h: 'What a standard install includes',
        p: [
          'On a home with an existing loop we set and level the unit, cut in and connect, fit a new bypass valve and braided connectors, run the drain line to an approved air gap, program the control valve to your measured hardness, run a full regeneration, leak-check everything and take the packaging with us.',
          'We test your water at the hose bib before we touch anything and again at a kitchen tap when we are done, and we leave the numbers with you in writing. If the softener you bought is undersized for the hardness we measure, we will tell you before we install it, not after.',
        ],
      },
      {
        h: 'Do you have a loop?',
        p: [
          'Most East Valley homes built after the mid-1990s were plumbed with a water softener loop — two stubbed pipes in the garage, on the side yard, or in a closet near the water heater, usually with a small drain and an outlet nearby. Builders in Gilbert, Chandler, Queen Creek and east Mesa put them in almost universally.',
          'Older Tempe, west Mesa, Ahwatukee and Apache Junction homes often have nothing. That is not a problem — it is simply a longer job, because we tie into the main service line and build the loop. Send a photo when you ask for a quote and we will tell you which one you are looking at before anyone drives out.',
        ],
      },
      {
        h: 'Sizing, in one paragraph',
        p: [
          'Grain capacity should match your household size and your water hardness. East Valley municipal water is generally in the 12–20 grains-per-gallon range, which is hard by any standard. A one-to-three person household is usually fine on a 32,000-grain unit; three to five people on 48,000; five or more, or a home on the harder end of that range, on 64,000. Oversizing slightly is cheap insurance — undersizing means the unit regenerates constantly, burns salt and wears out early.',
        ],
      },
    ],
    faqs: [
      ['Will you install a water softener I bought myself?',
       'Yes — that is most of what we do. Costco, Home Depot, Lowe\'s, Menards, Amazon, Springwell, Fleck, a unit a neighbour gave you, whatever it is. The price is the same flat rate regardless of where the hardware came from. The only thing we ask is that it is complete and undamaged when we arrive.'],
      ['How long does a water softener installation take?',
       'Two to three hours at an existing loop. Four to seven hours if we have to build a loop and tie into the main line. Swap-outs, where an old unit comes out and a new one goes in on the same connections, are usually done in 90 minutes.'],
      ['Do I need a permit to install a water softener in Arizona?',
       'For a straightforward installation at an existing loop, East Valley cities generally do not require a permit, because no new supply line is being created. Work that alters the main service line, adds a drain, or touches the water heater can require one. We pull it when it is required and the fee is passed through at cost.'],
      ['Is a water softener worth it in Phoenix?',
       'For most homes here, yes — on equipment life rather than on comfort alone. Valley water is hard enough that scale shortens the life of water heaters, dishwashers, ice makers and fixture cartridges measurably. A softener is generally cheaper than replacing a water heater early, and it is the single change most people notice immediately in their laundry and their showers.'],
      ['What about the salt discharge rules?',
       'Some Arizona communities have restricted self-regenerating softeners because of brine in the wastewater stream. Nothing in the East Valley currently bans residential softeners, but if you are in a community with its own rules we will check before we schedule. Where salt is a problem, a salt-free TAC conditioner is the alternative and we install those too.'],
    ],
  },
  {
    slug: 'reverse-osmosis-installation',
    nav: 'Reverse osmosis',
    name: 'Reverse Osmosis Installation',
    title: 'Reverse Osmosis Installation — East Valley Phoenix AZ',
    description:
      'Under-sink reverse osmosis installation from $245 flat in Mesa, Gilbert, Chandler and the East Valley. Any brand, including systems you bought yourself.',
    answer:
      'Under-sink reverse osmosis installation costs $245–$395 flat in the East Valley and takes about two hours. That covers mounting the manifold and tank, the feed tee, the drain connection, a dedicated faucet, flushing the membrane, and a before-and-after TDS test. A fridge and ice-maker line is $95 more.',
    jobs: ['ro-undersink'],
    sections: [
      {
        h: 'A softener and an RO do different jobs',
        p: [
          'A water softener removes hardness minerals so your plumbing and appliances stop scaling. It does not make the water taste better, and it adds a small amount of sodium. Reverse osmosis works at the drinking tap: it pushes water through a membrane that strips dissolved solids, and it is what actually changes how your water tastes.',
          'Most East Valley homes that are happy with their water have both — a softener on the whole house, and an RO under the kitchen sink. If you are only doing one thing this month, the RO is the cheaper one and the one your family will comment on.',
        ],
      },
      {
        h: 'What we do at the sink',
        p: [
          'We mount the filter manifold and the storage tank inside the cabinet so you keep as much usable space as possible, fit the feed tee and shut-off, connect the drain, and install the faucet — either in the existing sprayer or soap-dispenser hole, or through a new hole we drill in the counter. Granite and quartz are fine; we use a diamond core bit and we do it dry-shielded.',
          'Then we flush the membrane properly, which takes time people skip, and we measure total dissolved solids at the tap before and after so you can see what you bought.',
        ],
      },
      {
        h: 'Filter changes',
        p: [
          'Sediment and carbon pre-filters want changing every six to twelve months here; the membrane lasts two to five years depending on how hard your feed water is. You can do it yourself in ten minutes once we show you — we walk you through it on install day. If you would rather not, a filter-change visit is a $129 service call.',
        ],
      },
    ],
    faqs: [
      ['Can you connect reverse osmosis to my refrigerator?',
       'Yes. It is a $95 add-on if done on the same visit — we run a quarter-inch line from the RO to the fridge and ice maker. Done later as its own trip it is more, so mention it when you book.'],
      ['Do you drill the countertop for the RO faucet?',
       'Yes, including granite and quartz, at no extra charge. If your sink has a sprayer or soap dispenser you do not use, we will use that hole instead and save you a hole in the stone.'],
      ['Does RO waste a lot of water?',
       'Older systems sent roughly three to four gallons to the drain per gallon produced. Modern permeate-pump and high-efficiency units are closer to one-to-one. If you are buying new and water use bothers you, buy a high-efficiency model — we will install either.'],
      ['Will RO water hurt my plumbing or my health?',
       'No. RO water is slightly acidic and mineral-free, which is why it is delivered on its own small faucet rather than through your whole house. Some people prefer a remineralising stage for taste; we install those too.'],
    ],
  },
  {
    slug: 'whole-home-water-filtration',
    nav: 'Whole-home filtration',
    name: 'Whole-Home Water Filtration',
    title: 'Whole House Water Filter Installation — East Valley AZ',
    description:
      'Whole-home carbon filtration installed for $225–$395 as a softener add-on. Removes chlorine and chloramine taste and odour at every tap in the house.',
    answer:
      'A whole-home carbon filter installs ahead of your softener and removes chlorine, chloramine, and the taste and smell that come with them at every tap and shower in the house. Installed on the same visit as a softener it is $225–$395; as its own visit, expect the higher end.',
    jobs: ['whole-home-filter', 'conditioner'],
    sections: [
      {
        h: 'What it fixes, and what it does not',
        p: [
          'Valley municipal water is disinfected, and that disinfectant is what you smell when you fill a glass or step into a hot shower. A carbon tank ahead of the softener takes it out for the whole house — every shower, every tap, the washing machine. It also protects the softener resin, which chlorine degrades over time.',
          'What it does not do is remove hardness. Carbon and softening are separate jobs, and anyone selling you one as a replacement for the other is selling. If your glassware is spotted and your water heater is scaling, you want a softener; the carbon tank is what makes the water pleasant.',
        ],
      },
      {
        h: 'Order of operations',
        p: [
          'Where both are installed, the sequence is: main line → sediment (if you are on a well) → carbon → softener → house. We set it up that way as a matter of course, and if you already own a system installed backwards we will re-plumb it as part of a service call.',
        ],
      },
    ],
    faqs: [
      ['Do I need a whole-home filter if I already have reverse osmosis?',
       'Not for drinking water — the RO already handles that at the kitchen tap. People add whole-home carbon for showers, skin and hair, and to protect softener resin. It is a comfort and longevity purchase, not a safety one.'],
      ['How often does the carbon media need replacing?',
       'A properly sized backwashing carbon tank runs five to ten years here. Cartridge-style whole-home filters need changing every three to six months, which is why we generally steer people toward a tank if they are buying new.'],
    ],
  },
  {
    slug: 'water-softener-replacement',
    nav: 'Replacement & removal',
    name: 'Water Softener Replacement & Removal',
    title: 'Water Softener Replacement & Removal — East Valley AZ',
    description:
      'Swap an old water softener for a new one from $375 flat, including haul-away and recycling. The small job the big dealers will not quote. Mesa to Queen Creek.',
    answer:
      'A water softener swap-out — old unit removed, new unit installed on the same connections — is $375–$495 and takes about 90 minutes, including hauling away and recycling the old tank. If you want a softener removed entirely and the loop bypassed, that is $195.',
    jobs: ['softener-swap'],
    sections: [
      {
        h: 'The job nobody wants',
        p: [
          'A replacement is a 90-minute job with no equipment sale attached to it, which is exactly why a dealer will either refuse it or quote it like a full system. It is also the most common call we get: a fifteen-year-old unit has finally stopped regenerating, the homeowner has already bought a replacement, and three companies have told them to buy a whole new system instead.',
          'We take that call, we publish the price, and the licensed plumber who does the work is paid properly for it. That is the entire business model in one paragraph.',
        ],
      },
      {
        h: 'Repair or replace?',
        p: [
          'A control valve rebuild is usually worth it on a unit under eight years old with a good resin bed. Past twelve years, or where the resin has been chewed up by chlorine, replacement is the cheaper answer over any reasonable horizon. We will tell you which one you are looking at on a $129 service call, and that fee comes off the work if you go ahead.',
        ],
      },
      {
        h: 'Selling the house?',
        p: [
          'A dead softener in the garage is a line item on every inspection report in this valley. Swapping it before listing costs less than the credit a buyer will ask for, and we can turn one around inside a week — sooner in Gilbert and Chandler.',
        ],
      },
    ],
    faqs: [
      ['Do you take the old softener away?',
       'Yes, included. The tank and resin are recycled, the brine tank goes with it, and we leave the space swept.'],
      ['My softener is leaking — is that an emergency?',
       'Put it on bypass (the valve where the loop meets the unit) and the house keeps running water while the softener sits isolated. That turns an emergency into a scheduled job, and it is the first thing we will talk you through on the phone.'],
      ['Can you just remove it and not replace it?',
       'Yes, $195 to remove the unit, bypass the loop cleanly and haul it off.'],
    ],
  },
  {
    slug: 'well-water-treatment',
    nav: 'Well water',
    name: 'Well Water Treatment',
    title: 'Well Water Treatment — Queen Creek & San Tan Valley AZ',
    description:
      'Iron, sulphur, sediment and hardness treatment for East Valley wells. Designed from your actual water test, installed by licensed Arizona plumbers.',
    answer:
      'Well water in Queen Creek, San Tan Valley and Gold Canyon typically needs sediment, iron and sulphur treatment before a softener will work properly. Systems run $850–$2,400 installed depending on what your water test shows. We start with the test, not with a system we are trying to sell.',
    jobs: ['well'],
    sections: [
      {
        h: 'Test first. Always.',
        p: [
          'Two wells a mile apart in San Tan Valley can need completely different equipment. Iron stains fixtures orange; hydrogen sulphide is the rotten-egg smell; manganese leaves black specks; sediment destroys everything downstream. A softener alone will foul quickly against any of them.',
          'So we start with a lab test — $95, credited against the work — and design from the results. If the answer is that you only need a softener, we will say so and charge you for a softener.',
        ],
      },
      {
        h: 'Typical build order',
        p: [
          'Pressure tank → sediment filter → oxidation or aeration for iron and sulphur → backwashing media filter → softener → optional UV → house, with an RO at the kitchen sink. Not every well needs every stage, and every stage you do not need is money and maintenance you do not want.',
        ],
      },
    ],
    faqs: [
      ['Do you work on shared or private wells in San Tan Valley?',
       'Yes, on the treatment side inside or beside the home. Well pumps, casings and pressure tanks that need drilling work go to a licensed well contractor — we will hand you off to one rather than pretend.'],
      ['My water smells like rotten eggs. What is that?',
       'Hydrogen sulphide, usually. It is unpleasant rather than dangerous at typical concentrations, and it is treated with oxidation or an air-injection filter ahead of the softener.'],
    ],
  },
  {
    slug: 'water-softener-repair',
    nav: 'Repair & service',
    name: 'Water Softener Repair & Service',
    title: 'Water Softener Repair & Service — East Valley AZ | $129',
    description:
      'Flat $129 diagnostic on any brand of water softener or RO system across the East Valley. Parts quoted before work. The fee applies to the repair.',
    answer:
      'A water softener service call is a flat $129 in the East Valley, covering diagnosis and the first hour of labour, applied to the repair if you go ahead. Common fixes: salt bridges, a valve that will not regenerate, leaking bypass seals, fouled resin and RO filter changes.',
    jobs: ['service'],
    sections: [
      {
        h: 'Things that are usually not a new system',
        p: [
          'Salt bridging — a hard crust over an air gap in the brine tank — is the single most common "my softener stopped working" call, and it is fixed in ten minutes with no parts. Next most common: a stuck or fouled injector, a failed valve motor, a drain line that was never run properly, and hardness settings someone guessed at instead of measuring.',
          'Any dealer will quote a new system for all four, because that is the only product they sell. We carry parts and we tell you the truth.',
        ],
      },
    ],
    faqs: [
      ['Do you service brands you did not install?',
       'Yes, any brand. Most of our service calls are on units installed years ago by companies that no longer answer the phone.'],
      ['How much salt should I be using?',
       'A family of four on East Valley water typically goes through one to two 40-pound bags a month. Much more than that usually means the hardness setting is wrong or the unit is undersized, and both are worth a look.'],
    ],
  },
];

/* --- Cities ---------------------------------------------------------------- */
/* Hardness figures are deliberately given as ranges. Municipal supply here is a
   blend of Colorado River (CAP), Salt/Verde river and groundwater, and the mix
   changes by treatment plant, by season and sometimes by street. Every city page
   sends the reader to their own utility's annual report rather than pretending
   to a precision nobody can honestly claim. */
export const cities = [
  {
    slug: 'mesa',
    name: 'Mesa',
    county: 'Maricopa County',
    utility: 'City of Mesa Water Resources',
    utilityUrl: 'https://www.mesaaz.gov',
    hardness: '12–18 grains per gallon',
    zips: ['85201', '85202', '85203', '85204', '85205', '85206', '85207', '85208', '85209', '85212', '85213', '85215'],
    neighborhoods: ['Las Sendas', 'Red Mountain Ranch', 'Eastmark', 'Dobson Ranch', 'Superstition Springs', 'Alta Mesa', 'Mountain Bridge', 'Augusta Ranch'],
    intro:
      'Mesa is the biggest single slice of our work, and the most split city in the East Valley: east Mesa is full of 1995-and-newer homes with a proper softener loop in the garage, while west and central Mesa is mid-century housing where a loop has to be built from scratch.',
    local: [
      'In east Mesa — Eastmark, Mountain Bridge, Las Sendas, Augusta Ranch — a standard install at the existing loop is the norm, and the flat $495–$645 rate applies almost every time. Many of those homes also have a builder-installed RO stub under the kitchen sink already waiting for a unit.',
      'West of Country Club and through the older Dobson Ranch and Alta Mesa streets, expect no loop, a tighter garage, and sometimes galvanised or older copper that needs a careful transition. That is the $950–$1,650 job, and we will tell you which one you are before we drive out if you send a photo of the water heater area and the side yard.',
      'Mesa also has a large retiree population in the 55+ communities along Baseline and out toward Apache Junction, and those homes tend to have softeners from the 1990s and 2000s that have long since given up. Swap-outs there are our most common single job.',
    ],
  },
  {
    slug: 'gilbert',
    name: 'Gilbert',
    county: 'Maricopa County',
    utility: 'Town of Gilbert Water',
    utilityUrl: 'https://www.gilbertaz.gov',
    hardness: '15–20 grains per gallon',
    zips: ['85233', '85234', '85295', '85296', '85297', '85298'],
    neighborhoods: ['Val Vista Lakes', 'Agritopia', 'Seville', 'Power Ranch', 'Morrison Ranch', 'Higley Groves', 'Adora Trails', 'Lyon\'s Gate'],
    intro:
      'Gilbert has some of the hardest municipal water in the valley and some of the newest housing stock, which is a good combination for us: nearly every home has a loop, and nearly every home needs the unit.',
    local: [
      'Power Ranch, Seville, Adora Trails, Lyon\'s Gate and the rest of the 2000s-and-later subdivisions were plumbed with a garage loop as standard, usually on the wall shared with the laundry. Those are textbook two-hour installs.',
      'At 15–20 grains per gallon, sizing matters more here than anywhere else we work. A 32,000-grain unit on a family of five in Seville will regenerate every other day, eat salt and wear out its resin years early. We steer most Gilbert households of four or more to 64,000 grains, and we will say so even when you have already bought something smaller — before we install it, not after.',
      'Older Gilbert, the stretch around the Heritage District and the 1980s ranch homes off Elliot, is the exception: no loop, longer job, same honest quote.',
    ],
  },
  {
    slug: 'chandler',
    name: 'Chandler',
    county: 'Maricopa County',
    utility: 'City of Chandler Water',
    utilityUrl: 'https://www.chandleraz.gov',
    hardness: '14–19 grains per gallon',
    zips: ['85224', '85225', '85226', '85248', '85249', '85286'],
    neighborhoods: ['Ocotillo', 'Fulton Ranch', 'Andersen Springs', 'Clemente Ranch', 'Cooper Commons', 'Pecos Ranch', 'Circle G'],
    intro:
      'Chandler splits cleanly along Chandler Boulevard: the south Chandler subdivisions — Ocotillo, Fulton Ranch, Clemente Ranch — are loop-equipped and quick, while north Chandler around downtown and the older Arizona Avenue corridor usually is not.',
    local: [
      'South Chandler homes frequently have an RO stub under the kitchen sink and a loop in the garage from the builder, so the whole package — softener plus under-sink RO on one visit — comes in well under what a single dealer system would cost.',
      'Chandler also has a lot of two-storey homes with the softener loop in an exterior side-yard alcove rather than the garage. Sun exposure kills brine tanks and control valve electronics here faster than anything else, so if yours sits in afternoon sun, ask us about an enclosure when we quote.',
      'The tech-corridor rentals around Price Road are a steady source of landlord work: a softener that keeps a water heater alive an extra five years is an easy sum for anyone holding a property long term.',
    ],
  },
  {
    slug: 'queen-creek',
    name: 'Queen Creek',
    county: 'Maricopa & Pinal Counties',
    utility: 'Town of Queen Creek Water / EPCOR',
    utilityUrl: 'https://www.queencreekaz.gov',
    hardness: '16–22 grains per gallon, higher on private wells',
    zips: ['85142', '85140', '85143'],
    neighborhoods: ['Encanterra', 'Hastings Farms', 'Cortina', 'Church Farm', 'Sossaman Estates', 'Queen Creek Station'],
    intro:
      'Queen Creek is the hardest water we routinely treat and the most mixed in supply — town water on newer subdivisions, EPCOR on some addresses, and private wells on the acre-plus lots. The equipment answer is different for each.',
    local: [
      'On town or EPCOR supply in Hastings Farms, Cortina, Queen Creek Station and the newer Ellsworth corridor builds, it is a standard loop install — but size up. At 16–22 grains a 48,000-grain unit is the floor for a family of four, not the ceiling.',
      'On the horse properties and older acre lots off Riggs, Combs and Meridian, you are usually on a well, and a softener on its own will foul fast against iron and sediment. Those jobs start with a $95 water test and get designed from the result. See our well water treatment page for how that sequence works.',
      'Queen Creek is also the fastest-growing part of our service area, which means a lot of two-to-five-year-old homes where the builder left a loop and never installed anything in it. If that is you, the install is quick and the price is the published one.',
    ],
  },
  {
    slug: 'san-tan-valley',
    name: 'San Tan Valley',
    county: 'Pinal County',
    utility: 'EPCOR Water / private wells',
    utilityUrl: 'https://www.epcor.com',
    hardness: '16–24 grains per gallon; wells vary widely',
    zips: ['85140', '85142', '85143'],
    neighborhoods: ['Johnson Ranch', 'Circle Cross Ranch', 'Copper Basin', 'Pecan Creek', 'Skyline Ranch', 'Castlegate'],
    intro:
      'San Tan Valley is where the big companies stop driving, which makes it one of the best places for us to work. Johnson Ranch, Circle Cross and Copper Basin are full of 2004–2010 homes with loops, aging first-generation softeners, and no local installer answering the phone.',
    local: [
      'The housing here went up fast in the mid-2000s, which means a large cohort of original builder-grade softeners all reaching end of life at the same time. A swap-out is $375–$495 and takes 90 minutes, and it is the most common thing we do out here.',
      'Water in this area is hard even by valley standards, and some addresses are on private wells with iron and sulphur on top of the hardness. If your fixtures stain orange or the hot water smells of sulphur, that is a treatment-train question, not a softener question.',
      'We do not charge a travel surcharge to San Tan Valley. Our contractors are paid the distance premium out of our margin, not out of your quote — that is the deal we made with them and it is the reason we can get someone out here at all.',
    ],
  },
  {
    slug: 'tempe',
    name: 'Tempe',
    county: 'Maricopa County',
    utility: 'City of Tempe Water Utilities',
    utilityUrl: 'https://www.tempe.gov',
    hardness: '12–17 grains per gallon',
    zips: ['85281', '85282', '85283', '85284'],
    neighborhoods: ['Warner Ranch', 'The Lakes', 'Optimist Park', 'Maple-Ash', 'Dava', 'Escalante'],
    intro:
      'Tempe is mostly pre-1990 housing, which means the loop question usually answers itself: there is not one. The work is heavier than in Gilbert and the quote reflects it honestly rather than by surprise.',
    local: [
      'In Maple-Ash, Optimist Park and the older streets near the university you are frequently looking at a mid-century home with limited garage space and original copper. We build a loop off the main, fit shut-offs and a bypass so a future service call never means shutting the house down, and finish the penetration properly.',
      'South Tempe — Warner Ranch, The Lakes, the 1980s and 1990s subdivisions off Elliot and Warner — is more mixed, and a fair number do have a loop or at least an easy tie-in point near the water heater.',
      'Tempe is also full of rentals and student housing. If you manage property here, the under-sink RO and a properly sized softener are the two upgrades tenants actually notice, and both are flat-rate for us to install.',
    ],
  },
  {
    slug: 'apache-junction',
    name: 'Apache Junction',
    county: 'Pinal County',
    utility: 'Apache Junction Water District / Arizona Water Company',
    utilityUrl: 'https://www.apachejunctionaz.gov',
    hardness: '15–22 grains per gallon',
    zips: ['85117', '85118', '85119', '85120'],
    neighborhoods: ['Superstition Mountain', 'Peralta Trails', 'Gold Canyon border', 'Mountain View', 'Sunrise'],
    intro:
      'Apache Junction is exactly the market the national companies drive past: a lot of manufactured and older stick-built homes, retirees on fixed incomes, and quotes from the big guys that start at four thousand dollars.',
    local: [
      'Manufactured and park-model homes have their own plumbing realities — skirting access, exterior connections, and units that sit outside in full sun. We install in them routinely, and we will fit an enclosure so a brine tank does not cook through a July.',
      'Water on this side of the valley runs hard with high total dissolved solids, so an under-sink RO makes a bigger difference to the taste here than almost anywhere else we work. At $245–$395 it is the single best-value thing we install in Apache Junction.',
      'There is no travel surcharge to Apache Junction. If someone quoted you one, that was a way of saying no politely.',
    ],
  },
  {
    slug: 'gold-canyon',
    name: 'Gold Canyon',
    county: 'Pinal County',
    utility: 'Arizona Water Company / private wells',
    utilityUrl: 'https://www.azwater.com',
    hardness: '16–24 grains per gallon; wells vary',
    zips: ['85118'],
    neighborhoods: ['MountainBrook Village', 'Peralta Trails', 'Superstition Mountain Golf & Country Club', 'Entrada del Oro'],
    intro:
      'Gold Canyon combines some of the hardest water in the region with a lot of well-kept 55+ housing whose original water treatment is now twenty years old. It is a long drive for most companies and a normal Tuesday for ours.',
    local: [
      'MountainBrook Village and the surrounding 55+ communities are largely 1995–2005 builds with loops, which keeps the install simple. What they mostly need is a replacement and an honest sizing conversation, not a new whole-house program.',
      'Some Gold Canyon addresses are on private wells or small private systems with iron and high TDS. Those get a water test first and a designed treatment train second.',
      'HOA rules in a few of the golf communities limit what can sit visible outside. We have fitted enclosures and relocated units into garages to satisfy them before; tell us the rule and we will quote to it.',
    ],
  },
  {
    slug: 'ahwatukee',
    name: 'Ahwatukee',
    county: 'Maricopa County (City of Phoenix)',
    utility: 'City of Phoenix Water Services',
    utilityUrl: 'https://www.phoenix.gov',
    hardness: '12–17 grains per gallon',
    zips: ['85044', '85045', '85048'],
    neighborhoods: ['Mountain Park Ranch', 'Lakewood', 'The Foothills', 'Club West', 'Equestrian Trails'],
    intro:
      'Ahwatukee sits on Phoenix water and on the western edge of our area. Mountain Park Ranch, Lakewood and The Foothills went up largely between 1985 and 2000, so loops are hit and miss — roughly half the homes we quote have one.',
    local: [
      'The 1990s Foothills and Club West builds usually have a loop, often in a side-yard alcove rather than the garage. The 1980s Lakewood and Mountain Park streets frequently do not.',
      'Two-storey homes here often put the water heater in an upstairs closet, which changes where a loop can reasonably be built. Send a photo of the garage wall and the main shut-off and we can usually tell you the answer before scheduling.',
      'Phoenix supply is at the softer end of what we see — softer being a relative term at 12–17 grains — so a 48,000-grain unit covers most Ahwatukee households comfortably.',
    ],
  },
  {
    slug: 'sun-lakes',
    name: 'Sun Lakes',
    county: 'Maricopa County',
    utility: 'Local water utility — check your bill',
    utilityUrl: 'https://www.chandleraz.gov',
    hardness: '14–20 grains per gallon',
    zips: ['85248'],
    neighborhoods: ['IronOaks', 'Cottonwood', 'Oakwood', 'Palo Verde'],
    intro:
      'Sun Lakes is a 55+ community south of Chandler, and it is the clearest example of who this company exists for: homeowners who have been quoted $6,000 for a system that should have been a $400 swap-out.',
    local: [
      'Nearly every home here has a loop and most have had a softener at some point, so the work is overwhelmingly replacement and repair — the two jobs commission-based companies treat as a nuisance.',
      'We publish our prices, we tell you on the phone whether your unit is worth repairing, and the $129 diagnostic comes off the repair. If your unit is nine years old and needs a $180 valve rebuild, we will do the rebuild.',
      'If you would rather not carry salt bags, ask about the delivered salt fill add-on — ten bags loaded into the brine tank for $85 on a scheduled visit.',
    ],
  },
];

/* --- Long-form guides ------------------------------------------------------ */
export const guides = [
  {
    slug: 'water-softener-installation-cost-east-valley',
    title: 'What Does Water Softener Installation Cost in the East Valley? (2026)',
    metaTitle: 'Water Softener Installation Cost — East Valley AZ 2026',
    nav: 'Installation cost',
    description:
      'Real installed prices for water softeners in Mesa, Gilbert and Queen Creek — labour, equipment, loop vs no loop, and why dealer quotes run 6× higher.',
    answer:
      'In the East Valley, water softener installation labour runs $495–$645 at an existing loop and $950–$1,650 when a loop must be built. The softener itself is $795–$1,195 for a quality 32k–64k grain unit. Total, installed, a typical Gilbert or Mesa home lands between $1,300 and $1,800 — against $4,000–$8,000 from a dealer.',
    sections: [
      {
        h: 'The three numbers in any softener quote',
        p: [
          'Every quote you get is really three numbers wearing one hat: the equipment, the labour, and the margin. Dealers merge them so that no single number can be compared to anything. Once you separate them, the market gets very easy to read.',
          'Equipment: a good 48,000-grain, metered, twin-tank-capable softener with a Fleck, Clack or comparable control valve retails for roughly $800–$1,200. A 64,000-grain unit runs $1,000–$1,400. These are not secret prices; they are on the shelf at Costco and Home Depot and on a dozen manufacturer websites.',
          'Labour: two to three hours of licensed plumbing work at an existing loop. Four to seven if a loop has to be built.',
          'Margin: whatever is left. In a dealer model, that is most of the invoice.',
        ],
      },
      {
        h: 'What the total actually looks like',
        rows: [
          ['Scenario', 'Equipment', 'Install', 'Total'],
          ['Gilbert 2008 build, loop in garage, family of four, 64k unit', '$1,195', '$495–$645', '$1,690–$1,840'],
          ['Mesa 1985 build, no loop, 48k unit', '$995', '$950–$1,650', '$1,945–$2,645'],
          ['Sun Lakes swap-out, customer supplied unit', 'already owned', '$375–$495', '$375–$495'],
          ['Chandler softener + under-sink RO, same visit', '$1,380', '$740–$1,040', '$2,120–$2,420'],
          ['Typical dealer "whole home solution"', 'bundled', 'bundled', '$4,000–$8,000'],
        ],
        p: [
          'The bottom row is not an exaggeration and it is not unusual. It is the standard in-home sales price for a water treatment system in Maricopa County, and it is why a licensed plumber can be paid $300 for a job that was invoiced at $5,000.',
        ],
      },
      {
        h: 'Where the extra money goes in a dealer sale',
        p: [
          'Into the appointment. An in-home water test, a two-hour presentation, a commissioned salesperson, a finance application and a manager call-back all cost money, and they are all priced into the system. The installer arrives afterwards and is paid a piece rate not far off what we pay.',
          'We removed that layer. The price is published, the scope is fixed at booking from photos you send, and the contractor keeps a fair share of a smaller, honest number.',
        ],
      },
      {
        h: 'What should make a quote go up',
        p: [
          'Legitimately: no existing loop; a main line that needs re-routing; galvanised pipe that has to be transitioned; an outdoor install needing an enclosure; a second-storey or attic water heater; well water requiring pre-treatment; permit fees where a city requires one.',
          'Not legitimately: your ZIP code, the fact that you are home during the day, a "today only" discount, or a finance term dressed up as a monthly price.',
        ],
      },
    ],
    faqs: [
      ['Is it cheaper to buy my own water softener and hire an installer?',
       'Usually by a wide margin. A quality unit from a retailer plus our flat install rate typically totals $1,300–$1,800 in a loop-equipped home, against $4,000–$8,000 for an equivalent dealer package. The equipment is often the same class of hardware.'],
      ['How much does it cost to install a water softener if there is no loop?',
       '$950–$1,650 in the East Valley, depending on how far the main line is from where the unit will sit and what your existing pipe is made of. We confirm the number from photos before scheduling, and it does not change on the day unless you change the scope.'],
      ['Do you charge for a quote?',
       'No. Quotes are free and given over the phone or text from photos. The only thing we charge for before work starts is a lab water test on a well, which is $95 and credited against the job.'],
    ],
  },
  {
    slug: 'install-costco-home-depot-water-softener-arizona',
    title: 'Who Installs a Costco or Home Depot Water Softener in Arizona?',
    metaTitle: 'Who Installs a Costco Water Softener in Arizona?',
    nav: 'Customer-supplied installs',
    description:
      'Bought a softener at Costco, Home Depot or online and cannot find an installer? Here is why — and what the install actually costs in the East Valley.',
    answer:
      'Most water treatment dealers refuse to install equipment you bought yourself because their business model depends on the equipment margin, not the labour. Independent licensed plumbers will. In the East Valley the flat rate is $495–$645 at an existing loop, whatever brand or retailer the unit came from.',
    sections: [
      {
        h: 'Why you keep getting told no',
        p: [
          'You bought a perfectly good softener on sale. You call four companies. Three say they only install their own equipment and one quotes you $1,800 for two hours of work. Nothing about this is a comment on your unit — it is the economics of a sales-led model, where install labour is a cost centre subsidised by a large equipment margin. Take the margin away and the job is no longer worth their salesperson\'s time.',
        ],
      },
      {
        h: 'What we check before installing a unit you supplied',
        p: [
          'Three things, and we do them on the phone or from photos so nobody wastes a trip. First, that it is complete — control valve, bypass, brine tank, and the fittings that match your pipe size. Second, that it is sized right for your household and your measured hardness. Third, that there is somewhere sensible to put it with a drain within reach.',
          'If any of those is wrong we tell you before we book, not after we have opened the box. Most of the time the fix is a $40 fitting kit, which we bring.',
        ],
      },
      {
        h: 'Warranty, honestly',
        p: [
          'Most retail softener warranties cover the tank and valve regardless of who installed them, but some manufacturers require professional installation for the full term — which is exactly what you get here, since the work is done by a licensed, insured Arizona plumbing contractor and we give you a written invoice naming the licence. Keep it with your paperwork; that document is what a manufacturer asks for.',
          'Our own workmanship warranty covers the installation itself for one year. The hardware warranty stays with whoever sold you the hardware.',
        ],
      },
    ],
    faqs: [
      ['Will installing it myself void the warranty?',
       'It can, depending on the manufacturer — several require professional installation for the full warranty term. Our invoice names the licensed contractor and the licence number, which is the documentation manufacturers ask for.'],
      ['I bought a softener two years ago and never installed it. Is it still fine?',
       'Almost certainly, if it was stored dry and indoors. Resin does not expire in the box. Bring it out and send us a photo of the label.'],
      ['Do you install Costco\'s Whirlpool, GE, Aquasure, Springwell, SoftPro or Fleck units?',
       'All of them, and anything else with a standard control valve. The flat rate does not change by brand.'],
    ],
  },
  {
    slug: 'east-valley-water-hardness-by-city',
    title: 'East Valley Water Hardness by City: Mesa, Gilbert, Chandler & More',
    metaTitle: 'East Valley Water Hardness by City — Mesa to Queen Creek',
    nav: 'Hardness by city',
    description:
      'How hard the water is in Mesa, Gilbert, Chandler, Queen Creek and the rest of the East Valley — and what grain capacity that means for your softener.',
    answer:
      'East Valley tap water typically tests between 12 and 22 grains per gallon (roughly 205–375 ppm), which is "very hard" on every scale in use. Gilbert, Queen Creek and San Tan Valley sit at the harder end; Tempe, Mesa and Ahwatukee at the softer end of that range. Check your utility\'s annual water quality report for your address.',
    sections: [
      {
        h: 'Why the number is a range and not a figure',
        p: [
          'Valley municipal supply is a blend — Colorado River water delivered by the CAP canal, Salt and Verde river water, and groundwater — and the proportions change by treatment plant, by season, and after infrastructure work. Two homes in the same city can measure differently, and the same home can measure differently in March and August.',
          'Anyone quoting you a single decimal figure for your city either measured your tap that morning or is guessing. Your utility publishes an annual water quality report with their measured range; that is the authoritative number for your address, and each of our city pages links to it.',
        ],
      },
      {
        h: 'Approximate ranges we measure in the field',
        rows: [
          ['City', 'Typical range (gpg)', 'Suggested size, family of four'],
          ['Gilbert', '15–20', '64,000 grain'],
          ['Queen Creek', '16–22', '64,000 grain'],
          ['San Tan Valley', '16–24', '64,000 grain'],
          ['Gold Canyon', '16–24', '64,000 grain'],
          ['Apache Junction', '15–22', '48,000–64,000 grain'],
          ['Chandler', '14–19', '48,000–64,000 grain'],
          ['Sun Lakes', '14–20', '48,000 grain'],
          ['Mesa', '12–18', '48,000 grain'],
          ['Tempe', '12–17', '48,000 grain'],
          ['Ahwatukee', '12–17', '48,000 grain'],
        ],
        p: [
          'These are field measurements from our own installs, given as ranges on purpose. We test your tap on install day and program the valve to what we actually measure, not to a table.',
        ],
      },
      {
        h: 'Converting the units',
        p: [
          'One grain per gallon equals 17.1 parts per million (mg/L) of calcium carbonate. So 15 gpg is about 257 ppm. Utilities usually report ppm; softeners are programmed in grains. Anything above 10.5 gpg (180 ppm) is classified "very hard" — the entire East Valley clears that by a wide margin.',
        ],
      },
      {
        h: 'What hardness does to a house here',
        p: [
          'Scale on the heating element and tank floor of a water heater is the expensive one; it insulates the element, raises your gas or electric use, and shortens the life of a $1,600 appliance. After that: dishwasher and washing machine valves, ice makers, faucet cartridges, glass shower doors, and the film that makes soap feel like it never rinses off.',
          'None of it is dangerous. All of it is cumulative, and at 15–20 grains it accumulates fast.',
        ],
      },
    ],
    faqs: [
      ['How do I test my own water hardness?',
       'A $10 test strip kit from any hardware store is accurate enough to size a softener. Test from an outside hose bib, before any existing treatment. We also test free as part of any quote visit.'],
      ['Is Gilbert\'s water really harder than Mesa\'s?',
       'Generally yes, in our field measurements — Gilbert commonly runs a few grains higher than central Mesa. Both are firmly in "very hard" territory, so the practical difference is grain capacity and salt use rather than whether you need a softener.'],
    ],
  },
  {
    slug: 'water-softener-loop-explained',
    title: 'What Is a Water Softener Loop? (And Do You Have One?)',
    metaTitle: 'What Is a Water Softener Loop? Do You Have One?',
    nav: 'Softener loops',
    description:
      'How to tell in sixty seconds whether your Arizona home has a water softener loop — and what the answer means for your installation cost.',
    answer:
      'A water softener loop is a pair of stubbed pipes, usually in the garage, that a builder installs so a softener can be connected without cutting into the main line. Most East Valley homes built after about 1995 have one. Having a loop cuts installation cost roughly in half, from $950–$1,650 down to $495–$645.',
    sections: [
      {
        h: 'Where to look, in order',
        p: [
          'The garage wall shared with the laundry room or kitchen, near the water heater. Then a side-yard alcove, often behind a small access door. Then an interior closet near the water heater. Then, in some Chandler and Queen Creek builds, an exterior recess with a hose bib and an outlet.',
          'You are looking for two capped or valved pipe stubs a few inches apart, usually with a small drain opening nearby and a standard electrical outlet within a few feet. The outlet is the giveaway — builders put it there for the softener\'s control valve.',
        ],
      },
      {
        h: 'What it is not',
        p: [
          'Not the water heater connections. Not the hose bib. Not the recirculation pump loop, which is a different thing entirely and sits at the water heater. If you are unsure, take a photo of the whole wall — not a close-up — and text it to us. We answer these all day and it costs nothing.',
        ],
      },
      {
        h: 'No loop is not a problem',
        p: [
          'It is a longer job. We tie into the main service line, build the loop with shut-offs and a bypass so the house never has to be shut down for a future service call, and seal the penetration properly. Four to seven hours, $950–$1,650, quoted from photos before anyone drives out.',
          'Building a new home? Ask your builder to include the loop, or have us fit one at the pre-drywall stage for $450. It is the cheapest it will ever be.',
        ],
      },
    ],
    faqs: [
      ['My loop has water coming out of both pipes. Is that normal?',
       'It means the loop is not currently bypassed or capped properly. Shut off the main, cap or valve them, and call someone. It is a quick fix, not a disaster.'],
      ['Can a softener go outside in Arizona?',
       'It can, and in many East Valley homes it has to. Direct summer sun destroys brine tanks and control-valve electronics, so an enclosure or a shaded alcove is worth the $175. We fit them routinely.'],
    ],
  },
];

/* --- Site-wide FAQ --------------------------------------------------------- */
export const siteFaqs = [
  ['Do you install water softeners I bought myself?',
   'Yes — that is the core of what we do. Any brand from any retailer, including Costco, Home Depot, Lowe\'s, Amazon and direct-from-manufacturer units. The flat rate does not change based on where the hardware came from.'],
  ['What does installation cost?',
   'Softener at an existing loop: $495–$645. Softener where a loop must be built: $950–$1,650. Swap-out of an existing unit: $375–$495. Under-sink reverse osmosis: $245–$395. Service call: flat $129. Every price is on our pricing page, in public, before you call.'],
  ['What areas do you serve?',
   'Mesa, Gilbert, Chandler, Queen Creek, San Tan Valley, Tempe, Apache Junction, Gold Canyon, Ahwatukee and Sun Lakes. No travel surcharge anywhere in that list.'],
  ['Are you licensed and insured?',
   'Every installation is performed by a licensed, insured Arizona plumbing contractor. The licence number appears on your invoice and in the footer of this site, and you are welcome to verify it with the Arizona Registrar of Contractors before we start.'],
  ['How fast can you get here?',
   'Usually within two to four business days, and same-week for everything. Emergencies — an active leak — get talked through on the phone first, because putting the unit on bypass usually turns it into a scheduled job instead of an emergency.'],
  ['Do you offer financing?',
   'No, and that is deliberate. Financing exists in this industry to make a $6,000 price feel like $89 a month. Our prices are low enough to pay outright.'],
  ['How do I pay?',
   'Card, ACH or check on completion. Nothing is due up front, and there is no deposit on standard installs.'],
  ['What is your warranty?',
   'One year on our workmanship. The equipment carries whatever warranty its manufacturer provides, and because the work is done by a licensed contractor with a documented invoice, manufacturer warranty requirements are satisfied.'],
  ['Do you do commercial or multi-family work?',
   'Small commercial, yes — restaurants, salons, coffee shops, small offices. Large multi-family is outside what we take on.'],
  ['Are you a franchise or a national company?',
   'Neither. We are a local East Valley operation that books the work, fixes the scope and price up front, and pays licensed local plumbing contractors a posted, fair rate to do it.'],
];

/* --- Trust / process copy -------------------------------------------------- */
export const steps = [
  ['Send a photo', 'Text or email a photo of where the unit will go — the garage wall, the side yard, or under the sink. Thirty seconds of your time replaces a two-hour sales appointment.'],
  ['Get a fixed price', 'We reply with the flat rate and the scope, in writing. It is the same price that is published on this website. No in-home presentation, no "manager discount", no financing pitch.'],
  ['Licensed plumber installs it', 'A licensed, insured Arizona plumbing contractor arrives in a two-hour window, installs it properly, tests your water before and after, and cleans up. You pay when it is done.'],
];

export const differentiators = [
  ['Prices published, not pitched', 'Every rate we charge is on the pricing page. You will never sit through a presentation to find out what something costs.'],
  ['We install your equipment', 'Bought it at Costco? Online? Two years ago and never got round to it? Same flat rate.'],
  ['Small jobs welcome', 'Swap-outs, relocations, filter changes, bypass valves. The jobs other companies decline are the ones we built the business around.'],
  ['Contractors paid fairly', 'Our posted rates to plumbing contractors are on this website too. Underpaid installers do rushed work, and the homeowner pays for it later.'],
  ['No travel surcharge', 'San Tan Valley, Gold Canyon and Apache Junction cost the same as Gilbert. The distance comes out of our margin, not your quote.'],
  ['No financing, no upsell', 'One visit, one price, no monthly payment plan for a garage appliance.'],
];
