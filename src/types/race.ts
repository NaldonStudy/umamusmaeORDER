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
  triggerCondition?: (state: TeamRaceState, raceProgress: number, rank: number, totalTeams: number) => boolean;
  duration: number;
  effectType: SkillEffectType;
  effectValue: number;
  cooldown: number;
  rarity: 'common' | 'rare' | 'epic';
  color: string;
  icon: string;
}

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

export interface ActiveEffect {
  skillId: string;
  skillName: string;
  effectType: SkillEffectType;
  effectValue: number;
  remainingTicks: number;
  color: string;
  icon: string;
}

export interface RaceLog {
  tick: number;
  teamId: string;
  teamName: string;
  teamColor: string;
  type: 'skill_activate' | 'overtake' | 'finish' | 'burst';
  message: string;
  skillName?: string;
  skillIcon?: string;
  skillColor?: string;
}

export type RacePhase = 'setup' | 'countdown' | 'racing' | 'result';

export interface RaceState {
  phase: RacePhase;
  teams: Team[];
  teamStates: TeamRaceState[];
  tick: number;
  totalTicks: number;
  logs: RaceLog[];
  rankings: string[];
  activeSkillBanners: SkillBanner[];
}

export interface SkillBanner {
  id: string;
  teamId: string;
  teamName: string;
  teamColor: string;
  skillName: string;
  skillIcon: string;
  skillColor: string;
  expiresAt: number;
}

export interface RaceResult {
  rankings: Array<{
    rank: number;
    team: Team;
    finishTime: number;
    skillsActivated: number;
  }>;
  logs: RaceLog[];
  mvp: Team | null;
  mostOvertakes: Team | null;
}
