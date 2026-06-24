/* =========================================================================
   CCAT Prep — Question Bank
   -------------------------------------------------------------------------
   The Criteria Cognitive Aptitude Test (CCAT) has 50 questions in 15 minutes
   across three areas:
     - Verbal   : analogies, synonyms/antonyms, sentence completion, relations
     - Math     : number series, word problems, arithmetic, ratios, logic
     - Spatial  : abstract/visual reasoning, pattern series, attention to detail
   Each question:
     { id, category, type, q, options:[...], answer:<index>, explanation,
       svg?:<svg string for the prompt>, svgOptions?:[<svg>...] }
   ========================================================================= */

const QUESTIONS = [

  /* ====================== VERBAL ABILITY ============================= */

  // ---- Analogies ----
  { id:'v1', category:'verbal', type:'Analogy',
    q:'Ocean is to puddle as mountain is to ____?',
    options:['Valley','Hill','Lake','Cliff'], answer:1,
    explanation:'An ocean is a very large body of water; a puddle is a tiny one. A mountain is a very large landform; a hill is a small one — same size relationship.' },

  { id:'v2', category:'verbal', type:'Analogy',
    q:'Author is to book as composer is to ____?',
    options:['Orchestra','Symphony','Conductor','Piano'], answer:1,
    explanation:'An author creates a book; a composer creates a symphony. The relationship is creator-to-creation.' },

  { id:'v3', category:'verbal', type:'Analogy',
    q:'Thermometer is to temperature as odometer is to ____?',
    options:['Speed','Distance','Time','Pressure'], answer:1,
    explanation:'A thermometer measures temperature; an odometer measures distance traveled. (A speedometer measures speed.)' },

  { id:'v4', category:'verbal', type:'Analogy',
    q:'Cautious is to reckless as humble is to ____?',
    options:['Modest','Shy','Arrogant','Quiet'], answer:2,
    explanation:'Cautious and reckless are opposites; the opposite of humble is arrogant.' },

  { id:'v5', category:'verbal', type:'Analogy',
    q:'Glove is to hand as ____ is to head.',
    options:['Sock','Hat','Scarf','Shoe'], answer:1,
    explanation:'A glove covers the hand; a hat covers the head.' },

  { id:'v6', category:'verbal', type:'Analogy',
    q:'Drought is to water as famine is to ____?',
    options:['Food','Land','Rain','People'], answer:0,
    explanation:'A drought is a severe shortage of water; a famine is a severe shortage of food.' },

  { id:'v7', category:'verbal', type:'Analogy',
    q:'Pen is to writer as ____ is to painter.',
    options:['Canvas','Brush','Color','Gallery'], answer:1,
    explanation:'A pen is the primary tool of a writer; a brush is the primary tool of a painter.' },

  { id:'v8', category:'verbal', type:'Analogy',
    q:'Library is to books as ____ is to art.',
    options:['Studio','Museum','School','Theater'], answer:1,
    explanation:'A library houses and displays books; a museum houses and displays art.' },

  { id:'v9', category:'verbal', type:'Analogy',
    q:'Whisper is to shout as trickle is to ____?',
    options:['Drip','Stream','Flood','Drop'], answer:2,
    explanation:'A whisper is a quiet version of a shout (a small amount of sound); a trickle is a small flow and a flood is a huge flow — degree of intensity.' },

  { id:'v10', category:'verbal', type:'Analogy',
    q:'Hive is to bee as ____ is to ant.',
    options:['Nest','Colony','Hill','Web'], answer:2,
    explanation:'Bees live in a hive; ants live in an (ant) hill. A colony describes the group, not the dwelling.' },

  // ---- Synonyms ----
  { id:'v11', category:'verbal', type:'Synonym',
    q:'Which word is most nearly the SAME in meaning as "ABUNDANT"?',
    options:['Scarce','Plentiful','Heavy','Costly'], answer:1,
    explanation:'Abundant means existing in large quantities — plentiful.' },

  { id:'v12', category:'verbal', type:'Synonym',
    q:'Which word means the same as "CANDID"?',
    options:['Secretive','Frank','Hesitant','Polite'], answer:1,
    explanation:'Candid means truthful and straightforward — frank.' },

  { id:'v13', category:'verbal', type:'Synonym',
    q:'Which word means the same as "DILIGENT"?',
    options:['Lazy','Hardworking','Clever','Careless'], answer:1,
    explanation:'Diligent means showing careful and persistent effort — hardworking.' },

  { id:'v14', category:'verbal', type:'Synonym',
    q:'Which word means the same as "FRUGAL"?',
    options:['Generous','Wasteful','Thrifty','Wealthy'], answer:2,
    explanation:'Frugal means economical or sparing with money — thrifty.' },

  { id:'v15', category:'verbal', type:'Synonym',
    q:'Which word means the same as "LUCID"?',
    options:['Clear','Dark','Lucky','Loud'], answer:0,
    explanation:'Lucid means easily understood; clear.' },

  { id:'v16', category:'verbal', type:'Synonym',
    q:'Which word means the same as "TENACIOUS"?',
    options:['Weak','Persistent','Gentle','Confused'], answer:1,
    explanation:'Tenacious means holding firmly; persistent and determined.' },

  { id:'v17', category:'verbal', type:'Synonym',
    q:'Which word means the same as "OBSOLETE"?',
    options:['Modern','Outdated','Useful','Hidden'], answer:1,
    explanation:'Obsolete means no longer in use; outdated.' },

  // ---- Antonyms ----
  { id:'v18', category:'verbal', type:'Antonym',
    q:'Which word is most NEARLY OPPOSITE to "BENEVOLENT"?',
    options:['Kind','Generous','Cruel','Helpful'], answer:2,
    explanation:'Benevolent means kind and well-meaning; its opposite is cruel.' },

  { id:'v19', category:'verbal', type:'Antonym',
    q:'Which word is most nearly OPPOSITE to "TRANSPARENT"?',
    options:['Clear','Opaque','Bright','Thin'], answer:1,
    explanation:'Transparent means see-through; opaque means not able to be seen through.' },

  { id:'v20', category:'verbal', type:'Antonym',
    q:'Which word is most nearly OPPOSITE to "EXPAND"?',
    options:['Grow','Stretch','Contract','Build'], answer:2,
    explanation:'Expand means to grow larger; contract means to shrink.' },

  { id:'v21', category:'verbal', type:'Antonym',
    q:'Which word is most nearly OPPOSITE to "PRAISE"?',
    options:['Applaud','Criticize','Reward','Admire'], answer:1,
    explanation:'Praise means to express approval; criticize means to express disapproval.' },

  { id:'v22', category:'verbal', type:'Antonym',
    q:'Which word is most nearly OPPOSITE to "ARTIFICIAL"?',
    options:['Fake','Natural','Plastic','Smart'], answer:1,
    explanation:'Artificial means made by humans / not natural; its opposite is natural.' },

  { id:'v23', category:'verbal', type:'Antonym',
    q:'Which word is most nearly OPPOSITE to "ASCEND"?',
    options:['Climb','Rise','Descend','Float'], answer:2,
    explanation:'Ascend means to move up; descend means to move down.' },

  // ---- Sentence Completion ----
  { id:'v24', category:'verbal', type:'Sentence Completion',
    q:'The new policy was so ____ that even the experts struggled to understand it.',
    options:['simple','convoluted','brief','popular'], answer:1,
    explanation:'"Even experts struggled to understand" signals complexity — convoluted (extremely complex) fits.' },

  { id:'v25', category:'verbal', type:'Sentence Completion',
    q:'Although she was usually ____, she made an exception and spoke at length about her work.',
    options:['talkative','reserved','angry','famous'], answer:1,
    explanation:'"Although ... made an exception and spoke at length" implies she normally does NOT — reserved (quiet) fits.' },

  { id:'v26', category:'verbal', type:'Sentence Completion',
    q:'The detective found a ____ between the suspect\'s story and the physical evidence.',
    options:['harmony','discrepancy','agreement','similarity'], answer:1,
    explanation:'A detective comparing story to evidence and finding a problem points to a discrepancy (a difference/inconsistency).' },

  { id:'v27', category:'verbal', type:'Sentence Completion',
    q:'His ____ remarks offended nearly everyone in the room.',
    options:['tactful','gracious','insensitive','quiet'], answer:2,
    explanation:'Remarks that "offended nearly everyone" must have been insensitive.' },

  { id:'v28', category:'verbal', type:'Sentence Completion',
    q:'The bridge was deemed ____ after engineers found severe cracks in its supports.',
    options:['sturdy','unsafe','beautiful','modern'], answer:1,
    explanation:'Severe cracks in supports would make the bridge unsafe.' },

  { id:'v29', category:'verbal', type:'Sentence Completion',
    q:'Rather than acting on impulse, a ____ investor studies the market carefully.',
    options:['prudent','rash','careless','hasty'], answer:0,
    explanation:'"Rather than acting on impulse" and "studies carefully" describe a prudent (careful, wise) investor.' },

  // ---- Word Relationships / Odd one out ----
  { id:'v30', category:'verbal', type:'Odd One Out',
    q:'Which word does NOT belong with the others?',
    options:['Rose','Tulip','Oak','Daisy'], answer:2,
    explanation:'Rose, tulip, and daisy are flowers; an oak is a tree.' },

  { id:'v31', category:'verbal', type:'Odd One Out',
    q:'Which word does NOT belong with the others?',
    options:['Copper','Iron','Glass','Silver'], answer:2,
    explanation:'Copper, iron, and silver are metals; glass is not.' },

  { id:'v32', category:'verbal', type:'Odd One Out',
    q:'Which word does NOT belong with the others?',
    options:['Honest','Sincere','Truthful','Deceptive'], answer:3,
    explanation:'Honest, sincere, and truthful are synonyms; deceptive is the opposite.' },

  { id:'v33', category:'verbal', type:'Word Relationship',
    q:'A "flock" relates to "sheep" in the same way a "____" relates to "wolves".',
    options:['Herd','Pack','School','Swarm'], answer:1,
    explanation:'A group of sheep is a flock; a group of wolves is a pack.' },

  { id:'v34', category:'verbal', type:'Word Relationship',
    q:'Choose the word that best completes the relationship: Doctor : Hospital :: Teacher : ____',
    options:['Student','School','Lesson','Book'], answer:1,
    explanation:'A doctor works in a hospital; a teacher works in a school (place of work).' },

  { id:'v35', category:'verbal', type:'Synonym',
    q:'Which word means the same as "AMBIGUOUS"?',
    options:['Clear','Unclear','Final','Honest'], answer:1,
    explanation:'Ambiguous means open to more than one interpretation — unclear.' },

  { id:'v36', category:'verbal', type:'Analogy',
    q:'Spark is to fire as ____ is to flood.',
    options:['Rain','Drop','River','Storm'], answer:1,
    explanation:'A spark is the small beginning of a fire; a drop is the small beginning that can build to a flood.' },

  { id:'v37', category:'verbal', type:'Antonym',
    q:'Which word is most nearly OPPOSITE to "ABUNDANT"?',
    options:['Plentiful','Ample','Scarce','Full'], answer:2,
    explanation:'Abundant means plentiful; scarce means in short supply.' },

  { id:'v38', category:'verbal', type:'Sentence Completion',
    q:'The volunteers worked ____ through the night to fill sandbags before the storm hit.',
    options:['lazily','tirelessly','rarely','reluctantly'], answer:1,
    explanation:'Working "through the night ... before the storm" suggests dedicated, tireless effort.' },

  { id:'v39', category:'verbal', type:'Analogy',
    q:'Novice is to expert as seed is to ____?',
    options:['Soil','Tree','Flower','Root'], answer:1,
    explanation:'A novice grows into an expert through development; a seed grows into a tree.' },

  { id:'v40', category:'verbal', type:'Synonym',
    q:'Which word means the same as "METICULOUS"?',
    options:['Careless','Thorough','Quick','Rough'], answer:1,
    explanation:'Meticulous means showing great attention to detail — thorough.' },

  /* ====================== MATH & LOGIC ============================== */

  // ---- Number series ----
  { id:'m1', category:'math', type:'Number Series',
    q:'What number comes next? 2, 4, 8, 16, ____',
    options:['24','32','30','20'], answer:1,
    explanation:'Each term doubles (×2): 16 × 2 = 32.' },

  { id:'m2', category:'math', type:'Number Series',
    q:'What number comes next? 3, 6, 9, 12, ____',
    options:['14','15','16','18'], answer:1,
    explanation:'Add 3 each time: 12 + 3 = 15.' },

  { id:'m3', category:'math', type:'Number Series',
    q:'What number comes next? 1, 1, 2, 3, 5, 8, ____',
    options:['11','12','13','15'], answer:2,
    explanation:'Fibonacci: each term is the sum of the two before it. 5 + 8 = 13.' },

  { id:'m4', category:'math', type:'Number Series',
    q:'What number comes next? 81, 27, 9, 3, ____',
    options:['1','0','2','3'], answer:0,
    explanation:'Divide by 3 each time: 3 ÷ 3 = 1.' },

  { id:'m5', category:'math', type:'Number Series',
    q:'What number comes next? 2, 5, 11, 23, ____',
    options:['35','46','47','44'], answer:2,
    explanation:'Each term is doubled then +1: 23 × 2 + 1 = 47.' },

  { id:'m6', category:'math', type:'Number Series',
    q:'What number comes next? 1, 4, 9, 16, 25, ____',
    options:['30','36','35','49'], answer:1,
    explanation:'These are perfect squares (1², 2², 3², 4², 5²); next is 6² = 36.' },

  { id:'m7', category:'math', type:'Number Series',
    q:'What number comes next? 100, 95, 85, 70, ____',
    options:['55','50','60','45'], answer:1,
    explanation:'Subtract 5, 10, 15, 20... : 70 − 20 = 50.' },

  { id:'m8', category:'math', type:'Number Series',
    q:'Find the missing number: 7, 14, 28, ____, 112',
    options:['42','56','70','84'], answer:1,
    explanation:'Each term doubles: 28 × 2 = 56, and 56 × 2 = 112.' },

  // ---- Arithmetic / percentages / ratios ----
  { id:'m9', category:'math', type:'Percentage',
    q:'A jacket costs $80. It is marked down by 25%. What is the sale price?',
    options:['$55','$60','$65','$20'], answer:1,
    explanation:'25% of $80 = $20 off. $80 − $20 = $60.' },

  { id:'m10', category:'math', type:'Percentage',
    q:'What is 15% of 240?',
    options:['24','36','30','45'], answer:1,
    explanation:'10% of 240 = 24; 5% = 12; 15% = 24 + 12 = 36.' },

  { id:'m11', category:'math', type:'Ratio',
    q:'A recipe uses flour and sugar in a 3:2 ratio. If you use 9 cups of flour, how much sugar?',
    options:['4 cups','6 cups','5 cups','3 cups'], answer:1,
    explanation:'3:2 → flour is 3 parts = 9 cups, so 1 part = 3 cups. Sugar is 2 parts = 6 cups.' },

  { id:'m12', category:'math', type:'Word Problem',
    q:'A train travels 60 miles in 1.5 hours. What is its average speed in miles per hour?',
    options:['30 mph','40 mph','45 mph','90 mph'], answer:1,
    explanation:'Speed = distance ÷ time = 60 ÷ 1.5 = 40 mph.' },

  { id:'m13', category:'math', type:'Word Problem',
    q:'If 4 workers can build a wall in 6 days, how long would it take 8 workers (working at the same rate)?',
    options:['3 days','4 days','12 days','2 days'], answer:0,
    explanation:'Total work = 4 × 6 = 24 worker-days. With 8 workers: 24 ÷ 8 = 3 days.' },

  { id:'m14', category:'math', type:'Word Problem',
    q:'A shirt originally priced at $40 is now $30. What percent discount is that?',
    options:['10%','25%','30%','33%'], answer:1,
    explanation:'Discount = $10 off $40 = 10/40 = 0.25 = 25%.' },

  { id:'m15', category:'math', type:'Average',
    q:'The average of 4 numbers is 20. Three of them are 18, 22, and 25. What is the fourth?',
    options:['15','20','12','17'], answer:0,
    explanation:'Sum must be 4 × 20 = 80. Known three sum to 65, so the fourth is 80 − 65 = 15.' },

  { id:'m16', category:'math', type:'Word Problem',
    q:'Sarah is twice as old as Tom. In 5 years she will be 1.5 times his age. How old is Tom now?',
    options:['5','10','15','20'], answer:0,
    explanation:'Let Tom = t, Sarah = 2t. (2t+5) = 1.5(t+5) → 2t+5 = 1.5t+7.5 → 0.5t = 2.5 → t = 5.' },

  { id:'m17', category:'math', type:'Fraction',
    q:'What is 2/3 of 90?',
    options:['30','45','60','75'], answer:2,
    explanation:'90 ÷ 3 = 30; 30 × 2 = 60.' },

  { id:'m18', category:'math', type:'Word Problem',
    q:'A store buys an item for $40 and sells it for $50. What is the profit margin (profit as a percent of cost)?',
    options:['10%','20%','25%','50%'], answer:2,
    explanation:'Profit = $10. As a percent of cost: 10/40 = 25%.' },

  { id:'m19', category:'math', type:'Word Problem',
    q:'A car uses 8 gallons of gas to travel 240 miles. How many gallons for 360 miles?',
    options:['10','12','14','16'], answer:1,
    explanation:'Mileage = 240 ÷ 8 = 30 mi/gal. 360 ÷ 30 = 12 gallons.' },

  { id:'m20', category:'math', type:'Percentage',
    q:'A population of 5,000 grows by 20%. What is the new population?',
    options:['5,200','6,000','5,500','7,000'], answer:1,
    explanation:'20% of 5,000 = 1,000. New total = 5,000 + 1,000 = 6,000.' },

  { id:'m21', category:'math', type:'Word Problem',
    q:'Three people split a $90 bill equally, but one person also adds a $15 tip paid by themselves. How much does that one person pay in total?',
    options:['$30','$45','$35','$40'], answer:1,
    explanation:'Each share = $90 ÷ 3 = $30. The tipper pays $30 + $15 = $45.' },

  { id:'m22', category:'math', type:'Logic',
    q:'If all Bloops are Razzies, and all Razzies are Lazzies, then all Bloops are definitely:',
    options:['Lazzies','Not Lazzies','Some Lazzies','Cannot be determined'], answer:0,
    explanation:'Bloops ⊆ Razzies ⊆ Lazzies, so every Bloop is a Lazzie (transitive).' },

  { id:'m23', category:'math', type:'Logic',
    q:'Five friends finish a race. Ana beats Bo. Cy beats Ana. Dee beats Cy. Bo beats Ed. Who finished last?',
    options:['Bo','Ana','Ed','Ana or Ed'], answer:2,
    explanation:'Order so far: Dee > Cy > Ana > Bo > Ed. Ed is last.' },

  { id:'m24', category:'math', type:'Word Problem',
    q:'A water tank holds 600 liters. A pump fills it at 50 liters per minute, but the tank leaks 10 liters per minute. How long to fill it from empty?',
    options:['12 min','15 min','10 min','20 min'], answer:1,
    explanation:'Net fill rate = 50 − 10 = 40 L/min. 600 ÷ 40 = 15 minutes.' },

  { id:'m25', category:'math', type:'Percentage',
    q:'A price increases from $50 to $65. What is the percent increase?',
    options:['15%','30%','25%','20%'], answer:1,
    explanation:'Increase = $15. As a percent of original: 15/50 = 0.30 = 30%.' },

  { id:'m26', category:'math', type:'Word Problem',
    q:'A box contains 3 red, 5 blue, and 2 green marbles. What is the probability of drawing a blue marble?',
    options:['1/2','1/5','3/10','2/5'], answer:0,
    explanation:'Total = 10 marbles, 5 blue. 5/10 = 1/2.' },

  { id:'m27', category:'math', type:'Number Series',
    q:'What number comes next? 1, 2, 6, 24, ____',
    options:['48','96','120','72'], answer:2,
    explanation:'Multiply by 2, 3, 4, 5...: 24 × 5 = 120 (these are factorials).' },

  { id:'m28', category:'math', type:'Word Problem',
    q:'If it is currently 3:40, what time will it be in 95 minutes?',
    options:['5:15','5:25','5:05','4:55'], answer:0,
    explanation:'95 min = 1 hr 35 min. 3:40 + 1:00 = 4:40, + 35 min = 5:15.' },

  { id:'m29', category:'math', type:'Word Problem',
    q:'A worker earns $18 per hour and time-and-a-half for hours over 40. What is the pay for a 44-hour week?',
    options:['$792','$828','$846','$864'], answer:2,
    explanation:'40 × $18 = $720. Overtime: 4 hrs × $27 (time-and-a-half) = $108. Total = $720 + $108 = $828.' },

  { id:'m30', category:'math', type:'Word Problem',
    q:'A rectangle is 12 cm long and 5 cm wide. What is its area?',
    options:['17 cm²','34 cm²','60 cm²','120 cm²'], answer:2,
    explanation:'Area = length × width = 12 × 5 = 60 cm².' },

  { id:'m31', category:'math', type:'Logic',
    q:'Some cats are black. All black animals in this shelter are friendly. Which must be true?',
    options:['All cats are friendly','Some cats may be friendly','No cats are friendly','All friendly animals are cats'], answer:1,
    explanation:'Only the black cats are guaranteed friendly; other cats are unknown — so "some cats may be friendly" is the safe statement.' },

  { id:'m32', category:'math', type:'Number Series',
    q:'Find the missing number: 5, 10, 20, 40, ____, 160',
    options:['60','80','100','120'], answer:1,
    explanation:'Each term doubles: 40 × 2 = 80, and 80 × 2 = 160.' },

  { id:'m33', category:'math', type:'Word Problem',
    q:'A pizza is cut into 8 equal slices. If 3 people each eat 2 slices, what fraction of the pizza remains?',
    options:['1/4','1/8','2/8','3/8'], answer:0,
    explanation:'Eaten = 6 slices, remaining = 2 of 8 = 2/8 = 1/4.' },

  { id:'m34', category:'math', type:'Percentage',
    q:'On a test, a student answers 45 of 60 questions correctly. What percentage is that?',
    options:['70%','72%','75%','80%'], answer:2,
    explanation:'45 ÷ 60 = 0.75 = 75%.' },

  { id:'m35', category:'math', type:'Word Problem',
    q:'Two numbers add to 30 and differ by 8. What is the larger number?',
    options:['17','18','19','22'], answer:2,
    explanation:'x + y = 30, x − y = 8. Add: 2x = 38 → x = 19.' },

  { id:'m36', category:'math', type:'Number Series',
    q:'What comes next? 2, 3, 5, 8, 12, ____',
    options:['15','16','17','18'], answer:2,
    explanation:'Differences increase by 1: +1, +2, +3, +4, +5. 12 + 5 = 17.' },

  { id:'m37', category:'math', type:'Word Problem',
    q:'A map scale is 1 inch = 50 miles. Two cities are 3.5 inches apart on the map. How far apart are they in reality?',
    options:['150 miles','175 miles','200 miles','185 miles'], answer:1,
    explanation:'3.5 × 50 = 175 miles.' },

  { id:'m38', category:'math', type:'Logic',
    q:'John is taller than Mike but shorter than Sam. Lee is taller than Sam. Who is the tallest?',
    options:['Sam','John','Lee','Mike'], answer:2,
    explanation:'Lee > Sam > John > Mike, so Lee is tallest.' },

  { id:'m39', category:'math', type:'Word Problem',
    q:'A phone plan costs $20 per month plus $0.10 per text. If the bill was $35, how many texts were sent?',
    options:['100','120','150','200'], answer:2,
    explanation:'$35 − $20 = $15 in texts. $15 ÷ $0.10 = 150 texts.' },

  { id:'m40', category:'math', type:'Percentage',
    q:'An item costs $200 after a 20% discount. What was the original price?',
    options:['$240','$250','$220','$260'], answer:1,
    explanation:'$200 represents 80% of the original. Original = 200 ÷ 0.80 = $250.' },

  /* ====================== SPATIAL / ABSTRACT ======================= */

  // ---- Letter / symbol series (abstract reasoning) ----
  { id:'s1', category:'spatial', type:'Letter Series',
    q:'What comes next in the series? A, C, E, G, ____',
    options:['H','I','J','K'], answer:1,
    explanation:'Skip one letter each time (A→C→E→G): the next is I.' },

  { id:'s2', category:'spatial', type:'Letter Series',
    q:'What comes next? Z, X, V, T, ____',
    options:['S','R','Q','P'], answer:1,
    explanation:'Move back two letters each time (Z→X→V→T): the next is R.' },

  { id:'s3', category:'spatial', type:'Letter Series',
    q:'What comes next? A, B, D, G, K, ____',
    options:['N','O','P','Q'], answer:2,
    explanation:'Gaps grow by 1: +1, +2, +3, +4, +5. K (11th) + 5 = P (16th).' },

  { id:'s4', category:'spatial', type:'Pattern',
    q:'Which letter pair continues the pattern? AZ, BY, CX, ____',
    options:['DV','DW','EW','DX'], answer:1,
    explanation:'First letter goes forward (A,B,C,D); second goes backward (Z,Y,X,W) → DW.' },

  // ---- Attention to detail (string matching) ----
  { id:'s5', category:'spatial', type:'Attention to Detail',
    q:'Which pair is EXACTLY identical?',
    options:['7B4K9 — 7B4K9','3X8M2 — 3X8N2','GQ5T1 — GO5T1','P9L2Z — P9I2Z'], answer:0,
    explanation:'Only the first pair matches character-for-character (7B4K9 = 7B4K9). The others differ by one symbol.' },

  { id:'s6', category:'spatial', type:'Attention to Detail',
    q:'Which pair is NOT identical?',
    options:['hello123 — hello123','RT-99-XX — RT-99-XX','842nQ — 842nQ','b00kKeep — b00kkeep'], answer:3,
    explanation:'In "b00kKeep" vs "b00kkeep", the capital K differs from the lowercase k.' },

  { id:'s7', category:'spatial', type:'Attention to Detail',
    q:'How many times does the digit "3" appear? 3 8 1 3 6 3 9 0 3 3 2',
    options:['3','4','5','6'], answer:2,
    explanation:'Counting the 3s: positions 1, 4, 6, 9, 10 → five 3s.' },

  // ---- Odd one out (described shapes) ----
  { id:'s8', category:'spatial', type:'Odd One Out',
    q:'Three shapes have an even number of sides and one has an odd number. Which is the odd one out?',
    options:['Square (4)','Hexagon (6)','Triangle (3)','Octagon (8)'], answer:2,
    explanation:'Square (4), hexagon (6), and octagon (8) all have an even number of sides; a triangle has 3 (odd).' },

  { id:'s9', category:'spatial', type:'Rotation',
    q:'If you rotate the letter "b" 180° (turn it upside down), which letter does it most resemble?',
    options:['d','p','q','b'], answer:2,
    explanation:'Rotating "b" 180° flips it both horizontally and vertically, producing a shape like "q".' },

  { id:'s10', category:'spatial', type:'Cube Folding',
    q:'A standard six-sided die has opposite faces summing to 7. If one face shows 2, what is on the opposite face?',
    options:['3','4','5','6'], answer:2,
    explanation:'Opposite faces of a die sum to 7, so opposite 2 is 7 − 2 = 5.' },

  { id:'s11', category:'spatial', type:'Pattern',
    q:'Complete the visual sequence (number of dots): • , ••• , ••••• , ____',
    options:['••••••','•••••••','••••','••••••••'], answer:1,
    explanation:'Dots increase by 2 each step: 1, 3, 5, 7. The next has 7 dots.' },

  { id:'s12', category:'spatial', type:'Symbol Series',
    q:'What comes next? ↑ → ↓ ← ↑ → ____',
    options:['↑','→','↓','←'], answer:2,
    explanation:'The arrows rotate clockwise (up, right, down, left, repeat). After → comes ↓.' },

  // ---- SVG-based abstract reasoning ----
  { id:'s13', category:'spatial', type:'Shape Series',
    q:'Which shape comes next in the sequence? (the number of sides increases by one each step)',
    svg:`<svg viewBox="0 0 320 80" class="qsvg">
      <g fill="none" stroke="currentColor" stroke-width="3">
        <polygon points="40,20 60,60 20,60"/>
        <rect x="100" y="20" width="40" height="40"/>
        <polygon points="200,18 222,33 214,58 186,58 178,33"/>
        <text x="270" y="48" font-size="34" stroke="none" fill="currentColor">?</text>
      </g></svg>`,
    options:['Hexagon (6 sides)','Triangle (3 sides)','Circle','Square (4 sides)'],
    svgOptions:[
      `<svg viewBox="0 0 60 60" class="osvg"><polygon points="30,8 50,20 50,40 30,52 10,40 10,20" fill="none" stroke="currentColor" stroke-width="3"/></svg>`,
      `<svg viewBox="0 0 60 60" class="osvg"><polygon points="30,12 48,48 12,48" fill="none" stroke="currentColor" stroke-width="3"/></svg>`,
      `<svg viewBox="0 0 60 60" class="osvg"><circle cx="30" cy="30" r="20" fill="none" stroke="currentColor" stroke-width="3"/></svg>`,
      `<svg viewBox="0 0 60 60" class="osvg"><rect x="12" y="12" width="36" height="36" fill="none" stroke="currentColor" stroke-width="3"/></svg>`],
    answer:0,
    explanation:'The sequence is triangle (3), square (4), pentagon (5)... so the next shape has 6 sides — a hexagon.' },

  { id:'s14', category:'spatial', type:'Rotation',
    q:'The arrow rotates 90° clockwise at each step. Which arrow comes next?',
    svg:`<svg viewBox="0 0 300 70" class="qsvg"><g stroke="currentColor" stroke-width="4" fill="none">
      <g transform="translate(30,35)"><line x1="-15" y1="0" x2="15" y2="0"/><polyline points="8,-7 15,0 8,7"/></g>
      <g transform="translate(110,35) rotate(90)"><line x1="-15" y1="0" x2="15" y2="0"/><polyline points="8,-7 15,0 8,7"/></g>
      <g transform="translate(190,35) rotate(180)"><line x1="-15" y1="0" x2="15" y2="0"/><polyline points="8,-7 15,0 8,7"/></g>
      <text x="262" y="46" font-size="30" stroke="none" fill="currentColor">?</text>
    </g></svg>`,
    options:['Pointing up','Pointing left','Pointing down','Pointing right'],
    answer:0,
    explanation:'Right → down → left → up. Rotating 90° clockwise from "left" gives "up".' },

  { id:'s15', category:'spatial', type:'Matrix',
    q:'In the matrix, shading rotates one position clockwise each row. Which option completes the bottom-right cell? (the shaded corner moves clockwise)',
    options:['Top-left shaded','Top-right shaded','Bottom-right shaded','Bottom-left shaded'],
    answer:3,
    explanation:'Following the clockwise rotation of the shaded corner across the grid, the final cell has its bottom-left corner shaded.' },

  { id:'s16', category:'spatial', type:'Shape Series',
    q:'A figure gains one dot each step: 1 dot, 2 dots, 3 dots. How many dots in the 6th figure?',
    options:['5','6','7','8'], answer:1,
    explanation:'The count equals the figure number, so the 6th figure has 6 dots.' },

  { id:'s17', category:'spatial', type:'Attention to Detail',
    q:'Which option exactly matches the target?  Target: 4417-AZ-093',
    options:['4417-AZ-098','4417-A2-093','4417-AZ-093','4471-AZ-093'], answer:2,
    explanation:'Only "4417-AZ-093" matches the target exactly; the others change a digit or letter.' },

  { id:'s18', category:'spatial', type:'Symbol Series',
    q:'What comes next? ◐ ◓ ◑ ◒ ____',
    options:['◐','◑','◓','◒'], answer:0,
    explanation:'The shaded half rotates clockwise (left, top, right, bottom). After bottom (◒) it returns to left (◐).' },

  { id:'s19', category:'spatial', type:'Letter Series',
    q:'What comes next? B, D, G, K, ____',
    options:['N','O','P','Q'], answer:2,
    explanation:'Gaps increase: +2, +3, +4, +5. K (11) + 5 = P (16).' },

  { id:'s20', category:'spatial', type:'Pattern',
    q:'Mirror image: which option is the mirror reflection of "R" across a vertical line?',
    options:['Я (backwards R)','R','B','P'], answer:0,
    explanation:'A vertical-line mirror flips left-right, turning "R" into a backwards R (Я).' },

  { id:'s21', category:'spatial', type:'Odd One Out',
    q:'Which does NOT belong? Three figures are shaded; one is unshaded.',
    svg:`<svg viewBox="0 0 320 70" class="qsvg"><g stroke="currentColor" stroke-width="3">
      <circle cx="40" cy="35" r="22" fill="currentColor"/>
      <circle cx="120" cy="35" r="22" fill="currentColor"/>
      <circle cx="200" cy="35" r="22" fill="none"/>
      <circle cx="280" cy="35" r="22" fill="currentColor"/>
    </g></svg>`,
    options:['1st circle','2nd circle','3rd circle','4th circle'],
    answer:2,
    explanation:'The third circle is unshaded (hollow) while the other three are filled — it is the odd one out.' },

  { id:'s22', category:'spatial', type:'Number Grid',
    q:'In each row the numbers follow a rule. Row: 2, 4, 8; Row: 3, 6, 12; Row: 5, 10, ___. What is missing?',
    options:['15','20','25','30'], answer:1,
    explanation:'Each row doubles: ×2 then ×2 again. 5, 10, 20.' },

  { id:'s23', category:'spatial', type:'Cube Folding',
    q:'An unfolded cube (net) has faces labeled. On a cube, how many faces does each face touch (are adjacent to)?',
    options:['2','3','4','5'], answer:2,
    explanation:'Each face of a cube is adjacent to 4 others and opposite to exactly 1.' },

  { id:'s24', category:'spatial', type:'Symbol Series',
    q:'What comes next? □ ■ □ ■ □ ____',
    options:['□','■'], answer:1,
    explanation:'The pattern alternates empty/filled squares; after an empty square comes a filled one.' },

  { id:'s25', category:'spatial', type:'Shape Series',
    q:'A square loses one corner (becomes a pentagon-like cut) ... abstractly, sides go 4, 5, 6, 7. What is the 4th value?',
    options:['6','7','8','9'], answer:1,
    explanation:'The sequence 4, 5, 6, 7 increases by 1 each step; the 4th value is 7.' },
];

