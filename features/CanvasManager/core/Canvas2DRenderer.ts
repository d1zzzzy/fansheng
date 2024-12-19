import { DrawUtil } from "../draw.util";
import { positionCanvas } from "../element.util";
import { CanvasOptions, DrawOptions, Line, Point, RotateLine } from "../interface";
import { rotatePoint } from "../point.util";

export interface ICanvas2DRenderer {
  initialize(container: HTMLElement, options: CanvasOptions): void;
  resizeCanvas(container: HTMLElement, options: CanvasOptions): void;
  resize(width: number, height: number): void;
  render(): void;
  destroy(): void;

  // 动画效果
  moveLine(start: Point, end: Point, options: DrawOptions, duration: number, gap: number): Promise<void>;
  moveLines(lines: Line[], options: DrawOptions, duration: number, gaps: number[]): Promise<void>;
  rotateLine(line: RotateLine, options: DrawOptions, duration: number, angle: number): Promise<void>;
  rotateLines(lines: RotateLine[], options: DrawOptions, duration: number, angle: number): Promise<void>;

  // 绘制线段
  drawLine(start: Point, end: Point, options: DrawOptions): void;
  // 绘制线段动画，从线段两端延伸
  drawAnimateLine(start: Point, end: Point, options: DrawOptions, duration: number): Promise<void>;
  // 绘制弧线
  drawArc(center: Point, radius: number, startAngle: number, endAngle: number, options: DrawOptions): void;
  // 绘制点
  drawPoint(point: Point, options: DrawOptions): void;
  // 绘制矩形
  drawRect(topLeft: Point, width: number, height: number, options: DrawOptions): void;
  // 清除画布
  clear(): void;
  // 清除当前画布
  clearCanvas(): void;
}

export class Canvas2DRenderer implements ICanvas2DRenderer {
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private offscreenCanvas: HTMLCanvasElement | null = null;
  private offscreenContext: CanvasRenderingContext2D | null = null;
  private animationCanvas: HTMLCanvasElement | null = null;
  private animationContext: CanvasRenderingContext2D | null = null;
  private animationFrameId: number | null = null;
  private dpr: number;

  private resizeObserver: ResizeObserver | null = null;

  constructor(container: HTMLElement, options: CanvasOptions = {}) {
    this.dpr = window.devicePixelRatio || 1;

    // 创建并初始化主画布
    this.canvas = document.createElement('canvas');

    // 获取主画布上下文
    this.context = this.canvas.getContext('2d');
    if (!this.context) {
      throw new Error('Canvas 2D context is not supported');
    }

    // 创建离屏画布用于动画优化
    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenContext = this.offscreenCanvas.getContext('2d');

    if (!this.offscreenContext) {
      throw new Error('Offscreen Canvas context is not supported');
    }

    // 创建动画画布
    this.animationCanvas = document.createElement('canvas');
    this.animationContext = this.animationCanvas.getContext('2d');

    if (!this.animationContext) {
      throw new Error('Animation Canvas context is not supported');
    }

    this.canvas.setAttribute('id', 'main-canvas');
    this.animationCanvas.setAttribute('id', 'animation-canvas');

    container.appendChild(this.canvas);
    container.appendChild(this.animationCanvas);

    this.resizeCanvas(container, options);

    positionCanvas(this.canvas, container);
    positionCanvas(this.animationCanvas, container);


    this.resizeObserver = new ResizeObserver(() => this.resizeCanvas(container, options));
    this.resizeObserver.observe(container);
  }

  initialize(container: HTMLCanvasElement, options: CanvasOptions = {}): void {

  }

