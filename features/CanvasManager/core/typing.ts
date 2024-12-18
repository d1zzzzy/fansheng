import { CanvasOptions } from "../interface";

export interface Renderer {
  initialize(canvas: HTMLCanvasElement, options: CanvasOptions): void;
  resizeCanvas(container: HTMLElement, options: CanvasOptions): void;
  resize(width: number, height: number): void;
  render(): void;
  destroy(): void; // 销毁时需要清理的逻辑
}
