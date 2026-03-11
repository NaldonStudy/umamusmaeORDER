import { useMemo } from 'react';
import { useRaceStore } from '../../store/raceStore';
import StarsBg from '../common/StarsBg';

export default function ResultBoard() {
  const { raceState, startCountdown, reset } = useRaceStore();

  const results = useMemo(() => {
    if (!raceState || raceState.phase !== 'result') return [];
    return raceState.rankings.map((teamId, index) => {
      const team = raceState.teams.find((t) => t.id === teamId)!;
      const ts = raceState.teamStates.find((s) => s.teamId === teamId)!;
      const skillsActivated = raceState.logs.filter(
        (l) => l.teamId === teamId && l.type === 'skill_activate'
      ).length;
      const overtakesMade = raceState.logs.filter(
        (l) => l.teamId === teamId && l.type === 'overtake'
      ).length;
      return {
        rank: index + 1,
        team,
        finishTime: ts.finishTime ?? raceState.tick,
        skillsActivated,
        overtakesMade,
      };
    });
  }, [raceState]);

  const skillLogs = useMemo(
    () =>
      raceState?.logs
        .filter((l) => l.type === 'skill_activate' || l.type === 'overtake' || l.type === 'finish')
        .slice(-25)
        .reverse() ?? [],
    [raceState]
  );

  const mvp = useMemo(() => {
    if (!results.length) return null;
    return results.reduce((best, r) =>
      r.skillsActivated + r.overtakesMade * 2 > best.skillsActivated + best.overtakesMade * 2
        ? r
        : best
    );
  }, [results]);

  if (!raceState || raceState.phase !== 'result') return null;

  const top3 = results.slice(0, 3);
  const totalTicks = raceState.totalTicks;

  return (
    <div className="result-screen">
      <StarsBg />

      <div className="result-fireworks" style={{ position: 'relative', zIndex: 1 }}>
        🎊 🏆 🎊
      </div>
      <div className="result-title" style={{ position: 'relative', zIndex: 1 }}>
        레이스 종료!
      </div>

      <div className="result-podium" style={{ position: 'relative', zIndex: 1 }}>
        {top3.map((r) => (
          <div key={r.team.id} className={`podium-slot rank-${r.rank}`}>
            <div className="podium-avatar">{r.team.emoji}</div>
            <div className="podium-name" style={{ color: r.team.color }}>
              {r.team.name}
            </div>
            <div className="podium-block">
              {r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : '🥉'}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          gap: '0.75rem',
          flexWrap: 'wrap',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <StatChip icon="⏱️" label="총 진행 틱" value={`${totalTicks}`} />
        <StatChip
          icon="⚡"
          label="총 스킬 발동"
          value={`${results.reduce((s, r) => s + r.skillsActivated, 0)}회`}
        />
        <StatChip
          icon="⚔️"
          label="총 추월"
          value={`${results.reduce((s, r) => s + r.overtakesMade, 0)}회`}
        />
        {mvp && (
          <StatChip
            icon="🌟"
            label="MVP"
            value={mvp.team.name}
            color={mvp.team.color}
          />
        )}
      </div>

      <div className="result-rankings" style={{ position: 'relative', zIndex: 1 }}>
        <div className="result-rankings-title">— 전체 순위 —</div>
        {results.map((r) => {
          const medal =
            r.rank === 1 ? 'gold' : r.rank === 2 ? 'silver' : r.rank === 3 ? 'bronze' : '';
          return (
            <div
              className="result-rank-item"
              key={r.team.id}
              style={{
                animationDelay: `${r.rank * 0.08}s`,
                borderColor:
                  r.rank <= 3 ? `${r.team.color}44` : 'rgba(255,255,255,0.08)',
              }}
            >
              <div className={`result-rank-num ${medal}`}>{r.rank}</div>
              <div className="result-rank-emoji">{r.team.emoji}</div>
              <div style={{ flex: 1 }}>
                <div className="result-rank-name" style={{ color: r.team.color }}>
                  {r.team.name}
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', marginTop: '2px' }}>
                  {r.skillsActivated > 0 && (
                    <span className="result-rank-skill-count">⚡ {r.skillsActivated}</span>
                  )}
                  {r.overtakesMade > 0 && (
                    <span
                      className="result-rank-skill-count"
                      style={{
                        background: 'rgba(251,191,36,0.15)',
                        color: '#fbbf24',
                      }}
                    >
                      ⚔️ {r.overtakesMade}
                    </span>
                  )}
                </div>
              </div>
              {mvp?.team.id === r.team.id && (
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 900,
                    color: '#fbbf24',
                    background: 'rgba(251,191,36,0.15)',
                    borderRadius: '6px',
                    padding: '0.2rem 0.5rem',
                  }}
                >
                  MVP 🌟
                </span>
              )}
            </div>
          );
        })}
      </div>

      <div className="result-log-section" style={{ position: 'relative', zIndex: 1 }}>
        <div className="result-log-title">레이스 하이라이트</div>
        <div className="result-log-list">
          {skillLogs.map((log, i) => (
            <div
              key={`result-log-${i}`}
              className={`log-entry log-${log.type}`}
              style={{ fontSize: '0.82rem' }}
            >
              {log.message}
            </div>
          ))}
          {skillLogs.length === 0 && (
            <div
              style={{
                color: '#4b5563',
                fontSize: '0.82rem',
                textAlign: 'center',
                padding: '0.5rem',
              }}
            >
              기록 없음
            </div>
          )}
        </div>
      </div>

      <div className="result-actions" style={{ position: 'relative', zIndex: 1 }}>
        <button className="btn-replay" onClick={startCountdown}>
          🔄 같은 팀으로 재경주
        </button>
        <button className="btn-home" onClick={reset}>
          🏠 처음으로
        </button>
      </div>
    </div>
  );
}

function StatChip({
  icon,
  label,
  value,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  color?: string;
}) {
  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '10px',
        padding: '0.5rem 0.9rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
        minWidth: '80px',
      }}
    >
      <div style={{ fontSize: '1.1rem' }}>{icon}</div>
      <div style={{ fontSize: '0.65rem', color: '#6b7280' }}>{label}</div>
      <div
        style={{
          fontSize: '0.9rem',
          fontWeight: 900,
          color: color ?? '#f8f8ff',
        }}
      >
        {value}
      </div>
    </div>
  );
}
