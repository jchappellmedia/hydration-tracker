/* Freedom Plan — app logic.
   Offline-first: state lives in localStorage and syncs to Supabase when signed in.
   The personal plan (modules + baby steps) lives only in the user's account data,
   never in this public code. This file just renders whatever plan it's given. */

(function () {
  "use strict";

  // ---------- State ----------
  const LS_KEY = "mdr-state-v1";
  const defaultState = () => ({
    steps: {},        // curriculum stepId -> { done, actions:{i:true}, note }
    goals: [],
    weekPlans: {},
    widgets: {},
    revenueTarget: 1000000,
    checkins: {},     // dateISO -> true
    plan: null,       // personal course { title, subtitle, updated, modules:[...] }
    updatedAt: 0,
  });

  let state = loadLocal();
  let sb = null;
  let user = null;
  let pushTimer = null;

  function loadLocal() {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) return Object.assign(defaultState(), JSON.parse(raw));
    } catch (e) { /* corrupted -> fresh */ }
    return defaultState();
  }

  function save() {
    state.updatedAt = Date.now();
    localStorage.setItem(LS_KEY, JSON.stringify(state));
    schedulePush();
    refreshProgress();
  }

  // ---------- Supabase sync ----------
  function setLocked(locked) { document.body.classList.toggle("locked", locked); }

  function initSupabase() {
    if (!window.supabase || typeof SUPABASE_URL === "undefined") {
      const msg = document.getElementById("gate-msg");
      if (msg) { msg.className = "auth-msg err"; msg.textContent = "Can't reach the sign-in service. Check your connection and reload."; }
      return;
    }
    try { sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY); }
    catch (e) { console.warn("supabase init failed", e); return; }

    sb.auth.onAuthStateChange(async (_event, session) => {
      user = session ? session.user : null;
      setLocked(!user);
      updateAuthUI();
      if (user) await pullRemote();
    });
  }

  async function pullRemote() {
    if (!sb || !user) return;
    const { data, error } = await sb.from("skillstack_state")
      .select("data, updated_at").eq("user_id", user.id).maybeSingle();
    if (error) { console.warn("pull failed", error); return; }
    const remote = data && data.data;
    if (remote && remote.updatedAt > (state.updatedAt || 0)) {
      const localPlan = state.plan;
      state = Object.assign(defaultState(), remote);
      if (!state.plan && localPlan) state.plan = localPlan;
      localStorage.setItem(LS_KEY, JSON.stringify(state));
      renderAll();
    } else {
      if (remote && remote.plan && !state.plan) {
        state.plan = remote.plan;
        localStorage.setItem(LS_KEY, JSON.stringify(state));
        renderAll();
      }
      if (state.updatedAt) schedulePush();
    }
  }

  function schedulePush() {
    if (!sb || !user) return;
    clearTimeout(pushTimer);
    pushTimer = setTimeout(async () => {
      const { error } = await sb.from("skillstack_state").upsert({
        user_id: user.id, data: state, updated_at: new Date().toISOString(),
      });
      setSyncStatus(error ? "sync error" : "synced ✓", !error);
      if (error) console.warn("push failed", error);
    }, 800);
  }

  function setSyncStatus(text, on) {
    const el = document.getElementById("sync-status");
    if (!el) return;
    el.textContent = text;
    el.classList.toggle("on", !!on);
  }

  function updateAuthUI() {
    const btn = document.getElementById("auth-btn");
    const pwBtn = document.getElementById("pw-btn");
    if (user) { btn.textContent = "Sign out"; pwBtn.hidden = false; setSyncStatus("synced ✓", true); }
    else { btn.textContent = "Sign in"; pwBtn.hidden = true; setSyncStatus("local only", false); }
  }

  function normalizeEmail(input) {
    const v = input.trim();
    return v.includes("@") ? v : v + "@gmail.com";
  }

  async function handleAuth(mode, email, password, msgEl) {
    if (!sb) { msgEl.textContent = "Sync backend unavailable."; return; }
    msgEl.className = "auth-msg";
    msgEl.textContent = mode === "signup" ? "Creating account…" : "Signing in…";
    const fn = mode === "signup"
      ? sb.auth.signUp({ email, password })
      : sb.auth.signInWithPassword({ email, password });
    const { data, error } = await fn;
    if (error) { msgEl.className = "auth-msg err"; msgEl.textContent = error.message; return; }
    if (mode === "signup" && data.user && !data.session) {
      msgEl.className = "auth-msg ok";
      msgEl.textContent = "Account created — check your email to confirm, then sign in.";
      return;
    }
    msgEl.className = "auth-msg ok";
    msgEl.textContent = "Signed in!";
    setTimeout(() => { const m = document.getElementById("auth-modal"); if (m) m.classList.add("hidden"); }, 500);
  }

  // ---------- Helpers ----------
  const $ = (sel, root) => (root || document).querySelector(sel);
  const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function weekKey(d) {
    const date = d ? new Date(d) : new Date();
    const day = (date.getDay() + 6) % 7;
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
  function calcStreak() {
    let streak = 0;
    const d = new Date();
    if (!state.checkins[d.toISOString().slice(0, 10)]) d.setDate(d.getDate() - 1);
    while (state.checkins[d.toISOString().slice(0, 10)]) { streak++; d.setDate(d.getDate() - 1); }
    return streak;
  }

  // ---------- The Plan (unified course) ----------
  const WHO = { josh: "Josh", brianna: "Brianna", both: "Both" };
  function planModules() { return (state.plan && Array.isArray(state.plan.modules)) ? state.plan.modules : []; }
  function allPlanSteps() {
    const out = [];
    planModules().forEach((m) => (m.steps || []).forEach((s) => out.push({ step: s, module: m })));
    return out;
  }
  function moduleProgress(m) {
    const steps = m.steps || [];
    return { done: steps.filter((s) => s.done).length, total: steps.length };
  }
  function planProgress() {
    const steps = allPlanSteps();
    const done = steps.filter((x) => x.step.done).length;
    const total = steps.length || 1;
    return { done, total: steps.length, pct: Math.round((done / total) * 100) };
  }

  function whoChip(who) {
    const w = who && WHO[who] ? who : "both";
    return `<span class="chip who-${w}">${esc(WHO[w])}</span>`;
  }
  function cadChip(cad) {
    if (!cad || cad === "once") return "";
    const label = cad === "daily" ? "daily" : cad === "weekly" ? "weekly" : cad;
    return `<span class="chip cad">${esc(label)}</span>`;
  }
  function ringHTML(pct) {
    const C = 263.9;
    const off = C * (1 - pct / 100);
    return `
      <div class="ring" id="freedom-ring">
        <svg width="92" height="92" viewBox="0 0 92 92" aria-hidden="true">
          <circle cx="46" cy="46" r="42" fill="none" stroke="var(--border)" stroke-width="8"/>
          <circle cx="46" cy="46" r="42" fill="none" stroke="url(#rg)" stroke-width="8" stroke-linecap="round"
            stroke-dasharray="${C}" stroke-dashoffset="${off}" style="transition:stroke-dashoffset .5s ease"/>
          <defs><linearGradient id="rg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="var(--accent)"/><stop offset="1" stop-color="var(--green)"/>
          </linearGradient></defs>
        </svg>
        <div class="ring-pct"><b>${pct}%</b><span>done</span></div>
      </div>`;
  }

  // ---------- Render: Today ----------
  function renderToday() {
    const root = $("#tab-today");
    if (!planModules().length) {
      root.innerHTML = importPromptHTML("Your plan will appear here",
        "Once your personalized course is loaded, this screen shows your next moves and daily rhythm.");
      wirePlanImport(root);
      return;
    }
    const prog = planProgress();
    const today = new Date().toISOString().slice(0, 10);
    const checkedIn = !!state.checkins[today];
    const streak = calcStreak();
    const modulesDone = planModules().filter((m) => { const p = moduleProgress(m); return p.total && p.done === p.total; }).length;

    const next = allPlanSteps().filter((x) => !x.step.done).slice(0, 5);
    const daily = allPlanSteps().filter((x) => x.step.cadence === "daily");

    root.innerHTML = `
      <div class="hero" id="today-hero">
        ${ringHTML(prog.pct)}
        <div class="hero-meta">
          <div class="greeting">${checkedIn ? "You showed up today 👊" : "Let's move the needle"}</div>
          <div class="sub">${esc((state.plan && state.plan.subtitle) || "One step at a time, together.")}</div>
          <div class="hero-chips">
            <span class="hero-chip"><b>${prog.done}/${prog.total}</b> steps</span>
            <span class="hero-chip"><b>${modulesDone}/${planModules().length}</b> modules</span>
            <span class="hero-chip"><b>${streak}🔥</b> day streak</span>
          </div>
        </div>
      </div>

      <button class="btn ${checkedIn ? "" : "btn-primary"}" id="checkin-btn" style="width:100%;margin-bottom:16px">
        ${checkedIn ? "✓ Checked in today — nice" : "☀️ Daily check-in"}
      </button>

      <div class="card">
        <h2>Your next moves</h2>
        <p class="muted">The very next baby steps in the course. Knock these out first.</p>
        <div style="margin-top:8px">
          ${next.length ? next.map((n) => moveRowHTML(n)).join("")
            : `<p class="muted" style="padding:10px 0">🏆 Every step is done. Go celebrate — you earned it.</p>`}
        </div>
      </div>

      ${daily.length ? `
      <div class="card">
        <h2>Your daily rhythm</h2>
        <p class="muted">The small habits that carry the whole plan. Keep them going.</p>
        <div style="margin-top:8px">${daily.map((n) => dailyRowHTML(n)).join("")}</div>
      </div>` : ""}`;

    $("#checkin-btn", root).addEventListener("click", () => {
      state.checkins[today] = true; save(); renderToday();
    });
    wireTodaySteps(root);
  }

  function moveRowHTML(n) {
    const s = n.step;
    return `
      <div class="move">
        <div class="step-check" data-toggle="${esc(s.id)}">${s.done ? "✓" : ""}</div>
        <div class="move-body">
          <div class="move-text">${esc(s.text)}</div>
          <span class="move-from">${whoChip(s.who)} ${cadChip(s.cadence)}
            &nbsp;·&nbsp; <a href="#" data-goto-module="${esc(n.module.id)}">${esc(n.module.title)} →</a></span>
        </div>
      </div>`;
  }
  function dailyRowHTML(n) {
    const s = n.step;
    return `
      <div class="step-row ${s.done ? "done" : ""}">
        <div class="step-check" data-toggle="${esc(s.id)}">${s.done ? "✓" : ""}</div>
        <div class="step-main" data-toggle="${esc(s.id)}">
          <div class="txt">${esc(s.text)}</div>
          <div class="step-tags">${whoChip(s.who)}</div>
        </div>
      </div>`;
  }
  function wireTodaySteps(root) {
    $$("[data-toggle]", root).forEach((el) => el.addEventListener("click", (e) => {
      e.preventDefault();
      toggleStepById(el.dataset.toggle);
      renderToday();
    }));
    $$("a[data-goto-module]", root).forEach((a) => a.addEventListener("click", (e) => {
      e.preventDefault();
      switchTab("plan");
      openModule(a.dataset.gotoModule);
    }));
  }
  function toggleStepById(id) {
    for (const m of planModules()) {
      for (const s of (m.steps || [])) {
        if (s.id === id) { s.done = !s.done; save(); return; }
      }
    }
  }

  // ---------- Render: The Plan ----------
  function renderPlan() {
    const root = $("#tab-plan");
    if (!planModules().length) {
      root.innerHTML = importPromptHTML("The Plan",
        "This is your single, step-by-step course — everything from today through freedom, in order, with small baby steps you can do every day. It's private to your account.");
      wirePlanImport(root);
      return;
    }
    const plan = state.plan;
    const prog = planProgress();
    let html = `
      <div class="card">
        <div class="row spread" style="align-items:flex-start">
          <div style="flex:1;min-width:0">
            <h2>${esc(plan.title || "The Plan")}</h2>
            <p class="muted">${esc(plan.subtitle || "")}${plan.updated ? " · " + esc(plan.updated) : ""}</p>
          </div>
          <label class="btn btn-ghost btn-sm" for="plan-file" title="Replace plan">Re-import</label>
          <input type="file" id="plan-file" accept=".json" hidden>
        </div>
        <div style="margin-top:12px" class="hero-chips">
          <span class="hero-chip"><b>${prog.pct}%</b> complete</span>
          <span class="hero-chip"><b>${prog.done}/${prog.total}</b> baby steps</span>
        </div>
      </div>`;

    let lastPhase = null;
    planModules().forEach((m, mi) => {
      if (m.phase && m.phase !== lastPhase) {
        html += `<div class="section-label">${esc(m.phase)}</div>`;
        lastPhase = m.phase;
      }
      const p = moduleProgress(m);
      const complete = p.total && p.done === p.total;
      html += `
        <div class="module ${complete ? "done" : ""}" data-module="${esc(m.id)}">
          <div class="module-head">
            <div class="module-badge">${complete ? "✓" : (m.icon || "•")}</div>
            <div class="module-title">
              <h3>${esc(m.title)}</h3>
              <div class="m-count">${p.done}/${p.total} steps${complete ? " · done 🎉" : ""}</div>
            </div>
            <div class="module-chevron">›</div>
          </div>
          <div class="module-body">
            ${m.why ? `<div class="module-why">${m.why}</div>` : ""}
            ${(m.learn || []).length ? `<div class="module-learn">
              <div class="learn-label">📖 The learning</div>
              ${m.learn.map((p) => `<p>${p}</p>`).join("")}
            </div>` : ""}
            ${(m.steps || []).length ? `<div class="steps-label">✅ Baby steps — tap any step for its lesson</div>` : ""}
            ${(m.steps || []).map((s) => lessonStepHTML(s)).join("")}
          </div>
        </div>`;
    });
    root.innerHTML = html;

    $$(".module", root).forEach((el) => {
      $(".module-head", el).addEventListener("click", () => el.classList.toggle("open"));
      // checkbox toggles done
      $$(".step-check[data-step]", el).forEach((node) =>
        node.addEventListener("click", (e) => {
          e.stopPropagation();
          const m = planModules().find((x) => x.id === el.dataset.module);
          const s = (m.steps || []).find((x) => x.id === node.dataset.step);
          if (!s) return;
          s.done = !s.done;
          save();
          updateModuleEl(el, m);
        }));
      // tapping the step text/chevron opens its lesson
      $$("[data-open]", el).forEach((node) =>
        node.addEventListener("click", (e) => {
          e.stopPropagation();
          const row = node.closest(".lstep");
          if (row) row.classList.toggle("open");
        }));
    });

    wirePlanImport(root);

    const firstOpen = planModules().find((m) => { const p = moduleProgress(m); return p.done < p.total; });
    if (firstOpen) { const el = $(`.module[data-module="${firstOpen.id}"]`, root); if (el) el.classList.add("open"); }
    else { const first = $(".module", root); if (first) first.classList.add("open"); }
  }

  function lessonStepHTML(s) {
    const hasLesson = Array.isArray(s.lesson) && s.lesson.length;
    return `
      <div class="lstep ${s.done ? "done" : ""}" data-lstep="${esc(s.id)}">
        <div class="lstep-head">
          <div class="step-check" data-step="${esc(s.id)}" title="Mark done">${s.done ? "✓" : ""}</div>
          <div class="lstep-main" data-open="${esc(s.id)}">
            <div class="txt">${esc(s.text)}</div>
            <div class="step-tags">${whoChip(s.who)} ${cadChip(s.cadence)}${hasLesson ? ` <span class="lesson-hint">📖 Lesson</span>` : ""}</div>
          </div>
          ${hasLesson ? `<div class="lstep-chevron" data-open="${esc(s.id)}">›</div>` : ""}
        </div>
        ${hasLesson ? `<div class="lstep-body"><div class="lesson">${s.lesson.map((p) => `<p>${p}</p>`).join("")}</div></div>` : ""}
      </div>`;
  }
  function updateModuleEl(el, m) {
    const p = moduleProgress(m);
    const complete = p.total && p.done === p.total;
    el.classList.toggle("done", complete);
    $(".module-badge", el).textContent = complete ? "✓" : (m.icon || "•");
    $(".m-count", el).textContent = `${p.done}/${p.total} steps${complete ? " · done 🎉" : ""}`;
    (m.steps || []).forEach((s) => {
      const row = $(`.lstep[data-lstep="${CSS.escape(s.id)}"]`, el);
      if (row) { row.classList.toggle("done", !!s.done); const c = $(".step-check", row); if (c) c.textContent = s.done ? "✓" : ""; }
    });
    refreshProgress();
  }

  // ---------- Render: Details (full written plan) ----------
  function renderDetails() {
    const root = $("#tab-details");
    const d = state.plan && state.plan.detailed;
    if (!d || !Array.isArray(d.sections)) {
      root.innerHTML = `<div class="card"><h2>The detailed plan</h2>
        <p class="muted">Your full written plan lives here — the whole picture behind the steps. It'll appear once your plan is loaded.</p></div>`;
      return;
    }
    let html = `<div class="card">
      <h2>${esc((state.plan.title || "The Plan"))} — the full write-up</h2>
      <p class="muted">The detailed narrative behind the course. Read it when you want the whole story; work it day to day over in <b>The Plan</b>.</p></div>`;
    d.sections.forEach((sec) => {
      const items = sec.items || [];
      html += `<div class="card">
        <h2>${esc(sec.title)}</h2>
        <div class="lesson">${(sec.body || []).map((p) => `<p>${p}</p>`).join("")}</div>
        ${items.length ? `<div class="actions-title">Key moves</div>
          <ul class="detail-list">${items.map((it) => `<li>${esc(typeof it === "string" ? it : it.text)}</li>`).join("")}</ul>` : ""}
      </div>`;
    });
    root.innerHTML = html;
  }
  function openModule(id) {
    const root = $("#tab-plan");
    const el = $(`.module[data-module="${CSS.escape(id)}"]`, root);
    if (el) { el.classList.add("open"); el.scrollIntoView({ behavior: "smooth", block: "start" }); }
  }

  function importPromptHTML(title, sub) {
    return `
      <div class="card">
        <h2>${esc(title)}</h2>
        <p class="muted">${esc(sub)}</p>
        <p class="muted" style="margin-top:10px">If you were given a plan file, load it here:</p>
        <div class="row gap" style="margin-top:12px">
          <label class="btn btn-primary" for="plan-file">Import plan file</label>
          <input type="file" id="plan-file" accept=".json" hidden>
        </div>
      </div>`;
  }
  function wirePlanImport(root) {
    const input = $("#plan-file", root);
    if (!input) return;
    input.addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const plan = JSON.parse(await file.text());
        const ok = plan && (Array.isArray(plan.modules) || Array.isArray(plan.sections));
        if (!ok) throw new Error("bad shape");
        state.plan = plan;
        save();
        renderAll();
      } catch { alert("That file isn't a valid plan file."); }
    });
  }

  function refreshProgress() {
    const hero = $("#today-hero");
    if (hero && planModules().length) {
      const prog = planProgress();
      const ring = $("#freedom-ring");
      if (ring) {
        const arc = ring.querySelectorAll("circle")[1];
        if (arc) arc.setAttribute("stroke-dashoffset", 263.9 * (1 - prog.pct / 100));
        const pctEl = ring.querySelector(".ring-pct b");
        if (pctEl) pctEl.textContent = prog.pct + "%";
      }
    }
  }

  // ---------- Curriculum (Learn) ----------
  function stepState(id) {
    if (!state.steps[id]) state.steps[id] = { done: false, actions: {}, note: "" };
    return state.steps[id];
  }
  function allSteps() { return CURRICULUM.phases.flatMap((p) => p.steps.map((s) => ({ ...s, phase: p }))); }
  function phaseProgress(phase) {
    const done = phase.steps.filter((s) => stepState(s.id).done).length;
    return { done, total: phase.steps.length };
  }
  function curriculumProgress() {
    const steps = allSteps();
    const done = steps.filter((s) => stepState(s.id).done).length;
    return { done, total: steps.length, pct: Math.round((done / (steps.length || 1)) * 100) };
  }

  function renderLearn() {
    const root = $("#tab-learn");
    const prog = curriculumProgress();
    root.innerHTML = `
      <div class="card">
        <h2>Learn the material</h2>
        <p class="muted">The full course behind your plan — every book and framework, with lessons and exercises. Reference it whenever a step in The Plan points you here. ${prog.done}/${prog.total} lessons explored.</p>
      </div>
      <div id="learn-phases"></div>
      <div id="learn-library"></div>`;

    const host = $("#learn-phases", root);
    CURRICULUM.phases.forEach((phase) => {
      const prog2 = phaseProgress(phase);
      const el = document.createElement("div");
      el.className = "phase" + (prog2.done === prog2.total ? " done" : "");
      el.dataset.phase = phase.id;
      el.innerHTML = `
        <div class="phase-head">
          <div class="phase-num">${prog2.done === prog2.total ? "✓" : (phase.num === 0 ? "💰" : phase.num)}</div>
          <div class="phase-title">
            <h2>${esc(phase.title)}</h2>
            <div class="tagline">${esc(phase.tagline)}</div>
          </div>
          <div class="phase-progress">${prog2.done}/${prog2.total}</div>
        </div>
        <div class="phase-body"><p class="phase-intro">${esc(phase.intro)}</p></div>`;
      const body = $(".phase-body", el);
      phase.steps.forEach((step) => body.appendChild(renderStep(step)));
      $(".phase-head", el).addEventListener("click", () => el.classList.toggle("open"));
      host.appendChild(el);
    });

    renderLibrary($("#learn-library", root));
  }

  function renderStep(step) {
    const st = stepState(step.id);
    const el = document.createElement("div");
    el.className = "step" + (st.done ? " done" : "");
    el.dataset.step = step.id;
    const lessonHtml = step.lesson.map((p) => `<p>${p}</p>`).join("");
    const bookHtml = step.book ? `<span class="book-pill">📖 ${esc(step.book.name)} — ${esc(step.book.author)}</span>` : "";
    const actionsHtml = step.actions.map((a, i) => `
      <label class="action-item ${st.actions[i] ? "done" : ""}">
        <input type="checkbox" data-action="${i}" ${st.actions[i] ? "checked" : ""}>
        <span>${esc(a)}</span>
      </label>`).join("");
    el.innerHTML = `
      <div class="stephead">
        <div class="stephead-check">${st.done ? "✓" : ""}</div>
        <h3>${esc(step.title)}</h3>
        <span class="step-time">${esc(step.time || "")}</span>
      </div>
      <div class="stepbody">
        <div class="lesson">${lessonHtml}</div>
        ${bookHtml}
        <div class="widget-slot"></div>
        <div class="actions-title">Exercises</div>
        <div class="actions">${actionsHtml}</div>
        ${step.metric ? `<div class="metric-pill">🎯 Done when: ${esc(step.metric)}</div>` : ""}
        <div class="step-note"><label>Your notes
          <textarea placeholder="Ideas, results, numbers, lessons…">${esc(st.note || "")}</textarea></label></div>
        <button class="btn ${st.done ? "" : "btn-primary"} mark-done">${st.done ? "Mark as not done" : "Mark lesson done"}</button>
      </div>`;
    if (step.widget === "market-calc") renderMarketCalc($(".widget-slot", el));
    if (step.widget === "leverage-score") renderLeverageScore($(".widget-slot", el));
    if (step.widget === "freedom-calc") renderFreedomCalc($(".widget-slot", el));
    $(".stephead", el).addEventListener("click", () => el.classList.toggle("open"));
    $$("input[type=checkbox][data-action]", el).forEach((cb) => cb.addEventListener("change", () => {
      st.actions[cb.dataset.action] = cb.checked;
      cb.closest(".action-item").classList.toggle("done", cb.checked);
      save();
    }));
    $("textarea", el).addEventListener("input", (e) => { st.note = e.target.value; save(); });
    $(".mark-done", el).addEventListener("click", () => { st.done = !st.done; save(); renderLearn(); });
    return el;
  }

  function renderLibrary(root) {
    root.innerHTML = `
      <div class="card">
        <h2>The reading list</h2>
        <p class="muted">Every book behind the course, and why it's here.</p>
        ${CURRICULUM.library.map((b) => `
          <div class="lib-item">
            <span class="skill-tag">${esc(b.skill)}</span>
            <div><b>${esc(b.name)}</b> — ${esc(b.author)}</div>
            <div class="muted">${esc(b.why)}</div>
          </div>`).join("")}
      </div>
      <div class="card">
        <h2>Free market-research sources</h2>
        <p class="muted">The consulting firms whose analysts do your trend-spotting for free.</p>
        ${CURRICULUM.reportSources.map((s) => `
          <div class="lib-item"><a href="${esc(s.url)}" target="_blank" rel="noopener" style="color:var(--accent)">${esc(s.name)} ↗</a></div>`).join("")}
      </div>`;
  }

  // ---------- Widgets ----------
  function renderMarketCalc(slot) {
    const w = state.widgets.marketCalc || (state.widgets.marketCalc = { customers: "", price: "" });
    slot.innerHTML = `
      <div class="widget">
        <h4>Billion-Dollar Market Calculator</h4>
        <label>Number of potential customers
          <input type="number" min="0" id="mc-customers" value="${esc(w.customers)}" placeholder="e.g. 48133"></label>
        <label>Price per customer per YEAR ($)
          <input type="number" min="0" id="mc-price" value="${esc(w.price)}" placeholder="e.g. 36000"></label>
        <div class="widget-result" id="mc-result"></div>
      </div>`;
    const update = () => {
      w.customers = $("#mc-customers", slot).value; w.price = $("#mc-price", slot).value;
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
        ${tests.map((t, i) => `<label class="lev-row"><span>${esc(t)}</span>
          <input type="checkbox" data-lev="${i}" ${w[i] ? "checked" : ""}></label>`).join("")}
        <div class="widget-result" id="lev-result"></div>
      </div>`;
    const update = () => {
      const passed = tests.filter((_, i) => w[i]).length;
      const el = $("#lev-result", slot);
      el.className = "widget-result " + (passed === 4 ? "pass" : "fail");
      el.textContent = passed === 4 ? "4/4 — this is a high-leverage business ✓" : `${passed}/4 — redesign until all four pass`;
    };
    $$("input[data-lev]", slot).forEach((cb) => cb.addEventListener("change", () => { w[cb.dataset.lev] = cb.checked; update(); save(); }));
    update();
  }
  function renderFreedomCalc(slot) {
    const w = state.widgets.freedom || (state.widgets.freedom = { costs: "", buffer: "20", price: "" });
    slot.innerHTML = `
      <div class="widget">
        <h4>Freedom Number Calculator</h4>
        <label>Your essential monthly costs ($)
          <input type="number" min="0" id="fc-costs" value="${esc(w.costs)}" placeholder="e.g. 2500"></label>
        <label>Safety buffer (%)
          <input type="number" min="0" max="100" id="fc-buffer" value="${esc(w.buffer)}"></label>
        <label>Price of what you'll sell, per month ($) <span class="muted">(optional)</span>
          <input type="number" min="0" id="fc-price" value="${esc(w.price)}" placeholder="e.g. 300"></label>
        <div class="widget-result" id="fc-result"></div>
      </div>`;
    const update = () => {
      w.costs = $("#fc-costs", slot).value; w.buffer = $("#fc-buffer", slot).value; w.price = $("#fc-price", slot).value;
      const el = $("#fc-result", slot);
      if (!w.costs) { el.textContent = ""; return; }
      const number = Math.ceil(Number(w.costs) * (1 + Number(w.buffer || 0) / 100));
      let text = `Your freedom number: ${fmtMoney(number)}/month`;
      if (Number(w.price) > 0) text += ` — that's ${Math.ceil(number / Number(w.price))} customers at ${fmtMoney(Number(w.price))}/month`;
      el.className = "widget-result pass"; el.textContent = text; save();
    };
    ["fc-costs", "fc-buffer", "fc-price"].forEach((id) => $("#" + id, slot).addEventListener("input", update));
    update();
  }

  // ---------- Tabs & chrome ----------
  function switchTab(name) {
    $$(".tab").forEach((t) => t.classList.toggle("active", t.dataset.tab === name));
    $$(".tab-panel").forEach((p) => p.classList.toggle("active", p.id === "tab-" + name));
    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  function wireChrome() {
    $$(".tab").forEach((t) => t.addEventListener("click", () => switchTab(t.dataset.tab)));

    const gateMsg = $("#gate-msg");
    $("#gate-form").addEventListener("submit", (e) => {
      e.preventDefault();
      handleAuth("signin", normalizeEmail($("#gate-email").value), $("#gate-password").value, gateMsg);
    });
    $("#gate-signup").addEventListener("click", () => {
      const email = normalizeEmail($("#gate-email").value);
      const pw = $("#gate-password").value;
      if (!email || pw.length < 6) { gateMsg.className = "auth-msg err"; gateMsg.textContent = "Enter an email and a 6+ character password."; return; }
      handleAuth("signup", email, pw, gateMsg);
    });

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

    const pwModal = $("#pw-modal");
    $("#pw-btn").addEventListener("click", () => { $("#pw-msg").textContent = ""; pwModal.classList.remove("hidden"); });
    $("[data-close-pw]", pwModal).addEventListener("click", () => pwModal.classList.add("hidden"));
    pwModal.addEventListener("click", (e) => { if (e.target === pwModal) pwModal.classList.add("hidden"); });
    $("#pw-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      const msg = $("#pw-msg");
      const pw = $("#pw-new").value;
      if (pw !== $("#pw-confirm").value) { msg.className = "auth-msg err"; msg.textContent = "Passwords don't match."; return; }
      if (!sb || !user) return;
      msg.className = "auth-msg"; msg.textContent = "Updating…";
      const { error } = await sb.auth.updateUser({ password: pw });
      if (error) { msg.className = "auth-msg err"; msg.textContent = error.message; }
      else {
        msg.className = "auth-msg ok"; msg.textContent = "Password updated ✓";
        $("#pw-new").value = ""; $("#pw-confirm").value = "";
        setTimeout(() => pwModal.classList.add("hidden"), 900);
      }
    });

    $("#export-btn").addEventListener("click", () => {
      const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = "freedom-plan-data.json"; a.click();
    });
    $("#import-file").addEventListener("change", async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try { state = Object.assign(defaultState(), JSON.parse(await file.text())); save(); renderAll(); }
      catch { alert("That file isn't valid exported data."); }
    });
    $("#reset-btn").addEventListener("click", () => {
      if (confirm("Reset ALL progress and notes? Your plan stays, but every checkbox clears. This cannot be undone.")) {
        const keepPlan = state.plan;
        state = defaultState(); state.plan = keepPlan; save(); renderAll();
      }
    });
  }

  function renderAll() {
    renderToday();
    renderPlan();
    renderDetails();
    renderLearn();
  }

  // ---------- Boot ----------
  wireChrome();
  renderAll();
  initSupabase();
})();