  resizeCanvas(container: HTMLElement, options: CanvasOptions): void {
    const width = options.width || container.clientWidth;
    const height = options.height || container.clientHeight;

    const lastCanvasData = this.context?.getImageData(0, 0, this.canvas!.width, this.canvas!.height);

    this.canvas!.width = width * this.dpr;
    this.canvas!.height = height * this.dpr;
    this.canvas!.style.width = `${width}px`;
    this.canvas!.style.height = `${height}px`;

    this.offscreenCanvas!.width = this.canvas!.width;
    this.offscreenCanvas!.height = this.canvas!.height;

    this.animationCanvas!.width = this.canvas!.width;
    this.animationCanvas!.height = this.canvas!.height;

    // 将原点移至画布中心
    this.context?.setTransform(this.dpr, 0, 0, -this.dpr, this.canvas!.width / 2, this.canvas!.height / 2);
    this.offscreenContext?.setTransform(this.dpr, 0, 0, -this.dpr, this.offscreenCanvas!.width / 2, this.offscreenCanvas!.height / 2);
    this.animationContext?.setTransform(this.dpr, 0, 0, -this.dpr, this.animationCanvas!.width / 2, this.animationCanvas!.height / 2);

    // @TODO: 重新绘制保存的内容居中
    if (lastCanvasData) {
      this.context?.putImageData(lastCanvasData, 0, 0);
    }
  }

  resize(width: number, height: number): void {
    this.canvas!.width = width * this.dpr;
    this.canvas!.height = height * this.dpr;
  }

  render(): void {
    if (!this.context) return;
    this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
  }

  destroy(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.stopAnimation();

    this.clearCanvas();

    this.context = null;
    this.canvas = null;
    this.offscreenCanvas = null;
    this.animationCanvas = null;
    this.animationFrameId = null;
  }

  // 绘制线段
  drawLine(start: Point, end: Point, options: DrawOptions = {}): void {
    DrawUtil.drawLine(this.context as CanvasRenderingContext2D, start, end, options);
  }

  // 绘制线段动画，从线段两端延伸
  drawAnimateLine(start: Point, end: Point, options: DrawOptions = {}, duration: number = 0): Promise<void> {
    return new Promise((resolve) => {
      const ctx = this.offscreenContext as CanvasRenderingContext2D;
      const animCtx = this.animationContext as CanvasRenderingContext2D;

      if (duration <= 0) {
        // 立即绘制
        DrawUtil.drawLine(ctx, start, end, options);
        this.context?.drawImage(this.offscreenCanvas!, -this.canvas!.width / 2, -this.canvas!.height / 2);
        resolve();
        return;
      }

      // 动画绘制
      const totalLength = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
      const step = totalLength / (duration / 16.67); // assuming 60fps
      let currentLength = 0;

      const midPoint: Point = {
        x: (start.x + end.x) / 2,
        y: (start.y + end.y) / 2,
      };

      const alignToPixelGrid = (value: number) => Math.round(value) + 0.5;

      const animate = () => {
        if (currentLength < totalLength / 2) {
          const progress = currentLength / (totalLength / 2);
          const currentStart: Point = {
            x: alignToPixelGrid(midPoint.x - (midPoint.x - start.x) * progress),
            y: alignToPixelGrid(midPoint.y - (midPoint.y - start.y) * progress),
          };
          const currentEnd: Point = {
            x: alignToPixelGrid(midPoint.x + (end.x - midPoint.x) * progress),
            y: alignToPixelGrid(midPoint.y + (end.y - midPoint.y) * progress),
          };

          DrawUtil.clearCanvas(animCtx);
          DrawUtil.drawLine(animCtx, currentStart, currentEnd, options);

          currentLength += step;
          requestAnimationFrame(animate);
        } else {
          DrawUtil.drawLine(this.context as CanvasRenderingContext2D, start, end, options);
          DrawUtil.clearCanvas(animCtx);
          resolve();
        }
      };

      animate();
    });
  }

  // 绘制弧线
  drawArc(center: Point, radius: number, startAngle: number, endAngle: number, options: DrawOptions = {}): void {
    DrawUtil.drawArc(this.context as CanvasRenderingContext2D, center, radius, startAngle, endAngle, options);
  }

