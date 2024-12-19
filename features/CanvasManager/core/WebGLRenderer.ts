import { CameraController } from "@/features/CanvasManager/core/CameraController";
import { positionCanvas } from "../element.util";
import { CanvasOptions } from "../interface";
import {mat4} from "gl-matrix";

export interface IWebGLRenderer {
  initialize(container: HTMLElement, options: CanvasOptions): void;
  resize(width: number, height: number): void;
  resizeCanvas(container: HTMLElement, options: CanvasOptions): void;
  render(): void;
  destroy(): void;
}

export class WebGLRenderer implements IWebGLRenderer {
  private cameraController: CameraController | null = null;

  private gl: WebGLRenderingContext | null = null;
  private readonly canvas: HTMLCanvasElement;
  private program: WebGLProgram | null = null;
  private vertexBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;
  private buffers: { vertexBuffer: WebGLBuffer | null; colorBuffer: WebGLBuffer | null; lineBuffer?: WebGLBuffer | null } = { vertexBuffer: null, colorBuffer: null, lineBuffer: null };
  private vertices: Float32Array = new Float32Array([]);
  private colors: Float32Array = new Float32Array([]);

  constructor(container: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('id', 'gl-canvas');
    this.gl = this.canvas.getContext("webgl", { antialias: true });

    container.appendChild(this.canvas);

    positionCanvas(this.canvas, container);

    this.cameraController = new CameraController(this.canvas, this.gl!);
  }

