import type {
  CheckInChipId,
  ConditionCategory,
  CorrelationSummary,
  FocusModeRecommendation,
  ImpulseBucketSummary,
  ImpulseEvent,
  LocalFocusSession,
  LocalWellbeingLog,
  MicroStepItem,
  WellbeingAnalysisResult,
} from '../types/wellbeing';

export const CHECKIN_CHIPS: ReadonlyArray<{
  id: CheckInChipId;
  label: string;
}> = [
  { id: 'kurang_tidur', label: 'Kurang tidur' },
  { id: 'tugas_menumpuk', label: 'Tugas menumpuk' },
  { id: 'overthinking', label: 'Overthinking' },
  { id: 'lelah_layar', label: 'Lelah menatap layar' },
  { id: 'fisik_capek', label: 'Fisik capek' },
  { id: 'pikiran_tenang', label: 'Pikiran tenang' },
];

interface KeywordRule {
  keywords: string[];
  weights: Partial<Record<ConditionCategory, number>>;
  energyDelta: number;
  moodDelta: number;
}

const KEYWORD_RULES: KeywordRule[] = [
  {
    keywords: ['tidur', 'begadang', 'ngantuk', 'mengantuk', 'insomnia', 'pusing', 'lelah', 'capek', 'pegal', 'mata'],
    weights: { 'Kelelahan Fisik & Tidur': 2.2, 'Kelelahan Kognitif': 0.8 },
    energyDelta: -1,
    moodDelta: -0.4,
  },
  {
    keywords: ['tugas', 'skripsi', 'deadline', 'menumpuk', 'ujian', 'bingung', 'fokus', 'procrastinate', 'nunda', 'scroll', 'burnout'],
    weights: { 'Kelelahan Kognitif': 2.4, 'Beban Emosional': 0.7 },
    energyDelta: -0.7,
    moodDelta: -0.6,
  },
  {
    keywords: ['cemas', 'overthinking', 'khawatir', 'takut', 'gelisah', 'sedih', 'stres', 'sendiri', 'bingung', 'tekanan', 'insecure'],
    weights: { 'Beban Emosional': 2.5, 'Kelelahan Kognitif': 0.6 },
    energyDelta: -0.5,
    moodDelta: -1.1,
  },
  {
    keywords: ['tenang', 'nyaman', 'cukup', 'semangat', 'siap', 'segar', 'baik', 'stabil', 'lega', 'bersyukur'],
    weights: { 'Kondisi Seimbang': 2.8 },
    energyDelta: 1,
    moodDelta: 1.1,
  },
];

const CHIP_WEIGHTS: Record<
  CheckInChipId,
  { category: ConditionCategory; score: number; energyDelta: number; moodDelta: number }
> = {
  kurang_tidur: { category: 'Kelelahan Fisik & Tidur', score: 3, energyDelta: -1.4, moodDelta: -0.6 },
  fisik_capek: { category: 'Kelelahan Fisik & Tidur', score: 2.8, energyDelta: -1.3, moodDelta: -0.4 },
  lelah_layar: { category: 'Kelelahan Kognitif', score: 2.6, energyDelta: -0.9, moodDelta: -0.5 },
  tugas_menumpuk: { category: 'Kelelahan Kognitif', score: 2.9, energyDelta: -0.8, moodDelta: -0.8 },
  overthinking: { category: 'Beban Emosional', score: 3.1, energyDelta: -0.7, moodDelta: -1.2 },
  pikiran_tenang: { category: 'Kondisi Seimbang', score: 3.4, energyDelta: 1.1, moodDelta: 1.2 },
};

function clampScore(value: number): number {
  return Math.max(1, Math.min(5, Math.round(value)));
}

export function getFocusRecommendation(energyScore: number): FocusModeRecommendation {
  if (energyScore <= 2) {
    return {
      modeName: 'Gentle Focus',
      defaultMinutes: 10,
      minMinutes: 5,
      maxMinutes: 15,
      description: 'Energi sedang rendah — cukup 10 menit langkah ringan tanpa memaksa.',
    };
  }
  if (energyScore === 3) {
    return {
      modeName: 'Steady Focus',
      defaultMinutes: 15,
      minMinutes: 10,
      maxMinutes: 25,
      description: 'Ritme stabil 15 menit untuk menjaga momentum tetap nyaman.',
    };
  }
  return {
    modeName: 'Deep Flow',
    defaultMinutes: 25,
    minMinutes: 25,
    maxMinutes: 45,
    description: 'Energi cukup optimal — sesi 25–45 menit dengan jeda napas di akhir.',
  };
}

