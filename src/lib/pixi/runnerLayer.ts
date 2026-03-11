import {
  AnimatedSprite,
  Application,
  Container,
  Graphics,
  Sprite,
  Text,
  TextStyle,
  Texture,
} from 'pixi.js';

function hexToNumber(hex: string): number {
  return Number.parseInt(hex.replace('#', ''), 16);
}

function createRunnerFrameTexture(app: Application, bodyColor: number, phase: number): Texture {
  const g = new Graphics();
  const legSwing = phase === 0 ? -2 : phase === 1 ? 2 : phase === 2 ? 1 : -1;

  g.ellipse(12, 10, 11, 7).fill(bodyColor);
  g.circle(21, 8, 5).fill(bodyColor);
  g.circle(24, 6, 2).fill(0x111827);
  g.rect(6, 15, 3, 7 + legSwing).fill(0x111827);
  g.rect(15, 15, 3, 7 - legSwing).fill(0x111827);
  g.rect(8, 8, 4, 2).fill(0xf8fafc);

  const tex = app.renderer.generateTexture(g);
  g.destroy();
  return tex;
}

function createRunnerFrames(app: Application, colorHex: string): Texture[] {
  const c = hexToNumber(colorHex);
  return [
    createRunnerFrameTexture(app, c, 0),
    createRunnerFrameTexture(app, c, 1),
    createRunnerFrameTexture(app, c, 2),
    createRunnerFrameTexture(app, c, 3),
  ];
}

export interface RunnerBundle {
  teamId: string;
  container: Container;
  sprite: AnimatedSprite;
  glow: Sprite;
  label: Text;
  shadow: Sprite;
}

export function createRunnerBundle(
  app: Application,
  parent: Container,
  team: { id: string; name: string; color: string }
): RunnerBundle {
  const frames = createRunnerFrames(app, team.color);
  const sprite = new AnimatedSprite(frames);
  sprite.animationSpeed = 0.24;
  sprite.play();
  sprite.anchor.set(0.5);
  sprite.scale.set(1.15);

  const glow = new Sprite(Texture.WHITE);
  glow.anchor.set(0.5);
  glow.width = 36;
  glow.height = 20;
  glow.tint = hexToNumber(team.color);
  glow.alpha = 0;

  const shadow = new Sprite(Texture.WHITE);
  shadow.anchor.set(0.5);
  shadow.width = 22;
  shadow.height = 6;
  shadow.tint = 0x111827;
  shadow.alpha = 0.45;

  const label = new Text({
    text: team.name,
    style: new TextStyle({
      fill: team.color,
      fontFamily: 'Noto Sans KR',
      fontSize: 11,
      fontWeight: '700',
      stroke: { color: 0x0f172a, width: 2 },
    }),
  });
  label.anchor.set(0.5, 1.2);

  const container = new Container();
  container.addChild(glow);
  container.addChild(shadow);
  container.addChild(sprite);
  container.addChild(label);
  parent.addChild(container);

  return {
    teamId: team.id,
    container,
    sprite,
    glow,
    label,
    shadow,
  };
}

export function updateRunnerBundle(
  bundle: RunnerBundle,
  x: number,
  y: number,
  angle: number,
  isSkillActive: boolean,
  speed: number
) {
  bundle.container.position.set(x, y);
  bundle.container.rotation = angle;
  bundle.shadow.position.set(-5, 11);
  bundle.shadow.rotation = -angle * 0.4;

  bundle.sprite.animationSpeed = 0.16 + Math.min(0.18, speed / 40);
  bundle.glow.alpha = isSkillActive ? 0.35 : 0.06;
  bundle.glow.scale.set(isSkillActive ? 1.3 : 1);
}

export function destroyRunnerBundle(bundle: RunnerBundle) {
  bundle.container.destroy({ children: true });
}