  // 绘制点
  drawPoint(point: Point, options: DrawOptions = {}): void {
    DrawUtil.drawPoint(this.context as CanvasRenderingContext2D, point, options);
  }

  // 绘制矩形
  drawRect(topLeft: Point, width: number, height: number, options: DrawOptions = {}): void {
    DrawUtil.drawRect(this.context as CanvasRenderingContext2D, topLeft, width, height, options);
  }

  // 打字机效果绘制文字
  drawText(position: Point, text: string, speed: number, options: DrawOptions = {}): void {
    let index = 0;
    const drawInterval = setInterval(() => {
      this.clear();
      this.offscreenContext?.clearRect(-this.offscreenCanvas!.width / 2, -this.offscreenCanvas!.height / 2, this.offscreenCanvas!.width, this.offscreenCanvas!.height); // 清除离屏画布
      this.offscreenContext!.fillStyle = options.color || 'black';
      this.offscreenContext!.font = `${(options?.fontSize || 16) * this.dpr}px ${options.font || 'Arial'}`;
      this.offscreenContext?.fillText(text.slice(0, index + 1), position.x, position.y); // 每次绘制一部分文字

      this.context?.drawImage(this.offscreenCanvas!, -this.canvas!.width / 2, -this.canvas!.height / 2); // 将离屏画布的内容绘制到主画布

      index++;
      if (index >= text.length) {
        clearInterval(drawInterval);
      }
    }, speed);
  }

  // 动画处理（逐步绘制）
  animate(callback: (time: number) => void): void {
    const animateStep = (time: number) => {
      callback(time);
      this.animationFrameId = requestAnimationFrame(animateStep);
    };
    this.animationFrameId = requestAnimationFrame(animateStep);
  }

  // 停止动画
  stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // 清除画布
  clear(): void {
    this.context?.clearRect(-this.canvas!.width / 2, -this.canvas!.height / 2, this.canvas!.width, this.canvas!.height);
  }

  // 清除当前画布
  clearCanvas(): void {
    this.clear();
  }

  /** 动画效果 —— 半通用 */