export function analyzeWellbeingCheckIn(
  selectedChips: CheckInChipId[],
  noteText: string,
  manualEnergy?: number,
  manualMood?: number
): WellbeingAnalysisResult {
  const scores: Record<ConditionCategory, number> = {
    'Kelelahan Kognitif': 0,
    'Kelelahan Fisik & Tidur': 0,
    'Beban Emosional': 0,
    'Kondisi Seimbang': 0.5,
  };

  let energy = 3.4;
  let mood = 3.4;

  for (const chip of selectedChips) {
    const rule = CHIP_WEIGHTS[chip];
    if (rule) {
      scores[rule.category] += rule.score;
      energy += rule.energyDelta;
      mood += rule.moodDelta;
    }
  }

  const normalized = noteText.toLowerCase().trim();
  if (normalized.length > 0) {
    for (const rule of KEYWORD_RULES) {
      const matchCount = rule.keywords.reduce(
        (acc, kw) => (normalized.includes(kw) ? acc + 1 : acc),
        0
      );
      if (matchCount > 0) {
        const multiplier = Math.min(2, matchCount);
        for (const [cat, weight] of Object.entries(rule.weights) as Array<
          [ConditionCategory, number]
        >) {
          scores[cat] += weight * multiplier;
        }
        energy += rule.energyDelta * Math.min(1.5, matchCount * 0.6);
        mood += rule.moodDelta * Math.min(1.5, matchCount * 0.6);
      }
    }
  }

  const ordered = (Object.entries(scores) as Array<[ConditionCategory, number]>).sort(
    (a, b) => b[1] - a[1]
  );
  const conditionCategory: ConditionCategory = ordered[0][0];

  const finalEnergy =
    typeof manualEnergy === 'number' ? clampScore(manualEnergy) : clampScore(energy);
  const finalMood = typeof manualMood === 'number' ? clampScore(manualMood) : clampScore(mood);

  const feedbackMap: Record<ConditionCategory, [string, string]> = {
    'Kelelahan Kognitif': [
      'Pikiranmu tampak sedang memproses terlalu banyak hal sekaligus hari ini, dan wajar jika fokus terasa lebih cepat lelah.',
      'Mari perkecil target menjadi satu langkah berdurasi singkat agar otakmu mendapat ruang bernapas tanpa tekanan.',
    ],
    'Kelelahan Fisik & Tidur': [
      'Tubuh dan matamu sedang memberi sinyal bahwa mereka butuh ritme yang lebih pelan setelah waktu istirahat yang belum optimal.',
      'Ambil porsi fokus yang lembut saja, lalu sempatkan jeda relaksasi mata 20-20-20 dan tutup layar lebih awal malam ini.',
    ],
    'Beban Emosional': [
      'Ada rasa berat yang sedang kamu bawa di pikiranmu saat ini, dan mengakui perasaan tersebut sudah merupakan langkah yang baik.',
      'Kamu tidak perlu menyelesaikan semuanya sekaligus — cukup pegang satu langkah kecil yang paling mudah dikendalikan sekarang.',
    ],
    'Kondisi Seimbang': [
      'Kondisi pikiran dan energimu terasa cukup selaras untuk melangkah dengan ritme yang tenang namun terarah.',
      'Manfaatkan kejernihan ini untuk menyelesaikan satu prioritas bermakna sambil tetap menjaga jeda istirahat mata secara berkala.',
    ],
  };

  return {
    conditionCategory,
    energyScore: finalEnergy,
    moodScore: finalMood,
    empatheticFeedback: feedbackMap[conditionCategory],
    focusRecommendation: getFocusRecommendation(finalEnergy),
  };
}

