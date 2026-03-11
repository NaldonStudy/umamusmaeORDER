import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import { useRaceStore } from '../store/raceStore';
import { TOTAL_DISTANCE, TICK_INTERVAL_MS } from '../lib/raceEngine';
import type { RaceState } from '../types/race';
import SkillLog from './SkillLog';
import SkillFlash from './SkillFlash';

const LazyPixiRaceScene = lazy(() => import('./PixiRaceScene'));

interface RaceAudioSystemLike {
  init(): Promise<void>;
  setEnabled(on: boolean): Promise<void>;
  setVolume(vol: number): void;
  updateFromRaceState(state: RaceState | null): void;
  playLogEvent(log: { type: string }): void;
  destroy(): void;
}

export default function RaceTrack() {
  const {
    raceState,
    countdownValue,
    tickRace: doTick,
    tickCountdown,
  } = useRaceStore();
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [soundVolume, setSoundVolume] = useState(55);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<RaceAudioSystemLike | null>(null);
  const audioLoadRef = useRef<Promise<RaceAudioSystemLike | null> | null>(null);
  const lastAudioLogIndexRef = useRef(0);

  const stopRaceInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

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
    const audio = audioRef.current;
    if (!audio) return;
    audio.setVolume(soundVolume / 100);
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
      const audio = audioRef.current;
      if (!audio) return;
      await audio.setEnabled(false);
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

  useEffect(() => {
    if (!raceState) return;

    if (raceState.phase === 'countdown') {
      if (countdownRef.current) return;
      countdownRef.current = setInterval(() => {
        tickCountdown();
      }, 900);
      return () => {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
      };
    }

    if (raceState.phase === 'racing') {
      if (countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
      if (intervalRef.current) return;
      intervalRef.current = setInterval(() => {
        doTick();
      }, TICK_INTERVAL_MS);
      return () => stopRaceInterval();
    }

    if (raceState.phase === 'result') {
      stopRaceInterval();
    }
  }, [raceState?.phase, doTick, stopRaceInterval, tickCountdown]);

  if (!raceState) return null;

  if (raceState.phase === 'countdown') {
    return (
      <div className="countdown-screen">
        {countdownValue > 0 ? (
          <>
            <div className="countdown-label">레이스 준비 완료!</div>
            <div className="countdown-number" key={countdownValue}>
              {countdownValue}
            </div>
            <div style={{ color: '#6b7280', fontSize: '0.9rem' }}>
              {raceState.teams.length}팀 참가
            </div>
          </>
        ) : (
          <div className="countdown-go" key="go">GO!</div>
        )}
      </div>
    );
  }

  if (raceState.phase !== 'racing') return null;

  const sortedByRank = [...raceState.teamStates].sort((a, b) => a.rank - b.rank);
  const leaderPos = Math.max(...raceState.teamStates.map((s) => s.position));
  const overallProgress = leaderPos / TOTAL_DISTANCE;
  const finishedCount = raceState.teamStates.filter((s) => s.finishTime !== null).length;
  const totalTeams = raceState.teams.length;
  const topRankings = sortedByRank.slice(0, Math.min(6, raceState.teamStates.length));

  return (
    <div className="race-screen">
      <SkillFlash banners={raceState.activeSkillBanners} />

      <div className="race-header">
        <span className="race-title-bar">🏇 그랑프리 레이스</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
          {finishedCount > 0 && (
            <span style={{ color: '#34d399', fontSize: '0.82rem', fontWeight: 700 }}>
              🏁 {finishedCount}/{totalTeams} 완주
            </span>
          )}
          <button
            className="audio-toggle-btn"
            onClick={() => setSoundEnabled((prev) => !prev)}
          >
            {soundEnabled ? '음향 켬' : '음향 끔'}
          </button>
          <input
            className="audio-volume-slider"
            type="range"
            min={0}
            max={100}
            value={soundVolume}
            onChange={(e) => setSoundVolume(Number(e.target.value))}
          />
          <span className="race-progress-label">
            {Math.min(100, Math.round(overallProgress * 100))}%
          </span>
        </div>
      </div>

      <div className="pixi-track-wrapper">
        <Suspense fallback={<div className="pixi-loading">레이스 렌더러 로딩 중...</div>}>
          <LazyPixiRaceScene raceState={raceState} />
        </Suspense>
        <div className="race-ranking-overlay">
          <div className="race-ranking-title">실시간 순위</div>
          {topRankings.map((teamState) => {
            const team = raceState.teams.find((t) => t.id === teamState.teamId);
            if (!team) return null;
            return (
              <div key={team.id} className="race-ranking-row">
                <span className="race-ranking-rank">#{teamState.rank}</span>
                <span className="race-ranking-dot" style={{ background: team.color }} />
                <span className="race-ranking-name">{team.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      <SkillLog logs={raceState.logs} />
    </div>
  );
}
