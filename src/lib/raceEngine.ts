import type {
  Team,
  TeamRaceState,
  RaceState,
  RaceLog,
  SkillBanner,
  ActiveEffect,
} from '../types/race';

export const TOTAL_DISTANCE = 1000;
export const TICK_INTERVAL_MS = 50;
const BASE_SPEED_MIN = 4.5;
const BASE_SPEED_MAX = 6.5;
const STAMINA_DRAIN_RATE = 0.25;
const STAMINA_SPEED_PENALTY_THRESHOLD = 20;

export function createInitialTeamState(team: Team): TeamRaceState {
  return {
    teamId: team.id,
    position: 0,
    speed: team.baseSpeed,
    staminaLeft: team.stamina,
    rank: 1,
    finishTime: null,
    activeEffects: [],
    skillCooldowns: {},
    lastRank: 1,
  };
}

export function createInitialRaceState(teams: Team[]): RaceState {
  return {
    phase: 'countdown',
    teams,
    teamStates: teams.map(createInitialTeamState),
    tick: 0,
    totalTicks: 0,
    logs: [],
    rankings: [],
    activeSkillBanners: [],
  };
}

function calcSpeedMultiplier(state: TeamRaceState): number {
  let multiplier = 1.0;

  for (const effect of state.activeEffects) {
    if (
      effect.effectType === 'speed_boost' ||
      effect.effectType === 'burst' ||
      effect.effectType === 'acceleration_boost'
    ) {
      multiplier *= effect.effectValue;
    }
    if (effect.effectType === 'resist_slowdown') {
      multiplier = Math.max(multiplier, effect.effectValue);
    }
  }

  if (state.staminaLeft < STAMINA_SPEED_PENALTY_THRESHOLD) {
    const penaltyFactor = 0.7 + (state.staminaLeft / STAMINA_SPEED_PENALTY_THRESHOLD) * 0.3;
    multiplier *= penaltyFactor;
  }

  return multiplier;
}

function tickEffects(state: TeamRaceState): TeamRaceState {
  const next = state.activeEffects
    .map((e) => ({ ...e, remainingTicks: e.remainingTicks - 1 }))
    .filter((e) => e.remainingTicks > 0);

  const cooldowns = { ...state.skillCooldowns };
  for (const key of Object.keys(cooldowns)) {
    cooldowns[key] = Math.max(0, cooldowns[key] - 1);
  }

  return { ...state, activeEffects: next, skillCooldowns: cooldowns };
}

function tryActivateSkills(
  team: Team,
  state: TeamRaceState,
  raceProgress: number,
  rank: number,
  totalTeams: number,
  tick: number,
  logs: RaceLog[],
  banners: SkillBanner[]
): TeamRaceState {
  let updatedState = { ...state };
  const newLogs: RaceLog[] = [];
  const newBanners: SkillBanner[] = [];

  for (const skill of team.skills) {
    const cd = updatedState.skillCooldowns[skill.id] ?? 0;
    if (cd > 0) continue;

    const alreadyActive = updatedState.activeEffects.some((e) => e.skillId === skill.id);
    if (alreadyActive) continue;

    const triggered = skill.triggerCondition
      ? skill.triggerCondition(updatedState, raceProgress, rank, totalTeams)
      : false;

    if (!triggered) continue;

    const newEffect: ActiveEffect = {
      skillId: skill.id,
      skillName: skill.name,
      effectType: skill.effectType,
      effectValue: skill.effectValue,
      remainingTicks: skill.duration,
      color: skill.color,
      icon: skill.icon,
    };

    if (skill.effectType === 'stamina_recover') {
      updatedState = {
        ...updatedState,
        staminaLeft: Math.min(100, updatedState.staminaLeft + skill.effectValue),
        skillCooldowns: { ...updatedState.skillCooldowns, [skill.id]: skill.cooldown },
      };
    } else {
      updatedState = {
        ...updatedState,
        activeEffects: [...updatedState.activeEffects, newEffect],
        skillCooldowns: { ...updatedState.skillCooldowns, [skill.id]: skill.cooldown },
      };
    }

    const log: RaceLog = {
      tick,
      teamId: team.id,
      teamName: team.name,
      teamColor: team.color,
      type: 'skill_activate',
      message: `${skill.icon} ${team.name} — ${skill.name}!`,
      skillName: skill.name,
      skillIcon: skill.icon,
      skillColor: skill.color,
    };
    newLogs.push(log);

    const banner: SkillBanner = {
      id: `${team.id}-${skill.id}-${tick}`,
      teamId: team.id,
      teamName: team.name,
      teamColor: team.color,
      skillName: skill.name,
      skillIcon: skill.icon,
      skillColor: skill.color,
      expiresAt: tick + 40,
    };
    newBanners.push(banner);
  }

  logs.push(...newLogs);
  banners.push(...newBanners);

  return updatedState;
}

