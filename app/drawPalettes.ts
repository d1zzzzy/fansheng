import { Application, Text, TextStyle } from 'pixi.js';
import { lerp } from 'canvas-sketch-util/math';
import random from 'canvas-sketch-util/random';
import palettes from 'nice-color-palettes';

const margin = 100;

export function drawPalettes(app: Application) {
  const { width, height } = app.screen;
  const points = createGrid(24);

  const texts: Text[] = [];

  points.forEach((point) => {
    const { position, radius, color, rotation } = point;
    const { u, v } = position;

    const x = lerp(margin, width - margin, u);
    const y = lerp(margin, height - margin, v);

    const style = new TextStyle({
      fontFamily: 'Arial',
      fontSize: radius * width,
      fill: color,
      align: 'center',
    });
    const text = new Text({ text: '→' , style });
    text.x = x;
    text.y = y;
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
