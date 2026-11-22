import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Unlock, Moon, CheckCircle2, ShieldCheck } from 'lucide-react';
import type { ImpulseEvent, LocalWellbeingLog } from '../types/wellbeing';
import { usePassphraseCrypto } from '../hooks/usePassphraseCrypto';
import { useTabImpulse } from '../hooks/useTabImpulse';

interface PassphraseJournalProps {
  todayLog?: LocalWellbeingLog;
  onSaveEncryptedJournal: (payload: {
    reframingCategory: 'kendali_diri' | 'lepas_beban' | 'apresiasi';
    encryptedJournal: string;
    journalSalt: string;
    journalIv: string;
  }) => void;
  onCompleteSunset: (screenOffTime: string) => void;
  onRecordImpulse: (evt: ImpulseEvent) => void;
}

const REFRAMING_CARDS: Array<{
  id: 'kendali_diri' | 'lepas_beban' | 'apresiasi';
  step: string;
  title: string;
  prompt: string;
}> = [
  {
    id: 'kendali_diri',
    step: '1',
    title: 'Hal yang bisa saya kendalikan hari ini',
    prompt: 'Fokus pada tindakan kecil yang memang berada dalam jangkauanmu hari ini.',
  },
  {
    id: 'lepas_beban',
    step: '2',
    title: 'Beban pikiran yang boleh saya lepaskan malam ini',
    prompt: 'Biarkan urusan yang belum selesai menunggu esok dengan tenang.',
  },
  {
    id: 'apresiasi',
    step: '3',
    title: 'Satu hal kecil yang patut disyukuri',
    prompt: 'Apresiasi langkah kecil atau momen hangat yang sempat kamu alami hari ini.',
  },
];

