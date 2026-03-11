import type { TeamRaceState } from './team';

export type SkillTrigger =
  | 'race_start'
  | 'leading'
  | 'trailing'
  | 'midrace'
  | 'final_stretch'
  | 'random'
  | 'overtaken'
  | 'sprinting';

export type SkillEffectType =
  | 'speed_boost'
  | 'acceleration_boost'
  | 'stamina_recover'
  | 'resist_slowdown'
  | 'burst';

export interface Skill {
  id: string;
  name: string;
  description: string;
  trigger: SkillTrigger;
  triggerCondition?: (
    state: TeamRaceState,
    raceProgress: number,
    rank: number,
    totalTeams: number,
  ) => boolean;
  duration: number;
  effectType: SkillEffectType;
  effectValue: number;
  cooldown: number;
  rarity: 'common' | 'rare' | 'epic';
  color: string;
  icon: string;
}

export interface ActiveEffect {
  skillId: string;
  skillName: string;
  effectType: SkillEffectType;
  effectValue: number;
  remainingTicks: number;
  color: string;
  icon: string;
}
