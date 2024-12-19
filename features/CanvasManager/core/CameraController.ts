import {mat4, vec3} from "gl-matrix";

export class CameraController {
  private target: vec3 = vec3.fromValues(0, 0, 0); // 相机目标
  private distance: number = 11.2; // 相机与目标点的距离
  private minDistance: number = 2.0;
  private maxDistance: number = 50.0;

  azimuth: number = Math.PI / 4; // 水平角度（弧度）
  elevation: number = Math.PI / 4; // 垂直角度（俯仰角）
  private minElevation: number = 0.01; // 最低俯仰角（防止翻转）
  private maxElevation: number = Math.PI - 0.01; // 最高俯仰角

  private smoothFactor: number = 0.1; // 平滑缩放因子
  private targetDistance: number = this.distance;

  constructor(private canvas: HTMLCanvasElement, private gl: WebGLRenderingContext) {
    this.addMouseEvents();
  }

  getViewMatrix(): mat4 {
    const viewMatrix = mat4.create();

    // 转换为笛卡尔坐标
    const eye = vec3.create();
    const sinElevation = Math.sin(this.elevation);
    const cosElevation = Math.cos(this.elevation);
    const sinAzimuth = Math.sin(this.azimuth);
    const cosAzimuth = Math.cos(this.azimuth);

    eye[0] = this.target[0] + this.distance * cosElevation * sinAzimuth; // X
    eye[1] = this.target[1] + this.distance * sinElevation; // Y
    eye[2] = this.target[2] + this.distance * cosElevation * cosAzimuth; // Z

    mat4.lookAt(viewMatrix, eye, this.target, vec3.fromValues(0, 1, 0));
    return viewMatrix;
  }

  update() {
    // 平滑缩放
    this.distance += (this.targetDistance - this.distance) * this.smoothFactor;
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

      // 水平角度（绕目标点旋转）
      this.azimuth -= deltaX * 0.01;

      // 垂直角度（俯仰角）
      this.elevation -= deltaY * 0.01;
      this.elevation = Math.max(this.minElevation, Math.min(this.maxElevation, this.elevation));
    });

    this.canvas.addEventListener('mouseup', () => {
      isDragging = false;
    });

    this.canvas.addEventListener('mouseleave', () => {
      isDragging = false;
    });

    this.canvas.addEventListener('wheel', (event) => {
      event.preventDefault();

      // 缩放
      this.targetDistance += event.deltaY * 0.05;
      this.targetDistance = Math.max(this.minDistance, Math.min(this.maxDistance, this.targetDistance));
    });
  }
}
