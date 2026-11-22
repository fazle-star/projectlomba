import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type {
  ImpulseEvent,
  LocalFocusSession,
  LocalWellbeingLog,
  OptionalUserProfile,
  RhythmSettings,
} from '../types/wellbeing';
import {
  getSeedFocusSessions,
  getSeedImpulseEvents,
  getSeedWellbeingLogs,
} from '../utils/wellbeingAnalyzer';

const STORAGE_KEYS = {
  logs: 'selaras_wellbeing_logs_v1',
  sessions: 'selaras_focus_sessions_v1',
  impulses: 'selaras_impulse_events_v1',
  settings: 'selaras_rhythm_settings_v1',
  profile: 'selaras_optional_profile_v1',
};

const DEFAULT_SETTINGS: RhythmSettings = {
  sunsetHour: 21,
  sunsetMinute: 0,
  sleepHour: 22,
  sleepMinute: 0,
};

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

let cachedSupabase: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (!cachedSupabase && supabaseUrl && supabaseAnonKey) {
    cachedSupabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return cachedSupabase;
}

function safeParseJson<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadWellbeingLogs(): LocalWellbeingLog[] {
  const existing = safeParseJson<LocalWellbeingLog[] | null>(
    localStorage.getItem(STORAGE_KEYS.logs),
    null
  );
  if (existing && Array.isArray(existing) && existing.length > 0) {
    return existing;
  }
  const seeded = getSeedWellbeingLogs();
  localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(seeded));
  return seeded;
}

export function saveWellbeingLogs(logs: LocalWellbeingLog[]): void {
  localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logs));
}

export function loadFocusSessions(): LocalFocusSession[] {
  const existing = safeParseJson<LocalFocusSession[] | null>(
    localStorage.getItem(STORAGE_KEYS.sessions),
    null
  );
  if (existing && Array.isArray(existing) && existing.length > 0) {
    return existing;
  }
  const seeded = getSeedFocusSessions();
  localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(seeded));
  return seeded;
}

export function saveFocusSessions(sessions: LocalFocusSession[]): void {
  localStorage.setItem(STORAGE_KEYS.sessions, JSON.stringify(sessions));
}

export function loadImpulseEvents(): ImpulseEvent[] {
  const existing = safeParseJson<ImpulseEvent[] | null>(
    localStorage.getItem(STORAGE_KEYS.impulses),
    null
  );
  if (existing && Array.isArray(existing) && existing.length > 0) {
    return existing;
  }
  const seeded = getSeedImpulseEvents();
  localStorage.setItem(STORAGE_KEYS.impulses, JSON.stringify(seeded));
  return seeded;
}

export function saveImpulseEvents(events: ImpulseEvent[]): void {
  localStorage.setItem(STORAGE_KEYS.impulses, JSON.stringify(events));
}

export function loadRhythmSettings(): RhythmSettings {
  const existing = safeParseJson<RhythmSettings | null>(
    localStorage.getItem(STORAGE_KEYS.settings),
    null
  );
  if (existing && typeof existing.sunsetHour === 'number') {
    return existing;
  }
  return DEFAULT_SETTINGS;
}

export function saveRhythmSettings(settings: RhythmSettings): void {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

export function loadOptionalProfile(): OptionalUserProfile | null {
  return safeParseJson<OptionalUserProfile | null>(
    localStorage.getItem(STORAGE_KEYS.profile),
    null
  );
}

export function saveOptionalProfile(profile: OptionalUserProfile | null): void {
  if (!profile) {
    localStorage.removeItem(STORAGE_KEYS.profile);
  } else {
    localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
  }
}

export function clearEncryptedJournalsFromLogs(): LocalWellbeingLog[] {
  const logs = loadWellbeingLogs().map((item) => ({
    ...item,
    encryptedJournal: undefined,
    journalSalt: undefined,
    journalIv: undefined,
  }));
  saveWellbeingLogs(logs);
  return logs;
}

export async function signInOptionalAccount(
  email: string,
  password: string
): Promise<{ profile: OptionalUserProfile; note: string }> {
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) {
      throw new Error(error.message);
    }
    const nickname =
      (data.user?.user_metadata?.nickname as string | undefined) || 'Penjelajah Tenang';
    const profile: OptionalUserProfile = {
      id: data.user?.id || 'supabase-user',
      email: data.user?.email || email,
      nickname,
      mode: 'supabase',
    };
    saveOptionalProfile(profile);
    return {
      profile,
      note: 'Tersinkron ke Supabase Auth. Catatan jurnal tetap terenkripsi AES-GCM di perangkatmu.',
    };
  }

  // Local-first fallback when Supabase env vars are not configured
  const profile: OptionalUserProfile = {
    id: `local-${btoa(email).slice(0, 8)}`,
    email,
    nickname: 'Penjelajah Tenang',
    mode: 'local-account',
  };
  saveOptionalProfile(profile);
  return {
    profile,
    note: 'Mode profil lokal aktif (konfigurasi VITE_SUPABASE_URL untuk sinkronisasi lintas perangkat).',
  };
}