export const PassphraseJournal: React.FC<PassphraseJournalProps> = ({
  todayLog,
  onSaveEncryptedJournal,
  onCompleteSunset,
  onRecordImpulse,
}) => {
  const [selectedCard, setSelectedCard] = useState<'kendali_diri' | 'lepas_beban' | 'apresiasi'>(
    todayLog?.reframingCategory ?? 'kendali_diri'
  );
  const [passphraseInput, setPassphraseInput] = useState('');
  const [journalDraft, setJournalDraft] = useState('');
  const [cryptoError, setCryptoError] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [sunsetDoneNow, setSunsetDoneNow] = useState(Boolean(todayLog?.sunsetCompleted));

  const { isUnlocked, unlockWithPassphrase, encryptText, decryptText, lockMemoryKey } =
    usePassphraseCrypto();

  const { returnToastVisible, dismissToast } = useTabImpulse(
    !sunsetDoneNow,
    'sunset',
    onRecordImpulse
  );

  useEffect(() => {
    setSunsetDoneNow(Boolean(todayLog?.sunsetCompleted));
  }, [todayLog?.sunsetCompleted]);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setCryptoError(null);
    setStatusMessage(null);
    try {
      await unlockWithPassphrase(passphraseInput, todayLog?.journalSalt);
      if (todayLog?.encryptedJournal && todayLog?.journalIv) {
        const plain = await decryptText(todayLog.encryptedJournal, todayLog.journalIv);
        setJournalDraft(plain);
        setStatusMessage('Catatan terenkripsi berhasil didekripsi di memori browser.');
      } else {
        setStatusMessage('Ruang pribadi terbuka. Passphrase tidak disimpan ke penyimpanan.');
      }
      setPassphraseInput('');
    } catch {
      lockMemoryKey();
      setCryptoError('Passphrase tidak cocok atau terlalu singkat (minimal 4 karakter).');
    }
  };

  const handleEncryptAndSave = async () => {
    setCryptoError(null);
    setStatusMessage(null);
    if (!journalDraft.trim()) {
      setCryptoError('Tuliskan refleksi singkat terlebih dahulu sebelum mengenkripsi.');
      return;
    }
    try {
      const { ciphertext, salt, iv } = await encryptText(journalDraft.trim());
      onSaveEncryptedJournal({
        reframingCategory: selectedCard,
        encryptedJournal: ciphertext,
        journalSalt: salt,
        journalIv: iv,
      });
      setStatusMessage('Terenkripsi AES-GCM 256-bit & tersimpan lokal.');
    } catch (err) {
      setCryptoError(err instanceof Error ? err.message : 'Gagal mengenkripsi catatan.');
    }
  };

  const handleFinishSunset = () => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const timeStr = `${hh}:${mm}`;
    onCompleteSunset(timeStr);
    setSunsetDoneNow(true);
    setStatusMessage(`Waktu lepas layar tercatat pada pukul ${timeStr}. Selamat beristirahat.`);
  };

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-3xl bg-white dark:bg-[#211C18] border border-slate-900/8 dark:border-[#EAE0D5]/10 p-6 md:p-7 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-colors duration-700"
      aria-labelledby="sunset-heading"
    >
      {returnToastVisible && (
        <div
          role="status"
          className="mb-4 rounded-2xl bg-[#2B241F] border border-[#D97706]/30 px-4 py-3 flex items-center justify-between gap-3"
        >
          <p className="text-xs md:text-sm text-[#EAE0D5]">
            Terdeteksi berpindah tab saat ritual malam. Tarik napas perlahan dan kembali ke ruang tenangmu.
          </p>
          <button
            type="button"
            onClick={dismissToast}
            className="text-xs font-medium text-[#D97706] whitespace-nowrap cursor-pointer"
          >
            Tutup
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
        <div>
          <p className="text-xs font-medium text-[#2D6A4F] dark:text-[#D97706]">
            Digital Sunset Ritual · Mode Malam
          </p>
          <h2
            id="sunset-heading"
            className="text-xl font-semibold text-[#1E293B] dark:text-[#EAE0D5] mt-0.5"
          >
            Refleksi Kognitif & Brain Dump Terenkripsi
          </h2>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-[#B8ABA0]">
          <ShieldCheck className="w-4 h-4 text-[#2D6A4F] dark:text-[#D97706]" />
          PBKDF2 + AES-GCM Zero-Knowledge
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* 3 Guided Thought Reframing Cards */}
        <div className="lg:col-span-5 space-y-3" role="radiogroup" aria-label="Pilih fokus refleksi malam">
          {REFRAMING_CARDS.map((card) => {
            const active = selectedCard === card.id;
            return (
              <motion.button
                key={card.id}
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCard(card.id)}
                role="radio"
                aria-checked={active}
                className={`w-full text-left rounded-2xl p-4 border transition-colors cursor-pointer ${
                  active
                    ? 'bg-[#F0F4F0] dark:bg-[#2B241F] border-[#2D6A4F] dark:border-[#D97706]'
                    : 'bg-[#F7F9F7] dark:bg-[#161311]/70 border-slate-900/8 dark:border-[#EAE0D5]/10 hover:border-slate-900/20 dark:hover:border-[#EAE0D5]/25'
                }`}
              >
                <p className="text-xs font-medium text-[#2D6A4F] dark:text-[#D97706]">
                  Guided Thought Reframing
                </p>
                <p className="text-sm md:text-base font-semibold text-[#1E293B] dark:text-[#EAE0D5] mt-1">
                  {card.step}. {card.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-[#B8ABA0] mt-1">{card.prompt}</p>
              </motion.button>
            );
          })}
        </div>

        {/* Encrypted Brain Dump Panel */}
        <div className="lg:col-span-7 rounded-2xl bg-[#F7F9F7] dark:bg-[#161311]/80 border border-slate-900/8 dark:border-[#EAE0D5]/10 p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                {isUnlocked ? (
                  <Unlock className="w-4 h-4 text-[#2D6A4F] dark:text-[#D97706]" />
                ) : (
                  <Lock className="w-4 h-4 text-[#2D6A4F] dark:text-[#D97706]" />
                )}
                <h3 className="text-base font-semibold text-[#1E293B] dark:text-[#EAE0D5]">
                  Brain Dump Journal
                </h3>
              </div>
              <span className="text-xs font-medium text-slate-600 dark:text-[#B8ABA0]">
                {isUnlocked ? 'Terbuka · Terenkripsi AES-GCM' : 'Terkunci · Zero-Knowledge'}
              </span>
            </div>

            {!isUnlocked ? (
              <form onSubmit={handleUnlock} className="space-y-3 mt-4">
                <p className="text-xs leading-relaxed text-slate-600 dark:text-[#B8ABA0]">
                  Masukkan passphrase ruang pribadimu untuk menurunkan kunci enkripsi AES-GCM 256-bit
                  langsung di memori browser. Passphrase tidak pernah disimpan ke penyimpanan.
                </p>
                <div>
                  <label htmlFor="passphrase-input" className="sr-only">
                    Passphrase Ruang Pribadi
                  </label>
                  <input
                    id="passphrase-input"
                    type="password"
                    value={passphraseInput}
                    onChange={(e) => setPassphraseInput(e.target.value)}
                    placeholder="Passphrase pribadi (min. 4 karakter)"
                    className="w-full min-h-[44px] rounded-xl bg-white dark:bg-[#211C18] border border-slate-900/12 dark:border-[#EAE0D5]/15 px-4 py-2.5 text-sm text-[#1E293B] dark:text-[#EAE0D5] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#D97706]"
                  />
                </div>
                <motion.button
                  type="submit"
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.98 }}
                  className="min-h-[44px] px-5 py-2.5 rounded-xl bg-[#2D6A4F] dark:bg-[#D97706] text-white dark:text-[#161311] text-sm font-semibold cursor-pointer"
                >
                  {todayLog?.encryptedJournal ? 'Buka & Dekripsi Jurnal' : 'Buka Ruang Pribadi'}
                </motion.button>
              </form>
            ) : (
              <div className="space-y-3">
                <label htmlFor="brain-dump-textarea" className="sr-only">
                  Catatan Brain Dump Malam Ini
                </label>
                <textarea
                  id="brain-dump-textarea"
                  rows={5}
                  value={journalDraft}
                  onChange={(e) => setJournalDraft(e.target.value)}
                  placeholder="Tuangkan semua hal yang mengganjal di pikiranmu malam ini..."
                  className="w-full rounded-xl bg-white dark:bg-[#211C18] border border-slate-900/12 dark:border-[#EAE0D5]/15 px-4 py-3 text-sm leading-relaxed text-[#1E293B] dark:text-[#EAE0D5] placeholder:text-slate-400 dark:placeholder:text-[#8E8176] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#D97706]"
                />
                <div className="flex flex-wrap items-center gap-2">
                  <motion.button
                    type="button"
                    whileHover={{ y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleEncryptAndSave}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-[#2D6A4F] dark:bg-[#D97706] text-white dark:text-[#161311] text-xs font-semibold cursor-pointer"
                  >
                    Enkripsi & Simpan Lokal
                  </motion.button>
                  <button
                    type="button"
                    onClick={lockMemoryKey}
                    className="min-h-[40px] px-4 py-2 rounded-xl bg-white dark:bg-[#211C18] border border-slate-900/12 dark:border-[#EAE0D5]/15 text-xs font-medium text-slate-700 dark:text-[#EAE0D5] cursor-pointer"
                  >
                    Kunci Kembali
                  </button>
                </div>
              </div>
            )}

            {cryptoError && (
              <p role="alert" className="text-xs text-rose-600 dark:text-rose-400 mt-3">
                {cryptoError}
              </p>
            )}
            {statusMessage && (
              <p role="status" className="text-xs text-[#2D6A4F] dark:text-[#F59E0B] mt-3">
                {statusMessage}
              </p>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-900/8 dark:border-[#EAE0D5]/10">
            <motion.button
              type="button"
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleFinishSunset}
              className="w-full min-h-[48px] inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#2D6A4F] hover:bg-[#23543E] dark:bg-[#D97706] dark:hover:bg-[#B45309] text-white dark:text-[#161311] text-sm font-semibold shadow-sm cursor-pointer"
            >
              {sunsetDoneNow ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Layar Ditutup ({todayLog?.screenOffTime ?? 'Tercatat'}) · Siap Istirahat
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4" />
                  Tutup Layar & Siap Istirahat
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
