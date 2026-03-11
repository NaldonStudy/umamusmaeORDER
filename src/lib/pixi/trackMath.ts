import { TOTAL_DISTANCE } from '../raceEngine';

export interface TrackConfig {
  centerX: number;
  centerY: number;
  outerRadiusX: number;
  outerRadiusY: number;
  laneSpacing: number;
  laneCount: number;
}

export interface TrackPoint {
  x: number;
  y: number;
  angle: number;
  tangentX: number;
  tangentY: number;
}

export interface MiniMapConfig {
  x: number;
  y: number;
  width: number;
  height: number;
  padding: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getProgress(distance: number): number {
  const wrapped = ((distance % TOTAL_DISTANCE) + TOTAL_DISTANCE) % TOTAL_DISTANCE;
  return wrapped / TOTAL_DISTANCE;
}

export function createTrackConfig(width: number, height: number, laneCount: number): TrackConfig {
  const safeLaneCount = Math.max(1, laneCount);
  const minSide = Math.min(width, height);
  const outerRadiusX = clamp(width * 0.36, 180, width * 0.46);
  const outerRadiusY = clamp(height * 0.32, 115, minSide * 0.39);
  const laneSpacing = clamp(minSide * 0.013, 7, 14);
  return {
    centerX: width * 0.5,
    centerY: height * 0.56,
    outerRadiusX,
    outerRadiusY,
    laneSpacing,
    laneCount: safeLaneCount,
  };
}

export function distanceToTrackPoint(distance: number, laneIndex: number, cfg: TrackConfig): TrackPoint {
  const progress = getProgress(distance);
  const theta = progress * Math.PI * 2 - Math.PI / 2;

  const laneOffset = laneIndex * cfg.laneSpacing;
  const radiusX = Math.max(22, cfg.outerRadiusX - laneOffset);
  const radiusY = Math.max(16, cfg.outerRadiusY - laneOffset * 0.92);

  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  const x = cfg.centerX + radiusX * cos;
  const y = cfg.centerY + radiusY * sin;

  // Tangent for clockwise travel.
  const tangentX = -radiusX * sin;
  const tangentY = radiusY * cos;
  const tangentLen = Math.hypot(tangentX, tangentY) || 1;

  return {
    x,
    y,
    angle: Math.atan2(tangentY, tangentX),
    tangentX: tangentX / tangentLen,
    tangentY: tangentY / tangentLen,
  };
}

export function getCameraOffset(
  leaderDistance: number,
  laneIndex: number,
  cfg: TrackConfig,
  width: number,
  height: number
) {
  const leader = distanceToTrackPoint(leaderDistance, laneIndex, cfg);
  const lookAhead = 78;
  const targetX = leader.x + leader.tangentX * lookAhead;
  const targetY = leader.y + leader.tangentY * lookAhead * 0.5;
  return {
    x: width * 0.5 - targetX,
    y: height * 0.57 - targetY,
  };
}

export function distanceToMiniMapPoint(
  distance: number,
  laneIndex: number,
  laneCount: number,
  mini: MiniMapConfig
) {
  const progress = getProgress(distance);
  const theta = progress * Math.PI * 2 - Math.PI / 2;
  const maxInset = Math.max(1, laneCount - 1);
  const laneT = laneIndex / maxInset;
  const rx = (mini.width * 0.5 - mini.padding) - laneT * 3;
  const ry = (mini.height * 0.5 - mini.padding) - laneT * 3;
  const cx = mini.x + mini.width * 0.5;
  const cy = mini.y + mini.height * 0.5;

  return {
    x: cx + Math.cos(theta) * rx,
    y: cy + Math.sin(theta) * ry,
  };
}
