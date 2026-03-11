import { Container, Graphics } from 'pixi.js';

export interface DustParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
}

export interface FxState {
  dustPool: DustParticle[];
  nextPoolIndex: number;
  shakeTimeMs: number;
  shakePower: number;
  flashTimeMs: number;
}

function createParticle(): DustParticle {
  return {
    active: false,
    x: 0,
    y: 0,
    vx: 0,
    vy: 0,
    life: 0,
    maxLife: 0,
    size: 0,
  };
}

export function createFxState(poolSize = 500): FxState {
  const dustPool: DustParticle[] = [];
  for (let i = 0; i < poolSize; i += 1) {
    dustPool.push(createParticle());
  }
  return {
    dustPool,
    nextPoolIndex: 0,
    shakeTimeMs: 0,
    shakePower: 0,
    flashTimeMs: 0,
  };
}

export function emitDust(
  state: FxState,
  x: number,
  y: number,
  speedFactor: number,
  intensity = 1
) {
  const clampedIntensity = Math.max(1, intensity);
  const poolSize = state.dustPool.length;
  for (let i = 0; i < clampedIntensity; i += 1) {
    let particle: DustParticle | null = null;
    for (let s = 0; s < poolSize; s += 1) {
      const idx = (state.nextPoolIndex + s) % poolSize;
      if (!state.dustPool[idx].active) {
        particle = state.dustPool[idx];
        state.nextPoolIndex = (idx + 1) % poolSize;
        break;
      }
    }
    if (!particle) return;

    particle.active = true;
    particle.x = x + (Math.random() - 0.5) * 7;
    particle.y = y + 8 + (Math.random() - 0.5) * 6;
    particle.vx = -0.4 - Math.random() * (1 + speedFactor * 1.3);
    particle.vy = -0.08 - Math.random() * 0.25;
    particle.maxLife = 340 + Math.random() * 250;
    particle.life = particle.maxLife;
    particle.size = 1.6 + Math.random() * 2.8;
  }
}

export function updateFxState(state: FxState, deltaMs: number) {
  state.shakeTimeMs = Math.max(0, state.shakeTimeMs - deltaMs);
  state.flashTimeMs = Math.max(0, state.flashTimeMs - deltaMs);

  for (const particle of state.dustPool) {
    if (!particle.active) continue;
    particle.life -= deltaMs;
    if (particle.life <= 0) {
      particle.active = false;
      continue;
    }
    particle.x += particle.vx;
    particle.y += particle.vy;
  }
}

export function renderDust(state: FxState, dustGraphics: Graphics) {
  dustGraphics.clear();
  for (const particle of state.dustPool) {
    if (!particle.active) continue;
    const alpha = particle.life / particle.maxLife;
    dustGraphics
      .circle(particle.x, particle.y, particle.size)
      .fill({ color: 0xd6d3d1, alpha: alpha * 0.45 });
  }
}

export function triggerShake(state: FxState, durationMs: number, power: number) {
  state.shakeTimeMs = Math.max(state.shakeTimeMs, durationMs);
  state.shakePower = Math.max(state.shakePower, power);
}

export function triggerFlash(state: FxState, durationMs: number) {
  state.flashTimeMs = Math.max(state.flashTimeMs, durationMs);
}

export function getShakeOffset(state: FxState) {
  if (state.shakeTimeMs <= 0) return { x: 0, y: 0 };
  const amp = state.shakePower * (state.shakeTimeMs / 220);
  return {
    x: (Math.random() - 0.5) * amp,
    y: (Math.random() - 0.5) * amp,
  };
}

export function ensureLayer(parent: Container): Graphics {
  const g = new Graphics();
  parent.addChild(g);
  return g;
}
