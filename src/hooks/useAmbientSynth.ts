import { useCallback, useEffect, useRef, useState } from 'react';

export type AmbientSoundType = 'none' | 'rain' | 'brown' | 'drone';

export function useAmbientSynth() {
  const [activeSound, setActiveSound] = useState<AmbientSoundType>('none');
  const [volume, setVolume] = useState<number>(0.35);

  const ctxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const cleanupNodeRef = useRef<(() => void) | null>(null);

  const ensureContext = useCallback(() => {
    if (!ctxRef.current) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctxRef.current = new AudioCtx();
    }
    if (ctxRef.current.state === 'suspended') {
      void ctxRef.current.resume();
    }
    if (!masterGainRef.current && ctxRef.current) {
      const gain = ctxRef.current.createGain();
      gain.gain.value = volume;
      gain.connect(ctxRef.current.destination);
      masterGainRef.current = gain;
    }
    return ctxRef.current;
  }, [volume]);

  const stopSound = useCallback(() => {
    if (cleanupNodeRef.current) {
      cleanupNodeRef.current();
      cleanupNodeRef.current = null;
    }
    setActiveSound('none');
  }, []);

  const startSound = useCallback(
    (type: AmbientSoundType) => {
      if (type === 'none' || type === activeSound) {
        stopSound();
        return;
      }

      if (cleanupNodeRef.current) {
        cleanupNodeRef.current();
        cleanupNodeRef.current = null;
      }

      const ctx = ensureContext();
      const masterGain = masterGainRef.current;
      if (!ctx || !masterGain) return;

      const localGain = ctx.createGain();
      localGain.gain.setValueAtTime(0.001, ctx.currentTime);
      localGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.6);
      localGain.connect(masterGain);

      if (type === 'brown' || type === 'rain') {
        const bufferSize = ctx.sampleRate * 3;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        let lastOut = 0;
        for (let i = 0; i < bufferSize; i += 1) {
          const white = Math.random() * 2 - 1;
          lastOut = (lastOut + 0.02 * white) / 1.02;
          data[i] = type === 'brown' ? lastOut * 3.2 : white * 0.35 + lastOut * 1.4;
        }

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = type === 'rain' ? 'bandpass' : 'lowpass';
        filter.frequency.value = type === 'rain' ? 950 : 280;
        filter.Q.value = type === 'rain' ? 0.65 : 0.9;

        source.connect(filter);
        filter.connect(localGain);
        source.start();

        cleanupNodeRef.current = () => {
          try {
            localGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
            window.setTimeout(() => {
              try {
                source.stop();
                source.disconnect();
                filter.disconnect();
                localGain.disconnect();
              } catch {
                // ignore already stopped nodes
              }
            }, 280);
          } catch {
            // ignore
          }
        };
      } else if (type === 'drone') {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const filter = ctx.createBiquadFilter();

        osc1.type = 'sine';
        osc1.frequency.value = 110; // A2 warm base
        osc2.type = 'triangle';
        osc2.frequency.value = 164.81; // E3 fifth harmonic

        const osc2Gain = ctx.createGain();
        osc2Gain.gain.value = 0.18;

        const osc1Gain = ctx.createGain();
        osc1Gain.gain.value = 0.28;

        filter.type = 'lowpass';
        filter.frequency.value = 320;

        osc1.connect(osc1Gain);
        osc2.connect(osc2Gain);
        osc1Gain.connect(filter);
        osc2Gain.connect(filter);
        filter.connect(localGain);

        osc1.start();
        osc2.start();

        cleanupNodeRef.current = () => {
          try {
            localGain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
            window.setTimeout(() => {
              try {
                osc1.stop();
                osc2.stop();
                osc1.disconnect();
                osc2.disconnect();
                filter.disconnect();
                localGain.disconnect();
              } catch {
                // ignore
              }
            }, 280);
          } catch {
            // ignore
          }
        };
      }

      setActiveSound(type);
    },
    [activeSound, ensureContext, stopSound]
  );

  const playBreathChime = useCallback(
    (phase: 'inhale' | 'hold' | 'exhale' | 'rest') => {
      try {
        const ctx = ensureContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const freqMap = {
          inhale: 396,
          hold: 432,
          exhale: 330,
          rest: 528,
        };
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freqMap[phase], ctx.currentTime);
        gain.gain.setValueAtTime(0.001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.1);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 1.15);
      } catch {
        // Ignore audio context block before user gesture
      }
    },
    [ensureContext]
  );

  useEffect(() => {
    if (masterGainRef.current && ctxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(volume, ctxRef.current.currentTime, 0.08);
    }
  }, [volume]);

  useEffect(() => {
    return () => {
      if (cleanupNodeRef.current) cleanupNodeRef.current();
    };
  }, []);

  return {
    activeSound,
    volume,
    setVolume,
    startSound,
    stopSound,
    playBreathChime,
  };
}
