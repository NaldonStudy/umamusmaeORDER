import { Suspense, lazy } from 'react';
import { useRaceStore } from '../../store/raceStore';
import { TOTAL_DISTANCE } from '../../constants/race';
import { useRaceLoop } from '../../hooks/useRaceLoop';
import { useAudio } from '../../hooks/useAudio';
import SkillLog from './SkillLog';
import SkillFlash from './SkillFlash';

const LazyPixiRaceScene = lazy(() => import('./PixiRaceScene'));

export default function RaceTrack() {
  const {
    raceState,
    countdownValue,
    tickRace: doTick,
    tickCountdown,
  } = useRaceStore();

  const { soundEnabled, soundVolume, toggleSound, setVolume } = useAudio(raceState);

  useRaceLoop({
    phase: raceState?.phase,
    onTick: doTick,
    onCountdownTick: tickCountdown,
  });

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
          <button className="audio-toggle-btn" onClick={toggleSound}>
            {soundEnabled ? '음향 켬' : '음향 끔'}
          </button>
          <input
            className="audio-volume-slider"
            type="range"
            min={0}
            max={100}
            value={soundVolume}
            onChange={(e) => setVolume(Number(e.target.value))}
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
