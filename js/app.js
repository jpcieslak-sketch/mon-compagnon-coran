/* Carnet de suivi du Coran — logique de l'application */
(function () {
  "use strict";

  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => [...document.querySelectorAll(sel)];
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  let state = Store.load();

  /* ================= Grille des sourates ================= */
  function buildSurahGrid(container, searchInput) {
    const render = () => {
      const q = (searchInput ? searchInput.value : "").trim().toLowerCase();
      container.innerHTML = SURAHS.filter(s =>
        !q || s.name.toLowerCase().includes(q) || s.ar.includes(q) || String(s.id) === q
      ).map(s => {
        const st = state.surahs[s.id] ? state.surahs[s.id].status : ST.NONE;
        const cls = st === ST.NONE ? "" : st;
        return `<button class="surah-cell ${cls}" data-id="${s.id}" title="${esc(s.name)}">
          <span class="num">${s.id}</span>
          <span class="nm">${esc(s.name)}</span>
          <span class="ar">${s.ar}</span></button>`;
      }).join("");
    };
    render();
    if (searchInput) searchInput.oninput = render;
    container.onclick = (e) => {
      const btn = e.target.closest(".surah-cell");
      if (!btn) return;
      const id = Number(btn.dataset.id);
      const cur = state.surahs[id] ? state.surahs[id].status : ST.NONE;
      const order = [ST.NONE, ST.GOAL, ST.KNOWN, ST.FORGOTTEN, ST.NONE];
      const n = order[order.indexOf(cur) + 1] ?? ST.NONE;
      Schedule.setStatus(state, id, n);
      Store.save();
      render();
    };
    return render;
  }

  /* ================= Assistant de démarrage ================= */
  function initOnboarding() {
    buildSurahGrid($("#ob-grid"), $("#ob-search"));
    const showStep = (n) => {
      $$(".ob-step").forEach(s => s.classList.toggle("hidden", s.dataset.step != n));
      window.scrollTo(0, 0);
    };
    $$("[data-obnext]").forEach(b => b.onclick = () => showStep(b.dataset.obnext));
    $$("[data-obprev]").forEach(b => b.onclick = () => showStep(b.dataset.obprev));

    $("#ob-notify").onclick = () => {
      if ("Notification" in window) {
        Notification.requestPermission().then(p => {
          state.profile.reminders.enabled = (p === "granted");
          Store.save();
          $("#ob-notify").textContent = p === "granted" ? "✅ Notifications activées" : "🔕 Non autorisées";
          $("#ob-notify").classList.toggle("done", p === "granted");
        });
      } else {
        $("#ob-notify").textContent = "Notifications non supportées ici";
      }
    };

    $("#ob-finish").onclick = () => {
      const p = state.profile;
      p.motivation.why = $("#ob-why").value.trim();
      p.motivation.importance = $("#ob-importance").value.trim();
      p.motivation.who = $("#ob-who").value.trim();
      p.motivation.expectations = p.motivation.who;
      p.capacity.listen = Math.max(1, Number($("#ob-listen").value) || 5);
      p.capacity.read = Math.max(1, Number($("#ob-read").value) || 10);
      p.capacity.minutes = Math.max(5, Number($("#ob-minutes").value) || 15);
      p.capacity.ayahsPerPart = Math.max(1, Number($("#ob-ayahs").value) || 10);
      p.goalPerWeek = Math.max(1, Number($("#ob-goal").value) || 1);
      p.courseWeekday = Number($("#ob-weekday").value);
      const ym = $("#ob-start").value;
      p.yearStart = ym ? `${ym}-01` : `${new Date().getFullYear()}-09-01`;
      p.yearEnd = Schedule.addDays(p.yearStart, 300);
      p.reminders.morning = $("#ob-morning").value || "07:30";
      p.reminders.evening = $("#ob-evening").value || "20:30";
      state.onboarded = true;
      Schedule.generateCourseDays(state);
      Store.save();
      startApp();
    };
  }

  /* ================= Onglets ================= */
  function initTabs() {
    $$("#tabbar button").forEach(b => b.onclick = () => {
      $$("#tabbar button").forEach(x => x.classList.remove("active"));
      b.classList.add("active");
      $$(".screen").forEach(s => s.classList.add("hidden"));
      $(`#screen-${b.dataset.tab}`).classList.remove("hidden");
      window.scrollTo(0, 0);
      if (b.dataset.tab === "today") renderToday();
      if (b.dataset.tab === "surahs") renderSurahsScreen();
      if (b.dataset.tab === "calendar") renderCalendar();
      if (b.dataset.tab === "week") renderWeek();
      if (b.dataset.tab === "settings") renderSettings();
    });
  }

  /* ================= Aujourd'hui ================= */
  function renderToday() {
    const t = Schedule.today();
    $("#today-date").textContent = Schedule.frenchDate(t);
    const prog = Schedule.progression(state);
    const stk = Schedule.streak(state);
    $("#today-stats").innerHTML = `
      <div class="stat"><div class="v">${prog.count}</div><div class="l">sourates connues</div></div>
      <div class="stat"><div class="v">${prog.pct}%</div><div class="l">du Coran</div></div>
      <div class="stat"><div class="v">🔥 ${stk}</div><div class="l">jours tenus</div></div>`;

    const tasks = Schedule.dailyTasks(state, t);
    const log = state.logs[t] || {};
    let html = "";

    if (tasks.course) {
      const a = tasks.course.assignment;
      const label = a ? `${SURAHS[a.surahId - 1].name}${a.from ? ` (v.${a.from}${a.to ? "–" + a.to : ""})` : ""}` : "Rien d'assigné — touche le calendrier pour planifier";
      html += `<div class="card"><h3>🕌 Cours${log.coursePrepared ? " ✅" : ""}</h3>
        <div class="sub">${esc(label)}</div>
        ${a ? `<div class="task-actions">
          <button class="btn small ${log.coursePrepared ? "done" : ""}" id="btn-course-done">${log.coursePrepared ? "Préparé ✓" : "Je l'ai préparée"}</button>
        </div>` : ""}</div>`;
    }

    if (tasks.memorization) {
      const m = tasks.memorization;
      const s = SURAHS[m.surahId - 1];
      const label = (m.from || m.to) ? Schedule.portionLabel(m.surahId, m.from, m.to) : s.name;
      const when = m.date ? (m.date === t ? " — cours aujourd'hui" : " — pour le cours du " + Schedule.frenchDate(m.date)) : "";
      html += `<div class="card"><h3>🧠 Apprentissage de la semaine</h3>
        <div class="sub">${esc(label)}` + `<span class="d-arl"> ${s.ar}</span>` + esc(when) + `</div>
        <div class="ob-quote small">${esc(METHOD_STEPS[0] + " · " + METHOD_STEPS[1])}</div>
        <div class="check-row"><label style="margin:0"><input type="checkbox" id="chk-listen" ${log.listen ? "checked" : ""}> 🎧 Écoutée ${state.profile.capacity.listen}× aujourd'hui</label></div>
        <div class="check-row"><label style="margin:0"><input type="checkbox" id="chk-read" ${log.read ? "checked" : ""}> 📖 Lue ${state.profile.capacity.read}× aujourd'hui</label></div>
        <div class="check-row"><label style="margin:0"><input type="checkbox" id="chk-recited" ${log.recited ? "checked" : ""}> 🗣️ Récitée sans regarder ✓</label></div>
        <div class="task-actions">
          <button class="btn small primary" id="btn-portion">Portion apprise ✅</button>
        </div></div>`;
    } else {
      const nextGoal = SURAHS.find(s => {
        const st = state.surahs[s.id] && state.surahs[s.id].status;
        return !st || st === ST.GOAL || st === ST.FORGOTTEN;
      });
      html += `<div class="card"><h3>🧠 Mémorisation</h3>
        ${nextGoal
          ? `<div class="sub">Prochaine : ${esc(nextGoal.name)}. La méthode : écouter souvent, lire 5–10× par jour, puis réciter sans regarder.</div>
             <div class="task-actions"><button class="btn small primary" id="btn-start">Commencer ${esc(nextGoal.name)} ▶</button></div>`
          : `<div class="empty">Aucun objectif défini. Va dans l'onglet Sourates ✍️</div>`}</div>`;
    }

    if (tasks.revisions.length) {
      html += `<div class="card"><h3>🔁 Révisions du jour${log.revisions ? " ✅" : ""}</h3><div class="sub">Semaine type — ancrer ce que tu connais</div>` +
        tasks.revisions.map(id => {
          const s = SURAHS[id - 1];
          return `<div class="check-row"><span style="flex:1"><span class="d-arl">${s.ar}</span> ${esc(s.name)}</span>
            <button class="btn small" data-rev="${id}">✓</button>
            <button class="btn small danger" data-forgot="${id}">oubliée !</button></div>`;
        }).join("") +
        (tasks.revisionsOverflow > 0 ? `<div class="sub">+ ${tasks.revisionsOverflow} plus tard dans la semaine</div>` : "") +
        `</div>`;
    } else {
      html += `<div class="card"><h3>🔁 Révisions</h3><div class="empty">Rien à réviser aujourd'hui — solide 💪</div></div>`;
    }

    html += `<div class="card"><h3>🌙 Bilan du soir</h3>
      <div class="sub">Coche ce qui a été fait aujourd'hui, l'appli calcule ta régularité.</div>
      <div class="task-actions"><button class="btn small primary" id="btn-bilan">Ouvrir le bilan</button></div></div>`;

    $("#today-content").innerHTML = html;

    const dua = DUAS[Math.abs(Schedule.daysBetween("2026-01-01", t)) % DUAS.length];
    $("#today-dua").innerHTML = `<div class="ar d-arl">${dua.ar}</div><div class="fr">${esc(dua.fr)}</div><div class="src">${esc(dua.src)}</div>`;

    $("#btn-bilan").onclick = openBilan;
    const mem = tasks.memorization;
    ["listen", "read", "recited"].forEach(k => {
      const el = $(`#chk-${k}`);
      if (el) el.onchange = () => {
        state.logs[t] = state.logs[t] || {};
        state.logs[t][k] = el.checked;
        Store.save();
      };
    });
    if ($("#btn-portion")) $("#btn-portion").onclick = () => {
      if (mem.date && state.calendar[mem.date] && state.calendar[mem.date].assignment) {
        Schedule.portionDone(state, mem.date);
      } else {
        Schedule.setStatus(state, mem.surahId, ST.KNOWN);
      }
      state.logs[t] = state.logs[t] || {}; state.logs[t].recited = true;
      Store.save(); renderToday();
    };
    if ($("#btn-start")) $("#btn-start").onclick = () => {
      const nextGoal = SURAHS.find(s => {
        const st = state.surahs[s.id] && state.surahs[s.id].status;
        return !st || st === ST.GOAL || st === ST.FORGOTTEN;
      });
      Schedule.setStatus(state, nextGoal.id, ST.LEARNING);
      Store.save(); renderToday();
    };
    if ($("#btn-course-done")) $("#btn-course-done").onclick = () => {
      state.logs[t] = state.logs[t] || {};
      state.logs[t].coursePrepared = !state.logs[t].coursePrepared;
      Store.save(); renderToday();
    };
    $$("#today-content [data-rev]").forEach(b => b.onclick = () => {
      Schedule.reviewDone(state, Number(b.dataset.rev));
      state.logs[t] = state.logs[t] || {}; state.logs[t].revisions = true;
      Store.save(); renderToday();
    });
    $$("#today-content [data-forgot]").forEach(b => b.onclick = () => {
      Schedule.reviewForgot(state, Number(b.dataset.forgot));
      Store.save(); renderToday();
    });
  }

  /* ================= Bilan du soir ================= */
  function openBilan() {
    const t = Schedule.today();
    state.logs[t] = state.logs[t] || {};
    const log = state.logs[t];
    const items = [
      ["listen", "🎧 Écoutes de la portion faites"],
      ["read", "📖 Lectures de la portion faites"],
      ["portion", "🧠 Apprentissage de la semaine travaillé"],
      ["recited", "🗣️ Récitée sans regarder"],
      ["prayed", "🕌 Récitée dans la prière"],
      ["revisions", "🔁 Révisions faites"]
    ];
    $("#bilan-checks").innerHTML = items.map(([k, l]) =>
      `<div class="check-row bilan-check"><label style="margin:0;flex:1"><input type="checkbox" data-bilan="${k}" ${log[k] ? "checked" : ""}> ${l}</label></div>`
    ).join("");
    $("#bilan-note").value = log.note || "";
    $("#bilan-modal").classList.remove("hidden");
    $("#bilan-close").onclick = () => $("#bilan-modal").classList.add("hidden");
    $("#bilan-save").onclick = () => {
      $$("#bilan-checks input").forEach(i => { log[i.dataset.bilan] = i.checked; });
      log.note = $("#bilan-note").value.trim();
      log.validated = true;
      Store.save();
      $("#bilan-modal").classList.add("hidden");
      renderToday();
    };
  }

  /* ================= Écran sourates ================= */
  function renderSurahsScreen() {
    const prog = Schedule.progression(state);
    $("#surah-progress").innerHTML = `
      <div class="stat"><div class="v">${prog.count}/${prog.total}</div><div class="l">sourates</div></div>
      <div class="stat"><div class="v">${prog.ayahs}/${prog.ayahsTotal}</div><div class="l">versets</div></div>
      <div class="stat"><div class="v">${prog.pct}%</div><div class="l">du Coran</div></div>`;
    buildSurahGrid($("#surah-grid"), $("#surah-search"));
  }

  /* ================= Calendrier ================= */
  function renderCalendar() {
    Schedule.generateCourseDays(state);
    Store.save();
    const q = Schedule.queue(state);
    const hint = q.length
      ? `Prochaine à apprendre : <b>${esc(SURAHS[q[0].surahId - 1].name)}</b> (${SURAHS[q[0].surahId - 1].ayahs} versets)`
      : "Aucune sourate en file — choisis-en dans l'onglet Sourates";
    $("#cal-hint").innerHTML = hint;
    const { start, end } = Schedule.yearRange(state);
    const monthsHTML = [];
    let d = Schedule.fromISO(start);
    d = new Date(d.getFullYear(), d.getMonth(), 1);
    const endD = Schedule.fromISO(end);
    while (d <= endD) {
      const y = d.getFullYear(), m = d.getMonth();
      const label = new Date(y, m, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
      const first = new Date(y, m, 1);
      const pad = (first.getDay() + 6) % 7;
      const dim = new Date(y, m + 1, 0).getDate();
      let cells = "";
      for (let i = 0; i < pad; i++) cells += "<span></span>";
      for (let day = 1; day <= dim; day++) {
        const iso = Schedule.toISO(new Date(y, m, day));
        const c = state.calendar[iso];
        const cls = c && c.course ? (c.assignment ? "course has-assign" : "course") : "";
        cells += `<button class="day-cell ${cls}" data-date="${iso}">${day}</button>`;
      }
      monthsHTML.push(`<div class="mm"><h3>${label}</h3>
        <div class="day-head">${["L","M","M","J","V","S","D"].map(x => `<span>${x}</span>`).join("")}</div>
        <div class="day-grid">${cells}</div></div>`);
      d = new Date(y, m + 1, 1);
    }
    $("#calendar-months").innerHTML = monthsHTML.join("");
    $("#calendar-months").onclick = (e) => {
      const btn = e.target.closest(".day-cell");
      if (btn) openCalendarEditor(btn.dataset.date);
    };
    $("#btn-autofill").onclick = () => {
      const n = Schedule.planAutoFill(state, Schedule.today());
      Store.save();
      renderCalendar();
      alert(n ? n + " séance(s) planifiée(s) ✅" : "Rien à planifier : définis d'abord tes sourates (onglet Sourates)." );
    };
  }

  function openCalendarEditor(iso) {
    $("#cal-editor-date").textContent = Schedule.frenchDate(iso);
    const c = state.calendar[iso] || { course: false, assignment: null };
    $("#cal-course").checked = !!c.course;
    /* préremplir avec la prochaine sourate de la file (oubliées d'abord) */
    const q = Schedule.queue(state);
    const nextId = q.length ? q[0].surahId : 1;
    $("#cal-surah").innerHTML = SURAHS.map(s => `<option value="${s.id}">${s.id}. ${esc(s.name)} (${s.ayahs} v.)</option>`).join("");
    if (c.assignment) {
      $("#cal-surah").value = c.assignment.surahId;
      $("#cal-from").value = c.assignment.from || "";
      $("#cal-to").value = c.assignment.to || "";
    } else {
      $("#cal-surah").value = nextId;
      $("#cal-from").value = "";
      $("#cal-to").value = "";
    }
    $("#cal-editor").classList.remove("hidden");
    $("#cal-cancel").onclick = () => $("#cal-editor").classList.add("hidden");
    $("#cal-erase").onclick = () => {
      state.calendar[iso] = { course: false, assignment: null };
      Store.save();
      $("#cal-editor").classList.add("hidden");
      renderCalendar();
    };
    $("#cal-save").onclick = () => {
      state.calendar[iso] = {
        course: $("#cal-course").checked,
        assignment: $("#cal-course").checked ? {
          surahId: Number($("#cal-surah").value),
          from: Number($("#cal-from").value) || null,
          to: Number($("#cal-to").value) || null
        } : null
      };
      Store.save();
      $("#cal-editor").classList.add("hidden");
      renderCalendar();
    };
  }

  /* ================= Semaine / parcours / méthode ================= */
  function renderWeek() {
    /* Programme des 7 prochains jours */
    const plan = Schedule.weekPlan(state);
    $("#week-plan").innerHTML = plan.map(d => {
      const parts = [];
      if (d.tasks.memorization) {
        const m = d.tasks.memorization;
        parts.push("🧠 " + Schedule.portionLabel(m.surahId, m.from, m.to));
      }
      if (d.tasks.revisions.length) parts.push(`🔁 ${d.tasks.revisions.length} révision(s)`);
      if (d.tasks.course) parts.push("🕌 cours");
      return `<div class="card"><h3 style="font-size:.95rem">${Schedule.frenchDate(d.iso)}${d.iso === Schedule.today() ? " — aujourd'hui" : ""}</h3>
        <div class="sub">${parts.length ? parts.join(" · ") : "repos / avance libre"}</div></div>`;
    }).join("");

    /* Parcours d'apprentissage : d'abord les oubliées, puis les objectifs */
    const q = Schedule.queue(state);
    $("#parcours-list").innerHTML = q.length ? q.map(item => {
      const s = SURAHS[item.surahId - 1];
      const planned = Object.keys(state.calendar).filter(d =>
        d >= Schedule.today() && state.calendar[d].assignment && !state.calendar[d].assignment.done && state.calendar[d].assignment.surahId === item.surahId
      ).sort();
      const when = planned.length ? ` — ${esc(Schedule.portionLabel(item.surahId, state.calendar[planned[0]].assignment.from, state.calendar[planned[0]].assignment.to))} le ${Schedule.frenchDate(planned[0])}` : "";
      return `<div class="check-row"><span style="flex:1"><span class="chip ${item.forgotten ? "forgotten" : "goal"}">${item.forgotten ? "oubliée" : "objectif"}</span> ${esc(s.name)}${when}</span></div>`;
    }).join("") : `<div class="empty">Aucun objectif pour l'instant — définis tes sourates dans l'onglet Sourates.</div>`;

    /* Semaine type des révisions (sourates connues, répartition récurrente) */
    const wt = Schedule.weekTemplate(state);
    const dayNames = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];
    const hasKnown = wt.some(d => d.length);
    $("#week-template").innerHTML = hasKnown ? dayNames.map((n, i) => {
      const list = wt[i];
      return `<div class="check-row"><span style="display:inline-block;width:86px;color:var(--emerald-dark);font-weight:700">${n}</span>
        <span style="flex:1">${list.length ? list.map(id => esc(SURAHS[id - 1].name)).join(" · ") : `<span class="sub">—</span>`}</span></div>`;
    }).join("") : `<div class="empty">Les sourates connues apparaîtront ici, réparties automatiquement sur la semaine.</div>`;

    $("#method-card").innerHTML = `<ol>${METHOD_STEPS.map(m => `<li>${esc(m.slice(3))}</li>`).join("")}</ol>
      <p class="ob-quote small">${esc(HADITH_MOTIVATION)}</p>`;
  }

  /* ================= Réglages ================= */
  function renderSettings() {
    const p = state.profile;
    $("#set-name").value = p.name || "";
    $("#set-morning").value = p.reminders.morning;
    $("#set-evening").value = p.reminders.evening;
    $("#set-listen").value = p.capacity.listen;
    $("#set-read").value = p.capacity.read;
    $("#set-ayahs").value = p.capacity.ayahsPerPart;
    $("#set-notify").classList.toggle("done", p.reminders.enabled);
    ["#set-name", "#set-morning", "#set-evening", "#set-listen", "#set-read", "#set-ayahs"].forEach(sel =>
      $(sel).onchange = () => {
        p.name = $("#set-name").value.trim();
        p.reminders.morning = $("#set-morning").value || p.reminders.morning;
        p.reminders.evening = $("#set-evening").value || p.reminders.evening;
        p.capacity.listen = Math.max(1, Number($("#set-listen").value) || 5);
        p.capacity.read = Math.max(1, Number($("#set-read").value) || 10);
        p.capacity.ayahsPerPart = Math.max(1, Number($("#set-ayahs").value) || 10);
        Store.save();
      });
    $("#set-notify").onclick = () => {
      if (!("Notification" in window)) return;
      Notification.requestPermission().then(res => {
        p.reminders.enabled = res === "granted";
        Store.save();
        $("#set-notify").classList.toggle("done", p.reminders.enabled);
      });
    };
    $("#btn-export").onclick = () => {
      const blob = new Blob([Store.exportJSON()], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `mon-compagnon-coran-${Schedule.today()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
    };
    $("#btn-import").onclick = () => {
      const inp = document.createElement("input");
      inp.type = "file"; inp.accept = "application/json";
      inp.onchange = () => {
        const f = inp.files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = () => {
          try { Store.importJSON(r.result); state = Store.load(); startApp(); }
          catch (e) { alert("Fichier invalide : " + e.message); }
        };
        r.readAsText(f);
      };
      inp.click();
    };
    $("#btn-reset").onclick = () => {
      if (confirm("Tout effacer et recommencer avec Mon compagnon Coran ?")) {
        Store.reset();
        state = Store.load();
        showOnboarding();
      }
    };
  }

  /* ================= Notifications ================= */
  const Notify = {
    show(title, body) {
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: "notify", title, body });
      } else if ("Notification" in window) { new Notification(title, { body }); }
    }
  };

  function initNotifications() {
    const tick = () => {
      state = Store.load();
      const p = state.profile.reminders;
      if (!p.enabled || !("Notification" in window) || Notification.permission !== "granted") return;
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const t = Schedule.today();
      const sent = JSON.parse(localStorage.getItem("notif-sent") || "{}");
      const tasks = Schedule.dailyTasks(state, t);
      const fire = (key, when, payload) => {
        if (when && hhmm >= when && sent[`${key}-${t}`] !== true) {
          Notify.show(payload[0], payload[1]);
          sent[`${key}-${t}`] = true;
          localStorage.setItem("notif-sent", JSON.stringify(sent));
        }
      };
      const revN = tasks.revisions.length + (tasks.memorization ? 1 : 0);
      if (revN > 0) fire("morning", p.morning, ["📖 Programme du jour", `${revN} tâche${revN > 1 ? "s" : ""} t'attendent : mémorisation et révisions.`]);
      fire("evening", p.evening, ["🌙 Bilan du soir", "As-tu fait ton programme aujourd'hui ? Ouvre l'appli pour cocher ton bilan."]);
    };
    setInterval(tick, 30000);
    tick();
  }

  /* ================= Démarrage ================= */
  function showError(e) {
    const el = document.createElement("pre");
    el.style.cssText = "margin:2rem;padding:1rem;background:#fff;border:2px solid #c62828;border-radius:12px;font:14px monospace;white-space:pre-wrap;color:#b71c1c;z-index:9999";
    el.textContent = "Une erreur est survenue :\n" + (e && (e.message || e));
    document.body.appendChild(el);
  }
  window.addEventListener("error", ev => showError(ev.error || ev.message));
  window.addEventListener("unhandledrejection", ev => showError(ev.reason));

  function showOnboarding() {
    $("#onboarding").classList.remove("hidden");
    $("#app").classList.add("hidden");
  }
  function startApp() {
    $("#onboarding").classList.add("hidden");
    $("#app").classList.remove("hidden");
    try { renderToday(); } catch (e) { showError(e); }
    initNotifications();
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  function init() {
    window.__quranJSok = true;
    if (state.onboarded) { try { startApp(); } catch (e) { showError(e); showOnboarding(); } }
    else showOnboarding();
    try { initOnboarding(); } catch (e) { showError(e); }
    try { initTabs(); } catch (e) { showError(e); }
  }

  document.addEventListener("DOMContentLoaded", () => {
    try { init(); } catch (e) { showError(e); }
  });
})();
