export class KLineChart {
  private gl: WebGLRenderingContext
  private program: WebGLProgram | null
  private data: IDataItem[]
  private viewMatrix: Float32Array
  private offsetX: number
  private scaleX: number
  private visibleBars!: number

  constructor(
    private canvas: HTMLCanvasElement,
  ) {
    const { clientWidth, clientHeight } = canvas
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
    this.data = []
    this.viewMatrix = new Float32Array(9)

    //  视图参数
    this.offsetX = 0
    this.scaleX = 1
    this.visibleBars = 50

    this.initWebgl()
    this.generateData(2000)
    this.initEvents()
    this.render()

    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this))
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this))
  }

  initWebgl() {
    const gl = this.gl

    const vertexShader = `#version 300 es
      in vec2 position;
      in vec3 color;
      uniform mat3 viewMatrix;

      out vec3 vColor;

      void main() {
        vec3 pos = viewMatrix * vec3(position, 1.0);
        gl_Position = vec4(pos.xy, 0.0, 1.0);

        vColor = color;
      }`

    const fragmentShader = `#version 300 es
      precision highp float;
      in vec3 vColor;

      out vec4 fragColor;
      void main() {
        fragColor = vec4(vColor, 1.0);
      }`

    this.program = this.createProgram(vertexShader, fragmentShader)

    gl.useProgram(this.program)
  }

  initEvents() {
    let isDragging : boolean = false
    let startX : number = 0
    let startOffset : number = 0

    // 缩放事件
    window.addEventListener('wheel', e => {
      e.preventDefault()

      const zoomSpeed = 0.1
      const zoomFactor = 1 + zoomSpeed * (e.deltaY > 0 ? 1 : -1)
      const prevVisibleBars = this.visibleBars

      this.scaleX *= zoomFactor;
      this.scaleX = Math.max(0.1, Math.min(this.scaleX, 5))

      const mouseX = e.clientX / this.canvas.width
      this.offsetX += (mouseX - 0.5) * (prevVisibleBars - this.visibleBars)

      this.render()
    }, {
      passive: false
    })

    window.addEventListener('mousedown', e => {
      isDragging = true
      startX = e.clientX
      startOffset = this.offsetX
    })

    window.addEventListener('mousemove', e => {
      if (isDragging) {
        const delta = (e.clientX - startX) / this.canvas.width * this.visibleBars

        // ✅ 限制 `offsetX` 避免超出范围
        this.offsetX = Math.max(0, Math.min(startOffset - delta, this.data.length - this.visibleBars))

        this.render()
      }
    })

    window.addEventListener('mouseup', () => isDragging = false)
  }

  updateViewMatrix() {
    const aspect = this.canvas.width / this.canvas.height

    // 计算 Y 轴数据范围
    const minY = Math.min(...this.data.map(d => d.low)) || 0
    const maxY = Math.max(...this.data.map(d => d.high)) || 1
    const rangeY = maxY - minY || 1
    const midY = (minY + maxY) / 2

    // X 轴：基于 visibleBars 和 scaleX 计算
    const totalBars = this.data.length || 1
    const scaleX = (2 / this.visibleBars) * this.scaleX
    // 限制 offsetX 不超出数据范围
    this.offsetX = Math.max(0, Math.min(this.offsetX, totalBars - this.visibleBars))
    const offsetX = -1 + (this.offsetX * scaleX * this.visibleBars)

    // Y 轴：用 scaleY 将 [minY, maxY] 映射到 [-1,1]，然后平移使得数据中点对齐 0
    const scaleY = 2 / rangeY
    const offsetY = - scaleY * midY

    // viewMatrix 为 3x3 矩阵，列主序或行主序都行，但这里用的是一个平移+缩放的仿射变换
    this.viewMatrix.set([
      scaleX * aspect, 0, 0,
      0, scaleY, 0,
      offsetX, offsetY, 1
    ])
  }

  render() {
    const gl = this.gl

    gl.useProgram(this.program)
    this.updateViewMatrix()

    // 清空画布
    gl.clearColor(1, 1, 1, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)

    const viewMatrixLoc = gl.getUniformLocation(this.program!, 'viewMatrix')
    gl.uniformMatrix3fv(viewMatrixLoc, false, this.viewMatrix)

    // 分别存储影线和柱体实体部分的顶点和颜色数据
    const shadowVertices: number[] = []
    const shadowColors: number[] = []
    const bodyVertices: number[] = []
    const bodyColors: number[] = []

    this.data.forEach((bar: IDataItem, i: number) => {
      const x = i;  // X 坐标直接使用数据索引（后面由 viewMatrix 进行缩放平移）
      // 统一颜色规则：若 bar.close >= bar.open 则视为上涨（绿色），否则下跌（红色）
      const col = bar.close >= bar.open ? [0, 1, 0] : [1, 0, 0];

      // 1. 影线部分：2个顶点（上影线和下影线）
      shadowVertices.push(x, bar.high) // 影线顶端
      shadowVertices.push(x, bar.low)  // 影线底端
      shadowColors.push(...col, ...col)

      // 2. 实体部分：生成矩形，由两个三角形组成
      // 为保证矩形正确显示，不论涨跌，先求出实体的上边界和下边界
      const top = Math.max(bar.open, bar.close)
      const bottom = Math.min(bar.open, bar.close)
      const bodyWidth: number = 0.2

      // 生成两个三角形：
      // 三角形1（顶点按逆时针顺序）：
      // 左上, 右上, 右下
      bodyVertices.push(
        x - bodyWidth / 2, top,      // 左上
        x + bodyWidth / 2, top,      // 右上
        x + bodyWidth / 2, bottom    // 右下
      )
      bodyColors.push(...col, ...col, ...col)

      // 三角形2：
      // 左上, 右下, 左下
      bodyVertices.push(
        x - bodyWidth / 2, top,      // 左上
        x + bodyWidth / 2, bottom,   // 右下
        x - bodyWidth / 2, bottom    // 左下
      )
      bodyColors.push(...col, ...col, ...col)
    })

    // 创建并绑定影线的缓冲区
    this.createBuffer('position', new Float32Array(shadowVertices), 2)
    this.createBuffer('color', new Float32Array(shadowColors), 3)
    // 绘制影线部分
    if (shadowVertices.length > 0) {
      gl.drawArrays(gl.LINES, 0, shadowVertices.length / 2)
    }

    // 创建并绑定柱体实体部分的缓冲区
    this.createBuffer('position', new Float32Array(bodyVertices), 2)
    this.createBuffer('color', new Float32Array(bodyColors), 3)
    // 绘制实体部分
    if (bodyVertices.length > 0) {
      gl.drawArrays(gl.TRIANGLES, 0, bodyVertices.length / 2)
    }

    gl.enable(gl.DEPTH_TEST)
    gl.depthFunc(gl.LEQUAL)
  }

  createBuffer(name: string, data: Float32Array, size: number) {
    const gl = this.gl
    const buffer = gl.createBuffer()

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)

    const location = gl.getAttribLocation(this.program!, name)
    gl.enableVertexAttribArray(location)
    gl.vertexAttribPointer(location, size, gl.FLOAT, false, size * Float32Array.BYTES_PER_ELEMENT, 0)
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
      console.error('顶点着色器编译错误:', gl.getShaderInfoLog(vertexShader));
      gl.deleteShader(vertexShader);
      return null;
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

  private handleMouseMove(event: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect()
    const mouseX = event.clientX - rect.left

    const ndcX = (mouseX / this.canvas.width) * 2 - 1

    const dataX = (ndcX - this.viewMatrix[6]) / this.viewMatrix[0]

    const index = Math.round(dataX)

    console.log(index)
  }

  private handleMouseLeave() {

  }

  generateData(count: number) {
    let prevClose: number = 100
    let maxHigh = prevClose
    for (let i = 0; i < count; i++) {
      const open = prevClose
      const maxFluctuation = 50
      const high = open + Math.random() * maxFluctuation
      const low = open - Math.random() * maxFluctuation
      const close = low + Math.random() * (high - low)

      maxHigh = Math.max(maxHigh, high)

      this.data.push({
        time: i,
        open,
        high,
        low,
        close
      })
      prevClose = close
    }

    this.data = this.data.map(({ time, low, close, open, high }) => ({
      time,
      high: high / maxHigh,
      low: low / maxHigh,
      close: close / maxHigh,
      open: open / maxHigh
    }))
  }
}

interface IDataItem {
  time: number
  open: number
  high: number
  low: number
  close: number
}
