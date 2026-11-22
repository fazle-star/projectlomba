import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'framer-motion';
import { Eye, Moon, Sun, Clock, UserCheck, Wind } from 'lucide-react';
import type {
  ActiveTab,
  CircadianOverride,
  ImpulseEvent,
  LocalFocusSession,
  LocalWellbeingLog,
  OptionalUserProfile,
  RhythmSettings,
  WellbeingAnalysisResult,
} from './types/wellbeing';
import { analyzeWellbeingCheckIn, formatLocalDateKey } from './utils/wellbeingAnalyzer';
import {
  clearEncryptedJournalsFromLogs,
  loadFocusSessions,
  loadImpulseEvents,
  loadOptionalProfile,
  loadRhythmSettings,
  loadWellbeingLogs,
  saveFocusSessions,
  saveImpulseEvents,
  saveRhythmSettings,
  saveWellbeingLogs,
  signOutOptionalAccount,
  syncWellbeingSnapshot,
} from './utils/wellbeingSync';
import { useCircadianMode } from './hooks/useCircadianMode';
import { useAmbientSynth } from './hooks/useAmbientSynth';
import { useOnlineStatus } from './hooks/usePWAInstall';
import { CalmHorizonIllustration, SelarasLogo } from './components/SelarasLogo';
import { SmartCheckInCard } from './components/SmartCheckInCard';
import { MicroTaskSplitter } from './components/MicroTaskSplitter';
import { EyeBreathingModal } from './components/EyeBreathingModal';
import { PassphraseJournal } from './components/PassphraseJournal';
import { QuietPresenceBar } from './components/QuietPresenceBar';
import { ReflectionPage } from './components/ReflectionPage';
import { SettingsPage } from './components/SettingsPage';
import { AuthModal } from './components/AuthModal';

