import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ShieldCheck, X } from 'lucide-react';
import type { OptionalUserProfile } from '../types/wellbeing';
import { signInOptionalAccount, signUpOptionalAccount } from '../utils/wellbeingSync';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (profile: OptionalUserProfile, note: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthenticated }) => {
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [nickname, setNickname] = useState('Penjelajah Tenang');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!email.trim() || password.length < 6) {
      setErrorMsg('Masukkan email valid dan kata sandi minimal 6 karakter.');
      return;
    }
    setSubmitting(true);
    try {
      const res =
        authTab === 'login'
          ? await signInOptionalAccount(email.trim(), password)
          : await signUpOptionalAccount(nickname.trim(), email.trim(), password);
      onAuthenticated(res.profile, res.note);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal menghubungkan akun.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md rounded-3xl bg-white dark:bg-[#211C18] border border-slate-900/10 dark:border-[#EAE0D5]/12 p-6 md:p-7 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-3 mb-5">
              <div>
                <p className="text-xs font-medium text-[#2D6A4F] dark:text-[#D97706]">
                  Sinkronisasi Opsional
                </p>
                <h2
                  id="auth-modal-title"
                  className="text-xl font-semibold text-[#1E293B] dark:text-[#EAE0D5] mt-0.5"
                >
                  Simpan Ritme Lintas Perangkat
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup modal masuk atau daftar"
                className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-xl bg-[#F7F9F7] dark:bg-[#161311] text-[#1E293B] dark:text-[#EAE0D5] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Auth Tab Switcher */}
            <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#F0F4F0] dark:bg-[#161311] mb-5">
              <button
                type="button"
                onClick={() => {
                  setAuthTab('login');
                  setErrorMsg(null);
                }}
                className={`min-h-[40px] rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                  authTab === 'login'
                    ? 'bg-white dark:bg-[#211C18] text-[#1E293B] dark:text-[#EAE0D5] shadow-sm'
                    : 'text-slate-600 dark:text-[#B8ABA0]'
                }`}
              >
                Masuk
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthTab('register');
                  setErrorMsg(null);
                }}
                className={`min-h-[40px] rounded-lg text-sm font-semibold transition-colors cursor-pointer ${
                  authTab === 'register'
                    ? 'bg-white dark:bg-[#211C18] text-[#1E293B] dark:text-[#EAE0D5] shadow-sm'
                    : 'text-slate-600 dark:text-[#B8ABA0]'
                }`}
              >
                Daftar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {authTab === 'register' && (
                <div>
                  <label
                    htmlFor="auth-nickname"
                    className="block text-xs font-medium text-slate-600 dark:text-[#B8ABA0] mb-1.5"
                  >
                    Nama Panggilan
                  </label>
                  <input
                    id="auth-nickname"
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    placeholder="Penjelajah Tenang"
                    className="w-full min-h-[44px] rounded-xl bg-[#F7F9F7] dark:bg-[#161311] border border-slate-900/10 dark:border-[#EAE0D5]/12 px-4 py-2.5 text-sm text-[#1E293B] dark:text-[#EAE0D5] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#D97706]"
                  />
                </div>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-medium text-slate-600 dark:text-[#B8ABA0] mb-1.5"
                >
                  Email
                </label>
                <input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="kamu@kampus.ac.id"
                  required
                  className="w-full min-h-[44px] rounded-xl bg-[#F7F9F7] dark:bg-[#161311] border border-slate-900/10 dark:border-[#EAE0D5]/12 px-4 py-2.5 text-sm text-[#1E293B] dark:text-[#EAE0D5] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#D97706]"
                />
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-xs font-medium text-slate-600 dark:text-[#B8ABA0] mb-1.5"
                >
                  Kata Sandi
                </label>
                <input
                  id="auth-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                  className="w-full min-h-[44px] rounded-xl bg-[#F7F9F7] dark:bg-[#161311] border border-slate-900/10 dark:border-[#EAE0D5]/12 px-4 py-2.5 text-sm text-[#1E293B] dark:text-[#EAE0D5] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] dark:focus:ring-[#D97706]"
                />
              </div>

              {errorMsg && (
                <p role="alert" className="text-xs text-rose-600 dark:text-rose-400">
                  {errorMsg}
                </p>
              )}

              <motion.button
                type="submit"
                disabled={submitting}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="w-full min-h-[44px] rounded-xl bg-[#2D6A4F] hover:bg-[#23543E] dark:bg-[#D97706] dark:hover:bg-[#B45309] text-white dark:text-[#161311] text-sm font-semibold disabled:opacity-60 cursor-pointer"
              >
                {submitting
                  ? 'Memproses...'
                  : authTab === 'login'
                    ? 'Masuk ke Akun'
                    : 'Buat Akun Tenang'}
              </motion.button>

              <button
                type="button"
                onClick={onClose}
                className="w-full min-h-[44px] rounded-xl bg-[#F7F9F7] dark:bg-[#161311] border border-slate-900/10 dark:border-[#EAE0D5]/12 text-sm font-medium text-[#1E293B] dark:text-[#EAE0D5] cursor-pointer"
              >
                Lanjutkan sebagai Tamu
              </button>
            </form>

            <div className="mt-5 pt-4 border-t border-slate-900/8 dark:border-[#EAE0D5]/10 flex items-start gap-2.5 text-xs text-slate-600 dark:text-[#B8ABA0]">
              <ShieldCheck className="w-4 h-4 text-[#2D6A4F] dark:text-[#D97706] shrink-0 mt-0.5" />
              <span>
                Catatan Brain Dump tetap dienkripsi <strong>AES-GCM</strong> secara lokal di
                perangkatmu sebelum dikirim ke Supabase.
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
