import { useEffect, useRef, useCallback } from 'react';
import { useRaceStore } from '../store/raceStore';
import { TOTAL_DISTANCE, TICK_INTERVAL_MS } from '../lib/raceEngine';
import type { TeamRaceState, RaceState } from '../types/race';
import SkillLog from './SkillLog';
import SkillFlash from './SkillFlash';

export default function RaceTrack() {
  const {
    raceState,
    countdownValue,
    tickRace: doTick,
    tickCountdown,
  } = useRaceStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopRaceInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

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

  return (
    <div className="race-screen">
      <SkillFlash banners={raceState.activeSkillBanners} />

      <div className="race-header">
        <span className="race-title-bar">🏇 그랑프리 레이스</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {finishedCount > 0 && (
            <span style={{ color: '#34d399', fontSize: '0.82rem', fontWeight: 700 }}>
              🏁 {finishedCount}/{totalTeams} 완주
            </span>
          )}
          <span className="race-progress-label">
            {Math.min(100, Math.round(overallProgress * 100))}%
          </span>
        </div>
      </div>

      <div className="track-wrapper">
        <div className="track-field">
          {sortedByRank.map((ts) => (
            <LaneRow key={ts.teamId} ts={ts} raceState={raceState} />
          ))}
        </div>
      </div>

      <SkillLog logs={raceState.logs} />
    </div>
  );
}

function LaneRow({
  ts,
  raceState,
}: {
  ts: TeamRaceState;
  raceState: RaceState;
}) {
  const team = raceState.teams.find((t) => t.id === ts.teamId)!;
  const posPercent = Math.min(98, (ts.position / TOTAL_DISTANCE) * 100);
  const staminaPct = ts.staminaLeft;
  const hasActiveSkill = ts.activeEffects.length > 0;
  const topSkill = ts.activeEffects[0];
  const hasBurst = ts.activeEffects.some(
    (e) => e.effectType === 'burst'
  );

  const rankChange = ts.lastRank - ts.rank;

  const staminaColor =
    staminaPct > 60
      ? '#34d399'
      : staminaPct > 30
      ? '#fbbf24'
      : '#f43f5e';

  const rankClass =
    ts.rank === 1 ? 'rank-1' : ts.rank === 2 ? 'rank-2' : ts.rank === 3 ? 'rank-3' : '';

  const isFinished = ts.finishTime !== null;

  return (
    <div
      className="track-lane"
      style={{
        opacity: isFinished ? 0.7 : 1,
        background: isFinished ? 'rgba(52,211,153,0.04)' : undefined,
      }}
    >
      <div className={`lane-rank ${rankClass}`}>
        {isFinished ? (
          <span style={{ color: '#34d399', fontSize: '0.8rem' }}>✓</span>
        ) : (
          ts.rank
        )}
      </div>

      <div className="lane-info">
        <span className="lane-emoji">{team.emoji}</span>
        <span className="lane-name" style={{ color: team.color }}>
          {team.name}
        </span>
      </div>

      <div className="lane-track">
        <div
          className="lane-track-bar"
          style={{ width: `${posPercent}%`, background: team.color }}
        />
        {hasBurst && (
          <div
            style={{
              position: 'absolute',
              left: `${Math.max(0, posPercent - 8)}%`,
              width: '8%',
              height: '100%',
              background: `linear-gradient(to left, ${team.color}88, transparent)`,
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        )}
        <div
          className={`lane-runner ${hasActiveSkill ? 'has-skill' : ''}`}
          style={{ left: `${posPercent}%` }}
        >
          {isFinished ? '🏁' : team.emoji}
        </div>
        <div className="lane-finish" />
      </div>

      <div className="lane-stamina-bar">
        <div
          className="lane-stamina-fill"
          style={{ width: `${staminaPct}%`, background: staminaColor }}
        />
      </div>

      <div
        style={{
          width: '20px',
          textAlign: 'center',
          fontSize: '0.7rem',
          fontWeight: 900,
          flexShrink: 0,
        }}
      >
        {rankChange > 0 ? (
          <span style={{ color: '#34d399' }}>↑{rankChange}</span>
        ) : rankChange < 0 ? (
          <span style={{ color: '#f43f5e' }}>↓{Math.abs(rankChange)}</span>
        ) : (
          <span style={{ color: '#4b5563' }}>—</span>
        )}
      </div>

      {topSkill && (
        <div
          className="lane-active-skill"
          style={{
            background: `${topSkill.color}22`,
            color: topSkill.color,
            border: `1px solid ${topSkill.color}55`,
          }}
        >
          {topSkill.icon}
        </div>
      )}
    </div>
  );
}
