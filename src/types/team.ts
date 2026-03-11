import type { Skill, ActiveEffect } from './skill';

export interface Team {
  id: string;
  name: string;
  color: string;
  emoji: string;
  baseSpeed: number;
  acceleration: number;
  stamina: number;
  condition: number;
  skills: Skill[];
}

export interface TeamRaceState {
  teamId: string;
  position: number;
  speed: number;
  staminaLeft: number;
  rank: number;
  finishTime: number | null;
  activeEffects: ActiveEffect[];
  skillCooldowns: Record<string, number>;
  lastRank: number;
}
