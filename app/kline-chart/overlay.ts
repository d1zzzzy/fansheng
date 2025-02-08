// 不参与缩放与偏移
export class OverlayCanvas {
  private gl: WebGLRenderingContext
  private program: WebGLProgram | null
  private mousePosition = { x: -1, y: -1 }

  constructor(
    private canvas: HTMLCanvasElement,
  ) {
    const {clientWidth, clientHeight} = canvas
    const dpr = window.devicePixelRatio || 1

    canvas.width = clientWidth * dpr
    canvas.height = clientHeight * dpr
    canvas.style.width = `${clientWidth}px`
    canvas.style.height = `${clientHeight}px`

    this.canvas = canvas

    const _gl = this.canvas.getContext('webgl2')

    if (!_gl) throw new Error('Your browser not support WebGL2'!)

    this.gl = _gl

    this.program = null

    this.initWebgl()
    this.initEvents()
    this.render()
  }

  initWebgl() {
    const gl = this.gl

    const vertexShader = `#version 300 es
      in vec2 position;
      in float a_dashCoord;
      out float v_dashCoord;
      void main() {
        v_dashCoord = a_dashCoord;
        gl_Position = vec4(position, 0.0, 1.0);
      }`

    const fragmentShader = `#version 300 es
      precision mediump float;
      in float v_dashCoord;
      uniform float uSegments;
      uniform float uDashFraction;
      out vec4 outColor;
      void main() {
        float t = v_dashCoord * uSegments;

        if (mod(t, 1.0) > uDashFraction) {
          discard;
        }

        outColor = vec4(1.0, 0.0, 0.0, 1.0);
      }`

    this.program = this.createProgram(vertexShader, fragmentShader)

    gl.useProgram(this.program)
  }

  createProgram(vsSource: string, fsSource: string) {
    const gl = this.gl
    const program: WebGLProgram = gl.createProgram()

    const vertexShader: WebGLShader = gl.createShader(gl.VERTEX_SHADER)!

    gl.shaderSource(vertexShader, vsSource)
    gl.compileShader(vertexShader)

    const fragmentShader: WebGLShader = gl.createShader(gl.FRAGMENT_SHADER)!

    gl.shaderSource(fragmentShader, fsSource)
    gl.compileShader(fragmentShader)

    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)

    gl.bindAttribLocation(program, 0, 'position')
    gl.bindAttribLocation(program, 1, 'color')

    gl.linkProgram(program)

    if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
      console.error('顶点着色器编译错误:', gl.getShaderInfoLog(vertexShader))
      gl.deleteShader(vertexShader)
      return null
    }

    if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
      console.error('片段着色器编译错误:', gl.getShaderInfoLog(fragmentShader))
      gl.deleteShader(fragmentShader)
      return null
    }

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('程序链接错误:', gl.getProgramInfoLog(program))
      gl.deleteProgram(program)
      return null
    }

    return program
  }

  initEvents() {
    window.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect()
      // 注意这里要减去 rect.left 和 rect.top 以确保鼠标坐标是相对于画布的
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1
      const ndcY = 1 - ((e.clientY - rect.top) / rect.height) * 2

      this.updateVertices(ndcX, ndcY)
      this.draw()
    })
  }

  render() {
    const gl = this.gl

    gl.useProgram(this.program)
    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)

    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT)

    // 定义横竖两条线段的顶点数据
    const positions = new Float32Array([])

    this.createBuffer('position', positions, 2)

    if (positions.length > 0) {
      gl.drawArrays(gl.LINES, 0, 4)
    }
  }

  createBuffer(name: string, data: Float32Array, size: number) {
    const gl = this.gl
    const buffer = gl.createBuffer()

    const location = gl.getAttribLocation(this.program!, name)

    const dashCoordAttributeLocation = gl.getAttribLocation(this.program!, 'a_dashCoord')

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)

    const stride = 3 * Float32Array.BYTES_PER_ELEMENT

    gl.vertexAttribPointer(
      location,
      size,
      gl.FLOAT,
      false,
      stride,
      0
    )

    gl.enableVertexAttribArray(location)
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, stride, 0)

    gl.vertexAttribPointer(
      dashCoordAttributeLocation,
      1,
      gl.FLOAT,
      false,
      stride,
      2 * Float32Array.BYTES_PER_ELEMENT
    )

    gl.enableVertexAttribArray(dashCoordAttributeLocation)
    gl.vertexAttribPointer(dashCoordAttributeLocation, 1, gl.FLOAT, false, stride, 2 * Float32Array.BYTES_PER_ELEMENT)
  }

  updateVertices(ndcX: number, ndcY: number)  {
    const gl = this.gl
    // 定义横竖两条线段的顶点数据
    const vertices = new Float32Array([
      // 水平线顶点：x, y, dashCoord
      -1.0,  ndcY,  0.0,   // 起点：dashCoord = 0.0
      1.0,  ndcY,  1.0,   // 终点：dashCoord = 1.0

      // 垂直线顶点：x, y, dashCoord
      ndcX, -1.0,  0.0,   // 起点：dashCoord = 0.0
      ndcX,  1.0,  1.0    // 终点：dashCoord = 1.0
    ])

    // 更新缓冲区数据
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW)
  }

  draw() {
    const gl = this.gl

    gl.clear(gl.COLOR_BUFFER_BIT)

    const dashSegmentPixel = 20

    const uSegmentsH = this.canvas.width / dashSegmentPixel
    const uSegmentsV = this.canvas.height / dashSegmentPixel

    const uSegmentsLocation = gl.getUniformLocation(this.program!, 'uSegments')
    const uDashFractionLocation = gl.getUniformLocation(this.program!, 'uDashFraction')

    gl.uniform1f(uDashFractionLocation, 0.5)

    gl.uniform1f(uSegmentsLocation, uSegmentsH)
    gl.drawArrays(gl.LINES, 0, 2)

    gl.uniform1f(uSegmentsLocation, uSegmentsV)
    gl.drawArrays(gl.LINES, 2, 2)
  }
}