/* -------------------------------------------------------------------------
   Procedural generators — unlimited practice for "Drill" mode.
   ------------------------------------------------------------------------- */
const Generators = {
  // Random integer in [min, max]
  _r(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min; },

  numberSeries(){
    const start = this._r(1, 9);
    const step = this._r(2, 6);
    const type = this._r(0, 2);
    let seq = [], rule = '', ans;
    if (type === 0){ // arithmetic
      for (let i=0;i<5;i++) seq.push(start + i*step);
      ans = start + 5*step; rule = `Add ${step} each time.`;
    } else if (type === 1){ // geometric
      const r = this._r(2, 3);
      let v = start;
      for (let i=0;i<4;i++){ seq.push(v); v*=r; }
      ans = v; rule = `Multiply by ${r} each time.`;
    } else { // increasing difference
      let v = start, d = step;
      for (let i=0;i<5;i++){ seq.push(v); v += d; d++; }
      ans = v; rule = `Differences increase by 1 each step (starting at ${step}).`;
    }
    const opts = this._distract(ans);
    const ruleText = rule.replace(/\.$/,'').toLowerCase();
    return { id:'gen-ns-'+Math.random().toString(36).slice(2), category:'math', type:'Number Series',
      q:`What number comes next?  ${seq.join(', ')}, ____`,
      options:opts.options, answer:opts.answer, explanation:`${rule} So the next term is ${ans}.`,
      wrongHint:`it doesn’t continue the sequence — the rule is: ${ruleText}, which gives ${ans}` };
  },

  arithmetic(){
    const a = this._r(12, 99), b = this._r(2, 19);
    const op = this._r(0, 3);
    let ans, sym;
    if (op===0){ ans=a+b; sym='+'; }
    else if (op===1){ ans=a-b; sym='−'; }
    else if (op===2){ ans=a*b; sym='×'; }
    else { const q=this._r(2,12); const prod=q*b; const opts=this._distract(q);
      return { id:'gen-ar-'+Math.random().toString(36).slice(2), category:'math', type:'Arithmetic',
        q:`${prod} ÷ ${b} = ?`, options:opts.options, answer:opts.answer,
        explanation:`${prod} ÷ ${b} = ${q}.`,
        wrongHint:`the exact result of ${prod} ÷ ${b} is ${q}` }; }
    const opts = this._distract(ans);
    return { id:'gen-ar-'+Math.random().toString(36).slice(2), category:'math', type:'Arithmetic',
      q:`${a} ${sym} ${b} = ?`, options:opts.options, answer:opts.answer,
      explanation:`${a} ${sym} ${b} = ${ans}.`,
      wrongHint:`the exact result of ${a} ${sym} ${b} is ${ans}` };
  },

  percentage(){
    const pct = [5,10,15,20,25,40,50,75][this._r(0,7)];
    const base = this._r(2, 20) * 20;
    const ans = base * pct / 100;
    const opts = this._distract(ans);
    return { id:'gen-pc-'+Math.random().toString(36).slice(2), category:'math', type:'Percentage',
      q:`What is ${pct}% of ${base}?`, options:opts.options, answer:opts.answer,
      explanation:`${pct}% of ${base} = ${base} × ${pct/100} = ${ans}.`,
      wrongHint:`${pct}% of ${base} is ${base} × ${pct/100} = ${ans}, not this value` };
  },

  // Build 4 plausible numeric options around the correct answer
  _distract(ans){
    const set = new Set([ans]);
    let guard = 0;
    while (set.size < 4 && guard++ < 50){
      const delta = this._r(1, Math.max(3, Math.round(Math.abs(ans)*0.2)+2));
      const cand = Math.random() < 0.5 ? ans + delta : ans - delta;
      if (cand !== ans) set.add(cand);
    }
    let arr = [...set];
    // shuffle
    for (let i=arr.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [arr[i],arr[j]]=[arr[j],arr[i]]; }
    return { options: arr.map(String), answer: arr.indexOf(ans) };
  },

  random(){
    const f = [this.numberSeries, this.arithmetic, this.percentage][this._r(0,2)];
    return f.call(this);
  }
};

window.QUESTIONS = QUESTIONS;
window.Generators = Generators;
