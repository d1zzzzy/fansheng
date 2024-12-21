import Pixi from 'pixi.js';

import { Canvas2DRenderer, ICanvas2DRenderer } from "./core/Canvas2DRenderer";
import { IWebGLRenderer, WebGLRenderer } from "./core/WebGLRenderer";
import { PixiRenderer } from './core/PixiManager';

type Renderer = ICanvas2DRenderer | IWebGLRenderer | PixiRenderer;

export default class CanvasManager {
  private readonly container: HTMLElement;
  private _renderer: Renderer | null = null;

  constructor(container: HTMLElement) {
    // 创建并初始化主画布
    this.container = container;
  }

  switchTo2D(): void {
    this.setRenderer(new Canvas2DRenderer(this.container));
    this.render();
  }

  switchToWebGL(): void {
    this.setRenderer(new WebGLRenderer(this.container));
    this.render();
  }

  async switchToPixi(): Promise<Renderer | Pixi.Application | null> {
    await this.setRenderer(new PixiRenderer());

    return this.renderer;
  }

  async setRenderer(renderer: Renderer): Promise<void> {
    // 如果存在旧的渲染器，先销毁
    if (this._renderer) {
      this._renderer.destroy();
    }

    // 切换到新的渲染器
    this._renderer = renderer;
    await this._renderer.initialize(this.container, {});
  }

  get renderer(): Renderer | Pixi.Application | null {
    if (this._renderer instanceof PixiRenderer) {
      return this._renderer.context;
    }
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

  destroy(): void {
    if (this._renderer) {
      this._renderer.destroy();
    }
  }
}
