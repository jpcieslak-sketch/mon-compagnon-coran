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
    const wd = state.profile.courseWeekday;
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

  /* Oubli déclaré : repart de zéro */
  function reviewForgot(state, id) {
    const s = surahState(state, id);
    s.level = 0;
    s.status = ST.LEARNING;
    s.lastReviewed = today();
    s.nextDue = null;
  }

  /* ---------- Tâches du jour ---------- */
  function dailyTasks(state, dateISO) {
    const tasks = { memorization: null, revisions: [], course: null };

    /* 1. Cours : portion assignée à cette date */
    const cal = state.calendar[dateISO];
    if (cal && cal.course) {
      tasks.course = { date: dateISO, assignment: cal.assignment || null };
    }

    /* 2. Mémorisation en cours */
    const learning = Object.keys(state.surahs).filter(id => state.surahs[id].status === ST.LEARNING);
    if (learning.length) {
      const id = Math.min(...learning.map(Number));
      tasks.memorization = { surahId: id };
    }

    /* 3. Révisions dues (plafonnées selon la capacité du jour) */
    const maxRev = Math.max(2, Math.min(8, Math.round(state.profile.capacity.minutes / 5)));
    const due = Object.keys(state.surahs)
      .map(Number)
      .filter(id => {
        const s = state.surahs[id];
        return s.status === ST.KNOWN && s.nextDue && s.nextDue <= dateISO;
      })
      .sort((a, b) => (state.surahs[a].nextDue < state.surahs[b].nextDue ? -1 : 1));
    tasks.revisions = due.slice(0, maxRev);
    tasks.revisionsOverflow = due.length - tasks.revisions.length;
    return tasks;
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

  return { toISO, fromISO, today, addDays, daysBetween, frenchDate, yearRange, generateCourseDays,
           surahState, setStatus, reviewDone, reviewForgot, dailyTasks, progression, streak, weekPlan };
})();

if (typeof module !== "undefined") { module.exports = { Schedule }; }
