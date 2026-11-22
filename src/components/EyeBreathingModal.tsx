import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Eye, Volume2, VolumeX, Wind, X } from 'lucide-react';

interface EyeBreathingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayChime: (phase: 'inhale' | 'hold' | 'exhale' | 'rest') => void;
}

type StudioMode = 'breath-1' | 'breath-2' | 'eye-20';
type BreathPhase = 'inhale' | 'hold' | 'exhale';

const PHASE_SEQUENCE: Array<{ phase: BreathPhase; label: string; seconds: number }> = [
  { phase: 'inhale', label: 'Tarik Napas', seconds: 4 },
  { phase: 'hold', label: 'Tahan Lembut', seconds: 4 },
  { phase: 'exhale', label: 'Embuskan Perlahan', seconds: 6 },
];

export const EyeBreathingModal: React.FC<EyeBreathingModalProps> = ({
  isOpen,
  onClose,
  onPlayChime,
}) => {
  const [studioMode, setStudioMode] = useState<StudioMode>('breath-1');
  const [chimeEnabled, setChimeEnabled] = useState(true);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(PHASE_SEQUENCE[0].seconds);
  const [totalRemaining, setTotalRemaining] = useState(60);
  const [completed, setCompleted] = useState(false);

  const resetStudio = (mode: StudioMode) => {
    setStudioMode(mode);
    setCompleted(false);
    setPhaseIdx(0);
    setPhaseSecondsLeft(PHASE_SEQUENCE[0].seconds);
    setTotalRemaining(mode === 'eye-20' ? 20 : mode === 'breath-2' ? 120 : 60);
  };

  useEffect(() => {
    if (!isOpen) return;
    resetStudio('breath-1');
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || completed) return;
    if (chimeEnabled) {
      onPlayChime(studioMode === 'eye-20' ? 'rest' : PHASE_SEQUENCE[phaseIdx].phase);
    }
  }, [isOpen, phaseIdx, studioMode, chimeEnabled, completed, onPlayChime]);

  useEffect(() => {
    if (!isOpen || completed) return;

    const interval = window.setInterval(() => {
      setTotalRemaining((prevTotal) => {
        if (prevTotal <= 1) {
          setCompleted(true);
          return 0;
        }
        return prevTotal - 1;
      });

      if (studioMode !== 'eye-20') {
        setPhaseSecondsLeft((prevSec) => {
          if (prevSec <= 1) {
            const nextIdx = (phaseIdx + 1) % PHASE_SEQUENCE.length;
            setPhaseIdx(nextIdx);
            return PHASE_SEQUENCE[nextIdx].seconds;
          }
          return prevSec - 1;
        });
      }
    }, 1000);

    return () => window.clearInterval(interval);
  }, [isOpen, completed, studioMode, phaseIdx]);

  const currentPhase = PHASE_SEQUENCE[phaseIdx];
  const ringScale =
    studioMode === 'eye-20'
      ? 1.05
      : currentPhase.phase === 'inhale'
        ? 1.24
        : currentPhase.phase === 'hold'
          ? 1.26
          : 0.92;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.28 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="breathing-studio-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-md"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-2xl rounded-3xl bg-[#F7F9F7] dark:bg-[#211C18] border border-slate-900/10 dark:border-[#EAE0D5]/12 p-6 md:p-8 shadow-2xl relative overflow-hidden"
          >
            <div className="flex items-start justify-between gap-4 mb-6">
              <div>
                <p className="text-xs font-medium text-[#2D6A4F] dark:text-[#D97706]">
                  Studio Pemulihan Cepat
                </p>
                <h2
                  id="breathing-studio-title"
                  className="text-xl md:text-2xl font-semibold text-[#1E293B] dark:text-[#EAE0D5] mt-0.5"
                >
                  Latihan 20-20-20 & Olah Napas
                </h2>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setChimeEnabled((prev) => !prev)}
                  aria-label={chimeEnabled ? 'Matikan lonceng fase napas' : 'Aktifkan lonceng fase napas'}
                  className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-xl bg-white dark:bg-[#161311] border border-slate-900/10 dark:border-[#EAE0D5]/12 text-[#1E293B] dark:text-[#EAE0D5] cursor-pointer"
                >
                  {chimeEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Tutup studio napas dan mata"
                  className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-xl bg-white dark:bg-[#161311] border border-slate-900/10 dark:border-[#EAE0D5]/12 text-[#1E293B] dark:text-[#EAE0D5] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mode Switch */}
            <div className="flex flex-wrap items-center gap-2 mb-8">
              <button
                type="button"
                onClick={() => resetStudio('breath-1')}
                className={`min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  studioMode === 'breath-1'
                    ? 'bg-[#2D6A4F] text-white dark:bg-[#D97706] dark:text-[#161311]'
                    : 'bg-white dark:bg-[#161311] text-slate-700 dark:text-[#EAE0D5]'
                }`}
              >
                <Wind className="w-3.5 h-3.5" />
                Olah Napas 1 Menit
              </button>
              <button
                type="button"
                onClick={() => resetStudio('breath-2')}
                className={`min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  studioMode === 'breath-2'
                    ? 'bg-[#2D6A4F] text-white dark:bg-[#D97706] dark:text-[#161311]'
                    : 'bg-white dark:bg-[#161311] text-slate-700 dark:text-[#EAE0D5]'
                }`}
              >
                <Wind className="w-3.5 h-3.5" />
                Olah Napas 2 Menit
              </button>
              <button
                type="button"
                onClick={() => resetStudio('eye-20')}
                className={`min-h-[40px] inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  studioMode === 'eye-20'
                    ? 'bg-[#2D6A4F] text-white dark:bg-[#D97706] dark:text-[#161311]'
                    : 'bg-white dark:bg-[#161311] text-slate-700 dark:text-[#EAE0D5]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Istirahat Mata 20-20-20
              </button>
            </div>

            {/* Concentric Multi-Layer Aura */}
            <div className="py-6 flex flex-col items-center justify-center">
              <div className="relative w-60 h-60 flex items-center justify-center">
                {/* Outer Aura */}
                <motion.div
                  animate={{ scale: completed ? 1 : ringScale * 1.06, opacity: completed ? 0.3 : 0.25 }}
                  transition={{ duration: currentPhase.seconds * 0.45, ease: 'easeInOut' }}
                  className="absolute w-56 h-56 rounded-full bg-[#2D6A4F]/25 dark:bg-[#D97706]/25"
                />
                {/* Middle Aura */}
                <motion.div
                  animate={{ scale: completed ? 1 : ringScale * 0.96, opacity: 0.45 }}
                  transition={{ duration: currentPhase.seconds * 0.4, ease: 'easeInOut' }}
                  className="absolute w-44 h-44 rounded-full border-2 border-[#2D6A4F]/35 dark:border-[#D97706]/40 bg-[#2D6A4F]/12 dark:bg-[#D97706]/15"
                />
                {/* Inner Core */}
                <motion.div
                  animate={{ scale: completed ? 1 : ringScale * 0.86 }}
                  transition={{ duration: currentPhase.seconds * 0.35, ease: 'easeInOut' }}
                  className="relative w-36 h-36 rounded-full bg-white/90 dark:bg-[#161311]/90 border-2 border-[#2D6A4F]/60 dark:border-[#D97706]/70 shadow-lg flex flex-col items-center justify-center text-center px-3"
                >
                  {completed ? (
                    <>
                      <p className="text-sm font-semibold text-[#2D6A4F] dark:text-[#D97706]">
                        Sesi Selesai
                      </p>
                      <p className="text-xs text-slate-600 dark:text-[#B8ABA0] mt-1">
                        Napas dan matamu lebih segar
                      </p>
                    </>
                  ) : studioMode === 'eye-20' ? (
                    <>
                      <motion.div
                        animate={{ x: [-14, 14, -14], scale: [0.9, 1.15, 0.9] }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                        className="w-4 h-4 rounded-full bg-[#2D6A4F] dark:bg-[#D97706] mb-2"
                      />
                      <p className="text-xs font-semibold text-[#1E293B] dark:text-[#EAE0D5]">
                        Pandang Jauh
                      </p>
                      <p className="text-lg font-mono-num font-bold text-[#2D6A4F] dark:text-[#D97706]">
                        {totalRemaining} dtk
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-[#1E293B] dark:text-[#EAE0D5]">
                        {currentPhase.label}
                      </p>
                      <p className="text-xl font-mono-num font-bold text-[#2D6A4F] dark:text-[#D97706] mt-0.5">
                        {phaseSecondsLeft} dtk
                      </p>
                    </>
                  )}
                </motion.div>
              </div>

              <p className="text-sm text-slate-600 dark:text-[#D6C9BC] text-center max-w-md mt-4">
                {studioMode === 'eye-20'
                  ? 'Istirahatkan mata: alihkan pandangan ke objek sejauh 6 meter (20 kaki) selama 20 detik.'
                  : 'Ritme 4-4-6 membantu menenangkan sistem saraf dan meredakan ketegangan setelah menatap layar.'}
              </p>

              {studioMode !== 'eye-20' && !completed && (
                <div className="flex items-center justify-center gap-4 mt-3 text-xs font-mono-num">
                  {PHASE_SEQUENCE.map((item, idx) => (
                    <span
                      key={item.phase}
                      className={`transition-colors ${
                        idx === phaseIdx
                          ? 'font-semibold text-[#2D6A4F] dark:text-[#D97706]'
                          : 'text-slate-400 dark:text-[#8E8176]'
                      }`}
                    >
                      {item.label} {item.seconds}d
                    </span>
                  ))}
                </div>
              )}

              <div className="w-full flex flex-wrap items-center justify-between gap-3 mt-6 pt-4 border-t border-slate-900/8 dark:border-[#EAE0D5]/10">
                <span className="text-xs font-mono-num text-slate-500 dark:text-[#B8ABA0]">
                  Sisa durasi sesi: {totalRemaining} detik
                </span>
                <div className="flex items-center gap-2">
                  {completed && (
                    <button
                      type="button"
                      onClick={() => resetStudio(studioMode)}
                      className="min-h-[40px] px-4 py-2 rounded-xl bg-[#F0F4F0] dark:bg-[#2B241F] text-xs font-semibold text-[#1E293B] dark:text-[#EAE0D5] cursor-pointer"
                    >
                      Ulangi Latihan
                    </button>
                  )}
                  <motion.button
                    type="button"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={onClose}
                    className="min-h-[40px] px-5 py-2 rounded-xl bg-[#2D6A4F] dark:bg-[#D97706] text-white dark:text-[#161311] text-xs font-semibold cursor-pointer"
                  >
                    Kembali ke Ruang Hari Ini
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
