/* Les 114 sourates : id, nom (translittération), nom arabe, nombre de versets */
const SURAHS = [
  {id:1,name:"Al-Fatiha",ar:"الفَاتِحَة",ayahs:7},
  {id:2,name:"Al-Baqara",ar:"البَقَرَة",ayahs:286},
  {id:3,name:"Al-Imran",ar:"آل عِمران",ayahs:200},
  {id:4,name:"An-Nisa",ar:"النِّساء",ayahs:176},
  {id:5,name:"Al-Ma'ida",ar:"المَائدة",ayahs:120},
  {id:6,name:"Al-An'am",ar:"الأَنعام",ayahs:165},
  {id:7,name:"Al-A'raf",ar:"الأَعراف",ayahs:206},
  {id:8,name:"Al-Anfal",ar:"الأَنفال",ayahs:75},
  {id:9,name:"At-Tawba",ar:"التَّوبة",ayahs:129},
  {id:10,name:"Yunus",ar:"يونُس",ayahs:109},
  {id:11,name:"Hud",ar:"هُود",ayahs:123},
  {id:12,name:"Yusuf",ar:"يوسُف",ayahs:111},
  {id:13,name:"Ar-Ra'd",ar:"الرَّعد",ayahs:43},
  {id:14,name:"Ibrahim",ar:"إبراهيم",ayahs:52},
  {id:15,name:"Al-Hijr",ar:"الحِجر",ayahs:99},
  {id:16,name:"An-Nahl",ar:"النَّحل",ayahs:128},
  {id:17,name:"Al-Isra",ar:"الإسراء",ayahs:111},
  {id:18,name:"Al-Kahf",ar:"الكَهف",ayahs:110},
  {id:19,name:"Maryam",ar:"مَريَم",ayahs:98},
  {id:20,name:"Ta-Ha",ar:"طه",ayahs:135},
  {id:21,name:"Al-Anbiya",ar:"الأَنبياء",ayahs:112},
  {id:22,name:"Al-Hajj",ar:"الحَجّ",ayahs:78},
  {id:23,name:"Al-Mu'minun",ar:"المُؤمنون",ayahs:118},
  {id:24,name:"An-Nur",ar:"النُّور",ayahs:64},
  {id:25,name:"Al-Furqan",ar:"الفُرقان",ayahs:77},
  {id:26,name:"Ash-Shu'ara",ar:"الشُّعَراء",ayahs:227},
  {id:27,name:"An-Naml",ar:"النَّمل",ayahs:93},
  {id:28,name:"Al-Qasas",ar:"القَصص",ayahs:88},
  {id:29,name:"Al-Ankabut",ar:"العَنكبوت",ayahs:69},
  {id:30,name:"Ar-Rum",ar:"الرُّوم",ayahs:60},
  {id:31,name:"Luqman",ar:"لقمان",ayahs:34},
  {id:32,name:"As-Sajda",ar:"السَّجدة",ayahs:30},
  {id:33,name:"Al-Ahzab",ar:"الأَحزاب",ayahs:73},
  {id:34,name:"Saba",ar:"سَبَأ",ayahs:54},
  {id:35,name:"Fatir",ar:"فاتر",ayahs:45},
  {id:36,name:"Ya-Sin",ar:"يس",ayahs:83},
  {id:37,name:"As-Saffat",ar:"الصّافّات",ayahs:182},
  {id:38,name:"Sad",ar:"ص",ayahs:88},
  {id:39,name:"Az-Zumar",ar:"الزُّمَر",ayahs:75},
  {id:40,name:"Ghafir",ar:"غافر",ayahs:85},
  {id:41,name:"Fussilat",ar:"فُصّلت",ayahs:54},
  {id:42,name:"Ash-Shura",ar:"الشُّورى",ayahs:53},
  {id:43,name:"Az-Zukhruf",ar:"الزُّخروف",ayahs:89},
  {id:44,name:"Ad-Dukhan",ar:"الدُّخان",ayahs:59},
  {id:45,name:"Al-Jathiya",ar:"الجاثِية",ayahs:37},
  {id:46,name:"Al-Ahqaf",ar:"الأَحقاف",ayahs:35},
  {id:47,name:"Muhammad",ar:"مُحَمَّد",ayahs:38},
  {id:48,name:"Al-Fath",ar:"الفَتح",ayahs:29},
  {id:49,name:"Al-Hujurat",ar:"الحُجُرات",ayahs:18},
  {id:50,name:"Qaf",ar:"ق",ayahs:45},
  {id:51,name:"Adh-Dhariyat",ar:"الذّاريات",ayahs:60},
  {id:52,name:"At-Tur",ar:"الطُّور",ayahs:49},
  {id:53,name:"An-Najm",ar:"النَّجم",ayahs:62},
  {id:54,name:"Al-Qamar",ar:"القَمَر",ayahs:55},
  {id:55,name:"Ar-Rahman",ar:"الرَّحمن",ayahs:78},
  {id:56,name:"Al-Waqia",ar:"الواقِعة",ayahs:96},
  {id:57,name:"Al-Hadid",ar:"الحَديد",ayahs:29},
  {id:58,name:"Al-Mujadila",ar:"المجادَلة",ayahs:22},
  {id:59,name:"Al-Hashr",ar:"الحَشر",ayahs:24},
  {id:60,name:"Al-Mumtahina",ar:"المُمتَحَنة",ayahs:13},
  {id:61,name:"As-Saff",ar:"الصّفّ",ayahs:14},
  {id:62,name:"Al-Jumu'a",ar:"الجُمُعة",ayahs:11},
  {id:63,name:"Al-Munafiqun",ar:"المُنافِقون",ayahs:11},
  {id:64,name:"At-Taghabun",ar:"التَّغابُن",ayahs:18},
  {id:65,name:"At-Talaq",ar:"الطَّلاق",ayahs:12},
  {id:66,name:"At-Tahrim",ar:"التَّحرِيم",ayahs:12},
  {id:67,name:"Al-Mulk",ar:"المُلك",ayahs:30},
  {id:68,name:"Al-Qalam",ar:"القَلَم",ayahs:52},
  {id:69,name:"Al-Haqqa",ar:"الحاقّة",ayahs:52},
  {id:70,name:"Al-Ma'arij",ar:"المَعارج",ayahs:44},
  {id:71,name:"Nuh",ar:"نوح",ayahs:28},
  {id:72,name:"Al-Jinn",ar:"الجِنّ",ayahs:28},
  {id:73,name:"Al-Muzzammil",ar:"المُزّمّل",ayahs:20},
  {id:74,name:"Al-Muddathir",ar:"المُدّثّر",ayahs:56},
  {id:75,name:"Al-Qiyama",ar:"القِيامة",ayahs:40},
  {id:76,name:"Al-Insan",ar:"الإِنسان",ayahs:31},
  {id:77,name:"Al-Mursalat",ar:"المُرسَلات",ayahs:50},
  {id:78,name:"An-Naba",ar:"النَّبأ",ayahs:40},
  {id:79,name:"An-Nazi'at",ar:"النّازِعات",ayahs:46},
  {id:80,name:"Abasa",ar:"عَبَس",ayahs:42},
  {id:81,name:"At-Takwir",ar:"التَّكوير",ayahs:29},
  {id:82,name:"Al-Infitar",ar:"الإِنفِطار",ayahs:19},
  {id:83,name:"Al-Mutaffifin",ar:"المُطَفّفين",ayahs:36},
  {id:84,name:"Al-Inshiqaq",ar:"الإِنشِقاق",ayahs:25},
  {id:85,name:"Al-Buruj",ar:"البُروج",ayahs:22},
  {id:86,name:"At-Tariq",ar:"الطارق",ayahs:17},
  {id:87,name:"Al-A'la",ar:"الأَعلى",ayahs:19},
  {id:88,name:"Al-Ghashiya",ar:"الغاشِية",ayahs:26},
  {id:89,name:"Al-Fajr",ar:"الفَجر",ayahs:30},
  {id:90,name:"Al-Balad",ar:"البَلَد",ayahs:20},
  {id:91,name:"Ash-Shams",ar:"الشَّمس",ayahs:15},
  {id:92,name:"Al-Layl",ar:"اللَّيل",ayahs:21},
  {id:93,name:"Ad-Duha",ar:"الضُّحى",ayahs:11},
  {id:94,name:"Ash-Sharh",ar:"الشَّرح",ayahs:8},
  {id:95,name:"At-Tin",ar:"التّين",ayahs:8},
  {id:96,name:"Al-'Alaq",ar:"العَلَق",ayahs:19},
  {id:97,name:"Al-Qadr",ar:"القَدر",ayahs:5},
  {id:98,name:"Al-Bayyina",ar:"البَيّنة",ayahs:8},
  {id:99,name:"Az-Zalzala",ar:"الزَّلزَلة",ayahs:8},
  {id:100,name:"Al-Adiyat",ar:"العادِيات",ayahs:11},
  {id:101,name:"Al-Qari'a",ar:"القارِعة",ayahs:11},
  {id:102,name:"At-Takathur",ar:"التَّكاثُر",ayahs:8},
  {id:103,name:"Al-Asr",ar:"العَصر",ayahs:3},
  {id:104,name:"Al-Humaza",ar:"الهُمَزة",ayahs:9},
  {id:105,name:"Al-Fil",ar:"الفيل",ayahs:5},
  {id:106,name:"Quraysh",ar:"قُرَيش",ayahs:4},
  {id:107,name:"Al-Ma'un",ar:"المَاعون",ayahs:7},
  {id:108,name:"Al-Kawthar",ar:"الكَوثَر",ayahs:3},
  {id:109,name:"Al-Kafirun",ar:"الكافِرون",ayahs:6},
  {id:110,name:"An-Nasr",ar:"النَّصر",ayahs:3},
  {id:111,name:"Al-Masad",ar:"المَسَد",ayahs:5},
  {id:112,name:"Al-Ikhlus",ar:"الإخلاص",ayahs:4},
  {id:113,name:"Al-Falaq",ar:"الفَلَق",ayahs:5},
  {id:114,name:"An-Nas",ar:"النّاس",ayahs:6}
];