function updateRanks(teamStates: TeamRaceState[]): TeamRaceState[] {
  const sorted = [...teamStates].sort((a, b) => {
    if (a.finishTime !== null && b.finishTime !== null) return a.finishTime - b.finishTime;
    if (a.finishTime !== null) return -1;
    if (b.finishTime !== null) return 1;
    return b.position - a.position;
  });

  return teamStates.map((s) => {
    const rank = sorted.findIndex((x) => x.teamId === s.teamId) + 1;
    return { ...s, lastRank: s.rank, rank };
  });
}

export function tickRace(state: RaceState): RaceState {
  if (state.phase !== 'racing') return state;

  const allFinished = state.teamStates.every((s) => s.finishTime !== null);
  if (allFinished) {
    const rankings = [...state.teamStates]
      .sort((a, b) => (a.finishTime ?? Infinity) - (b.finishTime ?? Infinity))
      .map((s) => s.teamId);
    return { ...state, phase: 'result', rankings };
  }

  const tick = state.tick + 1;
  const totalDistance = TOTAL_DISTANCE;
  const newLogs: RaceLog[] = [];
  const newBanners: SkillBanner[] = [];

  let updatedStates = state.teamStates.map((s) => {
    if (s.finishTime !== null) return s;

    const team = state.teams.find((t) => t.id === s.teamId)!;
    const raceProgress = s.position / totalDistance;

    let ns = tickEffects(s);
    ns = tryActivateSkills(team, ns, raceProgress, ns.rank, state.teams.length, tick, newLogs, newBanners);

    const speedMult = calcSpeedMultiplier(ns);
    const randVariance = 1 + (Math.random() - 0.5) * 0.06;
    const baseMove = team.baseSpeed * speedMult * randVariance;

    const newPosition = Math.min(totalDistance, ns.position + baseMove);
    const staminaDrain = STAMINA_DRAIN_RATE * speedMult;
    const newStamina = Math.max(0, ns.staminaLeft - staminaDrain);

    const finished = newPosition >= totalDistance;
    const finishTime = finished && ns.finishTime === null ? tick : ns.finishTime;

    if (finished && ns.finishTime === null) {
      newLogs.push({
        tick,
        teamId: team.id,
        teamName: team.name,
        teamColor: team.color,
        type: 'finish',
        message: `🏁 ${team.name} 결승선 통과!`,
      });
    }

    return {
      ...ns,
      position: newPosition,
      speed: baseMove,
      staminaLeft: newStamina,
      finishTime,
    };
  });

  updatedStates = updateRanks(updatedStates);

  updatedStates.forEach((ns) => {
    if (ns.rank > ns.lastRank) {
      const overtaker = updatedStates.find((x) => x.rank === ns.lastRank);
      if (overtaker) {
        const overtakerTeam = state.teams.find((t) => t.id === overtaker.teamId)!;
        const nsTeam = state.teams.find((t) => t.id === ns.teamId)!;
        newLogs.push({
          tick,
          teamId: overtakerTeam.id,
          teamName: overtakerTeam.name,
          teamColor: overtakerTeam.color,
          type: 'overtake',
          message: `⚔️ ${overtakerTeam.name}이(가) ${nsTeam.name}을(를) 추월!`,
        });
      }
    }
  });

  const activeBanners = [
    ...state.activeSkillBanners.filter((b) => b.expiresAt > tick),
    ...newBanners,
  ];

  const allDone = updatedStates.every((s) => s.finishTime !== null);
  const rankings = allDone
    ? [...updatedStates]
        .sort((a, b) => (a.finishTime ?? Infinity) - (b.finishTime ?? Infinity))
        .map((s) => s.teamId)
    : state.rankings;

  return {
    ...state,
    tick,
    totalTicks: tick,
    teamStates: updatedStates,
    logs: [...state.logs, ...newLogs],
    activeSkillBanners: activeBanners,
    rankings,
    phase: allDone ? 'result' : 'racing',
  };
}

export function generateTeamColor(index: number): string {
  const colors = [
    '#f43f5e', '#f97316', '#eab308', '#22c55e',
    '#14b8a6', '#3b82f6', '#8b5cf6', '#ec4899',
    '#06b6d4', '#84cc16', '#a855f7', '#ef4444',
  ];
  return colors[index % colors.length];
}

export function generateTeamEmoji(index: number): string {
  const emojis = ['🐎', '🦄', '🐴', '🏇', '⭐', '🌸', '💫', '🌟', '🔥', '⚡', '🌈', '🎀'];
  return emojis[index % emojis.length];
}

export function clampSpeed(speed: number): number {
  return Math.max(BASE_SPEED_MIN, Math.min(BASE_SPEED_MAX, speed));
}
