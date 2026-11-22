export interface ImpulseEvent {
  timestamp: string;
  hour: number;
  context: 'focus' | 'sunset';
}

export interface LocalFocusSession {
  id: string;
  taskTitle: string;
  microSteps: string[];
  plannedMinutes: number;
  actualMinutes: number;
  tabSwitchCount: number;
  energyBefore: number;
  completed: boolean;
  sessionDate: string;
}

export interface LocalWellbeingLog {
  logDate: string;
  conditionCategory: string;
  screenOffTime?: string;
  sunsetCompleted: boolean;
  reframingCategory?: 'kendali_diri' | 'lepas_beban' | 'apresiasi';
  encryptedJournal?: string;
  journalSalt?: string;
  journalIv?: string;
  energyScore: number;
  moodScore: number;
  morningFocusScore?: number;
}

export type CircadianOverride = 'auto' | 'day' | 'night';

export type ActiveTab = 'today' | 'reflection' | 'settings';

export type ConditionCategory =
  | 'Kelelahan Kognitif'
  | 'Kelelahan Fisik & Tidur'
  | 'Beban Emosional'
  | 'Kondisi Seimbang';

export type CheckInChipId =
  | 'kurang_tidur'
  | 'tugas_menumpuk'
  | 'overthinking'
  | 'lelah_layar'
  | 'fisik_capek'
  | 'pikiran_tenang';

export interface WellbeingAnalysisResult {
  conditionCategory: ConditionCategory;
  energyScore: number;
  moodScore: number;
  empatheticFeedback: [string, string];
  focusRecommendation: FocusModeRecommendation;
}

export interface FocusModeRecommendation {
  modeName: 'Gentle Focus' | 'Steady Focus' | 'Deep Flow';
  defaultMinutes: number;
  minMinutes: number;
  maxMinutes: number;
  description: string;
}

export interface MicroStepItem {
  label: string;
  minutes: number;
}

export interface ImpulseBucketSummary {
  id: 'pagi' | 'siang' | 'sore' | 'malam';
  label: string;
  rangeLabel: string;
  count: number;
  focusCount: number;
  sunsetCount: number;
}

export interface CorrelationSummary {
  avgFocusEarlyScreenOff: number;
  avgFocusLateScreenOff: number;
  recommendedSunsetTime: string;
  insightText: string;
  peakDistractionWindow: string;
}

export interface RhythmSettings {
  sunsetHour: number;
  sunsetMinute: number;
  sleepHour: number;
  sleepMinute: number;
}

export interface OptionalUserProfile {
  id: string;
  email: string;
  nickname: string;
  mode: 'guest' | 'supabase' | 'local-account';
}
