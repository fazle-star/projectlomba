import React, { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Play,
  Pause,
  RotateCcw,
  Scissors,
  Volume2,
  Check,
  ChevronRight,
  Waves,
} from 'lucide-react';
import type {
  FocusModeRecommendation,
  ImpulseEvent,
  LocalFocusSession,
  MicroStepItem,
} from '../types/wellbeing';
import { formatLocalDateKey, splitTaskIntoMicroSteps } from '../utils/wellbeingAnalyzer';
import type { AmbientSoundType } from '../hooks/useAmbientSynth';
import { useTabImpulse } from '../hooks/useTabImpulse';

interface MicroTaskSplitterProps {
  energyScore: number;
  recommendation: FocusModeRecommendation;
  ambientSound: AmbientSoundType;
  ambientVolume: number;
  onSelectAmbientSound: (type: AmbientSoundType) => void;
  onChangeAmbientVolume: (vol: number) => void;
  onRecordImpulse: (evt: ImpulseEvent) => void;
  onCompleteSession: (session: LocalFocusSession) => void;
  onTriggerBreathingStudio: () => void;
}

export const MicroTaskSplitter: React.FC<MicroTaskSplitterProps> = ({
  energyScore,
  recommendation,
  ambientSound,
  ambientVolume,
  onSelectAmbientSound,
  onChangeAmbientVolume,
  onRecordImpulse,
  onCompleteSession,
  onTriggerBreathingStudio,
}) => {
  const [taskTitle, setTaskTitle] = useState('Menulis ringkasan materi kuliah');
  const [microSteps, setMicroSteps] = useState<MicroStepItem[]>(() =>
    splitTaskIntoMicroSteps('Menulis ringkasan materi kuliah')
  );
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [customMinutes, setCustomMinutes] = useState<number>(recommendation.defaultMinutes);
  const [secondsLeft, setSecondsLeft] = useState<number>(recommendation.defaultMinutes * 60);
  const [isRunning, setIsRunning] = useState(false);

  const { switchCount, returnToastVisible, resetSessionCount, dismissToast } = useTabImpulse(
    isRunning,
    'focus',
    onRecordImpulse
  );

  useEffect(() => {
    if (!isRunning) {
      setCustomMinutes(recommendation.defaultMinutes);
      setSecondsLeft(recommendation.defaultMinutes * 60);
    }
  }, [recommendation.defaultMinutes, isRunning]);

  useEffect(() => {
    if (!isRunning) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          setIsRunning(false);
          onCompleteSession({
            id: `focus-${Date.now()}`,
            taskTitle: taskTitle.trim() || 'Sesi Fokus Selaras',
            microSteps: microSteps.map((s) => s.label),
            plannedMinutes: customMinutes,
            actualMinutes: customMinutes,
            tabSwitchCount: switchCount,
            energyBefore: energyScore,
            completed: true,
            sessionDate: formatLocalDateKey(),
          });
          onTriggerBreathingStudio();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [
    isRunning,
    customMinutes,
    taskTitle,
    microSteps,
    switchCount,
    energyScore,
    onCompleteSession,
    onTriggerBreathingStudio,
  ]);

  const handleSplitTask = () => {
    const generated = splitTaskIntoMicroSteps(taskTitle);
    setMicroSteps(generated);
    setActiveStepIndex(0);
  };

  const handleSelectDuration = (mins: number) => {
    setIsRunning(false);
    setCustomMinutes(mins);
    setSecondsLeft(mins * 60);
  };

  const handleToggleTimer = () => {
    if (!isRunning && secondsLeft === 0) {
      setSecondsLeft(customMinutes * 60);
    }
    setIsRunning((prev) => !prev);
  };

  const handleResetTimer = () => {
    setIsRunning(false);
    setSecondsLeft(customMinutes * 60);
    resetSessionCount();
  };

  const handleNextStep = () => {
    if (activeStepIndex < microSteps.length - 1) {
      setActiveStepIndex((prev) => prev + 1);
    }
  };

  const totalSeconds = Math.max(1, customMinutes * 60);
  const progressRatio = (totalSeconds - secondsLeft) / totalSeconds;
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progressRatio);

  const formattedClock = useMemo(() => {
    const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
    const ss = String(secondsLeft % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }, [secondsLeft]);

  const activeStep = microSteps[activeStepIndex] ?? microSteps[0];

  const durationOptions = useMemo(() => {
    if (energyScore <= 2) return [10, 15];
    if (energyScore === 3) return [15, 20];
    return [25, 35, 45];
  }, [energyScore]);

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="relative rounded-3xl bg-white dark:bg-[#211C18] border border-slate-900/8 dark:border-[#EAE0D5]/10 p-6 md:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-colors duration-700"
      aria-labelledby="focus-heading"
    >
      <AnimatePresence>
        {returnToastVisible && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            role="status"
            className="mb-4 rounded-2xl bg-[#F0F4F0] dark:bg-[#2B241F] border border-[#2D6A4F]/20 dark:border-[#D97706]/30 px-4 py-3 flex items-center justify-between gap-3"
          >
            <p className="text-xs md:text-sm text-[#1E293B] dark:text-[#EAE0D5]">
              Pikiran sempat teralihkan sejenak. Tidak apa-apa, mari lanjutkan perlahan.
            </p>
            <button
              type="button"
              onClick={dismissToast}
              className="text-xs font-medium text-[#2D6A4F] dark:text-[#D97706] whitespace-nowrap shrink-0 cursor-pointer"
            >
              Tutup
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-start justify-between gap-3 mb-5">
        <div>
          <p className="text-xs font-medium text-[#2D6A4F] dark:text-[#D97706]">
            Fokus Adaptif · {recommendation.modeName}
          </p>
          <h2
            id="focus-heading"
            className="text-xl font-semibold text-[#1E293B] dark:text-[#EAE0D5] mt-0.5"
          >
            {isRunning ? 'Sesi Fokus Berjalan' : 'Ritme Fokus & Pemecah Tugas'}
          </h2>
          <p className="text-xs text-slate-500 dark:text-[#B8ABA0] mt-1">
            {recommendation.description}
          </p>
        </div>

        <div className="flex items-center gap-1.5" role="group" aria-label="Durasi sesi fokus">
          {durationOptions.map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => handleSelectDuration(mins)}
              className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-mono-num font-medium whitespace-nowrap transition-colors cursor-pointer ${
                customMinutes === mins
                  ? 'bg-[#2D6A4F] text-white dark:bg-[#D97706] dark:text-[#161311]'
                  : 'bg-[#F0F4F0] text-slate-700 hover:bg-[#E2EBE2] dark:bg-[#2B241F] dark:text-[#EAE0D5]'
              }`}
            >
              {mins} mnt
            </button>
          ))}
        </div>
      </div>

      {/* Task Input + Micro-Task Splitter */}
      <div className="flex flex-col sm:flex-row gap-2.5 mb-6">
        <div className="flex-1">
          <label htmlFor="focus-task-input" className="sr-only">
            Judul tugas yang ingin dikerjakan
          </label>
          <input
            id="focus-task-input"
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Tulis tugas besarmu di sini..."
            className="w-full min-h-[44px] rounded-xl bg-[#F7F9F7] dark:bg-[#161311] border border-slate-900/10 dark:border-[#EAE0D5]/12 px-4 py-2.5 text-sm text-[#1E293B] dark:text-[#EAE0D5] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#D97706]"
          />
        </div>
        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSplitTask}
          className="min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#F0F4F0] hover:bg-[#E1EAE2] dark:bg-[#2B241F] dark:hover:bg-[#382F29] text-[#1E293B] dark:text-[#EAE0D5] text-sm font-medium whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Scissors className="w-4 h-4 text-[#2D6A4F] dark:text-[#D97706]" />
          Pecah Jadi Langkah Kecil
        </motion.button>
      </div>

      {/* Active Timer Ring + Single Active Micro-Step */}
      <div className="rounded-2xl bg-[#F7F9F7] dark:bg-[#161311]/75 border border-slate-900/6 dark:border-[#EAE0D5]/8 p-5 flex flex-col sm:flex-row items-center gap-6">
        <div className="relative w-32 h-32 shrink-0 flex items-center justify-center">
          <svg className="w-32 h-32 -rotate-90" viewBox="0 0 132 132" aria-hidden="true">
            <circle
              cx="66"
              cy="66"
              r={radius}
              fill="none"
              strokeWidth="8"
              className="stroke-slate-200 dark:stroke-[#2B241F]"
            />
            <circle
              cx="66"
              cy="66"
              r={radius}
              fill="none"
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="stroke-[#2D6A4F] dark:stroke-[#D97706] transition-[stroke-dashoffset] duration-700"
            />
          </svg>
          <span
            data-testid="focus-timer-clock"
            className="absolute text-2xl font-bold font-mono-num text-[#1E293B] dark:text-[#EAE0D5]"
          >
            {formattedClock}
          </span>
        </div>

        <div className="flex-1 w-full text-center sm:text-left">
          <p className="text-xs font-medium text-slate-500 dark:text-[#B8ABA0]">
            Langkah {activeStepIndex + 1} dari {microSteps.length} · Estimasi {activeStep?.minutes ?? 5} menit
          </p>
          <p className="text-base md:text-lg font-semibold text-[#1E293B] dark:text-[#EAE0D5] mt-1">
            {activeStep?.label}
          </p>

          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2.5 mt-4">
            <motion.button
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleToggleTimer}
              className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#2D6A4F] hover:bg-[#23543E] dark:bg-[#D97706] dark:hover:bg-[#B45309] text-white dark:text-[#161311] text-sm font-semibold whitespace-nowrap cursor-pointer"
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isRunning ? 'Jeda Sesi' : 'Mulai Fokus'}
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleNextStep}
              disabled={activeStepIndex >= microSteps.length - 1}
              className="min-h-[44px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white dark:bg-[#211C18] border border-slate-900/10 dark:border-[#EAE0D5]/12 text-xs font-medium text-[#1E293B] dark:text-[#EAE0D5] disabled:opacity-45 whitespace-nowrap cursor-pointer"
            >
              {activeStepIndex >= microSteps.length - 1 ? (
                <>
                  <Check className="w-4 h-4 text-[#2D6A4F] dark:text-[#D97706]" />
                  Langkah Terakhir
                </>
              ) : (
                <>
                  Langkah Berikutnya
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </motion.button>

            <button
              type="button"
              onClick={handleResetTimer}
              aria-label="Atur ulang timer fokus"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl bg-white dark:bg-[#211C18] border border-slate-900/10 dark:border-[#EAE0D5]/12 text-slate-600 dark:text-[#B8ABA0] hover:text-[#1E293B] dark:hover:text-[#EAE0D5] cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {switchCount > 0 && (
            <p className="text-xs text-slate-500 dark:text-[#B8ABA0] mt-2.5 font-mono-num">
              Pindah tab terdeteksi sesi ini: {switchCount}x
            </p>
          )}
        </div>
      </div>

      {/* Web Audio Ambient Synthesizer */}
      <div className="mt-5 pt-5 border-t border-slate-900/8 dark:border-[#EAE0D5]/10">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div>
            <h3 className="text-sm font-semibold text-[#1E293B] dark:text-[#EAE0D5]">
              Peredam Bising & Suara Latar
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#B8ABA0]">
              Web Audio Ambient Synthesizer · tanpa unduhan audio eksternal
            </p>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-44">
            <Volume2 className="w-4 h-4 text-slate-500 dark:text-[#B8ABA0] shrink-0" />
            <label htmlFor="ambient-volume" className="sr-only">
              Volume suara latar
            </label>
            <input
              id="ambient-volume"
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={ambientVolume}
              onChange={(e) => onChangeAmbientVolume(Number(e.target.value))}
              className="w-full selaras-slider"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {(
            [
              { id: 'rain', label: 'Rintik Hujan Lembut' },
              { id: 'brown', label: 'Brown Noise' },
              { id: 'drone', label: 'Warm Drone' },
            ] as const
          ).map((sound) => {
            const active = ambientSound === sound.id;
            return (
              <motion.button
                key={sound.id}
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onSelectAmbientSound(sound.id)}
                aria-pressed={active}
                className={`min-h-[40px] inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#2D6A4F] text-white dark:bg-[#D97706] dark:text-[#161311]'
                    : 'bg-[#F0F4F0] text-[#1E293B] hover:bg-[#E2EBE2] dark:bg-[#2B241F] dark:text-[#EAE0D5]'
                }`}
              >
                <Waves className="w-3.5 h-3.5" />
                {sound.label}
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.section>
  );
};
