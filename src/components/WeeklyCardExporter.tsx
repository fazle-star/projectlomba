import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, CheckCircle2 } from 'lucide-react';
import type { CorrelationSummary, LocalFocusSession, LocalWellbeingLog } from '../types/wellbeing';

interface WeeklyCardExporterProps {
  logs: LocalWellbeingLog[];
  sessions: LocalFocusSession[];
  correlation: CorrelationSummary;
  isNightMode: boolean;
}

export const WeeklyCardExporter: React.FC<WeeklyCardExporterProps> = ({
  logs,
  sessions,
  correlation,
  isNightMode,
}) => {
  const [downloaded, setDownloaded] = useState(false);

  const avgEnergy = logs.length
    ? (logs.reduce((acc, item) => acc + item.energyScore, 0) / logs.length).toFixed(1)
    : '4.0';
  const sunsetCount = logs.filter((l) => l.sunsetCompleted).length;
  const completedFocusCount = sessions.filter((s) => s.completed).length;

  const handleDownloadPng = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Anti-FOMO Calm Background
    ctx.fillStyle = isNightMode ? '#161311' : '#F7F9F7';
    ctx.fillRect(0, 0, 1080, 1080);

    // Subtle decorative wave arcs
    ctx.strokeStyle = isNightMode ? 'rgba(217, 119, 6, 0.18)' : 'rgba(45, 106, 79, 0.14)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 860);
    ctx.bezierCurveTo(280, 790, 620, 940, 1080, 830);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 910);
    ctx.bezierCurveTo(320, 840, 700, 990, 1080, 890);
    ctx.stroke();

    // Inner Card
    ctx.fillStyle = isNightMode ? '#211C18' : '#FFFFFF';
    ctx.strokeStyle = isNightMode ? 'rgba(234, 224, 213, 0.14)' : 'rgba(30, 41, 59, 0.08)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(72, 72, 936, 936, 40);
    ctx.fill();
    ctx.stroke();

    // Brand Header
    ctx.fillStyle = isNightMode ? '#D97706' : '#2D6A4F';
    ctx.beginPath();
    ctx.arc(154, 160, 28, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#F7F9F7';
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(136, 156);
    ctx.quadraticCurveTo(145, 146, 154, 156);
    ctx.quadraticCurveTo(163, 166, 172, 156);
    ctx.stroke();

    ctx.fillStyle = isNightMode ? '#EAE0D5' : '#1E293B';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('Selaras · Mindful Weekly Card', 202, 171);

    ctx.fillStyle = isNightMode ? '#B8ABA0' : '#475569';
    ctx.font = '24px sans-serif';
    ctx.fillText('Ringkasan ritme tenang mingguan — tanpa angka streak yang menekan', 126, 238);

    // 3 Metric Blocks
    const metrics = [
      { label: 'Rata-rata Energi', value: `${avgEnergy} / 5` },
      { label: 'Sesi Fokus Selesai', value: `${completedFocusCount} sesi` },
      { label: 'Digital Sunset', value: `${sunsetCount} malam` },
    ];

    metrics.forEach((m, idx) => {
      const x = 126 + idx * 284;
      const y = 300;
      ctx.fillStyle = isNightMode ? '#161311' : '#F7F9F7';
      ctx.beginPath();
      ctx.roundRect(x, y, 260, 176, 24);
      ctx.fill();

      ctx.fillStyle = isNightMode ? '#B8ABA0' : '#475569';
      ctx.font = '22px sans-serif';
      ctx.fillText(m.label, x + 28, y + 60);

      ctx.fillStyle = isNightMode ? '#D97706' : '#2D6A4F';
      ctx.font = 'bold 42px monospace';
      ctx.fillText(m.value, x + 28, y + 126);
    });

    // Insight Box
    ctx.fillStyle = isNightMode ? '#2B241F' : '#EEF2EE';
    ctx.beginPath();
    ctx.roundRect(126, 524, 828, 220, 28);
    ctx.fill();

    ctx.fillStyle = isNightMode ? '#D97706' : '#2D6A4F';
    ctx.font = 'bold 24px sans-serif';
    ctx.fillText('Pola Pemulihan Layar & Fokus', 164, 578);

    ctx.fillStyle = isNightMode ? '#EAE0D5' : '#1E293B';
    ctx.font = '26px sans-serif';
    const words = correlation.insightText.split(' ');
    let line = '';
    let lineY = 632;
    for (const word of words) {
      const testLine = `${line}${word} `;
      if (ctx.measureText(testLine).width > 740) {
        ctx.fillText(line.trim(), 164, lineY);
        line = `${word} `;
        lineY += 40;
      } else {
        line = testLine;
      }
    }
    if (line.trim()) ctx.fillText(line.trim(), 164, lineY);

    // Footer
    ctx.fillStyle = isNightMode ? '#B8ABA0' : '#64748B';
    ctx.font = '22px sans-serif';
    ctx.fillText(`Rekomendasi lepas layar: ${correlation.recommendedSunsetTime} · Jendela rawan distraksi: ${correlation.peakDistractionWindow}`, 126, 860);
    ctx.fillText('Calm Technology · SDG 3 Digital Wellbeing', 126, 916);

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `selaras-mindful-weekly-${new Date().toISOString().slice(0, 10)}.png`;
    link.click();
    setDownloaded(true);
    window.setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-3xl bg-white dark:bg-[#211C18] border border-slate-900/8 dark:border-[#EAE0D5]/10 p-6 md:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-colors duration-700"
      aria-labelledby="weekly-card-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#2D6A4F] dark:text-[#D97706]">
            Mindful Weekly Card · Anti-FOMO
          </p>
          <h3
            id="weekly-card-heading"
            className="text-lg md:text-xl font-semibold text-[#1E293B] dark:text-[#EAE0D5] mt-0.5"
          >
            Kartu Laporan Mingguan
          </h3>
          <p className="text-xs text-slate-500 dark:text-[#B8ABA0] mt-1">
            Ringkasan progres tenang tanpa memicu kecemasan angka streak.
          </p>
        </div>

        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleDownloadPng}
          className="min-h-[44px] inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#2D6A4F] hover:bg-[#23543E] dark:bg-[#D97706] dark:hover:bg-[#B45309] text-white dark:text-[#161311] text-sm font-semibold whitespace-nowrap cursor-pointer"
        >
          {downloaded ? (
            <>
              <CheckCircle2 className="w-4 h-4" />
              PNG Berhasil Diunduh
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Unduh Kartu Mingguan (PNG)
            </>
          )}
        </motion.button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-5">
        <div className="rounded-2xl bg-[#F7F9F7] dark:bg-[#161311]/75 p-4 border border-slate-900/6 dark:border-[#EAE0D5]/8">
          <p className="text-xs text-slate-500 dark:text-[#B8ABA0]">Rata-rata Energi</p>
          <p className="text-2xl font-bold font-mono-num text-[#2D6A4F] dark:text-[#D97706] mt-1">
            {avgEnergy} / 5
          </p>
        </div>
        <div className="rounded-2xl bg-[#F7F9F7] dark:bg-[#161311]/75 p-4 border border-slate-900/6 dark:border-[#EAE0D5]/8">
          <p className="text-xs text-slate-500 dark:text-[#B8ABA0]">Sesi Fokus Selesai</p>
          <p className="text-2xl font-bold font-mono-num text-[#2D6A4F] dark:text-[#D97706] mt-1">
            {completedFocusCount} sesi
          </p>
        </div>
        <div className="rounded-2xl bg-[#F7F9F7] dark:bg-[#161311]/75 p-4 border border-slate-900/6 dark:border-[#EAE0D5]/8">
          <p className="text-xs text-slate-500 dark:text-[#B8ABA0]">Malam Digital Sunset</p>
          <p className="text-2xl font-bold font-mono-num text-[#2D6A4F] dark:text-[#D97706] mt-1">
            {sunsetCount} malam
          </p>
        </div>
      </div>
    </motion.section>
  );
};
