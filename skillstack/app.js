/* Million Dollar Roadmap — app logic.
   Offline-first: state lives in localStorage and syncs to Supabase when signed in. */

(function () {
  "use strict";

  // ---------- State ----------
  const LS_KEY = "mdr-state-v1";
  const defaultState = () => ({
    steps: {},        // stepId -> { done, actions: {idx: true}, note }
    goals: [],        // { id, title, why, due, done, createdAt }
    weekPlans: {},    // weekKey -> [{ text, done }]
    widgets: {},      // widget inputs (market calc, leverage score)
    revenueTarget: 1000000,
    checkins: {},     // dateISO -> true
    updatedAt: 0,
  });

  let state = loadLocal();
  let sb = null;       // supabase client
  let user = null;     // signed-in user
  let pushTimer = null;

  function loadLocal() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return Object.assign(defaultState(), JSON.parse(raw));
    } catch (e) { /* corrupted state -> start fresh */ }
    return defaultState();
  }

  function save() {
    state.updatedAt = Date.now();
    localStorage.setItem(LS_KEY, JSON.stringify(state));
    schedulePush();
    renderDashboard();
  }

  // ---------- Supabase sync ----------
  function initSupabase() {
    if (!window.supabase || typeof SUPABASE_URL === "undefined") return;
    try {
      sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
    } catch (e) { console.warn("supabase init failed", e); return; }

    sb.auth.onAuthStateChange(async (_event, session) => {
      user = session ? session.user : null;
      updateAuthUI();
      if (user) await pullRemote();
    });
  }

  async function pullRemote() {
    if (!sb || !user) return;
    const { data, error } = await sb.from("skillstack_state")
      .select("data, updated_at").eq("user_id", user.id).maybeSingle();
    if (error) { console.warn("pull failed", error); return; }
    if (data && data.data && data.data.updatedAt > (state.updatedAt || 0)) {
      state = Object.assign(defaultState(), data.data);
      localStorage.setItem(LS_KEY, JSON.stringify(state));
      renderAll();
    } else if (state.updatedAt) {
      schedulePush(); // local is newer -> push up
    }
  }

  function schedulePush() {
    if (!sb || !user) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(async () => {
      const { error } = await sb.from("skillstack_state").upsert({
        user_id: user.id, data: state, updated_at: new Date().toISOString(),
      });
      setSyncStatus(error ? "sync error" : "synced", !error);
      if (error) console.warn("push failed", error);
    }, 800);
  }

  function setSyncStatus(text, on) {
    const el = document.getElementById("sync-status");
    el.textContent = text;
    el.classList.toggle("on", !!on);
  }

  function updateAuthUI() {
    const btn = document.getElementById("auth-btn");
    if (user) {
      btn.textContent = "Sign out";
      setSyncStatus("synced ✓", true);
    } else {
      btn.textContent = "Sign in to sync";
      setSyncStatus("local only", false);
    }
  }

  function normalizeEmail(input) {
    const v = input.trim();
    return v.includes("@") ? v : v + "@gmail.com"; // allow bare username
  }

  async function handleAuth(mode, email, password, msgEl) {
    if (!sb) { msgEl.textContent = "Sync backend unavailable."; return; }
    msgEl.className = "auth-msg";
    msgEl.textContent = mode === "signup" ? "Creating account…" : "Signing in…";
    const fn = mode === "signup"
      ? sb.auth.signUp({ email, password })
      : sb.auth.signInWithPassword({ email, password });
    const { data, error } = await fn;
    if (error) {
      msgEl.className = "auth-msg err";
      msgEl.textContent = error.message;
      return;
    }
    if (mode === "signup" && data.user && !data.session) {
      msgEl.className = "auth-msg ok";
      msgEl.textContent = "Account created — check your email to confirm, then sign in here.";
      return;
    }
    msgEl.className = "auth-msg ok";
    msgEl.textContent = "Signed in!";
    setTimeout(() => document.getElementById("auth-modal").classList.add("hidden"), 600);
  }

  // ---------- Helpers ----------
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function stepState(id) {
    if (!state.steps[id]) state.steps[id] = { done: false, actions: {}, note: "" };
    return state.steps[id];
  }

  function allSteps() {
    return CURRICULUM.phases.flatMap((p) => p.steps.map((s) => ({ ...s, phase: p })));
  }

  function stepActionProgress(step) {
    const st = stepState(step.id);
    const done = step.actions.filter((_, i) => st.actions[i]).length;
    return { done, total: step.actions.length };
  }

  function phaseProgress(phase) {
    const done = phase.steps.filter((s) => stepState(s.id).done).length;
    return { done, total: phase.steps.length };
  }

  function overallProgress() {
    const steps = allSteps();
    const done = steps.filter((s) => stepState(s.id).done).length;
    return { done, total: steps.length, pct: Math.round((done / steps.length) * 100) };
  }

  function weekKey(d) {
    const date = d ? new Date(d) : new Date();
    const day = (date.getDay() + 6) % 7; // Monday = 0
    date.setDate(date.getDate() - day);
    return date.toISOString().slice(0, 10);
  }

  function fmtMoney(n) {
    if (!isFinite(n)) return "—";
    if (n >= 1e9) return "$" + (n / 1e9).toFixed(2) + "B";
    if (n >= 1e6) return "$" + (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return "$" + Math.round(n / 1e3) + "k";
    return "$" + Math.round(n);
  }

  // ---------- Render: Journey ----------
  function renderJourney() {
    const root = $("#tab-journey");
    root.innerHTML = "";
    CURRICULUM.phases.forEach((phase) => {
      const prog = phaseProgress(phase);
      const el = document.createElement("div");
      el.className = "phase" + (prog.done === prog.total ? " done" : "");
      el.dataset.phase = phase.id;
      el.innerHTML = `
        <div class="phase-head">
          <div class="phase-num">${prog.done === prog.total ? "✓" : (phase.num === 0 ? "💰" : phase.num)}</div>
          <div class="phase-title">
            <h2>${esc(phase.title)}</h2>
            <div class="tagline">${esc(phase.tagline)}</div>
          </div>
          <div class="phase-progress">${prog.done}/${prog.total} steps</div>
        </div>
        <div class="phase-body">
          <p class="phase-intro">${esc(phase.intro)}</p>
        </div>`;
      const body = $(".phase-body", el);
      phase.steps.forEach((step) => body.appendChild(renderStep(step)));
      $(".phase-head", el).addEventListener("click", () => el.classList.toggle("open"));
      root.appendChild(el);
    });
    // open the first phase with unfinished work
    const current = CURRICULUM.phases.find((p) => phaseProgress(p).done < p.steps.length);
    if (current) $(`.phase[data-phase="${current.id}"]`, root).classList.add("open");
  }

  function renderStep(step) {
    const st = stepState(step.id);
    const el = document.createElement("div");
    el.className = "step" + (st.done ? " done" : "");
    el.dataset.step = step.id;

    const lessonHtml = step.lesson.map((p) => `<p>${p}</p>`).join("");
    const bookHtml = step.book
      ? `<span class="book-pill">📖 ${esc(step.book.name)} — ${esc(step.book.author)}</span>` : "";
    const actionsHtml = step.actions.map((a, i) => `
      <label class="action-item ${st.actions[i] ? "done" : ""}">
        <input type="checkbox" data-action="${i}" ${st.actions[i] ? "checked" : ""}>
        <span>${esc(a)}</span>
      </label>`).join("");

    el.innerHTML = `
      <div class="step-head">
        <div class="step-check">${st.done ? "✓" : ""}</div>
        <h3>${esc(step.title)}</h3>
        <span class="step-time">${esc(step.time || "")}</span>
      </div>
      <div class="step-body">
        <div class="lesson">${lessonHtml}</div>
        ${bookHtml}
        <div class="widget-slot"></div>
        <div class="actions-title">Action steps (simple, needle-moving)</div>
        <div class="actions">${actionsHtml}</div>
        ${step.metric ? `<div class="metric-pill">🎯 Done when: ${esc(step.metric)}</div>` : ""}
        <div class="step-note">
          <label>Notes for this step
            <textarea placeholder="Ideas, results, numbers, lessons learned…">${esc(st.note || "")}</textarea>
          </label>
        </div>
        <button class="btn ${st.done ? "" : "btn-primary"} mark-done">
          ${st.done ? "Mark as not done" : "Mark step complete"}
        </button>
      </div>`;

    if (step.widget === "market-calc") renderMarketCalc($(".widget-slot", el));
    if (step.widget === "leverage-score") renderLeverageScore($(".widget-slot", el));
    if (step.widget === "freedom-calc") renderFreedomCalc($(".widget-slot", el));

    $(".step-head", el).addEventListener("click", () => el.classList.toggle("open"));
    $$("input[type=checkbox][data-action]", el).forEach((cb) => {
      cb.addEventListener("change", () => {
        st.actions[cb.dataset.action] = cb.checked;
        cb.closest(".action-item").classList.toggle("done", cb.checked);
        save();
      });
    });
    $("textarea", el).addEventListener("input", (e) => { st.note = e.target.value; save(); });
    $(".mark-done", el).addEventListener("click", () => {
      st.done = !st.done;
      save();
      renderJourney();
    });
    return el;
  }

  // ---------- Widgets ----------
  function renderMarketCalc(slot) {
    const w = state.widgets.marketCalc || (state.widgets.marketCalc = { customers: "", price: "" });
    slot.innerHTML = `
      <div class="widget">
        <h4>Billion-Dollar Market Calculator</h4>
        <label>Number of potential customers
          <input type="number" min="0" id="mc-customers" value="${esc(w.customers)}" placeholder="e.g. 48133">
        </label>
        <label>Price per customer per YEAR ($)
          <input type="number" min="0" id="mc-price" value="${esc(w.price)}" placeholder="e.g. 36000">
        </label>
        <div class="widget-result" id="mc-result"></div>
      </div>`;
    const update = () => {
      w.customers = $("#mc-customers", slot).value;
      w.price = $("#mc-price", slot).value;
      const total = Number(w.customers) * Number(w.price);
      const el = $("#mc-result", slot);
      if (!w.customers || !w.price) { el.textContent = ""; return; }
      const pass = total >= 1e9;
      el.className = "widget-result " + (pass ? "pass" : "fail");
      el.textContent = `${fmtMoney(total)} total market — ${pass ? "PASSES the $1B check ✓" : "fails the $1B check ✗ (find a bigger market)"}`;
      save();
    };
    $("#mc-customers", slot).addEventListener("input", update);
    $("#mc-price", slot).addEventListener("input", update);
    update();
  }

  function renderLeverageScore(slot) {
    const tests = [
      "Recurring revenue — customers use it monthly and buy repeatedly",
      "70%+ gross margins — $100 price costs < $30 to serve",
      "Scales through technology, not people (no agency/consulting/physical)",
      "You own the product (no affiliate, no dropshipping)",
    ];
    const w = state.widgets.leverage || (state.widgets.leverage = {});
    slot.innerHTML = `
      <div class="widget">
        <h4>High-Leverage Scorecard</h4>
        ${tests.map((t, i) => `
          <label class="lev-row">
            <span>${esc(t)}</span>
            <input type="checkbox" data-lev="${i}" ${w[i] ? "checked" : ""}>
          </label>`).join("")}
        <div class="widget-result" id="lev-result"></div>
      </div>`;
    const update = () => {
      const passed = tests.filter((_, i) => w[i]).length;
      const el = $("#lev-result", slot);
      el.className = "widget-result " + (passed === 4 ? "pass" : "fail");
      el.textContent = passed === 4
        ? "4/4 — this is a high-leverage business ✓"
        : `${passed}/4 — redesign the model until all four pass`;
    };
    $$("input[data-lev]", slot).forEach((cb) => cb.addEventListener("change", () => {
      w[cb.dataset.lev] = cb.checked; update(); save();
    }));
    update();
  }

  function renderFreedomCalc(slot) {
    const w = state.widgets.freedom || (state.widgets.freedom = { costs: "", buffer: "20", price: "" });
    slot.innerHTML = `
      <div class="widget">
        <h4>Freedom Number Calculator</h4>
        <label>Your essential monthly costs ($)
          <input type="number" min="0" id="fc-costs" value="${esc(w.costs)}" placeholder="e.g. 2500">
        </label>
        <label>Safety buffer (%)
          <input type="number" min="0" max="100" id="fc-buffer" value="${esc(w.buffer)}">
        </label>
        <label>Price of what you'll sell, per month ($) <span class="muted">(optional)</span>
          <input type="number" min="0" id="fc-price" value="${esc(w.price)}" placeholder="e.g. 300">
        </label>
        <div class="widget-result" id="fc-result"></div>
      </div>`;
    const update = () => {
      w.costs = $("#fc-costs", slot).value;
      w.buffer = $("#fc-buffer", slot).value;
      w.price = $("#fc-price", slot).value;
      const el = $("#fc-result", slot);
      if (!w.costs) { el.textContent = ""; return; }
      const number = Math.ceil(Number(w.costs) * (1 + Number(w.buffer || 0) / 100));
      let text = `Your freedom number: ${fmtMoney(number)}/month`;
      if (Number(w.price) > 0) {
        text += ` — that's ${Math.ceil(number / Number(w.price))} customers at ${fmtMoney(Number(w.price))}/month`;
      }
      el.className = "widget-result pass";
      el.textContent = text;
      save();
    };
    ["fc-costs", "fc-buffer", "fc-price"].forEach((id) =>
      $("#" + id, slot).addEventListener("input", update));
    update();
  }

  // ---------- Render: Dashboard ----------
  function renderDashboard() {
    const root = $("#tab-dashboard");
    const prog = overallProgress();
    const today = new Date().toISOString().slice(0, 10);
    const checkedInToday = !!state.checkins[today];
    const streak = calcStreak();
    const activeGoals = state.goals.filter((g) => !g.done);
    const wk = state.weekPlans[weekKey()] || [];
    const wkDone = wk.filter((p) => p.done).length;

    // next 3 incomplete actions across the journey, in order
    const next = [];
    for (const step of allSteps()) {
      const st = stepState(step.id);
      if (st.done) continue;
      step.actions.forEach((a, i) => {
        if (!st.actions[i] && next.length < 3) {
          next.push({ text: a, step });
        }
      });
      if (next.length >= 3) break;
    }

    root.innerHTML = `
      <div class="card">
        <div class="row spread">
          <div>
            <h2>North Star: ${esc(CURRICULUM.northStar.title)}</h2>
            <p class="muted">${esc(CURRICULUM.northStar.subtitle)}</p>
          </div>
          <button class="btn ${checkedInToday ? "" : "btn-primary"}" id="checkin-btn">
            ${checkedInToday ? "✓ Checked in today" : "Daily check-in"}
          </button>
        </div>
        <div class="stat-grid">
          <div class="stat"><div class="big-number">${prog.pct}%</div><div class="label">Journey complete</div></div>
          <div class="stat"><div class="big-number">${prog.done}/${prog.total}</div><div class="label">Steps done</div></div>
          <div class="stat"><div class="big-number">${streak}🔥</div><div class="label">Day streak</div></div>
          <div class="stat"><div class="big-number">${activeGoals.length}</div><div class="label">Active goals</div></div>
        </div>
        <div class="progress-wrap"><div class="progress-bar" style="width:${prog.pct}%"></div></div>
      </div>

      <div class="card">
        <h2>Your next 3 needle-movers</h2>
        <p class="muted">The very next actions on the roadmap. Do these before anything else.</p>
        <div id="next-actions">
          ${next.length ? next.map((n) => `
            <div class="next-action">
              <span>⚡</span>
              <div>${esc(n.text)}<span class="from">from: ${esc(n.step.title)} · <a href="#" data-goto="${n.step.id}">open step →</a></span></div>
            </div>`).join("")
          : `<p class="muted">Everything is done. You know what to do: go sell something. 🏆</p>`}
        </div>
      </div>

      <div class="card">
        <h2>This week's plan</h2>
        <p class="muted">${wk.length ? `${wkDone}/${wk.length} done` : "No plan yet — set your 3 needle-movers in Goals & Plans."}</p>
        ${wk.map((p) => `<div class="next-action">${p.done ? "✅" : "⬜"} <div>${esc(p.text)}</div></div>`).join("")}
      </div>`;

    $("#checkin-btn", root).addEventListener("click", () => {
      state.checkins[today] = true; save(); renderDashboard();
    });
    $$("a[data-goto]", root).forEach((a) => a.addEventListener("click", (e) => {
      e.preventDefault();
      switchTab("journey");
      const stepEl = $(`.step[data-step="${a.dataset.goto}"]`);
      if (stepEl) {
        stepEl.closest(".phase").classList.add("open");
        stepEl.classList.add("open");
        stepEl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }));
  }

  function calcStreak() {
    let streak = 0;
    const d = new Date();
    if (!state.checkins[d.toISOString().slice(0, 10)]) d.setDate(d.getDate() - 1);
    while (state.checkins[d.toISOString().slice(0, 10)]) {
      streak++; d.setDate(d.getDate() - 1);
    }
    return streak;
  }

  // ---------- Render: Goals & Plans ----------
  function renderGoals() {
    const root = $("#tab-goals");
    const wkKey = weekKey();
    const wk = state.weekPlans[wkKey] || (state.weekPlans[wkKey] = []);

    root.innerHTML = `
      <div class="card">
        <h2>Goals</h2>
        <p class="muted">Make them measurable and dated. Example: "10 signed LOIs by March 1" or "9/10 at sales — close 3 full-price deals by June".</p>
        <form id="goal-form" class="row gap" style="align-items:flex-end">
          <label style="flex:2;min-width:200px;margin:0">Goal
            <input type="text" id="goal-title" required placeholder="e.g. 10 signed LOIs">
          </label>
          <label style="flex:1;min-width:130px;margin:0">Deadline
            <input type="date" id="goal-due" required>
          </label>
          <button class="btn btn-primary" type="submit">Add goal</button>
        </form>
        <div id="goal-list" style="margin-top:16px"></div>
      </div>

      <div class="card">
        <h2>This week's plan <span class="muted">(week of ${wkKey})</span></h2>
        <p class="muted">Pick a maximum of 3 needle-moving actions for the week — pulled from the roadmap or your own. Fewer, bigger, done.</p>
        <div id="plan-slots"></div>
        <form id="plan-form" class="row gap">
          <input type="text" id="plan-text" placeholder="e.g. Make 250 outreach touches" style="flex:1;min-width:200px" ${wk.length >= 3 ? "disabled" : ""}>
          <button class="btn btn-primary" type="submit" ${wk.length >= 3 ? "disabled" : ""}>Add</button>
        </form>
      </div>`;

    // goals list
    const list = $("#goal-list", root);
    if (!state.goals.length) list.innerHTML = `<p class="muted">No goals yet. The roadmap will prompt you to add them at key steps.</p>`;
    state.goals
      .slice()
      .sort((a, b) => (a.done - b.done) || (a.due || "").localeCompare(b.due || ""))
      .forEach((g) => {
        const overdue = !g.done && g.due && g.due < new Date().toISOString().slice(0, 10);
        const el = document.createElement("div");
        el.className = "goal-card" + (g.done ? " done" : "");
        el.innerHTML = `
          <input type="checkbox" ${g.done ? "checked" : ""} style="width:20px;height:20px;accent-color:var(--green);margin-top:3px">
          <div class="goal-main">
            <div><b>${esc(g.title)}</b></div>
            <div class="goal-meta">${g.due ? `due ${esc(g.due)}` : ""} ${overdue ? `<span class="overdue">· overdue</span>` : ""}</div>
          </div>
          <button class="btn btn-ghost btn-sm danger">delete</button>`;
        $("input", el).addEventListener("change", (e) => { g.done = e.target.checked; save(); renderGoals(); });
        $("button", el).addEventListener("click", () => {
          state.goals = state.goals.filter((x) => x.id !== g.id); save(); renderGoals();
        });
        list.appendChild(el);
      });

    $("#goal-form", root).addEventListener("submit", (e) => {
      e.preventDefault();
      state.goals.push({
        id: "g" + Date.now(),
        title: $("#goal-title", root).value.trim(),
        due: $("#goal-due", root).value,
        done: false,
        createdAt: Date.now(),
      });
      save(); renderGoals();
    });

    // week plan slots
    const slots = $("#plan-slots", root);
    wk.forEach((p, i) => {
      const el = document.createElement("div");
      el.className = "plan-slot filled" + (p.done ? " done" : "");
      el.innerHTML = `
        <input type="checkbox" ${p.done ? "checked" : ""}>
        <input type="text" value="${esc(p.text)}" disabled>
        <button class="btn btn-ghost btn-sm danger">×</button>`;
      $("input[type=checkbox]", el).addEventListener("change", (e) => { p.done = e.target.checked; save(); renderGoals(); });
      $("button", el).addEventListener("click", () => { wk.splice(i, 1); save(); renderGoals(); });
      slots.appendChild(el);
    });

    $("#plan-form", root).addEventListener("submit", (e) => {
      e.preventDefault();
      const text = $("#plan-text", root).value.trim();
      if (!text || wk.length >= 3) return;
      wk.push({ text, done: false });
      save(); renderGoals();
    });
  }

  // ---------- Render: Library ----------
  function renderLibrary() {
    const root = $("#tab-library");
    root.innerHTML = `
      <div class="card">
        <h2>The Reading List</h2>
        <p class="muted">Every book the creator recommends, and why. One per skill — read them as you reach each step.</p>
        ${CURRICULUM.library.map((b) => `
          <div class="lib-item">
            <span class="skill-tag">${esc(b.skill)}</span>
            <div><b>${esc(b.name)}</b> — ${esc(b.author)}</div>
            <div class="muted">${esc(b.why)}</div>
          </div>`).join("")}
      </div>
      <div class="card">
        <h2>Free Market Research Sources</h2>
        <p class="muted">The consulting firms whose analysts do your trend-spotting for free (Phase 2).</p>
        ${CURRICULUM.reportSources.map((s) => `
          <div class="lib-item"><a href="${esc(s.url)}" target="_blank" rel="noopener" style="color:var(--accent)">${esc(s.name)} ↗</a></div>`).join("")}
      </div>
      <div class="card">
        <h2>Source Material</h2>
        <p class="muted">This tutorial is built from full transcripts of these videos, stored in this repository:</p>
        <div class="lib-item"><b>How to Make $1,000,000 From Scratch</b> — Michia Rohrssen's 3-step blueprint (market → launch → scale)</div>
        <div class="lib-item"><b>$110M CEO Explains: 7 Skills to Make Your First $1M</b> — Michia Rohrssen's skill stack</div>
        <div class="lib-item"><b>The 7 Baby Steps Explained (Top Criticisms Addressed)</b> — Dave Ramsey's personal-finance foundation (Phase 0)</div>
        <div class="lib-item"><b>How To Quit Your Job (And Do What You Love)</b> — Simon Squibb &amp; Ali Abdaal's 8-step escape blueprint (Phase 1)</div>
        <div class="lib-item"><b>Think and Grow Rich</b> — Napoleon Hill's 1937 classic, full public-domain text in the repo (Phase 8)</div>
        <div class="lib-item"><b>The 3 Fundamentals of "10x" Growth</b> — Dr. Benjamin Hardy's breakdown of 10x vs 2x (Phase 9)</div>
        <div class="lib-item"><b>Declutter Your Way To Success</b> — Terri Savelle Foy's excellence-and-environment discipline (Phase 10)</div>
        <div class="lib-item"><b>Mindset: The New Psychology of Success (summary)</b> — Carol Dweck's fixed vs. growth mindset research (Phase 11)</div>
      </div>`;
  }

  // ---------- Tabs, modal, footer ----------
  function switchTab(name) {
    $$(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
    $$(".tab-panel").forEach((p) => p.classList.toggle("active", p.id === "tab-" + name));
  }

  function wireChrome() {
    $$(".tab").forEach((t) => t.addEventListener("click", () => switchTab(t.dataset.tab)));

    const modal = $("#auth-modal");
    $("#auth-btn").addEventListener("click", async () => {
      if (user) { await sb.auth.signOut(); return; }
      modal.classList.remove("hidden");
    });
    $("[data-close]", modal).addEventListener("click", () => modal.classList.add("hidden"));
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.classList.add("hidden"); });

    const msgEl = $("#auth-msg");
    $("#auth-form").addEventListener("submit", (e) => {
      e.preventDefault();
      handleAuth("signin", normalizeEmail($("#auth-email").value), $("#auth-password").value, msgEl);
    });
    $("#signup-btn").addEventListener("click", () => {
      const email = normalizeEmail($("#auth-email").value);
      const pw = $("#auth-password").value;
      if (!email || pw.length < 6) { msgEl.className = "auth-msg err"; msgEl.textContent = "Enter an email and a 6+ character password."; return; }
      handleAuth("signup", email, pw, msgEl);
    });

    $("#export-btn").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "million-dollar-roadmap-data.json";
      a.click();
    });
    $("#import-file").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        state = Object.assign(defaultState(), JSON.parse(await file.text()));
        save(); renderAll();
      } catch { alert("That file isn't valid exported data."); }
    });
    $("#reset-btn").addEventListener("click", () => {
      if (confirm("Reset ALL progress, goals, and notes? This cannot be undone.")) {
        state = defaultState(); save(); renderAll();
      }
    });
  }

  function renderAll() {
    renderDashboard();
    renderJourney();
    renderGoals();
    renderLibrary();
  }

  // ---------- Boot ----------
  wireChrome();
  renderAll();
  initSupabase();
})();
