import { Application } from 'pixi.js';
import { Renderer } from "@/features/CanvasManager/core/typing";

export class PixiRenderer implements Renderer {
  private app: Application;

  constructor() {
    this.app = new Application();
  }

  async initialize(container: HTMLElement): Promise<void> {
    await this.app.init({
      width: container.clientWidth,
      height: container.clientHeight,
      preference: 'webgpu',
      backgroundColor: 0xf1fffa,
      resolution: window.devicePixelRatio || 1,
      autoDensity: true,
      antialias: true,
    });

    container.appendChild(this.app.canvas);
  }

  resizeCanvas(container: HTMLElement): void {
    this.app.renderer.resize(container.clientWidth, container.clientHeight);
  }

  resize(width: number, height: number): void {
    this.app.renderer.resize(width, height);
  }

  render(): void {
    // this.app.render();
  }

  destroy(): void {
    this.app.destroy();
  }

  get context(): Application {
    return this.app;
  }
}
