import { useEffect, useRef, useState } from 'react';
import type { ImpulseEvent } from '../types/wellbeing';

export function useTabImpulse(
  isActive: boolean,
  context: 'focus' | 'sunset',
  onRecordImpulse: (evt: ImpulseEvent) => void
) {
  const [switchCount, setSwitchCount] = useState(0);
  const [returnToastVisible, setReturnToastVisible] = useState(false);
  const wasHiddenRef = useRef(false);
  const callbackRef = useRef(onRecordImpulse);

  useEffect(() => {
    callbackRef.current = onRecordImpulse;
  }, [onRecordImpulse]);

  useEffect(() => {
    if (!isActive) {
      wasHiddenRef.current = false;
      return;
    }

    const handleVisibility = () => {
      if (document.visibilityState === 'hidden') {
        wasHiddenRef.current = true;
        const now = new Date();
        setSwitchCount((prev) => prev + 1);
        callbackRef.current({
          timestamp: now.toISOString(),
          hour: now.getHours(),
          context,
        });
      } else if (document.visibilityState === 'visible' && wasHiddenRef.current) {
        wasHiddenRef.current = false;
        setReturnToastVisible(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isActive, context]);

  useEffect(() => {
    if (!returnToastVisible) return;
    const timer = window.setTimeout(() => setReturnToastVisible(false), 4500);
    return () => window.clearTimeout(timer);
  }, [returnToastVisible]);

  const resetSessionCount = () => setSwitchCount(0);
  const dismissToast = () => setReturnToastVisible(false);

  return {
    switchCount,
    returnToastVisible,
    resetSessionCount,
    dismissToast,
  };
}
