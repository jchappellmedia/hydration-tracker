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

/* -------------------------------------------------------------------------
   SVG helpers — used to build provably-correct visual reasoning questions
   (next-in-series, odd-one-out, 3x3 matrix, figure analogy). Shapes are drawn
   from parameters so a rule and its distractors are guaranteed consistent.
   ------------------------------------------------------------------------- */
function _polyPoints(n, cx, cy, r, rotDeg){
  const out=[];
  for(let i=0;i<n;i++){
    const a=(-90+rotDeg)*Math.PI/180 + i*2*Math.PI/n;
    out.push((cx+r*Math.cos(a)).toFixed(1)+','+(cy+r*Math.sin(a)).toFixed(1));
  }
  return out.join(' ');
}
// Draw a regular polygon. fill: 'none' | 'solid' | 'light'
function poly(n, o){
  o=o||{}; const cx=o.cx||50, cy=o.cy||50, r=o.r||32, rot=o.rot||0, sw=o.sw||4;
  const f = o.fill==='solid'?'currentColor':'none';
  const op = o.fill==='light'?' fill-opacity="0.3"':'';
  const fill = o.fill==='light'?'currentColor':f;
  return `<polygon points="${_polyPoints(n,cx,cy,r,rot)}" fill="${fill}"${op} stroke="currentColor" stroke-width="${sw}"/>`;
}
function circ(o){
  o=o||{}; const cx=o.cx||50, cy=o.cy||50, r=o.r||30, sw=o.sw||4;
  const fill = o.fill==='solid'?'currentColor':'none';
  const op = o.fill==='light'?' fill-opacity="0.3"':'';
  return `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${o.fill==='light'?'currentColor':fill}"${op} stroke="currentColor" stroke-width="${sw}"/>`;
}
// An arrow rotated rotDeg (0 = pointing right)
function arrow(rotDeg){
  return `<g transform="translate(50,50) rotate(${rotDeg})" stroke="currentColor" stroke-width="6" fill="none" stroke-linecap="round" stroke-linejoin="round"><line x1="-26" y1="0" x2="24" y2="0"/><polyline points="10,-14 26,0 10,14"/></g>`;
}
// N dots placed on a fixed 3x3 lattice (count 1..9)
function dots(count){
  const P=[[30,30],[50,30],[70,30],[30,50],[50,50],[70,50],[30,70],[50,70],[70,70]];
  const order=[4,0,8,2,6,1,7,3,5]; // visually balanced fill order
  let s='';
  for(let i=0;i<count && i<9;i++){ const [x,y]=P[order[i]]; s+=`<circle cx="${x}" cy="${y}" r="7" fill="currentColor"/>`; }
  return s;
}
// Wrap inner markup as a sequence tile / option tile / matrix
function _tile(inner, cls){ return `<svg viewBox="0 0 100 100" class="${cls}">${inner}</svg>`; }
function vtile(inner){ return _tile(inner,'vtile'); }
function qmark(){ return _tile('<text x="50" y="70" font-size="52" text-anchor="middle" fill="currentColor">?</text>','vtile'); }
function otile(inner){ return _tile(inner,'osvg'); }
function vseq(tiles){ return `<div class="vseq">${tiles.join('')}</div>`; }
function matrix3(cells){ // cells: array of 9 inner-svg fragments ('?' allowed via qmark-less)
  let s='<svg viewBox="0 0 300 300" class="vmatrix">';
  for(let i=0;i<9;i++){ const r=Math.floor(i/3), c=i%3;
    s+=`<g transform="translate(${c*100},${r*100})"><rect x="3" y="3" width="94" height="94" rx="8" fill="none" stroke="var(--line)" stroke-width="2"/>${cells[i]}</g>`; }
  return s+'</svg>';
}
function mqmark(){ return '<text x="50" y="66" font-size="44" text-anchor="middle" fill="currentColor">?</text>'; }
// Two-column attention-to-detail table; rows: [[left,right],...]. Returns {html, identical}
function adTable(rows){
  let same=0;
  const body=rows.map((p,i)=>{ const eq=p[0]===p[1]; if(eq) same++;
    return `<tr><td>${i+1}</td><td class="mono">${p[0]}</td><td class="mono">${p[1]}</td></tr>`; }).join('');
  const html=`<table class="adtable"><thead><tr><th>#</th><th>Set A</th><th>Set B</th></tr></thead><tbody>${body}</tbody></table>`;
  return { html, identical:same };
}

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

  /* ================= VERBAL — additional set ================= */
  { id:'v41', category:'verbal', type:'Analogy',
    q:'Bird is to nest as bee is to ____?',
    options:['Honey','Hive','Flower','Sting'], answer:1,
    explanation:'A bird lives in a nest; a bee lives in a hive (home it builds).' },
  { id:'v42', category:'verbal', type:'Analogy',
    q:'Doctor is to patient as lawyer is to ____?',
    options:['Judge','Client','Court','Crime'], answer:1,
    explanation:'A doctor serves a patient; a lawyer serves a client (professional to person served).' },
  { id:'v43', category:'verbal', type:'Analogy',
    q:'Knife is to cut as ____ is to dig.',
    options:['Hammer','Shovel','Saw','Rake'], answer:1,
    explanation:'A knife is the tool used to cut; a shovel is the tool used to dig.' },
  { id:'v44', category:'verbal', type:'Analogy',
    q:'Sun is to day as moon is to ____?',
    options:['Star','Night','Sky','Light'], answer:1,
    explanation:'The sun is the dominant light of the day; the moon is the dominant light of the night.' },
  { id:'v45', category:'verbal', type:'Analogy',
    q:'Hungry is to eat as tired is to ____?',
    options:['Run','Sleep','Yawn','Work'], answer:1,
    explanation:'You eat to relieve hunger; you sleep to relieve tiredness (need to remedy).' },
  { id:'v46', category:'verbal', type:'Analogy',
    q:'Teacher is to school as chef is to ____?',
    options:['Menu','Kitchen','Recipe','Food'], answer:1,
    explanation:'A teacher works in a school; a chef works in a kitchen (worker to workplace).' },
  { id:'v47', category:'verbal', type:'Analogy',
    q:'Plentiful is to scarce as ancient is to ____?',
    options:['Old','Modern','Historic','Rare'], answer:1,
    explanation:'Plentiful and scarce are opposites; the opposite of ancient is modern.' },
  { id:'v48', category:'verbal', type:'Analogy',
    q:'Petal is to flower as ____ is to book.',
    options:['Cover','Page','Word','Library'], answer:1,
    explanation:'A petal is one part of a flower; a page is one part of a book (part to whole).' },

  { id:'v49', category:'verbal', type:'Synonym',
    q:'Which word means the same as "BENEVOLENT"?',
    options:['Cruel','Kind','Wealthy','Strict'], answer:1,
    explanation:'Benevolent means well-meaning and kindly.' },
  { id:'v50', category:'verbal', type:'Synonym',
    q:'Which word means the same as "RESILIENT"?',
    options:['Fragile','Tough','Tired','Slow'], answer:1,
    explanation:'Resilient means able to recover quickly; tough/hardy.' },
  { id:'v51', category:'verbal', type:'Synonym',
    q:'Which word means the same as "VITAL"?',
    options:['Optional','Essential','Minor','Empty'], answer:1,
    explanation:'Vital means absolutely necessary — essential.' },
  { id:'v52', category:'verbal', type:'Synonym',
    q:'Which word means the same as "PROVOKE"?',
    options:['Calm','Soothe','Incite','Ignore'], answer:2,
    explanation:'Provoke means to stir up or incite a reaction.' },
  { id:'v53', category:'verbal', type:'Synonym',
    q:'Which word means the same as "SCRUTINIZE"?',
    options:['Examine','Glance','Ignore','Approve'], answer:0,
    explanation:'Scrutinize means to examine closely and critically.' },
  { id:'v54', category:'verbal', type:'Synonym',
    q:'Which word means the same as "ELATED"?',
    options:['Overjoyed','Gloomy','Bored','Nervous'], answer:0,
    explanation:'Elated means extremely happy — overjoyed.' },
  { id:'v55', category:'verbal', type:'Synonym',
    q:'Which word means the same as "TRIVIAL"?',
    options:['Crucial','Insignificant','Massive','Urgent'], answer:1,
    explanation:'Trivial means of little importance — insignificant.' },

  { id:'v56', category:'verbal', type:'Antonym',
    q:'Which word is most nearly OPPOSITE to "GENEROUS"?',
    options:['Giving','Stingy','Kind','Warm'], answer:1,
    explanation:'Generous means free in giving; the opposite is stingy.' },
  { id:'v57', category:'verbal', type:'Antonym',
    q:'Which word is most nearly OPPOSITE to "RIGID"?',
    options:['Stiff','Firm','Flexible','Hard'], answer:2,
    explanation:'Rigid means stiff and unbending; the opposite is flexible.' },
  { id:'v58', category:'verbal', type:'Antonym',
    q:'Which word is most nearly OPPOSITE to "ACCELERATE"?',
    options:['Hasten','Rush','Decelerate','Speed'], answer:2,
    explanation:'Accelerate means to speed up; decelerate means to slow down.' },
  { id:'v59', category:'verbal', type:'Antonym',
    q:'Which word is most nearly OPPOSITE to "HUMID"?',
    options:['Damp','Moist','Arid','Wet'], answer:2,
    explanation:'Humid means moist/damp; arid means very dry.' },
  { id:'v60', category:'verbal', type:'Antonym',
    q:'Which word is most nearly OPPOSITE to "CONCEAL"?',
    options:['Hide','Bury','Reveal','Cover'], answer:2,
    explanation:'Conceal means to hide; reveal means to make known.' },
  { id:'v61', category:'verbal', type:'Antonym',
    q:'Which word is most nearly OPPOSITE to "TIMID"?',
    options:['Shy','Bold','Quiet','Meek'], answer:1,
    explanation:'Timid means shy and lacking courage; the opposite is bold.' },

  { id:'v62', category:'verbal', type:'Sentence Completion',
    q:'Despite the team\'s ____ start, they rallied to win the championship.',
    options:['promising','dismal','strong','perfect'], answer:1,
    explanation:'"Despite ... they rallied to win" signals a contrast — the start must have been bad (dismal).' },
  { id:'v63', category:'verbal', type:'Sentence Completion',
    q:'The scientist\'s findings were ____ by three independent laboratories before publication.',
    options:['ignored','corroborated','rejected','hidden'], answer:1,
    explanation:'Independent labs confirming findings means the results were corroborated (verified).' },
  { id:'v64', category:'verbal', type:'Sentence Completion',
    q:'Because the instructions were so ____, the new employees finished the task quickly.',
    options:['confusing','lengthy','clear','vague'], answer:2,
    explanation:'"Because ... finished quickly" implies easy-to-follow instructions — clear.' },
  { id:'v65', category:'verbal', type:'Sentence Completion',
    q:'The museum\'s collection was so ____ that visitors needed two days to see it all.',
    options:['vast','tiny','dull','fake'], answer:0,
    explanation:'Needing two days to see everything implies the collection was vast (huge).' },
  { id:'v66', category:'verbal', type:'Sentence Completion',
    q:'Her argument was ____; no one in the debate could find a flaw in it.',
    options:['weak','irrelevant','sound','vague'], answer:2,
    explanation:'An argument with no flaws is sound (logically solid).' },
  { id:'v67', category:'verbal', type:'Sentence Completion',
    q:'The hikers grew ____ as the trail became steeper and the air thinner.',
    options:['energized','fatigued','cheerful','faster'], answer:1,
    explanation:'A steeper trail and thinner air would make hikers fatigued (tired).' },

  { id:'v68', category:'verbal', type:'Odd One Out',
    q:'Which word does NOT belong with the others?',
    options:['Inch','Mile','Pound','Yard'], answer:2,
    explanation:'Inch, mile, and yard measure length; a pound measures weight.' },
  { id:'v69', category:'verbal', type:'Odd One Out',
    q:'Which word does NOT belong with the others?',
    options:['Saturn','Mars','Venus','Sun'], answer:3,
    explanation:'Saturn, Mars, and Venus are planets; the Sun is a star.' },
  { id:'v70', category:'verbal', type:'Odd One Out',
    q:'Which word does NOT belong with the others?',
    options:['Violin','Cello','Flute','Guitar'], answer:2,
    explanation:'Violin, cello, and guitar are string instruments; a flute is a wind instrument.' },
  { id:'v71', category:'verbal', type:'Odd One Out',
    q:'Which word does NOT belong with the others?',
    options:['Square','Triangle','Cube','Circle'], answer:2,
    explanation:'Square, triangle, and circle are 2-D shapes; a cube is a 3-D solid.' },

  { id:'v72', category:'verbal', type:'Word Relationship',
    q:'Hot : Cold :: Day : ____',
    options:['Sun','Night','Noon','Week'], answer:1,
    explanation:'Hot and cold are opposites; the opposite of day is night.' },
  { id:'v73', category:'verbal', type:'Word Relationship',
    q:'Puppy : Dog :: Kitten : ____',
    options:['Cat','Cub','Foal','Pup'], answer:0,
    explanation:'A puppy is a young dog; a kitten is a young cat (young to adult).' },
  { id:'v74', category:'verbal', type:'Word Relationship',
    q:'Finger : Hand :: Toe : ____',
    options:['Leg','Foot','Knee','Heel'], answer:1,
    explanation:'A finger is part of a hand; a toe is part of a foot.' },
  { id:'v75', category:'verbal', type:'Analogy',
    q:'Tall is to giant as short is to ____?',
    options:['Tree','Dwarf','Building','Tower'], answer:1,
    explanation:'A giant is defined by being tall; a dwarf is defined by being short.' },

  /* ================= MATH & LOGIC — additional set ================= */
  { id:'m41', category:'math', type:'Number Series',
    q:'What number comes next? 4, 9, 16, 25, ____',
    options:['30','36','35','49'], answer:1,
    explanation:'These are squares (2²,3²,4²,5²); next is 6² = 36.' },
  { id:'m42', category:'math', type:'Number Series',
    q:'What number comes next? 6, 11, 21, 41, ____',
    options:['61','81','82','71'], answer:1,
    explanation:'Each term doubles and subtracts 1: 41 × 2 − 1 = 81.' },
  { id:'m43', category:'math', type:'Number Series',
    q:'What number comes next? 1, 3, 6, 10, 15, ____',
    options:['18','20','21','25'], answer:2,
    explanation:'Add 2, 3, 4, 5, 6... (triangular numbers): 15 + 6 = 21.' },
  { id:'m44', category:'math', type:'Number Series',
    q:'Find the missing number: 64, 32, 16, ____, 4',
    options:['8','12','10','6'], answer:0,
    explanation:'Each term is halved: 16 ÷ 2 = 8, then 8 ÷ 2 = 4.' },
  { id:'m45', category:'math', type:'Number Series',
    q:'What number comes next? 5, 8, 14, 26, ____',
    options:['38','50','48','52'], answer:1,
    explanation:'Each step doubles the previous difference: +3,+6,+12,+24 → 26 + 24 = 50.' },
  { id:'m46', category:'math', type:'Number Series',
    q:'What number comes next? 2, 6, 18, 54, ____',
    options:['108','162','144','216'], answer:1,
    explanation:'Multiply by 3 each time: 54 × 3 = 162.' },

  { id:'m47', category:'math', type:'Percentage',
    q:'What is 30% of 150?',
    options:['30','45','50','60'], answer:1,
    explanation:'10% of 150 = 15; 30% = 45.' },
  { id:'m48', category:'math', type:'Percentage',
    q:'A $250 coat is discounted 40%. What is the sale price?',
    options:['$100','$150','$160','$210'], answer:1,
    explanation:'40% of $250 = $100 off. $250 − $100 = $150.' },
  { id:'m49', category:'math', type:'Percentage',
    q:'A salary rises from $40,000 to $46,000. What is the percent increase?',
    options:['10%','12%','15%','20%'], answer:2,
    explanation:'Increase = $6,000. 6,000 ÷ 40,000 = 0.15 = 15%.' },
  { id:'m50', category:'math', type:'Percentage',
    q:'If 18 is 25% of a number, what is the number?',
    options:['54','60','72','45'], answer:2,
    explanation:'18 is one quarter, so the whole = 18 × 4 = 72.' },

  { id:'m51', category:'math', type:'Word Problem',
    q:'A car travels 150 miles in 3 hours. At the same speed, how far in 5 hours?',
    options:['200 miles','225 miles','250 miles','300 miles'], answer:2,
    explanation:'Speed = 150 ÷ 3 = 50 mph. In 5 hours: 50 × 5 = 250 miles.' },
  { id:'m52', category:'math', type:'Word Problem',
    q:'Pencils cost $0.40 each. How many can you buy with $6.00?',
    options:['12','15','18','20'], answer:1,
    explanation:'6.00 ÷ 0.40 = 15 pencils.' },
  { id:'m53', category:'math', type:'Word Problem',
    q:'A team won 18 of 24 games. What fraction did they lose?',
    options:['1/4','1/3','3/4','1/6'], answer:0,
    explanation:'Lost = 24 − 18 = 6. 6/24 = 1/4.' },
  { id:'m54', category:'math', type:'Word Problem',
    q:'If 5 pens cost $7.50, how much do 8 pens cost at the same rate?',
    options:['$10.00','$12.00','$11.50','$12.50'], answer:1,
    explanation:'Each pen = $7.50 ÷ 5 = $1.50. 8 × $1.50 = $12.00.' },
  { id:'m55', category:'math', type:'Word Problem',
    q:'A tank is 3/5 full and holds 90 liters at that level. What is its full capacity?',
    options:['120 L','135 L','150 L','180 L'], answer:2,
    explanation:'3/5 = 90 L, so 1/5 = 30 L. Full (5/5) = 150 L.' },
  { id:'m56', category:'math', type:'Word Problem',
    q:'Two trains leave the same station going opposite directions at 40 and 60 mph. How far apart after 2 hours?',
    options:['100 miles','120 miles','200 miles','240 miles'], answer:2,
    explanation:'They separate at 40 + 60 = 100 mph. After 2 hours: 100 × 2 = 200 miles.' },
  { id:'m57', category:'math', type:'Word Problem',
    q:'A rectangle has a perimeter of 30 cm and a length of 9 cm. What is its width?',
    options:['6 cm','5 cm','7 cm','12 cm'], answer:0,
    explanation:'Perimeter = 2(L+W). 30 = 2(9+W) → 15 = 9 + W → W = 6 cm.' },
  { id:'m58', category:'math', type:'Average',
    q:'A student scores 80, 90, and 85 on three tests. What score is needed on a fourth to average 86?',
    options:['86','88','89','90'], answer:2,
    explanation:'Need total 4 × 86 = 344. First three sum to 255, so the fourth = 344 − 255 = 89.' },
  { id:'m59', category:'math', type:'Word Problem',
    q:'A jacket is marked up 50% to $90. What was the original cost?',
    options:['$45','$60','$75','$80'], answer:1,
    explanation:'$90 = 150% of cost. Cost = 90 ÷ 1.5 = $60.' },

  { id:'m60', category:'math', type:'Ratio',
    q:'In a class the ratio of girls to boys is 4:3. If there are 21 boys, how many girls?',
    options:['24','28','18','30'], answer:1,
    explanation:'3 parts = 21, so 1 part = 7. Girls = 4 × 7 = 28.' },
  { id:'m61', category:'math', type:'Ratio',
    q:'A drink mixes water and syrup 5:1. How much syrup is in 18 cups of drink?',
    options:['2 cups','3 cups','4 cups','6 cups'], answer:1,
    explanation:'Total parts = 6; 18 ÷ 6 = 3 cups per part. Syrup = 1 part = 3 cups.' },
  { id:'m62', category:'math', type:'Fraction',
    q:'What is 3/4 of 60?',
    options:['40','45','48','15'], answer:1,
    explanation:'60 ÷ 4 = 15; 15 × 3 = 45.' },
  { id:'m63', category:'math', type:'Fraction',
    q:'What is 1/3 + 1/4?',
    options:['2/7','7/12','5/12','1/2'], answer:1,
    explanation:'Common denominator 12: 4/12 + 3/12 = 7/12.' },

  { id:'m64', category:'math', type:'Logic',
    q:'All squares are rectangles. Some rectangles are blue. Which must be true?',
    options:['All squares are blue','Some squares may be blue','No square is blue','All rectangles are squares'], answer:1,
    explanation:'Squares are rectangles, and only some rectangles are blue — so squares may or may not be blue; "some squares may be blue" is the safe claim.' },
  { id:'m65', category:'math', type:'Logic',
    q:'Mia is older than Leo. Leo is older than Zoe. Zoe is older than Ben. Who is the youngest?',
    options:['Leo','Zoe','Ben','Mia'], answer:2,
    explanation:'Order: Mia > Leo > Zoe > Ben. Ben is youngest.' },
  { id:'m66', category:'math', type:'Logic',
    q:'If no reptiles have fur, and a gecko is a reptile, then a gecko:',
    options:['Has fur','Has no fur','Might have fur','Is not an animal'], answer:1,
    explanation:'No reptile has fur and a gecko is a reptile, so a gecko has no fur.' },
  { id:'m67', category:'math', type:'Logic',
    q:'In a code, MONDAY is written by shifting each letter forward by 1. What is the first letter of the code word?',
    options:['L','N','O','M'], answer:1,
    explanation:'Shifting M forward by one letter gives N.' },

  { id:'m68', category:'math', type:'Word Problem',
    q:'A worker packs 12 boxes in 40 minutes. How many boxes in 2 hours at the same rate?',
    options:['24','30','36','48'], answer:2,
    explanation:'Rate = 12 boxes / 40 min. 2 hours = 120 min = 3 × 40, so 3 × 12 = 36 boxes.' },
  { id:'m69', category:'math', type:'Word Problem',
    q:'A movie starts at 7:45 PM and runs 135 minutes. When does it end?',
    options:['9:45 PM','10:00 PM','10:15 PM','9:30 PM'], answer:1,
    explanation:'135 min = 2 hr 15 min. 7:45 + 2:00 = 9:45, + 15 min = 10:00 PM.' },
  { id:'m70', category:'math', type:'Word Problem',
    q:'A number is doubled and then 6 is added, giving 20. What is the number?',
    options:['7','8','9','13'], answer:0,
    explanation:'2x + 6 = 20 → 2x = 14 → x = 7.' },
  { id:'m71', category:'math', type:'Word Problem',
    q:'A store offers "buy 2, get 1 free." If each item is $9, what is the effective cost per item when buying 3?',
    options:['$6','$7','$8','$9'], answer:0,
    explanation:'You pay for 2 ($18) and get 3 items. $18 ÷ 3 = $6 per item.' },
  { id:'m72', category:'math', type:'Word Problem',
    q:'A square has an area of 49 cm². What is its perimeter?',
    options:['14 cm','21 cm','28 cm','49 cm'], answer:2,
    explanation:'Side = √49 = 7 cm. Perimeter = 4 × 7 = 28 cm.' },
  { id:'m73', category:'math', type:'Word Problem',
    q:'A recipe for 4 people needs 200 g of rice. How much rice for 10 people?',
    options:['400 g','450 g','500 g','600 g'], answer:2,
    explanation:'Per person = 200 ÷ 4 = 50 g. 10 × 50 = 500 g.' },
  { id:'m74', category:'math', type:'Word Problem',
    q:'A bag has 4 red and 6 blue chips. If one is drawn, what is the probability it is red?',
    options:['2/5','1/2','3/5','1/4'], answer:0,
    explanation:'Red = 4 of 10 total = 4/10 = 2/5.' },
  { id:'m75', category:'math', type:'Percentage',
    q:'A laptop costs $600. With 8% sales tax, what is the total price?',
    options:['$608','$640','$648','$660'], answer:2,
    explanation:'8% of $600 = $48. Total = $600 + $48 = $648.' },

  /* ================= SPATIAL & ABSTRACT — additional set ================= */
  { id:'s26', category:'spatial', type:'Letter Series',
    q:'What comes next? C, F, I, L, ____',
    options:['M','N','O','P'], answer:2,
    explanation:'Skip two letters each time (+3): C→F→I→L→O.' },
  { id:'s27', category:'spatial', type:'Letter Series',
    q:'What comes next? A, C, F, J, ____',
    options:['N','O','P','M'], answer:1,
    explanation:'Gaps grow by one: +2, +3, +4, +5. J (10th letter) + 5 = O (15th).' },
  { id:'s28', category:'spatial', type:'Letter Series',
    q:'What comes next? Y, W, U, S, ____',
    options:['R','Q','P','T'], answer:1,
    explanation:'Move back two letters each time: Y→W→U→S→Q.' },
  { id:'s29', category:'spatial', type:'Pattern',
    q:'Which pair continues the pattern? A1, B2, C3, ____',
    options:['D5','D4','E4','C4'], answer:1,
    explanation:'Letters advance A,B,C,D and numbers advance 1,2,3,4 → D4.' },
  { id:'s30', category:'spatial', type:'Pattern',
    q:'Which pair continues the pattern? ZA, YB, XC, ____',
    options:['WD','VD','WE','XD'], answer:0,
    explanation:'First letter goes back (Z,Y,X,W); second goes forward (A,B,C,D) → WD.' },

  { id:'s31', category:'spatial', type:'Attention to Detail',
    q:'Which pair is EXACTLY identical?',
    options:['QW8R2 — QW8R2','5HJ3K — 5HJ8K','LP0Z9 — LPO Z9','M4N7T — M4N7Y'], answer:0,
    explanation:'Only "QW8R2 — QW8R2" matches exactly; the others differ by one character.' },
  { id:'s32', category:'spatial', type:'Attention to Detail',
    q:'Which pair is NOT identical?',
    options:['account — account','SX-4471 — SX-4471','data2025 — data2025','Bright9 — Bright6'], answer:3,
    explanation:'"Bright9" vs "Bright6" differ in the last character (9 vs 6).' },
  { id:'s33', category:'spatial', type:'Attention to Detail',
    q:'How many times does the letter "S" appear?  S T R E S S F U L N E S S',
    options:['3','4','5','6'], answer:2,
    explanation:'Reading left to right: S, S, S, S, S — there are five S\'s (one at the start, two in the middle, two at the end).' },
  { id:'s34', category:'spatial', type:'Attention to Detail',
    q:'Which option exactly matches the target?  Target: BX-7290-LQ',
    options:['BX-7290-LQ','BX-7920-LQ','BX-7290-IQ','8X-7290-LQ'], answer:0,
    explanation:'Only the first option matches the target character-for-character.' },

  { id:'s35', category:'spatial', type:'Cube Folding',
    q:'On a standard die (opposite faces sum to 7), if the top shows 3 and the front shows 1, what is on the bottom?',
    options:['4','5','6','2'], answer:0,
    explanation:'The bottom is opposite the top. Opposite 3 = 7 − 3 = 4.' },
  { id:'s36', category:'spatial', type:'Rotation',
    q:'Rotating the letter "N" by 180° produces a shape most like which letter?',
    options:['Z','N','M','W'], answer:1,
    explanation:'"N" has rotational symmetry — turning it 180° still looks like an N.' },
  { id:'s37', category:'spatial', type:'Rotation',
    q:'If a clock\'s hour hand points to 12 and rotates 90° clockwise, which number does it point to?',
    options:['2','3','4','6'], answer:1,
    explanation:'90° clockwise is a quarter turn = 3 hours from 12, pointing to 3.' },

  { id:'s38', category:'spatial', type:'Symbol Series',
    q:'What comes next? ▲ ▶ ▼ ◀ ▲ ▶ ____',
    options:['▲','▶','▼','◀'], answer:2,
    explanation:'The triangle rotates clockwise (up, right, down, left). After ▶ comes ▼.' },
  { id:'s39', category:'spatial', type:'Symbol Series',
    q:'What comes next? + × + × + ____',
    options:['+','×'], answer:1,
    explanation:'The symbols alternate + and ×; after + comes ×.' },
  { id:'s40', category:'spatial', type:'Symbol Series',
    q:'What comes next? 🌑 🌒 🌓 🌔 ____',
    options:['🌑','🌕','🌗','🌒'], answer:1,
    explanation:'The moon waxes from new to full: new, crescent, half, gibbous, full (🌕).' },

  { id:'s41', category:'spatial', type:'Number Grid',
    q:'Each row follows the same rule. Row: 3, 5, 8; Row: 6, 8, 11; Row: 10, 12, ___. What is missing?',
    options:['14','15','16','13'], answer:1,
    explanation:'Within each row: +2 then +3. 10 → 12 → 15.' },
  { id:'s42', category:'spatial', type:'Number Grid',
    q:'Find the missing number in the grid pattern: 2, 4, 6 / 3, 6, 9 / 4, 8, ___',
    options:['10','11','12','16'], answer:2,
    explanation:'Each row counts by its first number: row 4 is 4, 8, 12.' },
  { id:'s43', category:'spatial', type:'Matrix',
    q:'In this grid every row sums to 15. One row contains 4, 5, and ___. What number completes it?',
    options:['5','6','7','11'], answer:1,
    explanation:'4 + 5 = 9, and the row must total 15, so the missing number is 15 − 9 = 6.' },

  { id:'s44', category:'spatial', type:'Shape Series',
    q:'Triangles in a row: 1 triangle, then 3, then 5, then 7. How many in the 5th figure?',
    options:['8','9','10','11'], answer:1,
    explanation:'Odd numbers 1, 3, 5, 7, 9 — the 5th figure has 9 triangles.' },
  { id:'s45', category:'spatial', type:'Shape Series',
    q:'Which shape comes next? (sides decrease by one each step)',
    svg:`<svg viewBox="0 0 320 80" class="qsvg"><g fill="none" stroke="currentColor" stroke-width="3">
      <polygon points="40,20 60,30 56,55 24,55 20,30"/>
      <rect x="100" y="22" width="40" height="40"/>
      <polygon points="200,20 222,58 178,58"/>
      <text x="270" y="48" font-size="34" stroke="none" fill="currentColor">?</text></g></svg>`,
    options:['Line segment (2 sides)','Hexagon (6 sides)','Square (4 sides)','Pentagon (5 sides)'],
    svgOptions:[
      `<svg viewBox="0 0 60 60" class="osvg"><line x1="10" y1="30" x2="50" y2="30" stroke="currentColor" stroke-width="3"/></svg>`,
      `<svg viewBox="0 0 60 60" class="osvg"><polygon points="30,8 50,20 50,40 30,52 10,40 10,20" fill="none" stroke="currentColor" stroke-width="3"/></svg>`,
      `<svg viewBox="0 0 60 60" class="osvg"><rect x="12" y="12" width="36" height="36" fill="none" stroke="currentColor" stroke-width="3"/></svg>`,
      `<svg viewBox="0 0 60 60" class="osvg"><polygon points="30,8 50,24 42,50 18,50 10,24" fill="none" stroke="currentColor" stroke-width="3"/></svg>`],
    answer:0,
    explanation:'Sides go pentagon (5), square (4), triangle (3)... so the next has 2 — a line segment.' },

  { id:'s46', category:'spatial', type:'Odd One Out',
    q:'Three figures are squares and one is a circle. Which is the odd one out?',
    svg:`<svg viewBox="0 0 320 70" class="qsvg"><g fill="none" stroke="currentColor" stroke-width="3">
      <rect x="20" y="15" width="40" height="40"/>
      <circle cx="120" cy="35" r="20"/>
      <rect x="180" y="15" width="40" height="40"/>
      <rect x="260" y="15" width="40" height="40"/></g></svg>`,
    options:['1st figure','2nd figure','3rd figure','4th figure'],
    answer:1,
    explanation:'The second figure is a circle; the other three are squares.' },
  { id:'s47', category:'spatial', type:'Odd One Out',
    q:'Which group does NOT belong: a set with 2 dots, a set with 4 dots, a set with 6 dots, or a set with 7 dots?',
    options:['2 dots','4 dots','6 dots','7 dots'], answer:3,
    explanation:'2, 4, and 6 are even; 7 is odd — the odd one out.' },

  { id:'s48', category:'spatial', type:'Pattern',
    q:'Mirror image: which is the reflection of "L" across a vertical line?',
    options:['Backwards L (⌐ shape opening left)','L','T','J'], answer:0,
    explanation:'A vertical mirror flips left-right, so the foot of the L points the other way — a backwards L.' },
  { id:'s49', category:'spatial', type:'Letter Series',
    q:'What comes next? AZ, CX, EV, GT, ____',
    options:['IR','HR','IS','JR'], answer:0,
    explanation:'First letter +2 (A,C,E,G,I); second letter −2 (Z,X,V,T,R) → IR.' },
  { id:'s50', category:'spatial', type:'Symbol Series',
    q:'What comes next? ◔ ◑ ◕ ● ____',
    options:['◔','○','●','◑'], answer:1,
    explanation:'The circle fills up (quarter, half, three-quarter, full) then resets to empty (○).' },

  /* ===================================================================
     VISUAL PATTERN QUESTIONS — drawn to mirror the real CCAT spatial
     section: Next-in-Series, Odd-One-Out, 3x3 Matrix, Figure Analogy.
     Five answer choices, as on the actual test.
     =================================================================== */

  // ---- Next in Series ----
  { id:'sv1', category:'spatial', type:'Next in Series',
    q:'Which figure completes the series?',
    svg: vseq([ vtile(poly(3)), vtile(poly(4)), vtile(poly(5)), qmark() ]),
    options:['Hexagon (6 sides)','Pentagon (5 sides)','Heptagon (7 sides)','Square (4 sides)','Triangle (3 sides)'],
    svgOptions:[ otile(poly(6)), otile(poly(5)), otile(poly(7)), otile(poly(4)), otile(poly(3)) ],
    answer:0,
    explanation:'The number of sides increases by one each step (3 → 4 → 5), so the next figure has 6 sides: a hexagon.' },

  { id:'sv2', category:'spatial', type:'Next in Series',
    q:'The arrow rotates by the same amount each step. Which arrow comes next?',
    svg: vseq([ vtile(arrow(0)), vtile(arrow(45)), vtile(arrow(90)), qmark() ]),
    options:['Pointing down-left','Pointing left','Pointing down','Pointing down-right','Pointing right'],
    svgOptions:[ otile(arrow(135)), otile(arrow(180)), otile(arrow(90)), otile(arrow(45)), otile(arrow(0)) ],
    answer:0,
    explanation:'Each step the arrow turns 45° clockwise (right → down-right → down), so the next points down-left (135°).' },

  { id:'sv3', category:'spatial', type:'Next in Series',
    q:'Two things change each step. Which figure completes the series?',
    svg: vseq([ vtile(poly(3,{fill:'none'})), vtile(poly(4,{fill:'solid'})), vtile(poly(5,{fill:'none'})), qmark() ]),
    options:['Filled hexagon','Empty hexagon','Filled pentagon','Filled heptagon','Shaded hexagon (light)'],
    svgOptions:[ otile(poly(6,{fill:'solid'})), otile(poly(6,{fill:'none'})), otile(poly(5,{fill:'solid'})), otile(poly(7,{fill:'solid'})), otile(poly(6,{fill:'light'})) ],
    answer:0,
    explanation:'Sides increase by one (3,4,5 → 6) and the fill alternates empty/solid (empty, solid, empty → solid). So the answer is a filled hexagon.' },

  { id:'sv4', category:'spatial', type:'Next in Series',
    q:'Which arrow comes next in the rotation?',
    svg: vseq([ vtile(arrow(0)), vtile(arrow(90)), vtile(arrow(180)), qmark() ]),
    options:['Pointing up','Pointing right','Pointing down','Pointing left','Pointing down-right'],
    svgOptions:[ otile(arrow(270)), otile(arrow(0)), otile(arrow(90)), otile(arrow(180)), otile(arrow(45)) ],
    answer:0,
    explanation:'The arrow turns 90° clockwise each step (right → down → left), so the next points up.' },

  { id:'sv5', category:'spatial', type:'Next in Series',
    q:'How many dots should the next figure have?',
    svg: vseq([ vtile(dots(1)), vtile(dots(3)), vtile(dots(5)), qmark() ]),
    options:['7 dots','5 dots','9 dots','6 dots','8 dots'],
    svgOptions:[ otile(dots(7)), otile(dots(5)), otile(dots(9)), otile(dots(6)), otile(dots(8)) ],
    answer:0,
    explanation:'The dot count goes up by 2 each step (1, 3, 5), so the next figure has 7 dots.' },

  { id:'sv6', category:'spatial', type:'Next in Series',
    q:'The figures lose a side each step. Which comes next?',
    svg: vseq([ vtile(poly(6)), vtile(poly(5)), vtile(poly(4)), qmark() ]),
    options:['Triangle (3 sides)','Square (4 sides)','Pentagon (5 sides)','Hexagon (6 sides)','Circle'],
    svgOptions:[ otile(poly(3)), otile(poly(4)), otile(poly(5)), otile(poly(6)), otile(circ()) ],
    answer:0,
    explanation:'The number of sides decreases by one each step (6, 5, 4), so the next figure is a triangle (3 sides).' },

  // ---- Odd One Out ----
  { id:'oo1', category:'spatial', type:'Odd One Out',
    q:'Four of these figures share a feature and one does not. Which is the odd one out?',
    svg: vseq([ vtile(poly(4)), vtile(poly(5)), vtile(poly(3,{fill:'solid'})), vtile(poly(6)), vtile(poly(4)) ]),
    options:['1st figure','2nd figure','3rd figure','4th figure','5th figure'],
    answer:2,
    explanation:'All the figures are unshaded outlines except the 3rd, which is solid-filled — it is the odd one out.' },

  { id:'oo2', category:'spatial', type:'Odd One Out',
    q:'Which figure does NOT belong with the others?',
    svg: vseq([ vtile(poly(4)), vtile(poly(6)), vtile(poly(5)), vtile(poly(8)), vtile(poly(4)) ]),
    options:['1st figure','2nd figure','3rd figure','4th figure','5th figure'],
    answer:2,
    explanation:'The square (4), hexagon (6), octagon (8) and square (4) all have an even number of sides; the 3rd figure is a pentagon (5 sides), which is odd.' },

  { id:'oo3', category:'spatial', type:'Odd One Out',
    q:'Four arrows point the same way and one differs. Which is the odd one out?',
    svg: vseq([ vtile(arrow(0)), vtile(arrow(0)), vtile(arrow(270)), vtile(arrow(0)), vtile(arrow(0)) ]),
    options:['1st arrow','2nd arrow','3rd arrow','4th arrow','5th arrow'],
    answer:2,
    explanation:'Four arrows point right; the 3rd arrow points up — the odd one out.' },

  { id:'oo4', category:'spatial', type:'Odd One Out',
    q:'Which figure does NOT belong, based on the number of dots?',
    svg: vseq([ vtile(dots(2)), vtile(dots(4)), vtile(dots(3)), vtile(dots(6)), vtile(dots(8)) ]),
    options:['1st figure','2nd figure','3rd figure','4th figure','5th figure'],
    answer:2,
    explanation:'The dot counts are 2, 4, 3, 6, 8. All are even except the 3rd figure, which has 3 dots (odd).' },

  // ---- 3x3 Matrix ----
  { id:'mx1', category:'spatial', type:'Matrix',
    q:'Which option completes the 3×3 grid? (look across rows AND down columns)',
    svg: matrix3([
      poly(3,{fill:'none'}),  poly(4,{fill:'none'}),  poly(5,{fill:'none'}),
      poly(3,{fill:'light'}), poly(4,{fill:'light'}), poly(5,{fill:'light'}),
      poly(3,{fill:'solid'}), poly(4,{fill:'solid'}), mqmark() ]),
    options:['Solid pentagon','Light pentagon','Solid square','Empty pentagon','Solid hexagon'],
    svgOptions:[ otile(poly(5,{fill:'solid'})), otile(poly(5,{fill:'light'})), otile(poly(4,{fill:'solid'})), otile(poly(5,{fill:'none'})), otile(poly(6,{fill:'solid'})) ],
    answer:0,
    explanation:'Across each row the shape gains a side (triangle → square → pentagon); down each column the shading darkens (empty → light → solid). The missing cell is therefore a solid pentagon.' },

  { id:'mx2', category:'spatial', type:'Matrix',
    q:'Which option completes the grid? (the shading shifts position each row)',
    svg: matrix3([
      poly(5,{fill:'none'}),  poly(5,{fill:'light'}), poly(5,{fill:'solid'}),
      poly(5,{fill:'light'}), poly(5,{fill:'solid'}), poly(5,{fill:'none'}),
      poly(5,{fill:'solid'}), poly(5,{fill:'none'}),  mqmark() ]),
    options:['Light pentagon','Empty pentagon','Solid pentagon','Light square','Light hexagon'],
    svgOptions:[ otile(poly(5,{fill:'light'})), otile(poly(5,{fill:'none'})), otile(poly(5,{fill:'solid'})), otile(poly(4,{fill:'light'})), otile(poly(6,{fill:'light'})) ],
    answer:0,
    explanation:'Each row uses the cycle empty → light → solid, but the cycle shifts one step to the left each row. The bottom row runs solid, empty, then light — so the missing cell is a light-shaded pentagon.' },

  { id:'mx3', category:'spatial', type:'Matrix',
    q:'The arrow turns the same amount from cell to cell (reading left-to-right, top-to-bottom). Which completes the grid?',
    svg: matrix3([
      arrow(0),   arrow(45),  arrow(90),
      arrow(135), arrow(180), arrow(225),
      arrow(270), arrow(315), mqmark() ]),
    options:['Pointing right','Pointing up-left','Pointing down-right','Pointing left','Pointing down'],
    svgOptions:[ otile(arrow(0)), otile(arrow(315)), otile(arrow(45)), otile(arrow(180)), otile(arrow(90)) ],
    answer:0,
    explanation:'Reading in order, the arrow rotates 45° clockwise each cell (0°, 45°, 90° … 315°). The next is 360° = 0°, pointing right.' },

  // ---- Figure Analogy ----
  { id:'fa1', category:'spatial', type:'Figure Analogy',
    q:'The top pair changes in a certain way. Apply the SAME change to the bottom figure. Which completes it?',
    svg: vseq([ vtile(poly(3,{fill:'none'})), vtile('<text x="50" y="68" font-size="40" text-anchor="middle" fill="currentColor">→</text>'), vtile(poly(3,{fill:'solid'})) ])
       + vseq([ vtile(poly(4,{fill:'none'})), vtile('<text x="50" y="68" font-size="40" text-anchor="middle" fill="currentColor">→</text>'), qmark() ]),
    options:['Solid square','Empty square','Solid pentagon','Solid triangle','Light square'],
    svgOptions:[ otile(poly(4,{fill:'solid'})), otile(poly(4,{fill:'none'})), otile(poly(5,{fill:'solid'})), otile(poly(3,{fill:'solid'})), otile(poly(4,{fill:'light'})) ],
    answer:0,
    explanation:'The top pair keeps the same shape but fills it in (empty triangle → solid triangle). Applying that to the empty square gives a solid square.' },

  { id:'fa2', category:'spatial', type:'Figure Analogy',
    q:'Apply the same rotation shown in the top pair to the bottom figure. Which completes it?',
    svg: vseq([ vtile(arrow(0)), vtile('<text x="50" y="68" font-size="40" text-anchor="middle" fill="currentColor">→</text>'), vtile(arrow(90)) ])
       + vseq([ vtile(arrow(270)), vtile('<text x="50" y="68" font-size="40" text-anchor="middle" fill="currentColor">→</text>'), qmark() ]),
    options:['Pointing right','Pointing left','Pointing down','Pointing up','Pointing down-right'],
    svgOptions:[ otile(arrow(0)), otile(arrow(180)), otile(arrow(90)), otile(arrow(270)), otile(arrow(45)) ],
    answer:0,
    explanation:'The top pair rotates the arrow 90° clockwise (right → down). Rotating the up-arrow 90° clockwise gives an arrow pointing right.' },

  /* ===================================================================
     VERBAL — Attention to Detail (two-column matching, real CCAT format)
     =================================================================== */
  (function(){ const t=adTable([
      ['8847TQ','8847TQ'], ['MX-0931-K','MX-0931-K'], ['river_run','river_runn'],
      ['00FF9A2','00FF9A2'], ['Delta-77','Delta-71'] ]);
    return { id:'ad1', category:'verbal', type:'Attention to Detail',
      q:'How many of the five rows have Set A and Set B EXACTLY the same?',
      svg:t.html, options:['0','1','2','3','4','5'], answer:t.identical,
      explanation:'Rows 1, 2 and 4 match exactly. Row 3 differs ("run" vs "runn") and row 5 differs ("77" vs "71") — so 3 rows are identical.' }; })(),

  (function(){ const t=adTable([
      ['Kowalski, A.','Kowalski, A.'], ['inv#4471902','inv#4471902'], ['β-carotene','β-caroteen'],
      ['Set 12.0.4','Set 12.0.4'], ['rhythm&blues','rhythm&blues'] ]);
    return { id:'ad2', category:'verbal', type:'Attention to Detail',
      q:'How many of the five rows are EXACTLY identical between the two columns?',
      svg:t.html, options:['0','1','2','3','4','5'], answer:t.identical,
      explanation:'Rows 1, 2, 4 and 5 match. Only row 3 differs ("carotene" vs "caroteen"), so 4 rows are identical.' }; })(),

  (function(){ const t=adTable([
      ['9G7-x12','9G7-x12'], ['Strasse 14b','Strasse 14b'], ['ZZ-009-zz','ZZ-009-zz'],
      ['portfolio.v2','portfolio.v2'], ['acct: 88301','acct: 88031'] ]);
    return { id:'ad3', category:'verbal', type:'Attention to Detail',
      q:'How many of the five rows are EXACTLY identical between the two columns?',
      svg:t.html, options:['0','1','2','3','4','5'], answer:t.identical,
      explanation:'Rows 1–4 match exactly. Row 5 differs ("88301" vs "88031" — the digits are transposed), so 4 rows are identical.' }; })(),

  /* ===================================================================
     LOGIC — Deductive Reasoning & Seating Arrangement (end-of-test style)
     =================================================================== */
  { id:'lg1', category:'math', type:'Deductive Reasoning',
    q:'Five runners finish a race (1st–5th). Wes finished before Tom. Tom finished before Sara. Uma finished immediately after Sara. Vic finished last. Who finished FIRST?',
    options:['Wes','Tom','Sara','Uma','Vic'], answer:0,
    explanation:'Vic is 5th. Uma is right after Sara, so Sara=3rd, Uma=4th (Sara can\'t be 4th or Uma would tie Vic). That leaves Wes and Tom for 1st–2nd with Wes before Tom: Wes 1st, Tom 2nd. Wes finished first.' },

  { id:'lg2', category:'math', type:'Seating Arrangement',
    q:'Five friends sit in chairs 1–5 (left to right). Raj is in chair 1. Tara is in chair 2. Priya is not at either end. Quinn sits immediately to Priya\'s right. Sam sits somewhere to the right of Quinn. Who is in chair 5?',
    options:['Sam','Priya','Quinn','Raj','Tara'], answer:0,
    explanation:'Chairs 3–5 remain for Priya, Quinn, Sam. Priya can\'t be at the end, and Quinn = Priya+1, Sam > Quinn. Priya=3, Quinn=4, Sam=5 is the only fit, so Sam is in chair 5.' },

  { id:'lg3', category:'math', type:'Deductive Reasoning',
    q:'All engineers are problem-solvers. No problem-solver dislikes coffee. Maria is an engineer. Which statement MUST be true?',
    options:['Maria dislikes coffee','Maria does not dislike coffee','Maria is not a problem-solver','Maria drinks tea'], answer:1,
    explanation:'Maria is an engineer, so she is a problem-solver. No problem-solver dislikes coffee, so Maria does not dislike coffee.' },

  { id:'lg4', category:'math', type:'Deductive Reasoning',
    q:'"If it rains, the game is canceled." The game was NOT canceled. What can you conclude?',
    options:['It rained','It did not rain','The game was delayed','Nothing can be concluded'], answer:1,
    explanation:'This is modus tollens: if rain → cancellation, and there was no cancellation, then it did not rain.' },

  { id:'lg5', category:'math', type:'Deductive Reasoning',
    q:'In a building, the gym is above the pool. The café is below the pool. The office is above the gym. Which is on the LOWEST floor?',
    options:['Office','Gym','Pool','Café'], answer:3,
    explanation:'From top to bottom: office, gym, pool, café. The café is on the lowest floor.' },

  { id:'lg6', category:'math', type:'Deductive Reasoning',
    q:'Some musicians are painters. All painters are creative. Which statement MUST be true?',
    options:['All musicians are creative','Some musicians are creative','No musician is creative','All creative people are painters'], answer:1,
    explanation:'The musicians who are painters must be creative (all painters are creative), so at least some musicians are creative. We cannot say all musicians are.' },

  /* ===================================================================
     VERBAL — Harder vocabulary & reasoning
     =================================================================== */
  { id:'vh1', category:'verbal', type:'Analogy',
    q:'Ephemeral is to eternal as ____ is to abundant.',
    options:['plentiful','scarce','ample','frequent'], answer:1,
    explanation:'Ephemeral (fleeting) and eternal (everlasting) are opposites; the opposite of abundant is scarce.' },
  { id:'vh2', category:'verbal', type:'Antonym',
    q:'Which word is most nearly OPPOSITE to "GREGARIOUS"?',
    options:['Sociable','Outgoing','Reclusive','Cheerful'], answer:2,
    explanation:'Gregarious means sociable and fond of company; its opposite is reclusive (preferring to be alone).' },
  { id:'vh3', category:'verbal', type:'Synonym',
    q:'Which word means most nearly the same as "CAPRICIOUS"?',
    options:['Steady','Fickle','Honest','Generous'], answer:1,
    explanation:'Capricious means given to sudden, unpredictable changes — fickle.' },
  { id:'vh4', category:'verbal', type:'Sentence Completion',
    q:'The senator\'s ____ response — neither confirming nor denying the report — frustrated the journalists.',
    options:['decisive','equivocal','candid','furious'], answer:1,
    explanation:'"Neither confirming nor denying" describes an equivocal (deliberately ambiguous) response.' },
  { id:'vh5', category:'verbal', type:'Analogy',
    q:'Cobbler is to shoes as cooper is to ____?',
    options:['Wood','Barrels','Hats','Ropes'], answer:1,
    explanation:'A cobbler makes/repairs shoes; a cooper is a craftsman who makes barrels.' },
  { id:'vh6', category:'verbal', type:'Antonym',
    q:'Which word is most nearly OPPOSITE to "ZENITH"?',
    options:['Peak','Summit','Nadir','Apex'], answer:2,
    explanation:'Zenith means the highest point; its opposite is the nadir, the lowest point.' },
  { id:'vh7', category:'verbal', type:'Synonym',
    q:'Which word means most nearly the same as "OBFUSCATE"?',
    options:['Clarify','Confuse','Reveal','Simplify'], answer:1,
    explanation:'To obfuscate is to deliberately make something unclear or confusing.' },
  { id:'vh8', category:'verbal', type:'Sentence Completion',
    q:'Far from being a ____ critic, she praised almost every painting in the exhibit.',
    options:['generous','discerning','captious','silent'], answer:2,
    explanation:'"Far from being a ___ critic, she praised almost everything" needs a word meaning fault-finding — captious (overly critical) fits the contrast.' },

  /* ===================================================================
     MATH & LOGIC — Harder, multi-step
     =================================================================== */
  { id:'mh1', category:'math', type:'Percentage',
    q:'A coat is discounted 20%, then an extra 10% is taken off the reduced price. What is the overall discount from the original price?',
    options:['28%','30%','25%','32%'], answer:0,
    explanation:'Successive discounts multiply: 0.80 × 0.90 = 0.72, so 72% of the price remains — a 28% total discount (not 30%).' },
  { id:'mh2', category:'math', type:'Number Series',
    q:'What number comes next? 3, 7, 15, 31, ____',
    options:['47','63','62','64'], answer:1,
    explanation:'Each term is doubled and then +1: 31 × 2 + 1 = 63.' },
  { id:'mh3', category:'math', type:'Word Problem',
    q:'One pipe fills a tank in 6 hours, another in 12 hours. Running together, how long to fill it?',
    options:['3 hours','4 hours','6 hours','9 hours'], answer:1,
    explanation:'Rates add: 1/6 + 1/12 = 2/12 + 1/12 = 3/12 = 1/4 tank per hour, so it fills in 4 hours.' },
  { id:'mh4', category:'math', type:'Logic',
    q:'If 3 machines make 3 widgets in 3 minutes, how many machines are needed to make 100 widgets in 100 minutes?',
    options:['3','100','33','9'], answer:0,
    explanation:'Each machine makes 1 widget per 3 minutes. In 100 minutes a machine makes about 33 widgets, so 3 machines make ~100 — the rate is unchanged, the answer is 3.' },
  { id:'mh5', category:'math', type:'Word Problem',
    q:'A driver goes to a city at 60 mph and returns along the same road at 40 mph. What is the average speed for the whole trip?',
    options:['48 mph','50 mph','52 mph','45 mph'], answer:0,
    explanation:'Average speed = total distance ÷ total time. For equal distances it is the harmonic mean: 2 × 60 × 40 ÷ (60 + 40) = 4800 ÷ 100 = 48 mph.' },
  { id:'mh6', category:'math', type:'Word Problem',
    q:'$1,000 is invested at 10% interest compounded annually. What is it worth after 2 years?',
    options:['$1,200','$1,210','$1,100','$1,221'], answer:1,
    explanation:'Year 1: 1,000 × 1.10 = 1,100. Year 2: 1,100 × 1.10 = 1,210.' },
  { id:'mh7', category:'math', type:'Ratio',
    q:'If a : b = 2 : 3 and b : c = 4 : 5, what is a : c?',
    options:['2 : 5','8 : 15','6 : 5','10 : 15'], answer:1,
    explanation:'Scale b to match: a:b = 8:12 and b:c = 12:15, giving a:b:c = 8:12:15. So a:c = 8:15.' },
  { id:'mh8', category:'math', type:'Number Series',
    q:'What number comes next? 2, 3, 5, 7, 11, 13, ____',
    options:['15','16','17','19'], answer:2,
    explanation:'These are consecutive prime numbers; the next prime after 13 is 17.' },
  { id:'mh9', category:'math', type:'Word Problem',
    q:'On an analog clock at exactly 3:15, what is the angle between the hour and minute hands?',
    options:['0°','7.5°','15°','22.5°'], answer:1,
    explanation:'At 3:15 the minute hand is at 90°. The hour hand has moved 15 min past 3, i.e. 3×30 + 15×0.5 = 97.5°. The difference is 7.5°.' },
  { id:'mh10', category:'math', type:'Word Problem',
    q:'A 25% increase followed by a 20% decrease leaves a price at what fraction of the original?',
    options:['Exactly the same','5% higher','5% lower','25% higher'], answer:0,
    explanation:'1.25 × 0.80 = 1.00, so the price ends up exactly where it started.' },
];

