import { useEffect, useState } from 'react';
import type { SkillBanner } from '../types/race';

interface Props {
  banners: SkillBanner[];
}

interface FlashItem {
  id: string;
  banner: SkillBanner;
  visible: boolean;
}

export default function SkillFlash({ banners }: Props) {
  const [flashes, setFlashes] = useState<FlashItem[]>([]);
  const seenIds = useState(() => new Set<string>())[0];

  useEffect(() => {
    const newOnes = banners.filter((b) => !seenIds.has(b.id));
    if (newOnes.length === 0) return;

    newOnes.forEach((b) => seenIds.add(b.id));

    const items: FlashItem[] = newOnes.map((b) => ({
      id: b.id,
      banner: b,
      visible: true,
    }));

    setFlashes((prev) => [...prev, ...items].slice(-6));

    const timer = setTimeout(() => {
      setFlashes((prev) => prev.map((f) =>
        items.some((i) => i.id === f.id) ? { ...f, visible: false } : f
      ));
    }, 1800);

    const cleanup = setTimeout(() => {
      setFlashes((prev) => prev.filter((f) => f.visible));
    }, 2500);

    return () => {
      clearTimeout(timer);
      clearTimeout(cleanup);
    };
  }, [banners, seenIds]);

  if (flashes.length === 0) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem',
        padding: '1rem',
        zIndex: 100,
        pointerEvents: 'none',
      }}
    >
      {flashes.filter((f) => f.visible).map((f) => (
        <div
          key={f.id}
          style={{
            background: `linear-gradient(135deg, ${f.banner.skillColor}22, ${f.banner.skillColor}44)`,
            border: `2px solid ${f.banner.skillColor}`,
            borderRadius: '14px',
            padding: '0.6rem 1.2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            boxShadow: `0 0 20px ${f.banner.skillColor}66`,
            animation: 'flashIn 0.35s cubic-bezier(0.34,1.56,0.64,1)',
            maxWidth: '280px',
          }}
        >
          <span style={{ fontSize: '1.6rem' }}>{f.banner.skillIcon}</span>
          <div>
            <div
              style={{
                fontSize: '0.75rem',
                fontWeight: 900,
                color: f.banner.teamColor,
                textShadow: `0 0 8px ${f.banner.teamColor}`,
              }}
            >
              {f.banner.teamName}
            </div>
            <div
              style={{
                fontSize: '0.95rem',
                fontWeight: 900,
                color: f.banner.skillColor,
              }}
            >
              {f.banner.skillName}
            </div>
          </div>
        </div>
      ))}

      <style>{`
        @keyframes flashIn {
          from { opacity: 0; transform: translateX(40px) scale(0.8); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