  initialize(container: HTMLElement): void {
    this.resizeCanvas(container);

    if (!this.gl) {
      throw new Error("Failed to initialize WebGL context");
    }

    this.gl.clearColor(0.941, 1.0, 0.980, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.enable(this.gl.DEPTH_TEST);  // 启用深度测试，确保物体之间的正确遮挡
    this.gl.depthFunc(this.gl.LEQUAL);  // 设置深度测试函数

    this.initShaders();
    this.initBuffers();

    console.log("WebGL Renderer with Cube initialized");
  }

  resize(width: number, height: number): void {
    if (!this.gl) return;

    const dpr = window.devicePixelRatio || 1;

    this.gl!.canvas.width = width * dpr;
    this.gl!.canvas.height = height * dpr;

    this.gl!.viewport(0, 0, this.gl!.canvas.width, this.gl!.canvas.height);
  }

  resizeCanvas(container: HTMLElement): void {
    if (!this.gl) return;
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = container.clientWidth * dpr;
    this.canvas.height = container.clientHeight * dpr;

    this.canvas.style.width = `${container.clientWidth}px`;
    this.canvas.style.height = `${container.clientHeight}px`;

    if (this.gl) {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  render() {
    if (!this.gl || !this.program || !this.cameraController) return;

    // View Matrix (相机位置和方向)
    const viewMatrix = this.cameraController.getViewMatrix();
    const viewLocation = this.gl.getUniformLocation(this.program, 'uView');

    this.gl.uniformMatrix4fv(viewLocation, false, viewMatrix);

    // Projection Matrix (透视投影)
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, this.cameraController.azimuth, this.canvas.width / this.canvas.height, 0.1, 100.0);

    // Model Matrix (魔方自身旋转)
    const modelMatrix = mat4.create(); // 模型矩阵默认单位矩阵
    mat4.identity(modelMatrix);
    mat4.rotateX(modelMatrix, modelMatrix, this.cameraController.azimuth);
    mat4.rotateY(modelMatrix, modelMatrix, this.cameraController.elevation);

    const uProjection = this.gl!.getUniformLocation(this.program!, 'uProjection');
    const uModel = this.gl!.getUniformLocation(this.program!, 'uModel');

    this.gl.uniformMatrix4fv(uProjection, false, projectionMatrix);
    this.gl.uniformMatrix4fv(uModel, false, modelMatrix);

    this.gl!.clear(this.gl!.COLOR_BUFFER_BIT | this.gl!.DEPTH_BUFFER_BIT);
    this.gl!.drawArrays(this.gl!.TRIANGLES, 0, this.vertices.length / 3);

    // 使用 requestAnimationFrame 实现循环渲染
    requestAnimationFrame(() => this.render());
  }

  destroy(): void {
    this.canvas.parentElement?.removeChild(this.canvas);

    if (this.gl) {
      if (this.program) this.gl.deleteProgram(this.program);
      if (this.vertexBuffer) this.gl.deleteBuffer(this.vertexBuffer);
      if (this.indexBuffer) this.gl.deleteBuffer(this.indexBuffer);

      this.gl.clearColor(0.941, 1.0, 0.980, 1.0);
    }
    this.gl = null;
    this.program = null;
    this.vertexBuffer = null;
    this.indexBuffer = null;
  }

  createShader(type: number, source: string) {
    const shader = this.gl!.createShader(type);
    this.gl!.shaderSource(shader!, source);
    this.gl!.compileShader(shader!);
    if (!this.gl!.getShaderParameter(shader!, this.gl!.COMPILE_STATUS)) {
      console.error(this.gl!.getShaderInfoLog(shader!));
      this.gl!.deleteShader(shader!);
      return null;
    }
    return shader;
  }

  createProgram(vertexShaderSource: string, fragmentShaderSource: string) {
    const vertexShader = this.createShader(this.gl!.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.createShader(this.gl!.FRAGMENT_SHADER, fragmentShaderSource);
    const program = this.gl!.createProgram();

    this.gl!.attachShader(program!, vertexShader!);
    this.gl!.attachShader(program!, fragmentShader!);
    this.gl!.linkProgram(program!);

    if (!this.gl!.getProgramParameter(program!, this.gl!.LINK_STATUS)) {
      console.error(this.gl!.getProgramInfoLog(program!));
      this.gl!.deleteProgram(program!);
      return null;
    }
    return program;
  }

  private initShaders() {
    const vertexShaderSource = `
      attribute vec3 a_Position;
      attribute vec3 a_Color;
      varying vec3 v_Color;

      uniform mat4 uProjection; // 投影矩阵
      uniform mat4 uView;       // 视图矩阵
      uniform mat4 uModel;      // 模型矩阵

      void main() {
        gl_Position = uProjection * uView * uModel * vec4(a_Position, 1.0);
        v_Color = a_Color;
      }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      varying vec3 v_Color;
      void main() {
        gl_FragColor = vec4(v_Color, 1.0);
      }
    `;

    const program = this.createProgram(vertexShaderSource, fragmentShaderSource);

    this.gl!.useProgram(program!);
    this.program = program;
  }

  private initBuffers() {
    const { vertices, colors } = generateRubikCubeData();

    // 顶点数据
    const vertexBuffer = this.gl!.createBuffer();
    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, vertexBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, vertices, this.gl!.STATIC_DRAW);
    const a_Position = this.gl!.getAttribLocation(this.program!, 'a_Position');
    this.gl!.vertexAttribPointer(a_Position, 3, this.gl!.FLOAT, false, 0, 0);
    this.gl!.enableVertexAttribArray(a_Position);

    // 颜色数据
    const colorBuffer = this.gl!.createBuffer();
    this.gl!.bindBuffer(this.gl!.ARRAY_BUFFER, colorBuffer);
    this.gl!.bufferData(this.gl!.ARRAY_BUFFER, colors, this.gl!.STATIC_DRAW);

    const a_Color = this.gl!.getAttribLocation(this.program!, 'a_Color');
    this.gl!.vertexAttribPointer(a_Color, 3, this.gl!.FLOAT, false, 0, 0);
    this.gl!.enableVertexAttribArray(a_Color);

    // 绘制
    this.gl!.drawArrays(this.gl!.TRIANGLES, 0, vertices.length / 3);
    this.buffers = { vertexBuffer, colorBuffer };
    this.vertices = vertices;
    this.colors = colors;
  }
}

function generateRubikCubeData() {
  const size = 0.9; // 每个小立方体的边长
  const offset = 0.905; // 每个小立方体之间的间距
  const colors = [
    [0.105, 0.148, 0.308],
    [0.152, 0.273, 0.562],
    [0.639, 0.421, 0.656],
    [0.351, 0.042, 0.3],
    [0.628, 0.933, 0.542],
    [0.824, 0.378, 0.207],
  ];

  const vertices: number[] = [];
  const colorsArray: number[] = [];

  for (let x = -1; x <= 1; x++) {
    for (let y = -1; y <= 1; y++) {
      for (let z = -1; z <= 1; z++) {
        // 小立方体的中心位置
        const centerX = x * offset;
        const centerY = y * offset;
        const centerZ = z * offset;

        // 生成小立方体的6个面
        for (let face = 0; face < 6; face++) {
          const faceColor = colors[face];
          const faceVertices = generateFace(centerX, centerY, centerZ, size, face);

          vertices.push(...faceVertices);
          for (let i = 0; i < 6; i++) {
            colorsArray.push(...faceColor); // 每个面6个顶点同样的颜色
          }
        }
      }
    }
  }

  return {
    vertices: new Float32Array(vertices),
    colors: new Float32Array(colorsArray),
  };
}

// 生成一个小立方体的某一面
function generateFace(cx: number, cy: number, cz: number, size: number, face: number): number[] {
  const half = size / 2;
  let faceVertices: number[][] = [];

  switch (face) {
    case 0: // 前面
      faceVertices = [
        [cx - half, cy - half, cz + half],
        [cx + half, cy - half, cz + half],
        [cx + half, cy + half, cz + half],
        [cx - half, cy - half, cz + half],
        [cx + half, cy + half, cz + half],
        [cx - half, cy + half, cz + half],
      ];
      break;
    case 1: // 后面
      faceVertices = [
        [cx - half, cy - half, cz - half],
        [cx + half, cy - half, cz - half],
        [cx + half, cy + half, cz - half],
        [cx - half, cy - half, cz - half],
        [cx + half, cy + half, cz - half],
        [cx - half, cy + half, cz - half],
      ];
      break;
    case 2: // 顶面
      faceVertices = [
        [cx - half, cy + half, cz - half],
        [cx + half, cy + half, cz - half],
        [cx + half, cy + half, cz + half],
        [cx - half, cy + half, cz - half],
        [cx + half, cy + half, cz + half],
        [cx - half, cy + half, cz + half],
      ];
      break;
    case 3: // 底面
      faceVertices = [
        [cx - half, cy - half, cz - half],
        [cx + half, cy - half, cz - half],
        [cx + half, cy - half, cz + half],
        [cx - half, cy - half, cz - half],
        [cx + half, cy - half, cz + half],
        [cx - half, cy - half, cz + half],
      ];
      break;
    case 4: // 左面
      faceVertices = [
        [cx - half, cy - half, cz - half],
        [cx - half, cy + half, cz - half],
        [cx - half, cy + half, cz + half],
        [cx - half, cy - half, cz - half],
        [cx - half, cy + half, cz + half],
        [cx - half, cy - half, cz + half],
      ];
      break;
    case 5: // 右面
      faceVertices = [
        [cx + half, cy - half, cz - half],
        [cx + half, cy + half, cz - half],
        [cx + half, cy + half, cz + half],
        [cx + half, cy - half, cz - half],
        [cx + half, cy + half, cz + half],
        [cx + half, cy - half, cz + half],
      ];
      break;
  }

  return faceVertices.flat();
}
