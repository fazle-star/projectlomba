import React from 'react';

interface SelarasLogoProps {
  className?: string;
}

export const SelarasLogo: React.FC<SelarasLogoProps> = ({ className = 'w-8 h-8' }) => {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="20"
        cy="20"
        r="19"
        className="fill-[#2D6A4F] dark:fill-[#D97706] transition-colors duration-700"
      />
      <path
        d="M8.5 17.5C12.3 13.8 16.2 13.8 20 17.5C23.8 21.2 27.7 21.2 31.5 17.5"
        stroke="#F7F9F7"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      <path
        d="M8.5 23.5C12.3 19.8 16.2 19.8 20 23.5C23.8 27.2 27.7 27.2 31.5 23.5"
        stroke="#EAE0D5"
        strokeOpacity="0.88"
        strokeWidth="2.1"
        strokeLinecap="round"
      />
    </svg>
  );
};

export const CalmHorizonIllustration: React.FC<{ isNightMode: boolean }> = ({ isNightMode }) => {
  return (
    <svg
      viewBox="0 0 320 72"
      preserveAspectRatio="none"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-16 pointer-events-none select-none"
      aria-hidden="true"
    >
      <path
        d="M0 48C56 30 112 62 168 44C224 26 274 52 320 38V72H0V48Z"
        fill={isNightMode ? 'rgba(217, 119, 6, 0.12)' : 'rgba(45, 106, 79, 0.08)'}
      />
      <path
        d="M0 56C64 42 128 66 196 50C248 38 286 58 320 48V72H0V56Z"
        fill={isNightMode ? 'rgba(217, 119, 6, 0.08)' : 'rgba(45, 106, 79, 0.05)'}
      />
    </svg>
  );
};
