export function createWebGLContext (canvasEl: HTMLCanvasElement): WebGLRenderingContext | null {
  const gl = canvasEl.getContext('webgl')  as WebGLRenderingContext;

  if (!gl) {
    throw new Error('WebGL not supported');
  }

  return gl;
}

export function createRenderArea (gl: WebGLRenderingContext, options: ICreateRenderAreaOptions) {
  const { width, height } = options;

  gl.canvas.width = width;
  gl.canvas.height = height;
}

export function createShader (gl: WebGLRenderingContext, type: number, source: string) {
  const shader: WebGLShader = gl.createShader(type)!;

  if (shader) {
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
  }

  return shader;
}

export function createProgram (gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
  const program: WebGLProgram = gl.createProgram()!;
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.useProgram(program);

  return program;
}

export function createTexture (gl: WebGLRenderingContext) {
  const texture: WebGLTexture = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  // 创建 framebuffer（用于离屏渲染）
  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);

// 创建颜色附着点（将渲染结果存储到纹理中）
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

// 检查 framebuffer 是否设置成功
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
    console.error('Framebuffer is not complete');
  }

// 解绑 framebuffer，回到默认 framebuffer
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);


  return texture;
}

export interface ICreateRenderAreaOptions {
  width: number;
  height: number;
  aspect?: number;
}
