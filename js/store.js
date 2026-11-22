/* Persistance locale (localStorage) + export/import */
const Store = (() => {
  const KEY = "quran-hifz-v1";

  const DEFAULT_STATE = () => ({
    version: 1,
    onboarded: false,
    profile: {
      name: "",
      motivation: { why: "", importance: "", who: "", stress: "", expectations: "" },
      capacity: { listen: 5, read: 10, minutes: 15, linesPerPart: 5 },   // fois/jour, minutes/jour, lignes/séance
      goalPerWeek: 1,                                   // nouvelles sourates / portions par semaine
      courseWeekday: 4,                                 // jeudi
      yearStart: null,                                  // "2026-10-01"
      yearEnd: null,                                    // "2027-05-31"
      reminders: { enabled: false, morning: "07:30", evening: "20:30" }
    },
    surahs: {},     // id -> { status, level, lastReviewed, nextDue, memorizedOn }
    calendar: {},   // dateISO -> { course:true/false, assignment:{surahId, from, to}|null }
    logs: {}        // dateISO -> { listen:bool, read:bool, recited:bool, prayed:bool, revisions:bool, note:"" }
  });

  let state = null;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        state = Object.assign(DEFAULT_STATE(), JSON.parse(raw));
        state.profile = Object.assign(DEFAULT_STATE().profile, state.profile);
        if (state.profile.capacity) {
          if (state.profile.capacity.linesPerPart == null && state.profile.capacity.ayahsPerPart) {
            state.profile.capacity.linesPerPart = Math.min(50, Math.max(1, Number(state.profile.capacity.ayahsPerPart) || 5));
          }
          state.profile.capacity = Object.assign(DEFAULT_STATE().profile.capacity, state.profile.capacity);
        }
      }
    } catch (e) { /* état corrompu : on repart à neuf */ }
    if (!state) state = DEFAULT_STATE();
    return state;
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* quota */ }
  }

  function reset() {
    state = DEFAULT_STATE();
    save();
  }

  function get() { return state || load(); }

  function exportJSON() { return JSON.stringify(state, null, 2); }

  function importJSON(txt) {
    const parsed = JSON.parse(txt);
    if (!parsed || typeof parsed !== "object" || !parsed.profile) throw new Error("Fichier invalide");
    state = Object.assign(DEFAULT_STATE(), parsed);
    save();
  }

  return { load, save, reset, get, exportJSON, importJSON, KEY };
})();

if (typeof module !== "undefined") { module.exports = { Store }; }