const TABS: Array<{ id: ActiveTab; label: string }> = [
  { id: 'today', label: 'Ruang Hari Ini' },
  { id: 'reflection', label: 'Refleksi & Grafik' },
  { id: 'settings', label: 'Pengaturan Ritme' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('today');
  const [logs, setLogs] = useState<LocalWellbeingLog[]>(() => loadWellbeingLogs());
  const [sessions, setSessions] = useState<LocalFocusSession[]>(() => loadFocusSessions());
  const [impulseEvents, setImpulseEvents] = useState<ImpulseEvent[]>(() => loadImpulseEvents());
  const [settings, setSettings] = useState<RhythmSettings>(() => loadRhythmSettings());
  const [userProfile, setUserProfile] = useState<OptionalUserProfile | null>(() =>
    loadOptionalProfile()
  );

  const [isBreathingOpen, setIsBreathingOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { override, setOverride, isNightMode, greeting } = useCircadianMode(settings);
  const { activeSound, volume, setVolume, startSound, playBreathChime } = useAmbientSynth();
  const isOnline = useOnlineStatus();

  const todayKey = useMemo(() => formatLocalDateKey(), []);
  const todayLog = useMemo(
    () => logs.find((item) => item.logDate === todayKey),
    [logs, todayKey]
  );

  const [latestAnalysis, setLatestAnalysis] = useState<WellbeingAnalysisResult>(() =>
    analyzeWellbeingCheckIn(
      [],
      '',
      todayLog?.energyScore ?? 3,
      todayLog?.moodScore ?? 3
    )
  );

  useEffect(() => {
    if (!toastMessage) return;
    const t = window.setTimeout(() => setToastMessage(null), 4000);
    return () => window.clearTimeout(t);
  }, [toastMessage]);

  const upsertTodayLog = useCallback(
    (updater: (current: LocalWellbeingLog) => LocalWellbeingLog) => {
      setLogs((prev) => {
        const idx = prev.findIndex((item) => item.logDate === todayKey);
        const base: LocalWellbeingLog =
          idx >= 0
            ? prev[idx]
            : {
                logDate: todayKey,
                conditionCategory: latestAnalysis.conditionCategory,
                sunsetCompleted: false,
                energyScore: latestAnalysis.energyScore,
                moodScore: latestAnalysis.moodScore,
              };
        const updated = updater(base);
        const next =
          idx >= 0 ? prev.map((item, i) => (i === idx ? updated : item)) : [...prev, updated];
        saveWellbeingLogs(next);
        void syncWellbeingSnapshot(next, sessions, userProfile);
        return next;
      });
    },
    [todayKey, latestAnalysis, sessions, userProfile]
  );

  const handleSaveCheckIn = useCallback(
    (result: WellbeingAnalysisResult) => {
      setLatestAnalysis(result);
      upsertTodayLog((cur) => ({
        ...cur,
        conditionCategory: result.conditionCategory,
        energyScore: result.energyScore,
        moodScore: result.moodScore,
      }));
    },
    [upsertTodayLog]
  );

  const handleRecordImpulse = useCallback((evt: ImpulseEvent) => {
    setImpulseEvents((prev) => {
      const next = [...prev, evt];
      saveImpulseEvents(next);
      return next;
    });
  }, []);

  const handleCompleteSession = useCallback(
    (session: LocalFocusSession) => {
      setSessions((prev) => {
        const next = [...prev, session];
        saveFocusSessions(next);
        void syncWellbeingSnapshot(logs, next, userProfile);
        return next;
      });
    },
    [logs, userProfile]
  );

  const handleSaveEncryptedJournal = useCallback(
    (payload: {
      reframingCategory: 'kendali_diri' | 'lepas_beban' | 'apresiasi';
      encryptedJournal: string;
      journalSalt: string;
      journalIv: string;
    }) => {
      upsertTodayLog((cur) => ({
        ...cur,
        reframingCategory: payload.reframingCategory,
        encryptedJournal: payload.encryptedJournal,
        journalSalt: payload.journalSalt,
        journalIv: payload.journalIv,
      }));
    },
    [upsertTodayLog]
  );

  const handleCompleteSunset = useCallback(
    (screenOffTime: string) => {
      upsertTodayLog((cur) => ({
        ...cur,
        screenOffTime,
        sunsetCompleted: true,
      }));
    },
    [upsertTodayLog]
  );

  const handleSaveMorningFocus = useCallback(
    (score: number) => {
      upsertTodayLog((cur) => ({
        ...cur,
        morningFocusScore: score,
      }));
    },
    [upsertTodayLog]
  );

  const handleUpdateSettings = useCallback((next: RhythmSettings) => {
    setSettings(next);
    saveRhythmSettings(next);
  }, []);

  const handleResetEncryptedJournals = useCallback(() => {
    const cleaned = clearEncryptedJournalsFromLogs();
    setLogs(cleaned);
  }, []);

  const handleAuthenticated = useCallback((profile: OptionalUserProfile, note: string) => {
    setUserProfile(profile);
    setToastMessage(note);
  }, []);

  const handleSignOut = useCallback(async () => {
    await signOutOptionalAccount();
    setUserProfile(null);
    setToastMessage('Kembali ke Mode Tamu Lokal.');
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen flex flex-col bg-[#F7F9F7] dark:bg-[#161311] text-[#1E293B] dark:text-[#EAE0D5] transition-colors duration-700">
        {/* Top Bar Contract: Brand | 3 Navigation Tabs | Guest/Auth Action */}
        <header className="sticky top-0 z-30 backdrop-blur-md bg-[#F7F9F7]/90 dark:bg-[#161311]/90 border-b border-slate-900/8 dark:border-[#EAE0D5]/10 transition-colors duration-700">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
            {/* Zone 1: Brand */}
            <div className="flex items-center gap-2.5 shrink-0">
              <SelarasLogo className="w-8 h-8" />
              <span className="font-display text-lg font-bold tracking-tight whitespace-nowrap text-[#1E293B] dark:text-[#EAE0D5]">
                Selaras
              </span>
            </div>

            {/* Zone 2: Desktop Shared Layout Pill Nav */}
            <nav
              aria-label="Navigasi utama Selaras"
              className="hidden md:flex items-center gap-1 p-1 rounded-2xl bg-[#EEF2EE] dark:bg-[#211C18] border border-slate-900/6 dark:border-[#EAE0D5]/8"
            >
              {TABS.map((tab) => {
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`relative min-h-[38px] px-4 py-1.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      isActive
                        ? 'text-[#1E293B] dark:text-[#EAE0D5]'
                        : 'text-slate-600 hover:text-[#1E293B] dark:text-[#B8ABA0] dark:hover:text-[#EAE0D5]'
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="activeTabPill"
                        transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        className="absolute inset-0 rounded-xl bg-white dark:bg-[#2B241F] shadow-sm"
                      />
                    )}
                    <span className="relative z-10">{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Zone 3: Guest-First Account Action */}
            <div className="flex items-center gap-2 shrink-0">
              <motion.button
                type="button"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setIsAuthOpen(true)}
                className="min-h-[40px] inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white dark:bg-[#211C18] border border-slate-900/10 dark:border-[#EAE0D5]/12 text-xs font-semibold text-[#1E293B] dark:text-[#EAE0D5] whitespace-nowrap cursor-pointer"
              >
                <UserCheck className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#D97706]" />
                <span>{userProfile ? userProfile.nickname : 'Mode Tamu • Masuk'}</span>
              </motion.button>
            </div>
          </div>

          {/* Mobile Tab Strip */}
          <nav
            aria-label="Navigasi seluler Selaras"
            className="flex md:hidden items-center justify-around gap-1 px-3 pb-2.5"
          >
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 min-h-[38px] px-2 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-white dark:bg-[#2B241F] text-[#1E293B] dark:text-[#EAE0D5] shadow-sm'
                      : 'text-slate-600 dark:text-[#B8ABA0]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </header>

        {/* Main Workspace Container */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 pt-6 pb-10">
          {/* Contextual Greeting + Circadian Simulator Toggle */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-[#B8ABA0] mb-1">
                <span>{isNightMode ? 'Digital Sunset Aktif' : 'Ritme Siang Adaptif'}</span>
                <span aria-hidden="true">·</span>
                <span>{isOnline ? 'Daring (PWA Siap Offline)' : 'Mode Offline Siap'}</span>
              </div>
              <h1 className="font-display text-2xl md:text-3xl font-bold text-[#1E293B] dark:text-[#EAE0D5]">
                {greeting.title}
              </h1>
              <p className="text-sm text-slate-600 dark:text-[#B8ABA0] mt-1 max-w-2xl">
                {greeting.subtitle}
              </p>
            </div>

            {/* Circadian Mode Switcher: Otomatis | Mode Siang | Mode Malam */}
            <div
              role="group"
              aria-label="Simulasi waktu sirkadian"
              className="inline-flex items-center gap-1 p-1 rounded-2xl bg-[#EEF2EE] dark:bg-[#211C18] border border-slate-900/8 dark:border-[#EAE0D5]/10 self-start md:self-center shrink-0"
            >
              {(
                [
                  { id: 'auto', label: 'Otomatis', icon: Clock },
                  { id: 'day', label: 'Mode Siang', icon: Sun },
                  { id: 'night', label: 'Mode Malam', icon: Moon },
                ] as Array<{ id: CircadianOverride; label: string; icon: typeof Sun }>
              ).map((item) => {
                const Icon = item.icon;
                const active = override === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setOverride(item.id)}
                    aria-pressed={active}
                    className={`min-h-[38px] inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                      active
                        ? 'bg-white dark:bg-[#2B241F] text-[#2D6A4F] dark:text-[#D97706] shadow-sm'
                        : 'text-slate-600 dark:text-[#B8ABA0] hover:text-[#1E293B] dark:hover:text-[#EAE0D5]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback Toast */}
          <AnimatePresence>
            {toastMessage && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                role="status"
                className="mb-5 rounded-2xl bg-white dark:bg-[#211C18] border border-[#2D6A4F]/25 dark:border-[#D97706]/35 px-4 py-3 text-xs md:text-sm text-[#1E293B] dark:text-[#EAE0D5] shadow-sm"
              >
                {toastMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Animated Tab Content */}
          <AnimatePresence mode="wait">
            {activeTab === 'today' && (
              <motion.div
                key={`today-${isNightMode ? 'night' : 'day'}`}
                initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="space-y-6"
              >
                {/* Always-Visible 1-Click 20-20-20 Eye & Breathing Studio Trigger */}
                <motion.div
                  whileHover={{ y: -2 }}
                  className="rounded-3xl bg-white dark:bg-[#211C18] border border-[#2D6A4F]/20 dark:border-[#D97706]/25 p-5 md:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-colors duration-700"
                >
                  <div className="flex items-start gap-3.5">
                    <div className="w-11 h-11 rounded-2xl bg-[#EEF2EE] dark:bg-[#2B241F] flex items-center justify-center shrink-0">
                      <Eye className="w-5 h-5 text-[#2D6A4F] dark:text-[#D97706]" />
                    </div>
                    <div>
                      <h2 className="text-base md:text-lg font-semibold text-[#1E293B] dark:text-[#EAE0D5]">
                        Latihan Napas & Relaksasi Mata 20-20-20
                      </h2>
                      <p className="text-xs md:text-sm text-slate-600 dark:text-[#B8ABA0] mt-0.5">
                        Redakan ketegangan mata dan atur ulang ritme napas 4-4-6 dalam 20 detik hingga 2 menit.
                      </p>
                    </div>
                  </div>

                  <motion.button
                    type="button"
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setIsBreathingOpen(true)}
                    className="min-h-[44px] inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#23543E] dark:bg-[#D97706] dark:hover:bg-[#B45309] text-white dark:text-[#161311] text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Wind className="w-4 h-4" />
                    Buka Studio Napas & Mata
                  </motion.button>
                </motion.div>

                {isNightMode ? (
                  <>
                    <PassphraseJournal
                      todayLog={todayLog}
                      onSaveEncryptedJournal={handleSaveEncryptedJournal}
                      onCompleteSunset={handleCompleteSunset}
                      onRecordImpulse={handleRecordImpulse}
                    />
                    <SmartCheckInCard
                      latestAnalysis={latestAnalysis}
                      onSaveCheckIn={handleSaveCheckIn}
                    />
                  </>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    <div className="lg:col-span-5">
                      <SmartCheckInCard
                        latestAnalysis={latestAnalysis}
                        onSaveCheckIn={handleSaveCheckIn}
                      />
                    </div>
                    <div className="lg:col-span-7">
                      <MicroTaskSplitter
                        energyScore={latestAnalysis.energyScore}
                        recommendation={latestAnalysis.focusRecommendation}
                        ambientSound={activeSound}
                        ambientVolume={volume}
                        onSelectAmbientSound={startSound}
                        onChangeAmbientVolume={setVolume}
                        onRecordImpulse={handleRecordImpulse}
                        onCompleteSession={handleCompleteSession}
                        onTriggerBreathingStudio={() => setIsBreathingOpen(true)}
                      />
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'reflection' && (
              <motion.div
                key="reflection"
                initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <ReflectionPage
                  logs={logs}
                  sessions={sessions}
                  impulseEvents={impulseEvents}
                  isNightMode={isNightMode}
                  onSaveMorningFocus={handleSaveMorningFocus}
                />
              </motion.div>
            )}

            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 14, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                <SettingsPage
                  settings={settings}
                  onUpdateSettings={handleUpdateSettings}
                  onResetEncryptedJournals={handleResetEncryptedJournals}
                  userProfile={userProfile}
                  onOpenAuthModal={() => setIsAuthOpen(true)}
                  onSignOut={() => void handleSignOut()}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <QuietPresenceBar isNightMode={isNightMode} />
        </main>

        <CalmHorizonIllustration isNightMode={isNightMode} />

        {/* Interactive Modals */}
        <EyeBreathingModal
          isOpen={isBreathingOpen}
          onClose={() => setIsBreathingOpen(false)}
          onPlayChime={playBreathChime}
        />

        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          onAuthenticated={handleAuthenticated}
        />
      </div>
    </MotionConfig>
  );
}
