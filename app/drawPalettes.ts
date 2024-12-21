import { Application, Text, TextStyle } from 'pixi.js';
import { lerp } from 'canvas-sketch-util/math';
import random from 'canvas-sketch-util/random';
import palettes from 'nice-color-palettes';

const margin = 100;

export function drawPalettes(app: Application, randomSeed = false) {
  const { width, height } = app.screen;
  const points = createGrid(16);
  const texts: Text[] = [];

  if (randomSeed) {
    app.stage.removeChildren();
    random.setSeed(Math.random());
    console.log('random.seed: ', random.seed)
  }

  points.forEach((point) => {
    const { position, radius, color, rotation } = point;
    const { u, v } = position;

    const x = lerp(margin, width - margin, u);
    const y = lerp(margin, height - margin, v);

    const style = new TextStyle({
      fontFamily: 'Helvetica',
      fontSize: radius * width,
      fill: color,
      align: 'center',
      stroke: { width: 0 },
    });
    const text = new Text({ text: '→' , style });
    text.x = x;
    text.y = y;
    // 旋转点设置为中心点
    text.anchor.set(0.5, 0.5);
    text.rotation = rotation;

    texts.push(text);
  });

  app.stage.addChild(...texts);
}

function createGrid(count: number): IPoint[] {
  const colorCount = random.rangeFloor(1, 6);
  const palette = random
    .shuffle(random.pick(palettes))
    .slice(0, colorCount);

  const points: IPoint[] = [];
  for (let i = 0; i < count; i++) {
    for (let j = 0; j < count; j++) {
      const u = count < 0.5 ? 0.5 : i / (count - 1);
      const v = count < 0.5 ? 0.5 : j / (count - 1);

      points.push({
        position: {
          u,
          v,
        },
        color: random.pick(palette),
        radius: Math.abs(random.noise2D(u, v)) * 0.05,
        rotation: random.noise2D(u, v),
      });
    }
  }

  return points;
}

interface IPoint {
  position: {
    u: number;
    v: number;
  };
  color: string;
  radius: number;
  rotation: number;
}