export async function signUpOptionalAccount(
  nickname: string,
  email: string,
  password: string
): Promise<{ profile: OptionalUserProfile; note: string }> {
  const finalNickname = nickname.trim() || 'Penjelajah Tenang';
  const client = getSupabaseClient();
  if (client) {
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { data: { nickname: finalNickname } },
    });
    if (error) {
      throw new Error(error.message);
    }
    const profile: OptionalUserProfile = {
      id: data.user?.id || 'supabase-user',
      email: data.user?.email || email,
      nickname: finalNickname,
      mode: 'supabase',
    };
    saveOptionalProfile(profile);
    return {
      profile,
      note: 'Akun terdaftar di Supabase Auth. Jurnal terenkripsi AES-GCM sebelum diunggah.',
    };
  }

  const profile: OptionalUserProfile = {
    id: `local-${Date.now()}`,
    email,
    nickname: finalNickname,
    mode: 'local-account',
  };
  saveOptionalProfile(profile);
  return {
    profile,
    note: 'Profil lokal tersimpan aman di perangkat ini.',
  };
}

export async function signOutOptionalAccount(): Promise<void> {
  const client = getSupabaseClient();
  if (client) {
    await client.auth.signOut().catch(() => undefined);
  }
  saveOptionalProfile(null);
}

export async function syncWellbeingSnapshot(
  logs: LocalWellbeingLog[],
  sessions: LocalFocusSession[],
  profile: OptionalUserProfile | null
): Promise<{ syncedToCloud: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client || !profile || profile.mode !== 'supabase') {
    return {
      syncedToCloud: false,
      message: 'Progres tersimpan lokal dengan aman di perangkat ini.',
    };
  }

  const latestLog = logs[logs.length - 1];
  if (latestLog) {
    const { error } = await client.from('wellbeing_logs').upsert(
      {
        user_id: profile.id,
        log_date: latestLog.logDate,
        condition_category: latestLog.conditionCategory,
        screen_off_time: latestLog.screenOffTime ?? null,
        sunset_completed: latestLog.sunsetCompleted,
        reframing_category: latestLog.reframingCategory ?? null,
        encrypted_journal: latestLog.encryptedJournal ?? null,
        journal_salt: latestLog.journalSalt ?? null,
        journal_iv: latestLog.journalIv ?? null,
        energy_score: latestLog.energyScore,
        mood_score: latestLog.moodScore,
        morning_focus_score: latestLog.morningFocusScore ?? null,
      },
      { onConflict: 'user_id,log_date' }
    );
    if (error) {
      return {
        syncedToCloud: false,
        message: 'Data tersimpan lokal; sinkronisasi cloud akan dicoba ulang saat daring.',
      };
    }
  }

  const latestSession = sessions[sessions.length - 1];
  if (latestSession) {
    await client.from('focus_sessions').upsert({
      id: latestSession.id,
      user_id: profile.id,
      task_title: latestSession.taskTitle,
      micro_steps: latestSession.microSteps,
      planned_minutes: latestSession.plannedMinutes,
      actual_minutes: latestSession.actualMinutes,
      tab_switch_count: latestSession.tabSwitchCount,
      energy_before: latestSession.energyBefore,
      completed: latestSession.completed,
      session_date: latestSession.sessionDate,
    });
  }

  return {
    syncedToCloud: true,
    message: 'Ringkasan dan ciphertext jurnal terenkripsi tersinkron ke cloud.',
  };
}
