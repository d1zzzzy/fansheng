import { DrawUtil } from "./draw.util";
import { DrawOptions, Line, Point } from "./interface";

export class AnimateUtil {
  static rotateLine(
    ctx: CanvasRenderingContext2D,
    line: Line,
    angle: number,
    duration: number,
    options: DrawOptions = {},
    rotateAt: Point = { x: 0, y: 0 }
  ) {
    return new Promise((resolve) => {
      const start = {
        x: line.start.x - rotateAt.x,
        y: line.start.y - rotateAt.y,
      };
      const end = {
        x: line.end.x - rotateAt.x,
        y: line.end.y - rotateAt.y,
      };

      const startAngle = Math.atan2(start.y, start.x);
      const endAngle = startAngle + angle * Math.PI / 180;

      const startX = start.x * Math.cos(endAngle) - start.y * Math.sin(endAngle);
      const startY = start.x * Math.sin(endAngle) + start.y * Math.cos(endAngle);

      const endX = end.x * Math.cos(endAngle) - end.y * Math.sin(endAngle);
      const endY = end.x * Math.sin(endAngle) + end.y * Math.cos(endAngle);

      DrawUtil.drawLine(ctx, { x: startX + rotateAt.x, y: startY + rotateAt.y }, { x: endX + rotateAt.x, y: endY + rotateAt.y }, options);

      const startTime = performance.now();
      const animate = (currentTime: number) => {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);

        const currentAngle = angle * progress * Math.PI / 180;

        const currentStart = {
          x: start.x * Math.cos(currentAngle) - start.y * Math.sin(currentAngle),
          y: start.x * Math.sin(currentAngle) + start.y * Math.cos(currentAngle),
        };

        DrawUtil.drawLine(ctx, currentStart, { x: endX + rotateAt.x, y: endY + rotateAt.y }, options);

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve(true);
        }
      };

      requestAnimationFrame(animate);
    });
  }
}