const TOTAL_AYAHS = SURAHS.reduce((s, x) => s + x.ayahs, 0);

/* Statuts d'une sourate */
const ST = {
  NONE: "none",            // pas définie
  GOAL: "goal",            // objectif : à apprendre
  LEARNING: "learning",    // en cours d'apprentissage
  KNOWN: "known",          // connue (entrée dans le cycle de révision)
  FORGOTTEN: "forgotten"   // oubliée : à réapprendre
};

/* Intervalle de révision espacée (jours) par niveau */
const REVIEW_INTERVALS = [1, 2, 3, 5, 7, 14, 30, 60];

/* Textes du carnet (méthode, motivation) */
const METHOD_STEPS = [
  "1. Écouter très souvent la sourate",
  "2. Lire la partie à apprendre plusieurs fois par jour",
  "3. Le jour de la mémorisation : réciter sans regarder",
  "4. Réviser dès le lendemain",
  "5. Réciter dans les prières"
];

const DUAS = [
  {ar:"وَقُل رَبِّ زِدني عِلمًا", fr:"Et dis : Seigneur, augmente mon savoir", src:"Sourate 20, verset 114"},
  {ar:"اَللَّهُمَّ اجْعَلِ الْقُرْآنَ رَبِيعَ قُلُوبِنَا وَنُورَ صُدُورِنَا", fr:"Ô Allah, fais du Coran le printemps de nos cœurs et la lumière de nos poitrines", src:"Invocation"}
];

const HADITH_MOTIVATION = "« Les actes les plus aimés d'Allah sont ceux qui durent, même s'ils sont peu nombreux. »";

/* Page de début de chaque sourate dans le mushaf standard de Médine (604 pages, ~15 lignes/page).
   Sert à estimer le nombre de lignes qu'occupe chaque sourate. */
const SURAH_START_PAGES = [1,2,50,77,106,128,151,177,187,208,221,235,249,255,262,267,282,293,305,312,322,332,342,350,359,367,377,385,396,404,411,415,418,428,434,440,446,453,458,467,477,483,489,496,499,502,507,511,515,518,520,523,526,528,531,534,537,542,545,549,551,553,554,556,558,560,562,564,566,568,570,572,574,575,577,578,580,582,583,585,586,587,587,589,590,591,591,592,593,594,595,595,596,596,597,597,598,598,599,599,600,600,601,601,601,602,602,602,603,603,603,604,604,604];

if (typeof module !== "undefined") { module.exports = { SURAHS, TOTAL_AYAHS, ST, REVIEW_INTERVALS, METHOD_STEPS, DUAS, HADITH_MOTIVATION, SURAH_START_PAGES }; }
