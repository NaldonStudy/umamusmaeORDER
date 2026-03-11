import { useState, useRef } from 'react';
import { useRaceStore } from '../store/raceStore';
import StarsBg from './StarsBg';

const QUICK_FILL_NAMES = [
  '소닉', '썬더볼트', '레드스톰', '블루문', '핑크드림',
  '퍼플킹', '골든스타', '실버윈드', '화이트나이트', '블랙로즈',
  '스카이블루', '레인보우',
];

const RARITY_COLORS: Record<string, string> = {
  common: '#94a3b8',
  rare: '#60a5fa',
  epic: '#a78bfa',
};

export default function TeamSetup() {
  const { pendingTeams, addTeam, removeTeam, updateTeamName, startCountdown, clearTeams } =
    useRaceStore();
  const [inputValue, setInputValue] = useState('');
  const [hoveredTeamId, setHoveredTeamId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    const name = inputValue.trim();
    if (!name || pendingTeams.length >= 12) return;
    addTeam(name);
    setInputValue('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleAdd();
  };

  const handleQuickFill = () => {
    clearTeams();
    const sample = [...QUICK_FILL_NAMES].sort(() => Math.random() - 0.5).slice(0, 6);
    sample.forEach((name) => addTeam(name));
  };

  const canStart = pendingTeams.length >= 2;
  const canAdd = pendingTeams.length < 12;

  return (
    <div className="setup-screen">
      <StarsBg />

      <div className="setup-header" style={{ position: 'relative', zIndex: 1 }}>
        <div className="setup-title">🏇 그랑프리 레이스</div>
        <div className="setup-subtitle">
          최대 12팀 · 스킬 시스템 · 실시간 순위 결정 프로그램
        </div>
      </div>

      <div className="setup-container" style={{ position: 'relative', zIndex: 1 }}>
        <div className="team-add-row">
          <input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="팀 / 참가자 이름 입력 후 Enter 또는 + 추가"
            maxLength={20}
            disabled={!canAdd}
          />
          <button
            className="btn-add"
            onClick={handleAdd}
            disabled={!canAdd || !inputValue.trim()}
          >
            + 추가
          </button>
        </div>

        <div className="teams-list">
          {pendingTeams.map((team, idx) => (
            <div
              className="team-item"
              key={team.id}
              onMouseEnter={() => setHoveredTeamId(team.id)}
              onMouseLeave={() => setHoveredTeamId(null)}
            >
              <span className="team-rank-badge">{idx + 1}</span>
              <div
                className="team-color-dot"
                style={{ backgroundColor: team.color, color: team.color }}
              />
              <span className="team-emoji">{team.emoji}</span>
              <input
                value={team.name}
                onChange={(e) => updateTeamName(team.id, e.target.value)}
                maxLength={20}
              />

              <div
                style={{
                  display: 'flex',
                  gap: '3px',
                  alignItems: 'center',
                  flexShrink: 0,
                }}
              >
                {team.skills.map((skill) => (
                  <span
                    key={skill.id}
                    title={`${skill.name} — ${skill.description}`}
                    style={{
                      fontSize: '0.9rem',
                      cursor: 'help',
                      filter: `drop-shadow(0 0 4px ${RARITY_COLORS[skill.rarity]})`,
                    }}
                  >
                    {skill.icon}
                  </span>
                ))}
              </div>

              {hoveredTeamId === team.id && (
                <div
                  style={{
                    position: 'absolute',
                    right: '2.5rem',
                    top: '100%',
                    zIndex: 10,
                    background: '#1a1030',
                    border: '1px solid rgba(167,139,250,0.3)',
                    borderRadius: '10px',
                    padding: '0.6rem 0.9rem',
                    minWidth: '180px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  }}
                >
                  {team.skills.map((skill) => (
                    <div
                      key={skill.id}
                      style={{
                        display: 'flex',
                        gap: '0.5rem',
                        alignItems: 'flex-start',
                        marginBottom: '0.4rem',
                      }}
                    >
                      <span>{skill.icon}</span>
                      <div>
                        <div
                          style={{
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: RARITY_COLORS[skill.rarity],
                          }}
                        >
                          {skill.name}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#6b7280' }}>
                          {skill.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button className="btn-remove" onClick={() => removeTeam(team.id)}>
                ✕
              </button>
            </div>
          ))}

          {pendingTeams.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '2.5rem 1rem',
                color: '#4b5563',
                fontSize: '0.9rem',
                background: 'rgba(255,255,255,0.02)',
                borderRadius: '12px',
                border: '1px dashed rgba(255,255,255,0.08)',
                lineHeight: 1.8,
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🐎</div>
              아직 참가자가 없어요.
              <br />
              이름을 입력해 추가하거나 랜덤으로 채워보세요!
            </div>
          )}
        </div>
      </div>

      <div className="setup-footer" style={{ position: 'relative', zIndex: 1 }}>
        <div className="team-count-info">
          <span>{pendingTeams.length}</span> / 12팀 등록됨
          {pendingTeams.length >= 12 && (
            <span style={{ color: '#f43f5e', marginLeft: '0.5rem' }}>최대 인원 도달</span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <button className="btn-quick" onClick={handleQuickFill}>
            🎲 랜덤 6팀 채우기
          </button>
          {pendingTeams.length > 0 && (
            <button
              className="btn-quick"
              onClick={clearTeams}
              style={{ color: '#f43f5e', borderColor: 'rgba(244,63,94,0.3)' }}
            >
              🗑 전체 삭제
            </button>
          )}
        </div>
        <button className="btn-start" onClick={startCountdown} disabled={!canStart}>
          🏁 레이스 시작!
        </button>
        {!canStart && (
          <div style={{ color: '#6b7280', fontSize: '0.82rem' }}>
            최소 2팀이 있어야 레이스를 시작할 수 있어요
          </div>
        )}
      </div>
    </div>
  );
}
