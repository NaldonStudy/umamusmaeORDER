import { useEffect, useRef } from 'react';
import { Application, Container, Graphics } from 'pixi.js';
import type { RaceState, TeamRaceState } from '../types/race';
import {
  createTrackConfig,
  distanceToMiniMapPoint,
  distanceToTrackPoint,
  getCameraOffset,
  type MiniMapConfig,
} from '../lib/pixi/trackMath';
import {
  createRunnerBundle,
  destroyRunnerBundle,
  prepareRunnerFrames,
  updateRunnerBundle,
  type RunnerBundle,
} from '../lib/pixi/runnerLayer';
import {
  createFxState,
  emitDust,
  ensureLayer,
  getShakeOffset,
  renderDust,
  triggerFlash,
  triggerShake,
  updateFxState,
} from '../lib/pixi/fxLayer';

interface Props {
  raceState: RaceState;
}

export default function PixiRaceScene({ raceState }: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const appRef = useRef<Application | null>(null);
  const trackRef = useRef<Graphics | null>(null);
  const crowdRef = useRef<Graphics | null>(null);
  const miniMapRef = useRef<Graphics | null>(null);
  const flashRef = useRef<Graphics | null>(null);
  const worldRef = useRef<Container | null>(null);
  const runnerLayerRef = useRef<Container | null>(null);
  const raceStateRef = useRef<RaceState>(raceState);
  const runnerMapRef = useRef<Map<string, RunnerBundle>>(new Map());
  const fxStateRef = useRef(createFxState(550));
  const elapsedRef = useRef(0);
  const lastLogIndexRef = useRef(0);
  const cameraRef = useRef({ x: 0, y: 0 });

  raceStateRef.current = raceState;

  useEffect(() => {
    let disposed = false;

    const init = async () => {
      if (!hostRef.current || disposed) return;

      const app = new Application();
      await app.init({
        resizeTo: hostRef.current,
        antialias: true,
        backgroundAlpha: 0,
      });
      if (disposed) {
        app.destroy();
        return;
      }

      await prepareRunnerFrames(import.meta.env.BASE_URL);

      hostRef.current.appendChild(app.canvas);
      appRef.current = app;

      const world = new Container();
      const crowd = new Graphics();
      const track = new Graphics();
      const runnerLayer = new Container();
      const dustLayer = ensureLayer(runnerLayer);
      const miniMap = new Graphics();
      const flash = new Graphics();

      world.addChild(crowd);
      world.addChild(track);
      world.addChild(runnerLayer);
      app.stage.addChild(world);
      app.stage.addChild(miniMap);
      app.stage.addChild(flash);

      worldRef.current = world;
      crowdRef.current = crowd;
      trackRef.current = track;
      runnerLayerRef.current = runnerLayer;
      miniMapRef.current = miniMap;
      flashRef.current = flash;

      // Reuse first child as dedicated dust graphics.
      if (!runnerLayer.children.includes(dustLayer)) {
        runnerLayer.addChild(dustLayer);
      }

      app.ticker.add((ticker) => {
        elapsedRef.current += ticker.deltaMS;
        drawFrame(ticker.deltaMS, dustLayer);
      });
    };

    const drawFrame = (deltaMs: number, dustLayer: Graphics) => {
      const app = appRef.current;
      const world = worldRef.current;
      const track = trackRef.current;
      const crowd = crowdRef.current;
      const miniMap = miniMapRef.current;
      const flash = flashRef.current;
      const runnerLayer = runnerLayerRef.current;
      if (!app || !world || !track || !crowd || !miniMap || !flash || !runnerLayer) return;

      const state = raceStateRef.current;
      const width = app.screen.width;
      const height = app.screen.height;
      const teams = state.teams;
      const teamStates = state.teamStates;
      const laneCount = Math.max(teams.length, 1);
      const t = elapsedRef.current * 0.003;
      const trackConfig = createTrackConfig(width, height, laneCount);

      // Log-triggered effects.
      const newLogs = state.logs.slice(lastLogIndexRef.current);
      lastLogIndexRef.current = state.logs.length;
      for (const log of newLogs) {
        if (log.type === 'skill_activate') {
          triggerFlash(fxStateRef.current, 190);
          triggerShake(fxStateRef.current, 150, 4.5);
        } else if (log.type === 'overtake') {
          triggerShake(fxStateRef.current, 130, 3.5);
        } else if (log.type === 'finish') {
          triggerFlash(fxStateRef.current, 280);
          triggerShake(fxStateRef.current, 230, 5.5);
        }
      }
      updateFxState(fxStateRef.current, deltaMs);

      // Camera follow.
      const leader = [...teamStates].sort((a, b) => a.rank - b.rank)[0];
      const leaderLaneIndex = Math.max(
        0,
        teams.findIndex((x) => x.id === leader?.teamId)
      );
      const camTarget = getCameraOffset(leader?.position ?? 0, leaderLaneIndex, trackConfig, width, height);
      cameraRef.current.x += (camTarget.x - cameraRef.current.x) * 0.08;
      cameraRef.current.y += (camTarget.y - cameraRef.current.y) * 0.08;
      const shake = getShakeOffset(fxStateRef.current);
      world.position.set(cameraRef.current.x + shake.x, cameraRef.current.y + shake.y);

      // Crowd with parallax.
      crowd.clear();
      const standY = trackConfig.centerY - trackConfig.outerRadiusY - 52;
      crowd.rect(0, standY, width * 1.2, 54).fill({ color: 0x0f172a, alpha: 0.92 });
      crowd.rect(0, standY + 44, width * 1.2, 10).fill({ color: 0x334155, alpha: 1 });
      for (let layer = 0; layer < 3; layer += 1) {
        const count = 78 - layer * 15;
        const baseY = standY + 36 - layer * 9;
        const step = width / count;
        for (let i = 0; i < count; i += 1) {
          const x = i * step + (layer + 1) * (cameraRef.current.x * 0.18);
          const wobble = Math.sin(t * (1.3 + layer * 0.3) + i * 0.3) * (1.5 + layer * 0.8);
          const color =
            i % 4 === 0 ? 0xf472b6 : i % 4 === 1 ? 0x60a5fa : i % 4 === 2 ? 0xfbbf24 : 0x4ade80;
          crowd.circle(x, baseY + wobble, 1.8 + layer * 0.45).fill({ color, alpha: 0.86 });
        }
      }

      // Track geometry.
      track.clear();
      track.ellipse(trackConfig.centerX, trackConfig.centerY, trackConfig.outerRadiusX + 28, trackConfig.outerRadiusY + 28).fill({ color: 0x166534, alpha: 0.5 });
      for (let lane = 0; lane < laneCount; lane += 1) {
        const rx = Math.max(22, trackConfig.outerRadiusX - lane * trackConfig.laneSpacing);
        const ry = Math.max(16, trackConfig.outerRadiusY - lane * trackConfig.laneSpacing * 0.92);
        if (lane === 0) {
          track.ellipse(trackConfig.centerX, trackConfig.centerY, rx + 8, ry + 8).fill({ color: 0x7c4a2f, alpha: 0.97 });
        }
        track.ellipse(trackConfig.centerX, trackConfig.centerY, rx, ry).stroke({
          color: lane % 2 === 0 ? 0xfde68a : 0xf3f4f6,
          alpha: 0.32,
          width: 2,
        });
      }
      track.ellipse(trackConfig.centerX, trackConfig.centerY, trackConfig.outerRadiusX - (laneCount + 1) * trackConfig.laneSpacing, trackConfig.outerRadiusY - (laneCount + 1) * trackConfig.laneSpacing).fill({ color: 0x14532d, alpha: 0.78 });

      // Finish marker on oval.
      const finishOuter = distanceToTrackPoint(0, 0, trackConfig);
      const finishInner = distanceToTrackPoint(0, laneCount - 1, trackConfig);
      track
        .moveTo(finishOuter.x, finishOuter.y)
        .lineTo(finishInner.x, finishInner.y)
        .stroke({ color: 0xfef3c7, width: 4, alpha: 0.95 });

      // Ensure runner bundles.
      const existingIds = new Set(runnerMapRef.current.keys());
      for (const team of teams) {
        if (!runnerMapRef.current.has(team.id)) {
          const bundle = createRunnerBundle(app, runnerLayer, team);
          runnerMapRef.current.set(team.id, bundle);
        }
        existingIds.delete(team.id);
      }
      for (const staleId of existingIds) {
        const stale = runnerMapRef.current.get(staleId);
        if (stale) {
          destroyRunnerBundle(stale);
          runnerMapRef.current.delete(staleId);
        }
      }

      // Runner update + dust/trails.
      const teamStateMap = new Map<string, TeamRaceState>(teamStates.map((s) => [s.teamId, s]));
      for (let laneIndex = 0; laneIndex < teams.length; laneIndex += 1) {
        const team = teams[laneIndex];
        const teamState = teamStateMap.get(team.id);
        if (!teamState) continue;
        const bundle = runnerMapRef.current.get(team.id);
        if (!bundle) continue;

        const point = distanceToTrackPoint(teamState.position, laneIndex, trackConfig);
        const speedFactor = Math.max(0, Math.min(1, teamState.speed / 14));
        const isSkillActive = teamState.activeEffects.length > 0;

        updateRunnerBundle(bundle, point.x, point.y, point.angle, isSkillActive, teamState.speed);

        if (Math.random() < 0.45 + speedFactor * 0.3) {
          emitDust(fxStateRef.current, point.x - point.tangentX * 10, point.y - point.tangentY * 10, speedFactor, isSkillActive ? 2 : 1);
        }

        if (teamState.activeEffects.some((e) => e.effectType === 'burst')) {
          track
            .moveTo(point.x, point.y)
            .lineTo(point.x - point.tangentX * 30, point.y - point.tangentY * 30)
            .stroke({ color: 0xfbbf24, alpha: 0.45, width: 2 });
        }
      }

      renderDust(fxStateRef.current, dustLayer);

      // Oval minimap.
      const mini: MiniMapConfig = {
        x: width - 224,
        y: 12,
        width: 210,
        height: 94,
        padding: 10,
      };
      miniMap.clear();
      miniMap.roundRect(mini.x, mini.y, mini.width, mini.height, 10).fill({ color: 0x0b1020, alpha: 0.8 });
      miniMap.roundRect(mini.x, mini.y, mini.width, mini.height, 10).stroke({ color: 0x6d28d9, alpha: 0.65, width: 1 });
      miniMap.ellipse(mini.x + mini.width * 0.5, mini.y + mini.height * 0.53, mini.width * 0.42, mini.height * 0.34).stroke({ color: 0xf1f5f9, alpha: 0.23, width: 2 });

      for (let lane = 0; lane < teams.length; lane += 1) {
        const team = teams[lane];
        const teamState = teamStateMap.get(team.id);
        if (!teamState) continue;
        const p = distanceToMiniMapPoint(teamState.position, lane, laneCount, mini);
        miniMap.circle(p.x, p.y, teamState.rank === 1 ? 4.1 : 3.2).fill(Number.parseInt(team.color.replace('#', ''), 16));
      }

      // Screen flash.
      flash.clear();
      if (fxStateRef.current.flashTimeMs > 0) {
        const alpha = Math.min(0.22, fxStateRef.current.flashTimeMs / 900);
        flash.rect(0, 0, width, height).fill({ color: 0xffffff, alpha });
      }
    };

    void init();

    return () => {
      disposed = true;
      if (appRef.current) {
        appRef.current.destroy(true, { children: true, texture: false });
        appRef.current = null;
      }
      for (const runner of runnerMapRef.current.values()) {
        destroyRunnerBundle(runner);
      }
      runnerMapRef.current.clear();
      worldRef.current = null;
      trackRef.current = null;
      crowdRef.current = null;
      runnerLayerRef.current = null;
      miniMapRef.current = null;
      flashRef.current = null;
    };
  }, []);

  return <div className="pixi-scene-host" ref={hostRef} />;
}
