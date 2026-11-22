import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Cloud, Download, Lock, Smartphone, Wifi, WifiOff, CheckCircle2, LogOut } from 'lucide-react';
import type { OptionalUserProfile, RhythmSettings } from '../types/wellbeing';
import { useOnlineStatus, usePWAInstall } from '../hooks/usePWAInstall';

interface SettingsPageProps {
  settings: RhythmSettings;
  onUpdateSettings: (next: RhythmSettings) => void;
  onResetEncryptedJournals: () => void;
  userProfile: OptionalUserProfile | null;
  onOpenAuthModal: () => void;
  onSignOut: () => void;
}

function formatHourLabel(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  settings,
  onUpdateSettings,
  onResetEncryptedJournals,
  userProfile,
  onOpenAuthModal,
  onSignOut,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const isOnline = useOnlineStatus();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleResetPassphrase = () => {
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    onResetEncryptedJournals();
    setConfirmReset(false);
    setResetDone(true);
    window.setTimeout(() => setResetDone(false), 3500);
  };

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
      }}
      className="grid grid-cols-1 md:grid-cols-2 gap-6"
    >
      {/* 1. Jadwal Ritme Sirkadian */}
      <motion.section
        variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
        className="rounded-3xl bg-white dark:bg-[#211C18] border border-slate-900/8 dark:border-[#EAE0D5]/10 p-6 md:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-colors duration-700"
      >
        <h2 className="text-lg font-semibold text-[#1E293B] dark:text-[#EAE0D5]">
          Jadwal Ritme Sirkadian
        </h2>
        <p className="text-xs text-slate-500 dark:text-[#B8ABA0] mt-1 mb-5">
          Tentukan kapan tampilan otomatis beralih ke tema hangat Digital Sunset.
        </p>

        <div className="space-y-5">
          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <label htmlFor="sunset-hour-slider" className="font-medium text-[#1E293B] dark:text-[#EAE0D5]">
                Jam Digital Sunset
              </label>
              <span className="font-mono-num font-semibold text-[#2D6A4F] dark:text-[#D97706]">
                {formatHourLabel(settings.sunsetHour, settings.sunsetMinute)}
              </span>
            </div>
            <input
              id="sunset-hour-slider"
              type="range"
              min={18}
              max={23}
              step={1}
              value={settings.sunsetHour}
              onChange={(e) =>
                onUpdateSettings({ ...settings, sunsetHour: Number(e.target.value) })
              }
              className="w-full selaras-slider"
            />
          </div>

          <div>
            <div className="flex items-center justify-between text-sm mb-2">
              <label htmlFor="sleep-hour-slider" className="font-medium text-[#1E293B] dark:text-[#EAE0D5]">
                Target Jam Tidur
              </label>
              <span className="font-mono-num font-semibold text-[#2D6A4F] dark:text-[#D97706]">
                {formatHourLabel(settings.sleepHour, settings.sleepMinute)}
              </span>
            </div>
            <input
              id="sleep-hour-slider"
              type="range"
              min={20}
              max={24}
              step={1}
              value={settings.sleepHour === 0 ? 24 : settings.sleepHour}
              onChange={(e) => {
                const raw = Number(e.target.value);
                onUpdateSettings({ ...settings, sleepHour: raw === 24 ? 0 : raw });
              }}
              className="w-full selaras-slider"
            />
          </div>
        </div>
      </motion.section>

      {/* 2. PWA & Mode Offline-First */}
      <motion.section
        variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
        className="rounded-3xl bg-white dark:bg-[#211C18] border border-slate-900/8 dark:border-[#EAE0D5]/10 p-6 md:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-colors duration-700 flex flex-col justify-between"
      >
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-[#1E293B] dark:text-[#EAE0D5]">
              PWA & Mode Offline-First
            </h2>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#2D6A4F] dark:text-[#F59E0B]">
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              {isOnline ? 'Siap Offline · Daring' : 'Mode Offline Aktif'}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-[#B8ABA0] mt-2">
            Seluruh fitur inti — check-in, timer fokus, ambient synth, latihan 20-20-20, dan jurnal
            terenkripsi — tetap berjalan penuh saat mode pesawat sebelum tidur.
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-900/8 dark:border-[#EAE0D5]/10">
          {isInstalled ? (
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#2D6A4F] dark:text-[#F59E0B]">
              <CheckCircle2 className="w-4 h-4" />
              Aplikasi sudah terpasang di perangkat ini
            </div>
          ) : isInstallable ? (
            <motion.button
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => void install()}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#2D6A4F] dark:bg-[#D97706] text-white dark:text-[#161311] text-sm font-semibold cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Instal Aplikasi Selaras
            </motion.button>
          ) : (
            <div className="space-y-2.5">
              <motion.button
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowIOSGuide((prev) => !prev)}
                className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-900/12 dark:border-[#EAE0D5]/15 text-sm font-medium text-[#1E293B] dark:text-[#EAE0D5] hover:bg-[#F7F9F7] dark:hover:bg-[#161311] cursor-pointer"
              >
                <Smartphone className="w-4 h-4 text-[#2D6A4F] dark:text-[#D97706]" />
                {showIOSGuide ? 'Tutup Panduan Instalasi' : isIOS ? 'Cara Pasang di iPhone / iPad' : 'Panduan Instalasi PWA'}
              </motion.button>
              {showIOSGuide && (
                <p className="text-xs leading-relaxed text-slate-600 dark:text-[#B8ABA0] bg-[#F7F9F7] dark:bg-[#161311] p-3.5 rounded-xl">
                  {isIOS
                    ? 'Ketuk tombol Bagikan (Share) di bilah Safari, lalu pilih Tambah ke Layar Utama (Add to Home Screen).'
                    : 'Klik ikon Instal di bilah alamat browser (Chrome/Edge) atau pilih Tambahkan ke Layar Utama pada menu browser ponsel.'}
                </p>
              )}
            </div>
          )}
        </div>
      </motion.section>

      {/* 3. Keamanan Zero-Knowledge */}
      <motion.section
        variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
        className="rounded-3xl bg-white dark:bg-[#211C18] border border-slate-900/8 dark:border-[#EAE0D5]/10 p-6 md:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-colors duration-700 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-[#2D6A4F] dark:text-[#D97706]" />
            <h2 className="text-lg font-semibold text-[#1E293B] dark:text-[#EAE0D5]">
              Keamanan Zero-Knowledge
            </h2>
          </div>
          <p className="text-xs leading-relaxed text-slate-600 dark:text-[#B8ABA0] mt-1">
            Enkripsi PBKDF2 (100.000 iterasi SHA-256) + AES-GCM 256-bit. Kunci tidak pernah
            meninggalkan memori browsermu.
          </p>
        </div>

        <div className="mt-5 space-y-2">
          <motion.button
            type="button"
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleResetPassphrase}
            className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-900/12 dark:border-[#EAE0D5]/15 text-sm font-medium text-[#1E293B] dark:text-[#EAE0D5] hover:bg-[#F7F9F7] dark:hover:bg-[#161311] cursor-pointer"
          >
            {confirmReset
              ? 'Konfirmasi: Hapus Ciphertext Jurnal & Reset Passphrase'
              : 'Atur Ulang Passphrase'}
          </motion.button>
          {resetDone && (
            <p role="status" className="text-xs text-[#2D6A4F] dark:text-[#F59E0B]">
              Ciphertext jurnal lama dibersihkan. Kamu bisa membuat passphrase baru di Mode Malam.
            </p>
          )}
        </div>
      </motion.section>

      {/* 4. Sinkronisasi Cloud Opsional */}
      <motion.section
        variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
        className="rounded-3xl bg-white dark:bg-[#211C18] border border-slate-900/8 dark:border-[#EAE0D5]/10 p-6 md:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-colors duration-700 flex flex-col justify-between"
      >
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cloud className="w-4 h-4 text-[#2D6A4F] dark:text-[#D97706]" />
            <h2 className="text-lg font-semibold text-[#1E293B] dark:text-[#EAE0D5]">
              Sinkronisasi Cloud Opsional
            </h2>
          </div>
          <p className="text-xs text-slate-600 dark:text-[#B8ABA0] mt-1">
            {userProfile
              ? `Terhubung sebagai ${userProfile.nickname} (${userProfile.email})`
              : 'Saat ini menggunakan Mode Tamu Lokal. Hubungkan akun kapan saja untuk cadangan lintas perangkat.'}
          </p>
        </div>

        <div className="mt-5">
          {userProfile ? (
            <motion.button
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={onSignOut}
              className="w-full min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-900/12 dark:border-[#EAE0D5]/15 text-sm font-medium text-[#1E293B] dark:text-[#EAE0D5] hover:bg-[#F7F9F7] dark:hover:bg-[#161311] cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Keluar ke Mode Tamu Lokal
            </motion.button>
          ) : (
            <motion.button
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={onOpenAuthModal}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl border border-slate-900/12 dark:border-[#EAE0D5]/15 text-sm font-medium text-[#1E293B] dark:text-[#EAE0D5] hover:bg-[#F7F9F7] dark:hover:bg-[#161311] cursor-pointer"
            >
              Hubungkan Akun Supabase
            </motion.button>
          )}
        </div>
      </motion.section>
    </motion.div>
  );
};
