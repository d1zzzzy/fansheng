'use strict';
import { DrawOptions, Point } from "./interface";

export class DrawUtil {
  static _dpr: number | undefined = undefined;

  static drawPoint(ctx: CanvasRenderingContext2D, point: Point, options: DrawOptions = {}) {
    ctx.beginPath();
    ctx.arc(point.x, point.y, (options.lineWidth || 1), 0, Math.PI * 2);
    ctx.fillStyle = options.color || 'black';
    ctx.fill();
  }

  static drawLine(ctx: CanvasRenderingContext2D, start: Point, end: Point, options: DrawOptions = {}) {
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = options.color || 'black';
    ctx.lineWidth = (options.lineWidth || 1);
    ctx.stroke();
  }

  static drawArc(ctx: CanvasRenderingContext2D, center: Point, radius: number, startAngle: number, endAngle: number, options: DrawOptions = {}) {
    ctx.beginPath();
    ctx.arc(center.x, center.y, radius, startAngle, endAngle);
    ctx.strokeStyle = options.color || 'black';
    ctx.lineWidth = (options.lineWidth || 1);
    ctx.stroke();
  }

  static drawRect(ctx: CanvasRenderingContext2D, topLeft: Point, width: number, height: number, options: DrawOptions = {}) {
    ctx.beginPath();
    ctx.rect(topLeft.x, topLeft.y, width, height);
    ctx.strokeStyle = options.color || 'black';
    ctx.lineWidth = (options.lineWidth || 1);
    ctx.stroke();
  }

  // 由于对画布进行了平移的操作（使其成为笛卡尔坐标系），所以需要调整清除的区域
  static clearCanvas(ctx: CanvasRenderingContext2D, x: number = -ctx.canvas.width, y: number = -ctx.canvas.height, width: number = ctx.canvas.width * 2, height: number = ctx.canvas.height * 2) {
    ctx.clearRect(x, y, width, height);
  }

  static updateDpr() {
    if (this._dpr === undefined) {
      this._dpr = window.devicePixelRatio || 1;
    }
  }

  static get dpr(): number {
    this.updateDpr();

    return this._dpr as number;
  }
}
