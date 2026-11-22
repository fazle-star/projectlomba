import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import type { CheckInChipId, WellbeingAnalysisResult } from '../types/wellbeing';
import { CHECKIN_CHIPS, analyzeWellbeingCheckIn } from '../utils/wellbeingAnalyzer';

interface SmartCheckInCardProps {
  latestAnalysis: WellbeingAnalysisResult;
  onSaveCheckIn: (result: WellbeingAnalysisResult) => void;
}

export const SmartCheckInCard: React.FC<SmartCheckInCardProps> = ({
  latestAnalysis,
  onSaveCheckIn,
}) => {
  const [selectedChips, setSelectedChips] = useState<CheckInChipId[]>([]);
  const [noteText, setNoteText] = useState('');
  const [manualEnergy, setManualEnergy] = useState<number>(latestAnalysis.energyScore);
  const [manualMood, setManualMood] = useState<number>(latestAnalysis.moodScore);
  const [hasCustomizedSliders, setHasCustomizedSliders] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);

  const toggleChip = (chipId: CheckInChipId) => {
    setSelectedChips((prev) => {
      const next = prev.includes(chipId)
        ? prev.filter((c) => c !== chipId)
        : [...prev, chipId];
      const preview = analyzeWellbeingCheckIn(next, noteText);
      if (!hasCustomizedSliders) {
        setManualEnergy(preview.energyScore);
        setManualMood(preview.moodScore);
      }
      return next;
    });
    setSavedNotice(false);
  };

  const handleNoteChange = (val: string) => {
    setNoteText(val);
    setSavedNotice(false);
    if (!hasCustomizedSliders) {
      const preview = analyzeWellbeingCheckIn(selectedChips, val);
      setManualEnergy(preview.energyScore);
      setManualMood(preview.moodScore);
    }
  };

  const handleAnalyzeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const computed = analyzeWellbeingCheckIn(
      selectedChips,
      noteText,
      manualEnergy,
      manualMood
    );
    onSaveCheckIn(computed);
    setSavedNotice(true);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-3xl bg-white dark:bg-[#211C18] border border-slate-900/8 dark:border-[#EAE0D5]/10 p-6 md:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-colors duration-700"
      aria-labelledby="checkin-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <div>
          <p className="text-xs font-medium text-[#2D6A4F] dark:text-[#D97706]">
            Pemetaan Emosi & Energi
          </p>
          <h2
            id="checkin-heading"
            className="text-xl font-semibold text-[#1E293B] dark:text-[#EAE0D5] mt-0.5"
          >
            Apa yang sedang kamu rasakan sekarang?
          </h2>
        </div>
        <span className="text-xs font-medium text-slate-500 dark:text-[#B8ABA0]">
          Kondisi saat ini: <strong className="text-[#1E293B] dark:text-[#EAE0D5]">{latestAnalysis.conditionCategory}</strong>
        </span>
      </div>

      <form onSubmit={handleAnalyzeSubmit} className="space-y-5">
        <div className="flex flex-wrap gap-2" role="group" aria-label="Pilih kondisi yang terasa">
          {CHECKIN_CHIPS.map((chip) => {
            const active = selectedChips.includes(chip.id);
            return (
              <motion.button
                key={chip.id}
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => toggleChip(chip.id)}
                aria-pressed={active}
                className={`min-h-[40px] px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2D6A4F] dark:focus-visible:ring-[#D97706] ${
                  active
                    ? 'bg-[#2D6A4F] text-white dark:bg-[#D97706] dark:text-[#161311]'
                    : 'bg-[#F0F4F0] text-[#1E293B] hover:bg-[#E3ECE4] dark:bg-[#2B241F] dark:text-[#EAE0D5] dark:hover:bg-[#362D27]'
                }`}
              >
                {chip.label}
              </motion.button>
            );
          })}
        </div>

        <div>
          <label
            htmlFor="checkin-note"
            className="block text-xs font-medium text-slate-600 dark:text-[#B8ABA0] mb-1.5"
          >
            Cerita singkat (opsional, diproses lokal di perangkatmu)
          </label>
          <textarea
            id="checkin-note"
            rows={2}
            value={noteText}
            onChange={(e) => handleNoteChange(e.target.value)}
            placeholder="Contoh: Kepala agak berat karena deadline menumpuk dan semalam kurang tidur..."
            className="w-full rounded-2xl bg-[#F7F9F7] dark:bg-[#161311] border border-slate-900/10 dark:border-[#EAE0D5]/12 px-4 py-3 text-sm text-[#1E293B] dark:text-[#EAE0D5] placeholder:text-slate-400 dark:placeholder:text-[#8E8176] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#D97706]"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div className="rounded-2xl bg-[#F7F9F7] dark:bg-[#161311]/70 px-4 py-3 border border-slate-900/6 dark:border-[#EAE0D5]/8">
            <div className="flex items-center justify-between text-xs mb-2">
              <label htmlFor="energy-slider" className="font-medium text-slate-700 dark:text-[#EAE0D5]">
                Skor Energi
              </label>
              <span className="font-mono-num font-semibold text-[#2D6A4F] dark:text-[#D97706]">
                {manualEnergy} / 5
              </span>
            </div>
            <input
              id="energy-slider"
              type="range"
              min={1}
              max={5}
              step={1}
              value={manualEnergy}
              onChange={(e) => {
                setHasCustomizedSliders(true);
                setManualEnergy(Number(e.target.value));
                setSavedNotice(false);
              }}
              className="w-full selaras-slider"
            />
          </div>

          <div className="rounded-2xl bg-[#F7F9F7] dark:bg-[#161311]/70 px-4 py-3 border border-slate-900/6 dark:border-[#EAE0D5]/8">
            <div className="flex items-center justify-between text-xs mb-2">
              <label htmlFor="mood-slider" className="font-medium text-slate-700 dark:text-[#EAE0D5]">
                Skor Suasana Hati
              </label>
              <span className="font-mono-num font-semibold text-[#2D6A4F] dark:text-[#D97706]">
                {manualMood} / 5
              </span>
            </div>
            <input
              id="mood-slider"
              type="range"
              min={1}
              max={5}
              step={1}
              value={manualMood}
              onChange={(e) => {
                setHasCustomizedSliders(true);
                setManualMood(Number(e.target.value));
                setSavedNotice(false);
              }}
              className="w-full selaras-slider"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <motion.button
            type="submit"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#24553F] dark:bg-[#D97706] dark:hover:bg-[#B45309] text-white dark:text-[#161311] text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Petakan Kondisi & Sesuaikan Fokus
          </motion.button>

          {savedNotice && (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2D6A4F] dark:text-[#F59E0B]">
              <CheckCircle2 className="w-4 h-4" />
              Check-in tersimpan & mode fokus disesuaikan
            </span>
          )}
        </div>
      </form>

      <div className="mt-5 pt-4 border-t border-slate-900/8 dark:border-[#EAE0D5]/10">
        <p className="text-sm leading-relaxed text-slate-700 dark:text-[#D6C9BC]">
          {latestAnalysis.empatheticFeedback[0]} {latestAnalysis.empatheticFeedback[1]}
        </p>
        <p className="text-xs text-slate-500 dark:text-[#9D8F82] mt-2">
          Refleksi mandiri non-medis · Energi {latestAnalysis.energyScore}/5 · Mood {latestAnalysis.moodScore}/5
        </p>
      </div>
    </motion.section>
  );
};
