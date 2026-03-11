import { useCallback, useEffect, useRef, useState } from 'react';
import type { RaceState } from '../types/race';

interface AudioSystemLike {
  init(): Promise<void>;
  setEnabled(on: boolean): Promise<void>;
  setVolume(vol: number): void;
  updateFromRaceState(state: RaceState | null): void;
  playLogEvent(log: { type: string }): void;
  destroy(): void;
}

interface UseAudioReturn {
  soundEnabled: boolean;
  soundVolume: number;
  toggleSound: () => void;
  setVolume: (vol: number) => void;
}

/**
 * 레이스 오디오 시스템을 관리하는 훅.
 * - 최초 활성화 시 audioRace 모듈을 lazy import하여 초기 번들 크기를 줄임
 * - raceState 변경마다 오디오를 동기화하고 새 로그 이벤트를 SFX로 재생
 */
export function useAudio(raceState: RaceState | null): UseAudioReturn {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundVolume, setSoundVolume] = useState(55);

  const audioRef = useRef<AudioSystemLike | null>(null);
  const audioLoadRef = useRef<Promise<AudioSystemLike | null> | null>(null);
  const lastAudioLogIndexRef = useRef(0);

  const ensureAudioSystem = useCallback(async () => {
    if (audioRef.current) return audioRef.current;
    if (audioLoadRef.current) return await audioLoadRef.current;

    audioLoadRef.current = import('../lib/audioRace')
      .then(async (mod) => {
        const audio = new mod.RaceAudioSystem();
        audioRef.current = audio;
        await audio.init();
        return audio;
      })
      .catch(() => null);

    return await audioLoadRef.current;
  }, []);

  useEffect(() => {
    audioRef.current?.setVolume(soundVolume / 100);
  }, [soundVolume]);

  useEffect(() => {
    let cancelled = false;
    const syncAudio = async () => {
      if (soundEnabled) {
        const audio = await ensureAudioSystem();
        if (!audio || cancelled) return;
        audio.setVolume(soundVolume / 100);
        await audio.setEnabled(true);
        return;
      }
      await audioRef.current?.setEnabled(false);
    };
    void syncAudio();
    return () => {
      cancelled = true;
    };
  }, [ensureAudioSystem, soundEnabled, soundVolume]);

  useEffect(() => {
    return () => {
      audioRef.current?.destroy();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !raceState || !soundEnabled) return;
    audio.updateFromRaceState(raceState);
    const newLogs = raceState.logs.slice(lastAudioLogIndexRef.current);
    lastAudioLogIndexRef.current = raceState.logs.length;
    for (const log of newLogs) {
      audio.playLogEvent(log);
    }
  }, [raceState, soundEnabled]);

  const toggleSound = useCallback(() => setSoundEnabled((prev) => !prev), []);
  const setVolume = useCallback((vol: number) => setSoundVolume(vol), []);

  return { soundEnabled, soundVolume, toggleSound, setVolume };
}
