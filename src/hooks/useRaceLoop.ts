import { useCallback, useEffect, useRef } from 'react';
import { TICK_INTERVAL_MS, COUNTDOWN_INTERVAL_MS } from '../constants/race';
import type { RacePhase } from '../types/race';

interface UseRaceLoopParams {
  phase: RacePhase | undefined;
  onTick: () => void;
  onCountdownTick: () => void;
}

/**
 * 레이스 단계에 따라 게임 루프(setInterval)를 관리하는 훅.
 * - 'countdown' 단계: 900ms 간격으로 카운트다운 감소
 * - 'racing' 단계: 50ms 간격으로 레이스 틱 진행
 * - 'result' 단계: 모든 인터벌 정지
 */
export function useRaceLoop({ phase, onTick, onCountdownTick }: UseRaceLoopParams) {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRaceInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!phase) return;

    if (phase === 'countdown') {
      if (countdownRef.current) return;
      countdownRef.current = setInterval(onCountdownTick, COUNTDOWN_INTERVAL_MS);
      return () => {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
      };
    }

    if (phase === 'racing') {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      if (intervalRef.current) return;
      intervalRef.current = setInterval(onTick, TICK_INTERVAL_MS);
      return () => stopRaceInterval();
    }

    if (phase === 'result') {
      stopRaceInterval();
    }
  }, [phase, onTick, onCountdownTick, stopRaceInterval]);
}
