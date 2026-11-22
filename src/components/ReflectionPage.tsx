import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Info, CheckCircle2 } from 'lucide-react';
import type { ImpulseEvent, LocalFocusSession, LocalWellbeingLog } from '../types/wellbeing';
import {
  analyzeImpulseBuckets,
  computeScreenOffCorrelation,
} from '../utils/wellbeingAnalyzer';
import { WeeklyCardExporter } from './WeeklyCardExporter';

interface ReflectionPageProps {
  logs: LocalWellbeingLog[];
  sessions: LocalFocusSession[];
  impulseEvents: ImpulseEvent[];
  isNightMode: boolean;
  onSaveMorningFocus: (score: number) => void;
}

const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function buildSmoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i += 1) {
    const p0 = points[i];
    const p1 = points[i + 1];
    const cx = (p0.x + p1.x) / 2;
    d += ` C ${cx} ${p0.y}, ${cx} ${p1.y}, ${p1.x} ${p1.y}`;
  }
  return d;
}

export const ReflectionPage: React.FC<ReflectionPageProps> = ({
  logs,
  sessions,
  impulseEvents,
  isNightMode,
  onSaveMorningFocus,
}) => {
  const latestLog = logs[logs.length - 1];
  const [morningScore, setMorningScore] = useState<number>(latestLog?.morningFocusScore ?? 4);
  const [savedMorning, setSavedMorning] = useState(false);

  const recentLogs = useMemo(() => logs.slice(-7), [logs]);
  const correlation = useMemo(
    () => computeScreenOffCorrelation(logs, impulseEvents),
    [logs, impulseEvents]
  );
  const impulseSummary = useMemo(() => analyzeImpulseBuckets(impulseEvents), [impulseEvents]);

  const chartDimensions = { width: 640, height: 210, padX: 38, padTop: 22, padBottom: 34 };
  const plotW = chartDimensions.width - chartDimensions.padX * 2;
  const plotH = chartDimensions.height - chartDimensions.padTop - chartDimensions.padBottom;

  const focusPoints = recentLogs.map((log, idx) => {
    const x =
      chartDimensions.padX +
      (recentLogs.length > 1 ? (idx / (recentLogs.length - 1)) * plotW : plotW / 2);
    const val = log.morningFocusScore ?? log.energyScore;
    const y = chartDimensions.padTop + ((5 - val) / 4) * plotH;
    return { x, y, log };
  });

  const moodPoints = recentLogs.map((log, idx) => {
    const x =
      chartDimensions.padX +
      (recentLogs.length > 1 ? (idx / (recentLogs.length - 1)) * plotW : plotW / 2);
    const y = chartDimensions.padTop + ((5 - log.moodScore) / 4) * plotH;
    return { x, y };
  });

  const focusPath = buildSmoothPath(focusPoints);
  const moodPath = buildSmoothPath(moodPoints);
  const focusAreaPath =
    focusPoints.length > 1
      ? `${focusPath} L ${focusPoints[focusPoints.length - 1].x} ${
          chartDimensions.height - chartDimensions.padBottom
        } L ${focusPoints[0].x} ${chartDimensions.height - chartDimensions.padBottom} Z`
      : '';

  const maxBucketCount = Math.max(1, ...impulseSummary.buckets.map((b) => b.count));

  const handleSaveMorning = (score: number) => {
    setMorningScore(score);
    onSaveMorningFocus(score);
    setSavedMorning(true);
    window.setTimeout(() => setSavedMorning(false), 2500);
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
      }}
      className="space-y-6"
    >
      {/* Check-in Pagi Hari */}
      <motion.section
        variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
        className="rounded-3xl bg-white dark:bg-[#211C18] border border-slate-900/8 dark:border-[#EAE0D5]/10 p-6 md:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-colors duration-700"
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#2D6A4F] dark:text-[#D97706]">
              Check-in Pagi Hari
            </p>
            <h2 className="text-xl font-semibold text-[#1E293B] dark:text-[#EAE0D5] mt-0.5">
              Bagaimana kualitas tidur dan fokusmu pagi ini?
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Skor fokus pagi">
            {[1, 2, 3, 4, 5].map((score) => (
              <motion.button
                key={score}
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleSaveMorning(score)}
                className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-mono-num font-semibold transition-colors cursor-pointer ${
                  morningScore === score
                    ? 'bg-[#2D6A4F] text-white dark:bg-[#D97706] dark:text-[#161311]'
                    : 'bg-[#F0F4F0] text-[#1E293B] dark:bg-[#2B241F] dark:text-[#EAE0D5]'
                }`}
              >
                {score}/5
              </motion.button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mt-4 text-xs text-slate-600 dark:text-[#B8ABA0]">
          <span className="font-mono-num">
            Fokus Pagi: <strong className="text-[#1E293B] dark:text-[#EAE0D5]">{morningScore}/5</strong>
          </span>
          <span aria-hidden="true">·</span>
          <span className="font-mono-num">
            Suasana Hati Terakhir: <strong className="text-[#1E293B] dark:text-[#EAE0D5]">{latestLog?.moodScore ?? 4}/5</strong>
          </span>
          {savedMorning && (
            <span className="inline-flex items-center gap-1 text-[#2D6A4F] dark:text-[#F59E0B] font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Tercatat ke grafik korelasi
            </span>
          )}
        </div>
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Screen-Off Correlation Spline Chart */}
        <motion.section
          variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
          className="lg:col-span-7 rounded-3xl bg-white dark:bg-[#211C18] border border-slate-900/8 dark:border-[#EAE0D5]/10 p-6 md:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-colors duration-700"
          aria-labelledby="correlation-heading"
        >
          <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
            <div>
              <h3
                id="correlation-heading"
                className="text-lg font-semibold text-[#1E293B] dark:text-[#EAE0D5]"
              >
                Korelasi Jam Lepas Layar & Fokus Esok Hari
              </h3>
              <p className="text-xs text-slate-500 dark:text-[#B8ABA0] mt-1">
                Perbandingan tren fokus pagi dan suasana hati dalam 7 catatan terakhir
              </p>
            </div>
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-[#B8ABA0]">
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#2D6A4F] dark:bg-[#D97706]" />
                Fokus
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-[#8E8176]" />
                Mood
              </span>
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <svg
              viewBox={`0 0 ${chartDimensions.width} ${chartDimensions.height}`}
              className="w-full min-w-[460px] h-52"
              role="img"
              aria-label="Grafik korelasi jam lepas layar dengan fokus dan mood keesokan harinya"
            >
              <defs>
                <linearGradient id="selarasAreaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="0%"
                    stopColor={isNightMode ? '#D97706' : '#2D6A4F'}
                    stopOpacity="0.24"
                  />
                  <stop
                    offset="100%"
                    stopColor={isNightMode ? '#D97706' : '#2D6A4F'}
                    stopOpacity="0.01"
                  />
                </linearGradient>
              </defs>

              {[1, 2, 3, 4, 5].map((tick) => {
                const y = chartDimensions.padTop + ((5 - tick) / 4) * plotH;
                return (
                  <g key={tick}>
                    <line
                      x1={chartDimensions.padX}
                      y1={y}
                      x2={chartDimensions.width - chartDimensions.padX}
                      y2={y}
                      stroke={isNightMode ? 'rgba(234,224,213,0.08)' : 'rgba(30,41,59,0.07)'}
                      strokeDasharray="3 4"
                    />
                    <text
                      x={14}
                      y={y + 4}
                      fontSize="11"
                      fill={isNightMode ? '#B8ABA0' : '#64748B'}
                      className="font-mono-num"
                    >
                      {tick}
                    </text>
                  </g>
                );
              })}

              {focusAreaPath && <path d={focusAreaPath} fill="url(#selarasAreaGrad)" />}

              {moodPath && (
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
                  d={moodPath}
                  fill="none"
                  stroke={isNightMode ? '#8E8176' : '#94A3B8'}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
              )}

              {focusPath && (
                <motion.path
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 1.05, ease: [0.22, 1, 0.36, 1] }}
                  d={focusPath}
                  fill="none"
                  stroke={isNightMode ? '#D97706' : '#2D6A4F'}
                  strokeWidth="3"
                  strokeLinecap="round"
                />
              )}

              {focusPoints.map((pt, idx) => {
                const dt = new Date(`${pt.log.logDate}T00:00:00`);
                const dayLabel = Number.isNaN(dt.getTime())
                  ? `H${idx + 1}`
                  : DAY_LABELS[dt.getDay()];
                return (
                  <g key={pt.log.logDate}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r="4.5"
                      fill={isNightMode ? '#D97706' : '#2D6A4F'}
                      stroke={isNightMode ? '#211C18' : '#FFFFFF'}
                      strokeWidth="2"
                    />
                    <text
                      x={pt.x}
                      y={chartDimensions.height - 8}
                      textAnchor="middle"
                      fontSize="11"
                      fill={isNightMode ? '#B8ABA0' : '#64748B'}
                    >
                      {dayLabel}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="mt-4 rounded-2xl bg-[#F7F9F7] dark:bg-[#161311]/75 px-4 py-3 flex items-start gap-2.5 text-xs text-slate-700 dark:text-[#D6C9BC]">
            <Info className="w-4 h-4 text-[#2D6A4F] dark:text-[#D97706] shrink-0 mt-0.5" />
            <span>{correlation.insightText}</span>
          </div>
        </motion.section>

        {/* Distraction Peak-Hour Analysis */}
        <motion.section
          variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
          className="lg:col-span-5 rounded-3xl bg-white dark:bg-[#211C18] border border-slate-900/8 dark:border-[#EAE0D5]/10 p-6 md:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-colors duration-700 flex flex-col justify-between"
          aria-labelledby="impulse-heading"
        >
          <div>
            <h3
              id="impulse-heading"
              className="text-lg font-semibold text-[#1E293B] dark:text-[#EAE0D5]"
            >
              Analisis Jam Rawan Distraksi
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#B8ABA0] mt-1">
              Distribusi impuls pindah tab dalam 4 rentang waktu harian
            </p>

            <div className="space-y-3.5 mt-5">
              {impulseSummary.buckets.map((bucket) => {
                const widthPct = Math.max(8, Math.round((bucket.count / maxBucketCount) * 100));
                const isPeak = bucket.id === impulseSummary.peakBucket.id && bucket.count > 0;
                return (
                  <div key={bucket.id}>
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-medium text-[#1E293B] dark:text-[#EAE0D5]">
                        {bucket.label} ({bucket.rangeLabel})
                      </span>
                      <span className="font-mono-num text-slate-600 dark:text-[#B8ABA0]">
                        {bucket.count} impuls
                      </span>
                    </div>
                    <div className="h-3 rounded-full bg-[#F0F4F0] dark:bg-[#161311] overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${widthPct}%` }}
                        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                        className={`h-full rounded-full ${
                          isPeak
                            ? 'bg-[#2D6A4F] dark:bg-[#D97706]'
                            : 'bg-[#2D6A4F]/45 dark:bg-[#D97706]/45'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-5 rounded-2xl bg-[#F7F9F7] dark:bg-[#161311]/75 p-4 border border-slate-900/6 dark:border-[#EAE0D5]/8">
            <p className="text-xs font-medium text-[#2D6A4F] dark:text-[#D97706]">
              Rekomendasi Otomatis Digital Sunset
            </p>
            <p className="text-xs leading-relaxed text-slate-700 dark:text-[#D6C9BC] mt-1">
              Jam paling rawan terdistraksi berada pada jendela{' '}
              <strong>{correlation.peakDistractionWindow}</strong>. Jadwal Digital Sunset ideal
              untukmu adalah pukul <strong className="font-mono-num">{impulseSummary.recommendedSunset}</strong>.
            </p>
          </div>
        </motion.section>
      </div>

      <WeeklyCardExporter
        logs={logs}
        sessions={sessions}
        correlation={correlation}
        isNightMode={isNightMode}
      />
    </motion.div>
  );
};
