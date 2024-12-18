import { Canvas2DRenderer, ICanvas2DRenderer } from "./core/Canvas2DRenderer";
import { IWebGLRenderer, WebGLRenderer } from "./core/WebGLRenderer";

type Renderer = ICanvas2DRenderer | IWebGLRenderer;

export default class CanvasManager {
  private container: HTMLElement;
  private _renderer: Renderer | null = null;

  constructor(container: HTMLElement) {
    // 创建并初始化主画布
    this.container = container;
  }

  swithTo2D(): void {
    this.setRenderer(new Canvas2DRenderer(this.container));
  }

  swithToWebGL(): void {
    this.setRenderer(new WebGLRenderer(this.container));
  }

  setRenderer(renderer: Renderer): void {
    // 如果存在旧的渲染器，先销毁
    if (this._renderer) {
      this._renderer.destroy();
    }

    // 切换到新的渲染器
    this._renderer = renderer;
    this._renderer.initialize(this.container, {});
  }

  get renderer(): Renderer | null {
    return this._renderer;
  }

  resize(width: number, height: number): void {
    if (this._renderer) {
      this._renderer.resize(width, height);
    }
  }

  render(): void {
    if (this._renderer) {
      this._renderer.render();
    }
  }
}
