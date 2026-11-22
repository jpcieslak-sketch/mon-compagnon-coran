/* Moteur de planification : calendrier annuel, tâches du jour, révision espacée */
const Schedule = (() => {

  /* ---------- Dates ---------- */
  const toISO = (d) => {
    const p = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
  };
  const fromISO = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  const today = () => toISO(new Date());
  const addDays = (iso, n) => { const d = fromISO(iso); d.setDate(d.getDate() + n); return toISO(d); };
  const daysBetween = (a, b) => Math.round((fromISO(b) - fromISO(a)) / 86400000);
  const frenchDate = (iso) => fromISO(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  /* ---------- Calendrier annuel des cours ---------- */
  function yearRange(state) {
    const p = state.profile;
    const start = p.yearStart || (new Date().getFullYear() + "-09-01");
    const end = p.yearEnd || (new Date().getFullYear() + 1 + "-06-30");
    return { start, end };
  }

  /* Génère les jours de cours (un par semaine, sur le jour paramétré) pour l'année */
  function generateCourseDays(state) {
    const { start, end } = yearRange(state);
    const wd = (state.profile.courseWeekday ?? 4) % 7;
    if (start >= end) return [];
    let d = fromISO(start);
    while (d.getDay() !== wd) d.setDate(d.getDate() + 1);
    const days = [];
    while (toISO(d) <= end) {
      const iso = toISO(d);
      days.push(iso);
      if (!state.calendar[iso]) state.calendar[iso] = { course: true, assignment: null };
      d.setDate(d.getDate() + 7);
    }
    return days;
  }

  /* ---------- État des sourates ---------- */
  function surahState(state, id) {
    if (!state.surahs[id]) state.surahs[id] = { status: ST.NONE, level: 0, lastReviewed: null, nextDue: null, memorizedOn: null };
    return state.surahs[id];
  }

  function setStatus(state, id, status) {
    const s = surahState(state, id);
    s.status = status;
    if (status === ST.KNOWN && !s.memorizedOn) {
      s.memorizedOn = today();
      s.level = 0;
      s.nextDue = addDays(today(), REVIEW_INTERVALS[0]);
      s.lastReviewed = null;
    }
    if (status === ST.LEARNING || status === ST.FORGOTTEN) { s.level = 0; s.nextDue = null; }
    if (status === ST.GOAL || status === ST.NONE) { s.level = 0; s.nextDue = null; s.memorizedOn = null; }
  }

  /* Révision effectuée : monte d'un niveau dans la répétition espacée */
  function reviewDone(state, id) {
    const s = surahState(state, id);
    const lvl = Math.min(s.level + 1, REVIEW_INTERVALS.length - 1);
    s.level = lvl;
    s.lastReviewed = today();
    s.nextDue = addDays(today(), REVIEW_INTERVALS[lvl]);
  }

  /* Oubli déclaré : repart dans la file d'apprentissage (oubliées d'abord) */
  function reviewForgot(state, id) {
    const s = surahState(state, id);
    s.level = 0;
    s.status = ST.FORGOTTEN;
    s.lastReviewed = today();
    s.nextDue = null;
  }

  /* ---------- File d'apprentissage (oubliées d'abord, puis objectifs) ---------- */
  function queue(state) {
    const forgotten = [], goals = [];
    SURAHS.forEach(s => {
      const st = state.surahs[s.id] ? state.surahs[s.id].status : ST.NONE;
      if (st === ST.FORGOTTEN) forgotten.push(s.id);
      else if (st === ST.GOAL) goals.push(s.id);
    });
    return forgotten.concat(goals).map(id => ({ surahId: id, forgotten: forgotten.includes(id) }));
  }

  /* Portion en cours d'apprentissage : la prochaine assignation de cours non apprise */
  function currentAssignment(state, dateISO) {
    const dates = Object.keys(state.calendar).filter(d =>
      d >= dateISO && state.calendar[d].course && state.calendar[d].assignment && !state.calendar[d].assignment.done
    ).sort();
    if (!dates.length) return null;
    const d = dates[0];
    const a = state.calendar[d].assignment;
    return { date: d, surahId: a.surahId, from: a.from, to: a.to };
  }

  /* Remplissage automatique du programme annuel avec les sourates/versets à apprendre */
  /* Lignes approximatives que chaque sourate occupe dans le mushaf standard de Médine (604 pages, ~15 lignes/page),
     déduites des pages de début. Les sourates qui partagent une page (la fin du mushaf) ont une estimation dédiée. */
  const TAIL_LINES = { 82: 1.5, 83: 4, 86: 2, 87: 2.5, 91: 2, 92: 3, 93: 2, 94: 1.5, 95: 1.5, 96: 3, 97: 0.75, 98: 3,
                       99: 1.5, 100: 2.5, 101: 2.5, 102: 1.5, 103: 0.75, 104: 1.5, 105: 1, 106: 1, 107: 1.5, 108: 0.75,
                       109: 1.5, 110: 0.75, 111: 1, 112: 0.75, 113: 1, 114: 1 };
  const SURAH_LINES = SURAHS.map((s, i) => {
    const pages = (typeof SURAH_START_PAGES !== "undefined") ? SURAH_START_PAGES : [];
    const here = pages[i] || 1;
    const next = pages[i + 1];
    const shared = (i > 0 && pages[i - 1] === here) || next === here;
    if (shared) return TAIL_LINES[i + 1] || 2;
    return (next && next > here ? next - here : 1) * 15;
  });

  function surahLines(id) { return SURAH_LINES[id - 1]; }

  /* Nombre de versets à apprendre pour couvrir ~lines lignes de cette sourate (arrondi au verset). */
  function versesForLines(id, lines) {
    const total = SURAHS[id - 1].ayahs;
    const L = SURAH_LINES[id - 1];
    return Math.min(total, Math.max(1, Math.round(lines * total / L)));
  }

  function planAutoFill(state, dateISO) {
    const partLines = Math.max(1, (state.profile.capacity && state.profile.capacity.linesPerPart) || 5);
    const dates = Object.keys(state.calendar).filter(d =>
      d >= dateISO && state.calendar[d].course && !state.calendar[d].assignment
    ).sort();
    let placed = 0;
    for (const d of dates) {
      const q = queue(state);
      if (!q.length) break;
      /* prochaine sourate de la file non encore (entièrement) planifiée */
      let target = null, fromV = 1;
      for (const item of q) {
        const future = Object.values(state.calendar)
          .map(c => c.assignment).filter(a => a && a.surahId === item.surahId && !a.done);
        const lastTo = future.reduce((m, a) => Math.max(m, a.to || SURAHS[item.surahId - 1].ayahs), 0);
        if (lastTo < SURAHS[item.surahId - 1].ayahs) { target = item; fromV = lastTo + 1; break; }
      }
      if (!target) break;
      const total = SURAHS[target.surahId - 1].ayahs;
      const toV = Math.min(fromV + versesForLines(target.surahId, partLines) - 1, total);
      state.calendar[d].assignment = { surahId: target.surahId, from: fromV, to: toV };
      placed++;
    }
    return placed;
  }

  /* ---------- Tâches du jour ---------- */
  function dailyTasks(state, dateISO) {
    const tasks = { memorization: null, revisions: [], course: null, assignment: currentAssignment(state, dateISO) };

    /* 1. Cours : portion assignée à cette date */
    const cal = state.calendar[dateISO];
    if (cal && cal.course) {
      tasks.course = { date: dateISO, assignment: cal.assignment || null };
    }

    /* 2. Mémorisation : portion assignée pour le prochain cours, sinon sourate en cours */
    if (tasks.assignment) {
      tasks.memorization = { surahId: tasks.assignment.surahId, from: tasks.assignment.from, to: tasks.assignment.to, date: tasks.assignment.date };
    } else {
      const learning = Object.keys(state.surahs).filter(id => state.surahs[id].status === ST.LEARNING);
      if (learning.length) {
        const id = Math.min(...learning.map(Number));
        tasks.memorization = { surahId: id };
      }
    }

    /* 3. Révisions du jour : issues de la semaine type — la totalité des sourates connues est répartie sur les 7 jours */
    const weekdayIdx = (fromISO(dateISO).getDay() + 6) % 7; /* 0 = lundi */
    tasks.revisions = weekTemplate(state)[weekdayIdx] || [];
    tasks.revisionsOverflow = 0;
    return tasks;
  }

  /* Semaine type : la totalité des sourates connues est répartie sur les 7 jours (lundi→dimanche).
     Fréquence selon le niveau de maîtrise : fraîche = tous les jours, bien maîtrisée = 1 fois/semaine.
     Les répétitions sont espacées régulièrement (pas deux fois le même jour). */
  function weekTemplate(state) {
    const days = [[], [], [], [], [], [], []];
    const freqOf = lvl => (lvl >= 6 ? 1 : lvl >= 4 ? 2 : lvl >= 2 ? 3 : 7);
    const known = Object.keys(state.surahs).map(Number)
      .filter(id => state.surahs[id].status === ST.KNOWN)
      .sort((a, b) => (state.surahs[a].level - state.surahs[b].level) || (a - b));
    let rot = 0;
    for (const id of known) {
      const f = freqOf(state.surahs[id].level);
      const used = new Set();
      for (let k = 0; k < f; k++) {
        let d = Math.round(rot + k * (7 / f)) % 7;
        while (used.has(d)) d = (d + 1) % 7;
        used.add(d);
        days[d].push(id);
      }
      rot = (rot + 1) % 7;
    }
    return days;
  }

  /* ---------- Progression ---------- */
  function progression(state) {
    const known = Object.keys(state.surahs).map(Number).filter(id => state.surahs[id].status === ST.KNOWN);
    let done = 0;
    known.forEach(id => { done += (SURAHS[id - 1] || { ayahs: 0 }).ayahs; });
    return { count: known.length, total: SURAHS.length, ayahs: done, ayahsTotal: TOTAL_AYAHS, pct: Math.round(done / TOTAL_AYAHS * 100) };
  }

  /* Série de jours consécutifs avec bilan validé */
  function streak(state) {
    let n = 0;
    let d = today();
    const logs = state.logs;
    while (logs[d] && (logs[d].read || logs[d].recited || logs[d].revisions)) {
      n++;
      d = addDays(d, -1);
      if (n > 400) break;
    }
    return n;
  }

  /* ---------- Programme hebdomadaire (aperçu, comme le carnet) ---------- */
  function weekPlan(state) {
    const t = today();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const iso = addDays(t, i);
      days.push({ iso, tasks: dailyTasks(state, iso) });
    }
    return days;
  }

  /* Portion apprise : met à jour l'assignation et le statut de la sourate */
  function portionDone(state, dateISO) {
    const a = state.calendar[dateISO] && state.calendar[dateISO].assignment;
    if (!a) return null;
    a.done = true;
    const ayahs = SURAHS[a.surahId - 1].ayahs;
    const coversAll = (a.from ?? 1) <= 1 && (a.to ?? ayahs) >= ayahs;
    setStatus(state, a.surahId, coversAll ? ST.KNOWN : ST.LEARNING);
    return { surahId: a.surahId, coversAll };
  }

  /* Étiquette d'une portion (ex. "Ad-Duha, versets 1–5") */
  function portionLabel(id, from, to) {
    const s = SURAHS[id - 1];
    if (from && to) return s.name + ", versets " + from + "–" + to;
    if (from) return s.name + ", versets " + from + "–" + s.ayahs;
    return s.name;
  }

  return { toISO, fromISO, today, addDays, daysBetween, frenchDate, yearRange, generateCourseDays,
           surahState, setStatus, reviewDone, reviewForgot, dailyTasks, progression, streak, weekPlan,
           queue, currentAssignment, planAutoFill, portionDone, weekTemplate, portionLabel,
           surahLines, versesForLines };
})();

if (typeof module !== "undefined") { module.exports = { Schedule }; }
