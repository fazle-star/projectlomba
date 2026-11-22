import { useEffect, useMemo, useState } from 'react';
import type { CircadianOverride, RhythmSettings } from '../types/wellbeing';

export function useCircadianMode(settings: RhythmSettings) {
  const [override, setOverride] = useState<CircadianOverride>('auto');
  const [now, setNow] = useState<Date>(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const isNightMode = useMemo(() => {
    if (override === 'night') return true;
    if (override === 'day') return false;

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const sunsetMinutes = settings.sunsetHour * 60 + settings.sunsetMinute;
    const morningStart = 6 * 60;
    return currentMinutes >= sunsetMinutes || currentMinutes < morningStart;
  }, [override, now, settings.sunsetHour, settings.sunsetMinute]);

  useEffect(() => {
    const root = document.documentElement;
    if (isNightMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute('content', isNightMode ? '#161311' : '#F7F9F7');
    }
  }, [isNightMode]);

  const greeting = useMemo(() => {
    if (isNightMode) {
      return {
        title: 'Waktunya Digital Sunset',
        subtitle: 'Perlahan turunkan tempo layar malam ini agar pikiran dan matamu pulih untuk esok.',
      };
    }
    const h = now.getHours();
    if (h < 11) {
      return {
        title: 'Selamat Pagi',
        subtitle: 'Mulai hari dengan ritme yang sadar — satu langkah terukur sudah cukup.',
      };
    }
    if (h < 15) {
      return {
        title: 'Selamat Siang',
        subtitle: 'Jaga energi tetap stabil dengan sesi fokus ringan dan jeda istirahat mata.',
      };
    }
    return {
      title: 'Selamat Sore',
      subtitle: 'Selesaikan hal yang paling penting hari ini tanpa membebani malammu.',
    };
  }, [isNightMode, now]);

  return {
    override,
    setOverride,
    isNightMode,
    greeting,
  };
}
