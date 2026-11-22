import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Users, Waves } from 'lucide-react';

interface QuietPresenceBarProps {
  isNightMode: boolean;
}

export const QuietPresenceBar: React.FC<QuietPresenceBarProps> = ({ isNightMode }) => {
  const [rippleCount, setRippleCount] = useState(0);
  const [rippleVisible, setRippleVisible] = useState(false);

  const presenceText = isNightMode
    ? '68 orang sedang bersiap istirahat'
    : '42 pelajar sedang fokus belajar';

  const handleSendRipple = () => {
    setRippleCount((prev) => prev + 1);
    setRippleVisible(true);
    window.setTimeout(() => setRippleVisible(false), 1600);
  };

  return (
    <>
      <AnimatePresence>
        {rippleVisible && (
          <div
            aria-hidden="true"
            className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center overflow-hidden"
          >
            {[0, 1, 2].map((idx) => (
              <motion.div
                key={`${rippleCount}-${idx}`}
                initial={{ scale: 0.15, opacity: 0.5 }}
                animate={{ scale: 4.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{
                  duration: 1.45,
                  delay: idx * 0.18,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="absolute w-48 h-48 rounded-full border-2 border-[#2D6A4F]/45 dark:border-[#D97706]/45"
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/85 dark:bg-[#211C18]/90 border border-slate-900/8 dark:border-[#EAE0D5]/10 px-5 py-3.5 transition-colors duration-700">
        <div className="flex items-center gap-2.5 text-xs md:text-sm text-slate-600 dark:text-[#D6C9BC]">
          <Users className="w-4 h-4 text-[#2D6A4F] dark:text-[#D97706] shrink-0" />
          <span>Quiet Presence · {presenceText}</span>
          {rippleCount > 0 && (
            <span className="text-xs font-medium text-[#2D6A4F] dark:text-[#F59E0B]">
              · Gelombang tenang terkirim
            </span>
          )}
        </div>

        <motion.button
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSendRipple}
          className="min-h-[40px] inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F0F4F0] hover:bg-[#E1EAE2] dark:bg-[#2B241F] dark:hover:bg-[#3A3029] text-xs font-semibold text-[#1E293B] dark:text-[#EAE0D5] whitespace-nowrap cursor-pointer"
        >
          <Waves className="w-3.5 h-3.5 text-[#2D6A4F] dark:text-[#D97706]" />
          Kirim Gelombang Tenang
        </motion.button>
      </div>
    </>
  );
};