/* -------------------------------------------------------------------------
   Procedural generators — unlimited practice for "Drill" mode.
   ------------------------------------------------------------------------- */
const Generators = {
  // Random integer in [min, max]
  _r(min, max){ return Math.floor(Math.random() * (max - min + 1)) + min; },

  numberSeries(){
    const start = this._r(2, 12);
    const step = this._r(3, 9);
    const type = this._r(0, 4);
    let seq = [], rule = '', ans;
    if (type === 0){ // arithmetic
      for (let i=0;i<5;i++) seq.push(start + i*step);
      ans = start + 5*step; rule = `Add ${step} each time.`;
    } else if (type === 1){ // geometric
      const r = this._r(2, 3);
      let v = start;
      for (let i=0;i<4;i++){ seq.push(v); v*=r; }
      ans = v; rule = `Multiply by ${r} each time.`;
    } else if (type === 2){ // increasing difference
      let v = start, d = step;
      for (let i=0;i<5;i++){ seq.push(v); v += d; d++; }
      ans = v; rule = `Differences increase by 1 each step (starting at ${step}).`;
    } else if (type === 3){ // double and add k
      const k = this._r(1, 4); let v = start;
      for (let i=0;i<4;i++){ seq.push(v); v = v*2 + k; }
      ans = v; rule = `Double the previous term and add ${k}.`;
    } else { // alternating: add a, then multiply by 2
      const a = this._r(2, 6); let v = start;
      for (let i=0;i<5;i++){ seq.push(v); v = (i % 2 === 0) ? v + a : v * 2; }
      ans = v; rule = `Alternately add ${a} and multiply by 2.`;
    }
    const opts = this._distract(ans);
    const ruleText = rule.replace(/\.$/,'').toLowerCase();
    return { id:'gen-ns-'+Math.random().toString(36).slice(2), category:'math', type:'Number Series',
      q:`What number comes next?  ${seq.join(', ')}, ____`,
      options:opts.options, answer:opts.answer, explanation:`${rule} So the next term is ${ans}.`,
      wrongHint:`it doesn’t continue the sequence — the rule is: ${ruleText}, which gives ${ans}` };
  },

  arithmetic(){
    const a = this._r(24, 149), b = this._r(3, 24);
    const op = this._r(0, 3);
    let ans, sym;
    if (op===0){ ans=a+b; sym='+'; }
    else if (op===1){ ans=a-b; sym='−'; }
    else if (op===2){ ans=a*b; sym='×'; }
    else { const q=this._r(3,15); const prod=q*b; const opts=this._distract(q);
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