  // 纵向移动线条
  moveLine(
    start: Point,
    end: Point,
    options: DrawOptions = {},
    duration: number = 1000,
    gap: number = 0
  ): Promise<void> {
    return new Promise((resolve) => {
      const animCtx = this.animationContext as CanvasRenderingContext2D;

      if (duration <= 0) {
        resolve();
        return;
      }

      const startTime = performance.now();
      let lastOffset = 0;

      const animate = (currentTime: number) => {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1); // 当前时间进度 [0, 1]
        const currentOffset = gap * progress; // 当前帧的偏移量

        // 清除之前绘制的内容，仅限于当前线段的范围
        const minX = Math.min(start.x, end.x) - 10;
        const minY = Math.min(start.y, end.y) - 10 + lastOffset;
        const maxX = Math.max(start.x, end.x) + 10;
        const maxY = Math.max(start.y, end.y) + 10 + currentOffset;
        DrawUtil.clearCanvas(animCtx, minX, minY, maxX - minX, maxY - minY);

        // 绘制当前线段的部分
        const currentStart: Point = {
          x: start.x,
          y: start.y + lastOffset,
        };
        const currentEnd: Point = {
          x: end.x,
          y: end.y + currentOffset,
        };
        DrawUtil.drawLine(animCtx, currentStart, currentEnd, options);

        lastOffset = currentOffset; // 更新最后的偏移量

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          const animatedStart = {
            x: start.x,
            y: start.y + gap,
          };
          const animatedEnd = {
            x: end.x,
            y: end.y + gap,
          };

          // 确保绘制到主画布
          DrawUtil.drawLine(this.context as CanvasRenderingContext2D, animatedStart, animatedEnd, options);
          DrawUtil.clearCanvas(animCtx);
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  // 纵向移动多条线段
  moveLines(lines: Line[], options: DrawOptions = {}, duration: number = 0, gaps: number[] = [0]): Promise<void> {
    return new Promise((resolve) => {
      const moveActions = lines.map((line, index) => {
        return this.moveLine(line.start, line.end, options, duration, gaps[index]);
      });

      Promise.all(moveActions).then(() => {
        resolve();
      });
    });
  }

  // 旋转线段, 角度单位为度, 顺时针为正, 逆时针为负, 默认顺时针, 旋转中心为线段中点
  rotateLine(line: RotateLine, options: DrawOptions = {}, duration: number = 0, angle: number = 0): Promise<void> {
    return new Promise((resolve) => {
      const animCtx = this.animationContext as CanvasRenderingContext2D;

      if (duration <= 0) {
        resolve();
        return;
      }

      const startTime = performance.now();
      let lastAngle = 0;

      const animate = (currentTime: number) => {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        const currentAngle = angle * progress * Math.PI / 180;

        const midPoint = {
          x: (line.start.x + line.end.x) / 2,
          y: (line.start.y + line.end.y) / 2,
        };


        const currentStart = rotatePoint(line.start, currentAngle, line.rotateAt ?? midPoint);
        const currentEnd = rotatePoint(line.end, currentAngle, line.rotateAt ?? midPoint);

        DrawUtil.clearCanvas(animCtx);
        DrawUtil.drawLine(animCtx, currentStart, currentEnd, options);

        lastAngle = currentAngle;

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          const animatedStart = rotatePoint(line.start, currentAngle, line.rotateAt ?? midPoint);
          const animatedEnd = rotatePoint(line.end, currentAngle, line.rotateAt ?? midPoint);

          DrawUtil.clearCanvas(animCtx);
          DrawUtil.drawLine(this.context as CanvasRenderingContext2D, animatedStart, animatedEnd, options);
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  // 旋转多条线段
  rotateLines(lines: RotateLine[], options: DrawOptions = {}, duration: number = 0, angle: number = 0): Promise<void> {
    return new Promise((resolve) => {
      const animCtx = this.animationContext as CanvasRenderingContext2D;

      if (duration <= 0) {
        resolve();
        return;
      }

      const startTime = performance.now();

      const animate = (currentTime: number) => {
        const elapsedTime = currentTime - startTime;
        const progress = Math.min(elapsedTime / duration, 1);
        const currentAngle = angle * progress * Math.PI / 180;

        DrawUtil.clearCanvas(animCtx);

        lines.forEach((line) => {
          const midPoint = {
            x: (line.start.x + line.end.x) / 2,
            y: (line.start.y + line.end.y) / 2,
          };

          const rotatePoint = (point: Point, angle: number, rotateAt: Point): Point => {
            const cosTheta = Math.cos(angle);
            const sinTheta = Math.sin(angle);
            return {
              x: cosTheta * (point.x - rotateAt.x) - sinTheta * (point.y - rotateAt.y) + rotateAt.x,
              y: sinTheta * (point.x - rotateAt.x) + cosTheta * (point.y - rotateAt.y) + rotateAt.y,
            };
          };

          const currentStart = rotatePoint(line.start, currentAngle, line.rotateAt ?? midPoint);
          const currentEnd = rotatePoint(line.end, currentAngle, line.rotateAt ?? midPoint);

          DrawUtil.drawLine(animCtx, currentStart, currentEnd, options);
        });

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          lines.forEach((line) => {
            const midPoint = {
              x: (line.start.x + line.end.x) / 2,
              y: (line.start.y + line.end.y) / 2,
            };

            const animatedStart = rotatePoint(line.start, currentAngle, line.rotateAt ?? midPoint);
            const animatedEnd = rotatePoint(line.end, currentAngle, line.rotateAt ?? midPoint);

            DrawUtil.drawLine(this.context as CanvasRenderingContext2D, animatedStart, animatedEnd, options);
          });
          DrawUtil.clearCanvas(animCtx);
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }
}
