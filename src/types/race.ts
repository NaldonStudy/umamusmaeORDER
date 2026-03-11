import type { Team, TeamRaceState } from './team';

export type RacePhase = 'setup' | 'countdown' | 'racing' | 'result';

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
