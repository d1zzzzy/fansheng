import CanvasManager from "@/features/CanvasManager";
import { Point } from "@/features/CanvasManager/interface";
import { COLOR_CONFIG } from "@/features/CanvasManager/constants/color.config";
import { ICanvas2DRenderer } from "@/features/CanvasManager/core/Canvas2DRenderer";

const MAX_LINE_LENGTH = 300;
const GAP = 100;

const defaultAnimationDuration = 600;
const defaultLineOptions = {
  color: COLOR_CONFIG.DARK_GREEN,
  lineWidth: 1,
};

async function FirstScreenAnimation(canvasManager: CanvasManager) {
  const renderer = canvasManager.renderer as ICanvas2DRenderer;
  const centerPoint: Point = { x: 0, y: 0 };

  drawPointFirstPoint(canvasManager, centerPoint);

  await drawAnimateLine(canvasManager, centerPoint);

  renderer.clear();

  await drawParrelLineAndAnimate(canvasManager, centerPoint);

  await drawPerpendicularLineAndAnimate(canvasManager, centerPoint);
}

export default FirstScreenAnimation;

function drawPointFirstPoint(canvasManager: CanvasManager, point: Point) {
  const renderer = canvasManager.renderer as ICanvas2DRenderer;

  renderer.drawPoint(point, defaultLineOptions);
}

// 绘制第一条线段
async function drawAnimateLine(canvasManager: CanvasManager, point: Point) {
  const renderer = canvasManager.renderer as ICanvas2DRenderer;
  const startPoint: Point = { x: point.x - MAX_LINE_LENGTH / 2, y: point.y };
  const endPoint: Point = { x: point.x + MAX_LINE_LENGTH / 2, y: point.y };

  await renderer.drawAnimateLine(startPoint, endPoint, defaultLineOptions, defaultAnimationDuration);
}

// 从上面的一条线段复制平移生成两条线段
async function drawParrelLineAndAnimate(canvasManager: CanvasManager, point: Point) {
  const renderer = canvasManager.renderer as ICanvas2DRenderer;
  const startPoint: Point = { x: point.x - MAX_LINE_LENGTH / 2, y: point.y };
  const endPoint: Point = { x: point.x + MAX_LINE_LENGTH / 2, y: point.y };

  const originLine = { start: startPoint, end: endPoint };
  const lines = new Array(4).fill(originLine);
  const gaps = [1.5, 0.5, -0.5, -1.5].map((gap) => gap * GAP);

  await renderer.moveLines(lines, defaultLineOptions, defaultAnimationDuration, gaps);
}

async function drawPerpendicularLineAndAnimate(canvasManager: CanvasManager, point: Point) {
  const renderer = canvasManager.renderer as ICanvas2DRenderer;
  const startPoint: Point = { x: point.x - MAX_LINE_LENGTH / 2, y: point.y };
  const endPoint: Point = { x: point.x + MAX_LINE_LENGTH / 2, y: point.y };

  const gaps = [1.5, 0.5, -0.5, -1.5].map((gap) => gap * GAP);

  const lines = gaps.map((gap) => ({
    start: { x: startPoint.x, y: startPoint.y + gap },
    end: { x: endPoint.x, y: endPoint.y + gap },
    rotateAt: { x: 0, y: 0 }
  }));

  await renderer.rotateLines(lines, defaultLineOptions, defaultAnimationDuration, 90);
}