export function splitTaskIntoMicroSteps(rawTaskTitle: string): MicroStepItem[] {
  const cleaned = rawTaskTitle.trim();
  const topic = cleaned.length > 0 ? cleaned : 'tugas utama hari ini';
  const lower = topic.toLowerCase();

  if (/(tulis|menulis|esai|makalah|laporan|bab|skripsi|artikel|jurnal)/.test(lower)) {
    return [
      { label: `Buat kerangka 3 poin utama untuk "${topic}"`, minutes: 5 },
      { label: `Tulis paragraf pembuka tanpa mengedit berlebih`, minutes: 7 },
      { label: `Lengkapi satu sub-bagian inti dengan 2 referensi`, minutes: 8 },
      { label: `Rapikan alur kalimat dan simpan progres`, minutes: 5 },
    ];
  }

  if (/(baca|pelajari|belajar|materi|ujian|kuliah|review|rangkum)/.test(lower)) {
    return [
      { label: `Pindai judul & ringkasan awal dari "${topic}"`, minutes: 5 },
      { label: `Baca aktif satu bagian inti sambil catat 3 kata kunci`, minutes: 8 },
      { label: `Tulis ulang pemahaman dengan bahasamu sendiri`, minutes: 7 },
    ];
  }

  if (/(kode|coding|program|fitur|bug|aplikasi|desain|ui|prototype)/.test(lower)) {
    return [
      { label: `Tentukan satu skenario kecil yang ingin diselesaikan di "${topic}"`, minutes: 5 },
      { label: `Susun struktur atau komponen paling dasar terlebih dahulu`, minutes: 8 },
      { label: `Uji satu alur kerja utama hingga berjalan mulus`, minutes: 7 },
    ];
  }

  if (/(presentasi|slide|ppt|pitch|deck|video)/.test(lower)) {
    return [
      { label: `Tentukan pesan kunci 1 kalimat untuk "${topic}"`, minutes: 5 },
      { label: `Susun urutan 3 slide pembuka dengan poin singkat`, minutes: 8 },
      { label: `Latih alur penyampaian lisan selama beberapa menit`, minutes: 5 },
    ];
  }

  return [
    { label: `Siapkan ruang kerja dan buka bahan utama "${topic}"`, minutes: 5 },
    { label: `Kerjakan bagian paling mudah selama beberapa menit pertama`, minutes: 7 },
    { label: `Selesaikan satu bagian inti hingga titik henti yang rapi`, minutes: 8 },
    { label: `Catat langkah berikutnya sebelum menutup sesi`, minutes: 5 },
  ];
}

export function analyzeImpulseBuckets(events: ImpulseEvent[]): {
  buckets: ImpulseBucketSummary[];
  peakBucket: ImpulseBucketSummary;
  recommendedSunset: string;
} {
  const buckets: ImpulseBucketSummary[] = [
    { id: 'pagi', label: 'Pagi', rangeLabel: '06–11', count: 0, focusCount: 0, sunsetCount: 0 },
    { id: 'siang', label: 'Siang', rangeLabel: '11–15', count: 0, focusCount: 0, sunsetCount: 0 },
    { id: 'sore', label: 'Sore', rangeLabel: '15–19', count: 0, focusCount: 0, sunsetCount: 0 },
    { id: 'malam', label: 'Malam', rangeLabel: '19–24', count: 0, focusCount: 0, sunsetCount: 0 },
  ];

  for (const evt of events) {
    const h = evt.hour;
    let target = buckets[3];
    if (h >= 6 && h < 11) target = buckets[0];
    else if (h >= 11 && h < 15) target = buckets[1];
    else if (h >= 15 && h < 19) target = buckets[2];
    else target = buckets[3];

    target.count += 1;
    if (evt.context === 'focus') target.focusCount += 1;
    else target.sunsetCount += 1;
  }

  const peakBucket = [...buckets].sort((a, b) => b.count - a.count)[0];
  const recommendedSunset =
    peakBucket.id === 'malam'
      ? '21:00'
      : peakBucket.id === 'sore'
        ? '21:15'
        : '21:30';

  return { buckets, peakBucket, recommendedSunset };
}

function parseTimeMinutes(timeStr?: string): number | null {
  if (!timeStr || !/^\d{2}:\d{2}$/.test(timeStr)) return null;
  const [hStr, mStr] = timeStr.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h < 6 ? (h + 24) * 60 + m : h * 60 + m;
}

