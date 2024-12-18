import { mat4 } from 'gl-matrix';

import { positionCanvas } from "../element.util";
import { CanvasOptions } from "../interface";

export interface IWebGLRenderer {
  initialize(container: HTMLElement, options: CanvasOptions): void;
  resize(width: number, height: number): void;
  resizeCanvas(container: HTMLElement, options: CanvasOptions): void;
  render(): void;
  destroy(): void;
}

export class WebGLRenderer implements IWebGLRenderer {
  private gl: WebGLRenderingContext | null = null;
  private canvas: HTMLCanvasElement;
  private program: WebGLProgram | null = null;
  private vertexBuffer: WebGLBuffer | null = null;
  private indexBuffer: WebGLBuffer | null = null;
  private buffers: { vertexBuffer: WebGLBuffer | null; colorBuffer: WebGLBuffer | null; lineBuffer?: WebGLBuffer | null } = { vertexBuffer: null, colorBuffer: null, lineBuffer: null };
  private vertices: Float32Array = new Float32Array([]);
  private colors: Float32Array = new Float32Array([]);
  private cameraAngleX: number = 0;
  private cameraAngleY: number = 0;
  private cameraDistance: number = 15.4;

  constructor(container: HTMLElement) {
    this.canvas = document.createElement('canvas');
    this.canvas.setAttribute('id', 'gl-canvas');

    container.appendChild(this.canvas);

    positionCanvas(this.canvas, container);

    this.addMouseEvents();
  }

  initialize(container: HTMLElement, options: CanvasOptions): void {
    this.gl = this.canvas.getContext("webgl", { antialias: true });
    this.resizeCanvas(container, {});

    if (!this.gl) {
      throw new Error("Failed to initialize WebGL context");
    }

    this.gl.clearColor(0.941, 1.0, 0.980, 1.0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.enable(this.gl.DEPTH_TEST);  // 启用深度测试，确保物体之间的正确遮挡
    this.gl.depthFunc(this.gl.LEQUAL);  // 设置深度测试函数
    this.gl.enable(this.gl.CULL_FACE); // 启用背面剔除
    this.gl.cullFace(this.gl.BACK);    // 剔除背面

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
    console.log('Canvas size:', this.canvas.width, this.canvas.height);
    console.log('Device pixel ratio:', window.devicePixelRatio);
  }

  resizeCanvas(container: HTMLElement, options: CanvasOptions): void {
    if (!this.gl) return;
    const dpr = window.devicePixelRatio || 1;

    this.canvas.width = container.clientWidth * dpr;
    this.canvas.height = container.clientHeight * dpr;

    this.canvas.style.width = `${container.clientWidth}px`;
    this.canvas.style.height = `${container.clientHeight}px`;

    if (this.gl) {
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    console.log('Canvas size:', this.canvas.width, this.canvas.height);
    console.log('Device pixel ratio:', window.devicePixelRatio);
  }

  render() {
    if (!this.gl || !this.program) return;

    this.setProjectionMatrix();
    this.setViewMatrix();
    this.setModelMatrix();

    this.gl!.clear(this.gl!.COLOR_BUFFER_BIT | this.gl!.DEPTH_BUFFER_BIT);
    this.gl!.drawArrays(this.gl!.TRIANGLES, 0, this.vertices.length / 3);
  }

  destroy(): void {
    if (this.gl) {
      if (this.program) this.gl.deleteProgram(this.program);
      if (this.vertexBuffer) this.gl.deleteBuffer(this.vertexBuffer);
      if (this.indexBuffer) this.gl.deleteBuffer(this.indexBuffer);
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

  initBuffers() {
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

  // 设置透视投影矩阵
  private setProjectionMatrix() {
    const projectionMatrix = mat4.create();
    mat4.perspective(projectionMatrix, Math.PI / 4, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 500.0);

    const projectionLocation = this.gl!.getUniformLocation(this.program!, 'uProjection');

    if (projectionLocation) {
      this.gl!.uniformMatrix4fv(projectionLocation, false, projectionMatrix);
    }
  }

  // 设置视图矩阵 (摄像机的位置和方向)
  private setViewMatrix() {
    const viewMatrix = mat4.create();

    const cameraPosition = [
      this.cameraDistance * Math.sin(this.cameraAngleY) * Math.cos(this.cameraAngleX),
      this.cameraDistance * Math.sin(this.cameraAngleX),
      this.cameraDistance * Math.cos(this.cameraAngleY) * Math.cos(this.cameraAngleX),
    ];

    const target = [0.0, 0.0, 0.0];
    const up = new Float32Array([0.0, 1.0, 0.0]);

    mat4.lookAt(viewMatrix, new Float32Array(cameraPosition), new Float32Array(target), up);

    const viewLocation = this.gl!.getUniformLocation(this.program!, 'uView');
    if (viewLocation) {
      this.gl!.uniformMatrix4fv(viewLocation, false, viewMatrix);
    }
  }

  // 设置模型矩阵 (物体的旋转和位置)
  private setModelMatrix() {
    const modelMatrix = mat4.create();

    // 添加旋转示例
    mat4.rotateX(modelMatrix, modelMatrix, this.cameraAngleX);
    mat4.rotateY(modelMatrix, modelMatrix, this.cameraAngleY);

    const modelLocation = this.gl!.getUniformLocation(this.program!, 'uModel');
    if (modelLocation) {
      this.gl!.uniformMatrix4fv(modelLocation, false, modelMatrix);
    }
  }

  private addMouseEvents() {
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    this.canvas.addEventListener('mousedown', (event) => {
      isDragging = true;
      lastX = event.clientX;
      lastY = event.clientY;
    });

    this.canvas.addEventListener('mousemove', (event) => {
      if (!isDragging) return;

      const deltaX = event.clientX - lastX;
      const deltaY = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;

      this.cameraAngleY += deltaX * 0.01;
      this.cameraAngleX += deltaY * 0.01;

      this.render();
    });

    this.canvas.addEventListener('mouseup', () => {
      isDragging = false;
    });

    this.canvas.addEventListener('wheel', (event) => {
      this.cameraDistance += event.deltaY * 0.05;
      this.cameraDistance = Math.max(5.0, Math.min(500.0, this.cameraDistance)); // 限制缩放范围

      this.render();
    });
  }
}

function generateRubikCubeData() {
  const size = 0.9; // 每个小立方体的边长
  const offset = 1.1; // 每个小立方体之间的间距
  const colors = [
    [1, 0, 0], // 红色
    [0, 1, 0], // 绿色
    [0, 0, 1], // 蓝色
    [1, 1, 0], // 黄色
    [1, 0, 1], // 紫色
    [0, 1, 1], // 青色
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
