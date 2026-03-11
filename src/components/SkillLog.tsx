import type { RaceLog } from '../types/race';

interface Props {
  logs: RaceLog[];
}

export default function SkillLog({ logs }: Props) {
  const recentLogs = [...logs].slice(-30).reverse();

  return (
    <div className="race-log-panel">
      {recentLogs.map((log, i) => (
        <div
          key={`${log.tick}-${log.teamId}-${i}`}
          className={`log-entry log-${log.type}`}
        >
          {log.message}
        </div>
      ))}
    </div>
  );
}
