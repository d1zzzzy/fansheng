export interface Point {
  x: number;
  y: number;
}

export interface Line {
  start: Point;
  end: Point;
}

export interface RotateLine extends Line {
  rotateAt?: Point;
}

export interface CanvasOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;

  responsive?: boolean;
}

export interface DrawOptions {
  color?: string;
  lineWidth?: number;
  fillColor?: string;
  font?: string;
  fontSize?: number;
}

interface ICanvasManager {
  initCanvas: (container: HTMLElement, options: CanvasOptions) => void;

  drawLine: (start: { x: number; y: number }, end: { x: number; y: number }, options: DrawOptions) => void;
  drawRect: (x: number, y: number, width: number, height: number, options: DrawOptions) => void;
  drawCircle: (x: number, y: number, radius: number, options: DrawOptions) => void;
  drawPoint: (x: number, y: number, options: DrawOptions) => void;
  drawText: (text: string, x: number, y: number, options: DrawOptions) => void;

  clear: () => void;

  on: (event: string, callback: (event: any) => void) => void;
  off: (event: string, callback: (event: any) => void) => void;

  getCanvas: () => HTMLCanvasElement;
  getContext: () => CanvasRenderingContext2D;

  animate: (callback: (deltaTime: number) => void, fps: number) => void;

  adjustDPI: () => void;
}

export default ICanvasManager;
