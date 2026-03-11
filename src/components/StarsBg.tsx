import { useMemo } from 'react';

export default function StarsBg() {
  const stars = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 100}%`,
      dur: `${2 + Math.random() * 4}s`,
      delay: `${Math.random() * 4}s`,
      opacity: 0.3 + Math.random() * 0.6,
    }));
  }, []);

  return (
    <div className="stars-bg">
      {stars.map((s) => (
        <div
          key={s.id}
          className="star"
          style={{
            left: s.left,
            top: s.top,
            '--dur': s.dur,
            '--delay': s.delay,
            '--opacity': s.opacity,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