export function computeScreenOffCorrelation(
  logs: LocalWellbeingLog[],
  events: ImpulseEvent[]
): CorrelationSummary {
  const earlyScores: number[] = [];
  const lateScores: number[] = [];

  for (let i = 0; i < logs.length; i += 1) {
    const log = logs[i];
    const mins = parseTimeMinutes(log.screenOffTime);
    const focusOutcome = log.morningFocusScore ?? log.energyScore;
    if (mins === null) continue;
    if (mins <= 21 * 60 + 45) {
      earlyScores.push(focusOutcome);
    } else {
      lateScores.push(focusOutcome);
    }
  }

  const avg = (arr: number[], fallback: number) =>
    arr.length > 0 ? Number((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)) : fallback;

  const avgFocusEarlyScreenOff = avg(earlyScores, 4.4);
  const avgFocusLateScreenOff = avg(lateScores, 2.7);
  const { peakBucket, recommendedSunset } = analyzeImpulseBuckets(events);

  return {
    avgFocusEarlyScreenOff,
    avgFocusLateScreenOff,
    recommendedSunsetTime: recommendedSunset,
    peakDistractionWindow: `${peakBucket.label} (${peakBucket.rangeLabel})`,
    insightText: `Lepas layar sebelum pukul ${recommendedSunset} menjaga fokus esok pagimu rata-rata di ${avgFocusEarlyScreenOff}/5 dibanding ${avgFocusLateScreenOff}/5 saat larut.`,
  };
}

export function formatLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getSeedWellbeingLogs(): LocalWellbeingLog[] {
  const base = new Date();
  const patterns: Array<{
    offset: number;
    category: string;
    screenOff: string;
    sunset: boolean;
    energy: number;
    mood: number;
    focus: number;
  }> = [
    { offset: -6, category: 'Kelelahan Fisik & Tidur', screenOff: '23:10', sunset: false, energy: 2, mood: 3, focus: 2 },
    { offset: -5, category: 'Kelelahan Kognitif', screenOff: '22:30', sunset: false, energy: 3, mood: 3, focus: 3 },
    { offset: -4, category: 'Beban Emosional', screenOff: '21:40', sunset: true, energy: 3, mood: 3, focus: 4 },
    { offset: -3, category: 'Kondisi Seimbang', screenOff: '21:15', sunset: true, energy: 4, mood: 4, focus: 4 },
    { offset: -2, category: 'Kelelahan Kognitif', screenOff: '22:10', sunset: false, energy: 3, mood: 3, focus: 3 },
    { offset: -1, category: 'Kondisi Seimbang', screenOff: '21:05', sunset: true, energy: 4, mood: 5, focus: 5 },
  ];

  return patterns.map((p) => {
    const dt = new Date(base);
    dt.setDate(base.getDate() + p.offset);
    return {
      logDate: formatLocalDateKey(dt),
      conditionCategory: p.category,
      screenOffTime: p.screenOff,
      sunsetCompleted: p.sunset,
      energyScore: p.energy,
      moodScore: p.mood,
      morningFocusScore: p.focus,
    };
  });
}

export function getSeedFocusSessions(): LocalFocusSession[] {
  const base = new Date();
  const yesterday = new Date(base);
  yesterday.setDate(base.getDate() - 1);
  return [
    {
      id: 'seed-focus-1',
      taskTitle: 'Merangkum bab metodologi penelitian',
      microSteps: [
        'Buat kerangka 3 poin utama',
        'Tulis paragraf pembuka',
        'Lengkapi satu sub-bagian inti',
      ],
      plannedMinutes: 15,
      actualMinutes: 15,
      tabSwitchCount: 1,
      energyBefore: 4,
      completed: true,
      sessionDate: formatLocalDateKey(yesterday),
    },
  ];
}

export function getSeedImpulseEvents(): ImpulseEvent[] {
  const base = new Date();
  const hours = [9, 13, 14, 16, 20, 21, 21, 22, 22];
  return hours.map((hour, idx) => {
    const dt = new Date(base);
    dt.setDate(base.getDate() - (idx % 4));
    dt.setHours(hour, 15, 0, 0);
    return {
      timestamp: dt.toISOString(),
      hour,
      context: hour >= 20 ? 'sunset' : 'focus',
    };
  });
}
