// 点工具函数

import { Point } from "./interface";

export function rotatePoint(point: Point, angle: number, rotateAt: Point): Point {
  const cosTheta = Math.cos(angle);
  const sinTheta = Math.sin(angle);
  return {
    x: cosTheta * (point.x - rotateAt.x) - sinTheta * (point.y - rotateAt.y) + rotateAt.x,
    y: sinTheta * (point.x - rotateAt.x) + cosTheta * (point.y - rotateAt.y) + rotateAt.y,
  };
}
