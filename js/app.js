/* ===========================================================
   CCAT Prep — Application logic
   =========================================================== */
(function(){
  'use strict';

  const CATS = {
    verbal:  { name:'Verbal',          color:'var(--verbal)',  icon:'📖' },
    math:    { name:'Math & Logic',    color:'var(--math)',    icon:'🔢' },
    spatial: { name:'Spatial & Abstract', color:'var(--spatial)', icon:'🧩' },
  };
  // The real CCAT is 50 questions in 15 minutes (≈18s each), weighted toward
  // verbal & numerical with a spatial section and a few logic items at the end.
  const FULL_TEST_SIZE = 50;
  const FULL_TEST_TIME = 15 * 60; // seconds

  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];

  /* ---------- storage ---------- */
  const Store = {
    key:'ccat-prep-v1',
    load(){ try { return JSON.parse(localStorage.getItem(this.key)) || {history:[]}; } catch { return {history:[]}; } },
    save(d){ localStorage.setItem(this.key, JSON.stringify(d)); },
    addResult(r){ const d=this.load(); d.history.push(r); if(d.history.length>100) d.history=d.history.slice(-100); this.save(d); },
    stats(){
      const d=this.load(); const h=d.history;
      const full = h.filter(x=>x.mode==='full');
      const best = full.length ? Math.max(...full.map(x=>x.correct)) : 0;
      const avg  = full.length ? Math.round(full.reduce((a,x)=>a+x.correct,0)/full.length) : 0;
      const totalQ = h.reduce((a,x)=>a+x.total,0);
      return { tests:full.length, best, avg, totalQ, history:h };
    },
    theme(){ return this.load().theme || 'dark'; },
    setTheme(t){ const d=this.load(); d.theme=t; this.save(d); },
  };

  /* ---------- utilities ---------- */
  function shuffle(a){ a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; }
  function fmtTime(s){ const m=Math.floor(s/60), ss=s%60; return m+':'+String(ss).padStart(2,'0'); }
  function flash(msg){ const f=document.createElement('div'); f.className='flash'; f.textContent=msg; document.body.appendChild(f); setTimeout(()=>f.remove(),1900); }

  // Pick a set mirroring real CCAT proportions: ~34% verbal, ~44% math+logic,
  // ~22% spatial. We build a weighted draw sequence and pull without repeats.
  function pickBalanced(n){
    const byCat = { verbal:[], math:[], spatial:[] };
    QUESTIONS.forEach(q=>byCat[q.category] && byCat[q.category].push(q));
    Object.keys(byCat).forEach(k=>byCat[k]=shuffle(byCat[k]));
    const targets = { verbal:Math.round(n*0.34), spatial:Math.round(n*0.22) };
    targets.math = n - targets.verbal - targets.spatial;
    const out=[];
    ['verbal','math','spatial'].forEach(c=>{
      for(let k=0;k<targets[c] && byCat[c].length;k++) out.push(byCat[c].shift());
    });
    // top up if any category ran short
    const rest = shuffle([...byCat.verbal, ...byCat.math, ...byCat.spatial]);
    while(out.length<n && rest.length) out.push(rest.shift());
    return shuffle(out);
  }
  function pickCategory(cat, n){ return shuffle(QUESTIONS.filter(q=>q.category===cat)).slice(0,n); }

  // The exact CCAT blueprint (BoostPrep full-length structure):
  // Verbal 18, Math & Logic 21, Spatial 11 — by subtype.
  const EXAM_BLUEPRINT = [
    { slot:'Sentence Completion', types:['Sentence Completion'], cat:'verbal', n:9 },
    { slot:'Analogies',           types:['Analogy'],             cat:'verbal', n:4 },
    { slot:'Attention to Detail', types:['Attention to Detail'], cat:'verbal', n:3 },
    { slot:'Antonyms',            types:['Antonym'],             cat:'verbal', n:2 },
    { slot:'Basic Math',          types:['Basic Math'],          cat:'math',   n:2 },
    { slot:'Word Problems',       types:['Word Problem','Percentage','Ratio','Average','Fraction'], cat:'math', n:11 },
    { slot:'Number Series',       types:['Number Series'],       cat:'math',   n:2 },
    { slot:'Tables & Graphs',     types:['Table & Graph'],       cat:'math',   n:2 },
    { slot:'Syllogism',           types:['Syllogism'],           cat:'math',   n:3 },
    { slot:'Seating',             types:['Seating Arrangement'], cat:'math',   n:1 },
    { slot:'Odd One Out',         types:['Odd One Out'],         cat:'spatial', visual:true, n:4 },
    { slot:'Matrices',            types:['Matrix'],              cat:'spatial', visual:true, n:3 },
    { slot:'Next in Series',      types:['Next in Series'],      cat:'spatial', visual:true, n:4 },
  ];
  // Assemble a 50-question exam matching the blueprint, then interleave so the
  // subjects are mixed throughout (like the real test). No repeats within a sim.
  function buildExam(){
    const used=new Set(); const out=[];
    EXAM_BLUEPRINT.forEach(s=>{
      const pool=QUESTIONS.filter(q=>s.types.includes(q.type) && !used.has(q.id)
        && (!s.cat || q.category===s.cat)
        && (!s.visual || q.svgOptions || /vseq|vmatrix/.test(q.svg||'')));
      // hardest first: draw from the 'hard' pool, then top up with the rest
      const hard=shuffle(pool.filter(q=>q.diff==='hard'));
      const rest=shuffle(pool.filter(q=>q.diff!=='hard'));
      const pick=hard.concat(rest).slice(0,s.n);
      pick.forEach(q=>used.add(q.id));
      out.push(...pick);
    });
    // top up to 50 if any pool fell short
    if(out.length<FULL_TEST_SIZE){
      const extra=shuffle(QUESTIONS.filter(q=>!used.has(q.id)));
      while(out.length<FULL_TEST_SIZE && extra.length){ out.push(extra.shift()); }
    }
    return shuffle(out);
  }

  /* ---------- Quiz engine ---------- */
  const Quiz = {
    state:null,
    timerId:null,

    start(opts){
      // opts: {mode, label, questions, timeLimit(sec)|null, drill:bool}
      this.state = {
        mode:opts.mode, label:opts.label,
        questions:opts.questions, drill:!!opts.drill,
        idx:0, answers:[], remaining:opts.timeLimit||0,
        timed:!!opts.timeLimit, startTs:Date.now(), generator:opts.generator||null,
      };
      Views.show('quiz');
      if(this.state.timed) this._startTimer();
      this.render();
    },

    _startTimer(){
      clearInterval(this.timerId);
      this.timerId=setInterval(()=>{
        this.state.remaining--;
        this._renderTimer();
        if(this.state.remaining<=0){ clearInterval(this.timerId); this.finish(); }
      },1000);
    },
    _renderTimer(){
      const t=$('#timer'); if(!t)return;
      t.querySelector('.t').textContent=fmtTime(Math.max(0,this.state.remaining));
      t.classList.toggle('warn', this.state.remaining<=120 && this.state.remaining>30);
      t.classList.toggle('danger', this.state.remaining<=30);
    },

    cur(){ return this.state.questions[this.state.idx]; },

    render(){
      const s=this.state, q=this.cur();
      const total=s.drill ? '∞' : s.questions.length;
      const cat=CATS[q.category];
      const answered=s.answers[s.idx];
      const optionsHtml=q.options.map((opt,i)=>{
        const ov = q.svgOptions ? q.svgOptions[i] : '';
        return `<button class="answer" data-i="${i}" ${answered!=null?'disabled':''}>
            <span class="key">${'ABCDE'[i]}</span>
            ${ov?`<span class="osvg-wrap">${ov}</span>`:''}
            <span class="atext">${opt}</span>
          </button>`;
      }).join('');

      const progPct = s.drill ? 0 : ((s.idx)/s.questions.length*100);
      $('#view-quiz').innerHTML=`
        <div class="quiz-head">
          ${s.timed?`<div class="timer" id="timer"><span>⏱</span><span class="t">${fmtTime(s.remaining)}</span></div>`:''}
          <div class="qcount">Question <b>${s.idx+1}</b> / ${total}</div>
          <span class="cat-tag ${q.category}">${cat.icon} ${cat.name}</span>
        </div>
        ${s.drill?'':`<div class="progress-track"><div class="progress-fill" style="width:${progPct}%"></div></div>`}
        <div class="qcard">
          <div class="qtype">${q.type||''}</div>
          <div class="qtext">${q.q}</div>
          ${q.svg?q.svg:''}
          <div class="answers">${optionsHtml}</div>
          <div id="explain-slot"></div>
        </div>
        <div class="quiz-foot">
          <button class="btn ghost" id="btn-quit">✕ End</button>
          <div class="spacer"></div>
          ${answered!=null ? `<button class="btn primary" id="btn-next">${this._isLast()?'See results':'Next →'}</button>`
                           : (s.timed?'':`<button class="btn ghost" id="btn-skip">Skip →</button>`)}
        </div>`;

      $$('.answer').forEach(b=>b.addEventListener('click',()=>this.answer(+b.dataset.i)));
      const next=$('#btn-next'); if(next) next.addEventListener('click',()=>this.next());
      const skip=$('#btn-skip'); if(skip) skip.addEventListener('click',()=>{ this.state.answers[s.idx]=-1; this.next(); });
      $('#btn-quit').addEventListener('click',()=>{ if(confirm('End this session?')) this.finish(); });
      if(answered!=null) this._showFeedback(answered,true);
    },

    _isLast(){ return !this.state.drill && this.state.idx>=this.state.questions.length-1; },

    answer(i){
      const s=this.state;
      if(s.answers[s.idx]!=null) return;
      s.answers[s.idx]=i;
      // In timed full-test mode, the real CCAT gives no feedback — just advance UI state.
      if(s.timed){ this._lockChoices(i); setTimeout(()=>this.next(),140); return; }
      this._showFeedback(i,false);
      this.render(); // re-render to show Next + disabled state
    },

    _lockChoices(sel){
      $$('.answer').forEach(b=>{ b.disabled=true; if(+b.dataset.i===sel) b.classList.add('sel'); });
    },

    _showFeedback(sel){
      const q=this.cur();
      $$('.answer').forEach(b=>{
        const i=+b.dataset.i; b.disabled=true;
        if(i===q.answer) b.classList.add('correct');
        else if(i===sel) b.classList.add('wrong');
      });
      const ok = sel===q.answer;
      const slot=$('#explain-slot');
      if(slot){
        const cl='ABCDE'[q.answer];
        let h=`<div class="explain"><span class="verdict ${ok?'ok':'no'}">${ok?'✓ Correct':(sel===-1?'⤳ Skipped — here is the answer':'✕ Not quite')}</span>`;
        if(!ok && sel!==-1 && sel!=null){
          h+=`<div class="why wrong"><b>Why “${q.options[sel]}” is wrong:</b> ${cap(wrongReason(q,sel))}.</div>`;
        }
        h+=`<div class="why right"><b>✓ Correct answer — ${cl}. “${q.options[q.answer]}”.</b> ${q.explanation}</div></div>`;
        slot.innerHTML=h;
      }
    },

    next(){
      const s=this.state;
      if(s.drill){
        s.idx++;
        s.questions.push(s.generator());
        if(s.answers[s.idx-1]==null) s.answers[s.idx-1]=-1;
        this.render(); return;
      }
      if(this._isLast()){ this.finish(); return; }
      s.idx++; this.render();
    },

    finish(){
      clearInterval(this.timerId);
      const s=this.state;
      // grade
      let correct=0; const detail=[];
      s.questions.forEach((q,i)=>{
        const a=s.answers[i];
        const isC = a===q.answer;
        if(isC) correct++;
        if(a!=null) detail.push({q, a, correct:isC});
      });
      const answered=s.answers.filter(a=>a!=null).length;
      const total=s.drill?answered:s.questions.length;
      // category breakdown
      const cats={verbal:{c:0,t:0},math:{c:0,t:0},spatial:{c:0,t:0}};
      s.questions.forEach((q,i)=>{ if(s.drill && s.answers[i]==null) return; cats[q.category].t++; if(s.answers[i]===q.answer) cats[q.category].c++; });
      const result={
        mode:s.mode, label:s.label, correct, total, answered,
        cats, detail, timeUsed:s.timed?(FULL_TEST_TIME-s.remaining):Math.round((Date.now()-s.startTs)/1000),
        date:new Date().toISOString(),
      };
      if(s.mode==='full') Store.addResult({mode:'full',label:s.label,correct,total,date:result.date,cats});
      else Store.addResult({mode:s.mode,label:s.label,correct,total:answered,date:result.date,cats});
      Results.render(result);
      Views.show('results');
    },
  };

  /* ---------- Results view ---------- */
  const Results = {
    render(r){
      const pct = r.total? Math.round(r.correct/r.total*100):0;
      const isFull = r.mode==='full';
      // Percentile estimate based on CCAT norms (raw score out of 50 → approx percentile)
      const percentile = isFull ? estPercentile(r.correct) : null;
      const verdict = pct>=80?'Outstanding! 🏆':pct>=65?'Great work! 🎉':pct>=50?'Solid effort 👍':pct>=35?'Keep practicing 💪':'Room to grow 🌱';
      const ringColor = pct>=65?'var(--good)':pct>=45?'var(--warn)':'var(--bad)';
      const circ=2*Math.PI*78;
      const off=circ*(1-pct/100);

      const bd = Object.entries(r.cats).map(([k,v])=>{
        if(!v.t) return '';
        const p=Math.round(v.c/v.t*100);
        return `<div class="bd-row">
          <span class="lbl">${CATS[k].icon} ${CATS[k].name}</span>
          <span class="bd-bar"><i style="width:${p}%;background:${CATS[k].color}"></i></span>
          <span class="num">${v.c}/${v.t}</span></div>`;
      }).join('');

      $('#view-results').innerHTML=`
        <div class="result-hero">
          <div class="score-ring">
            <svg width="180" height="180" viewBox="0 0 180 180">
              <circle cx="90" cy="90" r="78" fill="none" stroke="var(--line)" stroke-width="14"/>
              <circle cx="90" cy="90" r="78" fill="none" stroke="${ringColor}" stroke-width="14"
                stroke-linecap="round" stroke-dasharray="${circ}" stroke-dashoffset="${off}"/>
            </svg>
            <div class="pct"><span class="big">${pct}%</span><span class="small">${r.correct}/${r.total} correct</span></div>
          </div>
          <div class="verdict-line">${verdict}</div>
          <div class="result-sub">
            ${r.label}${isFull?` · You answered ${r.answered} of ${FULL_TEST_SIZE} in time`:''}
            ${percentile!=null?` · Est. <b>${percentile}th</b> percentile`:''}
            · Time: ${fmtTime(r.timeUsed)}
          </div>
        </div>
        <div class="breakdown">${bd}</div>
        ${isFull?`<div class="card" style="margin-top:18px">
          <b>What this means:</b> <span style="color:var(--muted)">The real CCAT has 50 questions in 15 minutes — most people answer ~24 correctly and very few finish. A raw score of ${r.correct} would place you around the <b>${percentile}th percentile</b> versus the general population.</span>
        </div>`:''}
        <div class="btn-row" style="margin-top:22px;justify-content:center">
          <button class="btn primary lg" id="r-review">Review answers</button>
          <button class="btn lg" id="r-again">Try again</button>
          <button class="btn ghost lg" id="r-home">Home</button>
        </div>`;
      $('#r-review').addEventListener('click',()=>Review.render(r));
      $('#r-again').addEventListener('click',()=>{ Views.show('home'); });
      $('#r-home').addEventListener('click',()=>{ Home.render(); Views.show('home'); });
      this._last=r;
    },
  };

  /* ---------- Review view ---------- */
  const Review = {
    render(r){
      const items=r.detail.map((d,n)=>{
        const q=d.q;
        const youText = d.a===-1?'(skipped)':q.options[d.a];
        return `<div class="review-item">
          <div class="rq"><span class="badge ${d.correct?'ok':(d.a===-1?'skip':'no')}">${d.correct?'✓':(d.a===-1?'–':'✕')}</span>
            <span>${n+1}. ${q.q}</span></div>
          ${q.svg?q.svg:''}
          ${(!d.correct && d.a!==-1)?`<div class="ra you-wrong">Your answer: <b>${youText}</b> — ${wrongReason(q,d.a)}.</div>`:''}
          ${d.a===-1?`<div class="ra you-wrong">You skipped this one.</div>`:''}
          <div class="ra right">Correct answer: <b>${q.options[q.answer]}</b></div>
          <div class="ra">${q.explanation}</div>
        </div>`;
      }).join('') || '<p style="color:var(--muted)">No questions were answered.</p>';
      $('#view-review').innerHTML=`
        <div class="section-title">Answer Review<span class="sub">${r.correct} correct of ${r.total} answered</span></div>
        ${items}
        <div class="btn-row" style="justify-content:center;margin-top:20px">
          <button class="btn primary" id="rv-home">← Back to Home</button>
        </div>`;
      $('#rv-home').addEventListener('click',()=>{ Home.render(); Views.show('home'); });
      Views.show('review');
    },
  };

  /* ---------- Home ---------- */
  const Home = {
    render(){
      const s=Store.stats();
      $('#view-home').innerHTML=`
        <div class="hero">
          <h1>Master the <span class="grad">CCAT</span></h1>
          <p>The Criteria Cognitive Aptitude Test is a <b>50-question, 15-minute</b> test of problem-solving, critical thinking, and learning ability. Train with realistic questions across all three areas — verbal, math &amp; logic, and spatial reasoning — then take full timed simulations to track your progress.</p>
          <div class="pills">
            <span class="pill"><b>50</b> questions</span>
            <span class="pill"><b>15</b> minutes</span>
            <span class="pill"><b>3</b> skill areas</span>
            <span class="pill">Avg score ≈ <b>24</b></span>
          </div>
        </div>

        <div class="grid cols-4">
          <div class="stat"><b>${s.tests}</b><span>Sims taken</span></div>
          <div class="stat"><b>${s.best||'—'}</b><span>Best score</span></div>
          <div class="stat"><b>${s.avg||'—'}</b><span>Avg score</span></div>
          <div class="stat"><b>${s.totalQ}</b><span>Q practiced</span></div>
        </div>

        <div class="section-title">Practice Modes<span class="sub">Pick how you want to train today</span></div>
        <div class="grid cols-3">
          <div class="card mode-card" data-go="full">
            <div class="ic blue">⏱️</div><h3>Full Simulation</h3>
            <p>50 questions, 15-minute timer, no feedback until the end. Built to the exact CCAT blueprint: 18 verbal, 21 math &amp; logic, 11 spatial.</p>
            <div class="go">Start the test →</div>
          </div>
          <div class="card mode-card" data-go="category">
            <div class="ic green">🎯</div><h3>Practice by Topic</h3>
            <p>Focus on verbal, math &amp; logic, or spatial reasoning with instant explanations.</p>
            <div class="go">Choose a topic →</div>
          </div>
          <div class="card mode-card" data-go="drill">
            <div class="ic purple">♾️</div><h3>Untimed Drills</h3>
            <p>No clock. Unlimited number-series, arithmetic &amp; percentage problems with a full why-it's-right / why-you-were-wrong breakdown after each answer.</p>
            <div class="go">Start drilling →</div>
          </div>
          <div class="card mode-card" data-go="quick">
            <div class="ic orange">⚡</div><h3>Quick 10</h3>
            <p>A fast, mixed 10-question timed warm-up (3 minutes) to test yourself.</p>
            <div class="go">Quick test →</div>
          </div>
          <div class="card mode-card" data-go="study">
            <div class="ic pink">📚</div><h3>Study Guide</h3>
            <p>Strategies, formulas, question-type breakdowns, and the percentile chart.</p>
            <div class="go">Read the guide →</div>
          </div>
          <div class="card mode-card" data-go="progress">
            <div class="ic blue">📈</div><h3>My Progress</h3>
            <p>See your score history and category strengths over time.</p>
            <div class="go">View progress →</div>
          </div>
        </div>`;
      $$('.mode-card').forEach(c=>c.addEventListener('click',()=>Router.go(c.dataset.go)));
    },
  };

  /* ---------- Setup screens ---------- */
  const Setup = {
    category(){
      let cat='verbal', count=10, timed=false;
      const draw=()=>{ $('#view-category').innerHTML=`
        <div class="section-title">Practice by Topic<span class="sub">Untimed by default · explanations after every question</span></div>
        <div class="card">
          <div class="opt-group"><h4>Choose a topic</h4><div class="choices" id="c-cat">
            ${Object.entries(CATS).map(([k,v])=>`<button class="choice ${cat===k?'sel':''}" data-v="${k}">${v.icon} ${v.name}</button>`).join('')}
          </div></div>
          <div class="opt-group"><h4>Number of questions</h4><div class="choices" id="c-count">
            ${[5,10,15,'All'].map(n=>`<button class="choice ${String(count)===String(n)?'sel':''}" data-v="${n}">${n}</button>`).join('')}
          </div></div>
          <div class="opt-group"><h4>Timer</h4><div class="choices" id="c-timed">
            <button class="choice ${!timed?'sel':''}" data-v="off">Untimed (learn)</button>
            <button class="choice ${timed?'sel':''}" data-v="on">Timed (~18s/Q)</button>
          </div></div>
          <div class="btn-row">
            <button class="btn primary lg" id="c-start">Start practice →</button>
            <button class="btn ghost lg" id="c-back">← Home</button>
          </div>
        </div>`;
        $$('#c-cat .choice').forEach(b=>b.onclick=()=>{cat=b.dataset.v;draw();});
        $$('#c-count .choice').forEach(b=>b.onclick=()=>{count=b.dataset.v==='All'?'All':+b.dataset.v;draw();});
        $$('#c-timed .choice').forEach(b=>b.onclick=()=>{timed=b.dataset.v==='on';draw();});
        $('#c-back').onclick=()=>Router.go('home');
        $('#c-start').onclick=()=>{
          const pool=QUESTIONS.filter(q=>q.category===cat);
          const n=count==='All'?pool.length:Math.min(count,pool.length);
          const qs=pickCategory(cat,n);
          Quiz.start({ mode:'category', label:`${CATS[cat].name} practice`, questions:qs,
            timeLimit: timed? n*18 : null });
        };
      };
      draw(); Views.show('category');
    },

    drill(){
      const TOPICS={ mixed:'Mixed math', series:'Number series', arith:'Arithmetic', pct:'Percentages' };
      const genFor=(t)=> t==='series'?Generators.numberSeries()
                       : t==='arith' ?Generators.arithmetic()
                       : t==='pct'   ?Generators.percentage()
                       : Generators.random();
      let topic='mixed', length='endless';
      const draw=()=>{ $('#view-drill').innerHTML=`
        <div class="section-title">Untimed Practice Drills
          <span class="sub">No clock, no pressure — every question shows the full breakdown right after you answer</span></div>
        <div class="card">
          <div class="opt-group"><h4>Topic</h4><div class="choices" id="d-topic">
            ${Object.entries(TOPICS).map(([k,v])=>`<button class="choice ${topic===k?'sel':''}" data-v="${k}">${v}</button>`).join('')}
          </div></div>
          <div class="opt-group"><h4>How many questions?</h4><div class="choices" id="d-len">
            ${[['10','10'],['25','25'],['endless','Endless ♾️']].map(([v,l])=>`<button class="choice ${length===v?'sel':''}" data-v="${v}">${l}</button>`).join('')}
          </div></div>
          <div class="opt-group"><h4>Mode</h4>
            <div class="pill" style="display:inline-block">⏱ Untimed · explanations after every answer</div>
          </div>
          <div class="btn-row">
            <button class="btn primary lg" id="d-start">Start drilling →</button>
            <button class="btn ghost lg" id="d-back">← Home</button>
          </div>
        </div>`;
        $$('#d-topic .choice').forEach(b=>b.onclick=()=>{topic=b.dataset.v;draw();});
        $$('#d-len .choice').forEach(b=>b.onclick=()=>{length=b.dataset.v;draw();});
        $('#d-back').onclick=()=>Router.go('home');
        $('#d-start').onclick=()=>{
          const gen=()=>genFor(topic);
          if(length==='endless'){
            Quiz.start({ mode:'drill', label:`Untimed drill · ${TOPICS[topic]}`, drill:true,
              questions:[gen()], generator:gen, timeLimit:null });
          } else {
            const n=+length;
            Quiz.start({ mode:'drill', label:`Untimed drill · ${TOPICS[topic]} (${n})`, drill:false,
              questions:Array.from({length:n}, gen), timeLimit:null });
          }
        };
      };
      draw(); Views.show('drill');
    },
  };

  /* ---------- Progress ---------- */
  const Progress = {
    render(){
      const s=Store.stats();
      const full=s.history.filter(h=>h.mode==='full');
      let chart='<p style="color:var(--muted)">Take a full simulation to start tracking your scores here.</p>';
      if(full.length){
        const max=FULL_TEST_SIZE;
        const bars=full.slice(-12).map(h=>{
          const ht=Math.max(4,Math.round(h.correct/max*120));
          const d=new Date(h.date); const lbl=(d.getMonth()+1)+'/'+d.getDate();
          return `<div style="display:flex;flex-direction:column;align-items:center;gap:6px;flex:1">
            <div style="font-size:.78rem;font-weight:800">${h.correct}</div>
            <div style="width:70%;max-width:34px;height:${ht}px;border-radius:8px 8px 0 0;background:linear-gradient(180deg,var(--brand),var(--brand2))"></div>
            <div style="font-size:.7rem;color:var(--muted)">${lbl}</div></div>`;
        }).join('');
        chart=`<div class="card"><div style="display:flex;align-items:flex-end;gap:8px;height:160px;padding:10px 4px">${bars}</div>
          <div style="text-align:center;color:var(--muted);font-size:.82rem;margin-top:8px">Raw score (correct / 50) — last ${Math.min(12,full.length)} simulations</div></div>`;
      }
      // aggregate category accuracy
      const agg={verbal:{c:0,t:0},math:{c:0,t:0},spatial:{c:0,t:0}};
      s.history.forEach(h=>{ if(h.cats) Object.entries(h.cats).forEach(([k,v])=>{agg[k].c+=v.c;agg[k].t+=v.t;}); });
      const catBars=Object.entries(agg).map(([k,v])=>{
        const p=v.t?Math.round(v.c/v.t*100):0;
        return `<div class="bd-row"><span class="lbl">${CATS[k].icon} ${CATS[k].name}</span>
          <span class="bd-bar"><i style="width:${p}%;background:${CATS[k].color}"></i></span>
          <span class="num">${p}%</span></div>`;
      }).join('');

      $('#view-progress').innerHTML=`
        <div class="section-title">My Progress<span class="sub">Stored privately in your browser</span></div>
        <div class="grid cols-4">
          <div class="stat"><b>${s.tests}</b><span>Sims taken</span></div>
          <div class="stat"><b>${s.best||'—'}</b><span>Best /50</span></div>
          <div class="stat"><b>${s.avg||'—'}</b><span>Avg /50</span></div>
          <div class="stat"><b>${s.totalQ}</b><span>Q practiced</span></div>
        </div>
        <div class="section-title">Score history</div>
        ${chart}
        <div class="section-title">Accuracy by area</div>
        <div class="breakdown">${catBars}</div>
        <div class="btn-row" style="margin-top:20px">
          <button class="btn primary" id="p-full">Take a full simulation →</button>
          <button class="btn ghost" id="p-reset">Reset all data</button>
        </div>`;
      $('#p-full').onclick=()=>Router.go('full');
      $('#p-reset').onclick=()=>{ if(confirm('Erase all your saved progress?')){ Store.save({history:[],theme:Store.theme()}); Progress.render(); flash('Progress cleared'); } };
      Views.show('progress');
    },
  };

  /* ---------- Study guide ---------- */
  const Guide = {
    render(){
      $('#view-study').innerHTML=`
        <div class="section-title">CCAT Study Guide<span class="sub">Everything you need to walk in prepared</span></div>
        <div class="card guide">
          <h3>📋 What is the CCAT?</h3>
          <p>The <b>Criteria Cognitive Aptitude Test</b> measures your ability to solve problems, digest information, and think critically. It is widely used in hiring. Key facts:</p>
          <ul>
            <li><b>50 questions</b> in <b>15 minutes</b> — that's about <b>18 seconds per question</b>.</li>
            <li>Questions get <b>progressively harder</b>. There is <b>no penalty for wrong answers</b>, so never leave a blank, and you <b>cannot skip and return</b> later.</li>
            <li><b>Fewer than 1%</b> of people finish all 50. The average raw score is around <b>24</b>; competitive roles target <b>35+</b>.</li>
            <li>Approximate mix: <b>~34% verbal</b>, <b>~34% numerical (math)</b>, <b>~22% spatial</b>, and <b>~10% logic</b>, interleaved throughout.</li>
          </ul>

          <h3>📖 Verbal Ability</h3>
          <ul>
            <li><b>Analogies:</b> identify the relationship in the first pair, then apply it. (worker : tool, part : whole, cause : effect, degree, opposite).</li>
            <li><b>Synonyms / Antonyms:</b> build vocabulary; watch for the trap option that's a synonym when an antonym is asked.</li>
            <li><b>Sentence completion:</b> read for signal words — <i>although, because, despite, therefore</i> — that flip or confirm meaning.</li>
            <li><b>Odd-one-out:</b> find the shared category, then the outlier.</li>
          </ul>

          <h3>🔢 Math & Logic</h3>
          <p>Memorize these so you don't burn time deriving them:</p>
          <div class="formula">Percent of a number:  X% of N = (X/100) × N</div>
          <div class="formula">Percent change:  (new − old) ÷ old × 100</div>
          <div class="formula">Speed = Distance ÷ Time   ·   Distance = Speed × Time</div>
          <div class="formula">Work:  total = workers × time (worker-days)</div>
          <div class="formula">Average = sum of values ÷ count</div>
          <ul>
            <li><b>Number series:</b> check for +/−, ×/÷, growing differences, squares, or Fibonacci-style sums.</li>
            <li><b>Logic:</b> "all/some/none" syllogisms — diagram them; ordering puzzles — write the chain (A &gt; B &gt; C).</li>
          </ul>

          <h3>🧩 Spatial Reasoning</h3>
          <p>The three official CCAT spatial formats — all visual, with five answer choices:</p>
          <ul>
            <li><b>Next-in-series:</b> 3–5 figures follow a rule; pick the figure that continues it. Track <i>one feature at a time</i> — number of sides, rotation, shading, count, or position.</li>
            <li><b>Odd-one-out:</b> five figures, four share a property and one breaks it. Scan shape, orientation, symmetry, shading, and element count.</li>
            <li><b>Matrix (3×3):</b> a grid with one cell missing. The rule runs <i>across rows AND down columns</i> — often two rules combined (e.g. shape changes across, shading changes down).</li>
            <li><b>Rotation &amp; mirrors:</b> imagine turning the figure 90°/180° (clockwise unless shown otherwise); a mirror is a left-right flip.</li>
          </ul>

          <h3>🔎 Verbal Attention to Detail</h3>
          <ul>
            <li>You get <b>two columns of short strings</b> (names, codes, addresses) and count how many rows match <b>exactly</b>.</li>
            <li>Differences are tiny: a swapped digit (88301 vs 88031), a doubled letter, or a case change. Compare <b>character by character</b>, left to right.</li>
          </ul>

          <h3>🎯 Test-day strategy</h3>
          <ul>
            <li><b>Triage fast:</b> if a question isn't clicking in ~20 seconds, guess and move on. One hard question isn't worth three easy ones.</li>
            <li><b>Never leave blanks</b> — wrong answers don't hurt you, so guess everything you can't reach.</li>
            <li>Keep a steady pace: at the halfway time mark (7:30) you want to be near question 25.</li>
            <li>Eliminate obviously-wrong options to improve guess odds.</li>
          </ul>

          <h3>📊 Score percentile chart</h3>
          <p>Approximate percentile vs. the general adult population (your target also depends on the role):</p>
          <table class="table">
            <tr><th>Raw score (/50)</th><th>≈ Percentile</th><th>Interpretation</th></tr>
            <tr><td><b>42+</b></td><td>99th</td><td>Exceptional</td></tr>
            <tr><td><b>36</b></td><td>~95th</td><td>Very strong</td></tr>
            <tr><td><b>31</b></td><td>~85th</td><td>Strong</td></tr>
            <tr><td><b>27</b></td><td>~70th</td><td>Above average</td></tr>
            <tr><td><b>24</b></td><td>~50th</td><td>Average</td></tr>
            <tr><td><b>20</b></td><td>~35th</td><td>Below average</td></tr>
            <tr><td><b>15</b></td><td>~15th</td><td>Needs work</td></tr>
          </table>
          <p style="font-size:.82rem">Percentiles are estimates for self-study and may differ from official Criteria Corp norms.</p>

          <div class="btn-row" style="margin-top:16px">
            <button class="btn primary" id="g-full">Take a full simulation →</button>
            <button class="btn ghost" id="g-home">← Home</button>
          </div>
        </div>`;
      $('#g-full').onclick=()=>Router.go('full');
      $('#g-home').onclick=()=>Router.go('home');
      Views.show('study');
    },
  };

  // Per-type fallback reasons explaining why a chosen distractor is wrong.
  const WRONG_REASONS = {
    'analogy':'it doesn’t preserve the same relationship shown in the first pair',
    'synonym':'it doesn’t share the meaning of the target word',
    'antonym':'it isn’t the opposite of the target word',
    'sentence completion':'it doesn’t fit the sentence’s logic and signal words (like “although”, “because”, “despite”)',
    'odd one out':'it actually belongs with the rest of the group, so it isn’t the outlier',
    'word relationship':'it doesn’t match the relationship shown in the example pair',
    'number series':'it doesn’t continue the pattern in the sequence',
    'letter series':'it doesn’t follow the letter pattern in the sequence',
    'symbol series':'it doesn’t continue the rotational/visual pattern',
    'shape series':'it doesn’t follow the progression of the figures',
    'percentage':'the percentage works out to a different value',
    'ratio':'it doesn’t keep the quantities in the required ratio',
    'fraction':'the fraction of the amount comes out differently',
    'average':'it doesn’t produce the required total or average',
    'arithmetic':'the calculation gives a different result',
    'word problem':'the steps of the problem don’t lead to this value',
    'logic':'it doesn’t logically follow from the statements given',
    'attention to detail':'a careful character-by-character check rules it out',
    'rotation':'rotating the figure as described doesn’t produce this',
    'cube folding':'the cube’s face relationships don’t support this',
    'matrix':'it doesn’t satisfy both the row and column rules',
    'number grid':'it doesn’t follow the same rule used in the other rows',
    'pattern':'it breaks the established pattern',
  };
  function wrongReason(q, sel){
    if(q.why && q.why[sel]) return q.why[sel];
    if(q.wrongHint) return q.wrongHint;
    return WRONG_REASONS[(q.type||'').toLowerCase()] || 'it doesn’t satisfy the rule this question is testing';
  }
  function cap(s){ return s ? s.charAt(0).toUpperCase()+s.slice(1) : s; }

  function estPercentile(raw){
    // piecewise-linear estimate from the chart above
    const pts=[[0,1],[15,15],[20,35],[24,50],[27,70],[31,85],[36,95],[42,99],[50,99]];
    for(let i=0;i<pts.length-1;i++){
      const [x0,y0]=pts[i],[x1,y1]=pts[i+1];
      if(raw>=x0&&raw<=x1){ return Math.round(y0+(y1-y0)*(raw-x0)/(x1-x0)); }
    }
    return raw>=50?99:1;
  }

  /* ---------- Views / Router ---------- */
  const Views={
    list:['home','category','drill','quiz','results','review','study','progress'],
    show(v){ this.list.forEach(x=>$('#view-'+x).classList.toggle('hidden', x!==v)); window.scrollTo({top:0,behavior:'smooth'}); this._cur=v; setActiveNav(v); },
  };
  const Router={
    go(where){
      switch(where){
        case 'home': Home.render(); Views.show('home'); break;
        case 'full': Quiz.start({mode:'full',label:'Full CCAT simulation',questions:buildExam(),timeLimit:FULL_TEST_TIME}); break;
        case 'quick': Quiz.start({mode:'quick',label:'Quick 10 warm-up',questions:pickBalanced(10),timeLimit:180}); break;
        case 'category': Setup.category(); break;
        case 'drill': Setup.drill(); break;
        case 'study': Guide.render(); break;
        case 'progress': Progress.render(); break;
      }
    }
  };
  function setActiveNav(v){
    const map={home:'home',study:'study',progress:'progress'};
    $$('.nav button[data-nav]').forEach(b=>b.classList.toggle('active', b.dataset.nav===map[v]));
  }

  /* ---------- theme ---------- */
  function applyTheme(t){ document.documentElement.classList.toggle('light', t==='light'); $('#theme-btn').textContent = t==='light'?'🌙':'☀️'; }

  /* ---------- boot ---------- */
  function boot(){
    applyTheme(Store.theme());
    $('#theme-btn').addEventListener('click',()=>{ const t=document.documentElement.classList.contains('light')?'dark':'light'; Store.setTheme(t); applyTheme(t); });
    $$('.nav button[data-nav]').forEach(b=>b.addEventListener('click',()=>Router.go(b.dataset.nav)));
    $('#brand-home').addEventListener('click',()=>Router.go('home'));
    Home.render(); Views.show('home');
  }
  document.addEventListener('DOMContentLoaded',boot);
})();
