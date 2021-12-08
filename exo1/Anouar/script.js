type Context = CanvasRenderingContext2D

function getFullScreenParams (ctx: Context): [number, number, number, number] {
  const { width, height } = ctx.canvas
  return [0, 0, width, height]
}

interface CtxUtils {
  clear: () => void
  save: (callback: () => void) => void
  drawPath: (callback: () => void) => void
}

function getCtxUtils (ctx: Context): CtxUtils {
  function clear (): void {
    const params = getFullScreenParams(ctx)
    ctx.clearRect(...params)
  }

  function save (callback: () => void): void {
    ctx.save()
    callback()
    ctx.restore()
  }

  function drawPath (callback: () => void): void {
    ctx.beginPath()
    callback()
    ctx.closePath()
  }

  return {
    clear,
    save,
    drawPath
  }
}

function initCanvas (resizeCallback: () => void, parent: HTMLElement = document.body): Context {
  function create (): [HTMLCanvasElement, Context] {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d') as Context

    return [canvas, ctx]
  }

  function resize (): void {
    const { clientHeight, clientWidth } = parent
    canvas.height = clientHeight
    canvas.width = clientWidth
    resizeCallback()
  }

  function append (): void {
    parent.innerHTML = ''
    parent.appendChild(canvas)
  }

  const [canvas, ctx] = create()
  resize()
  append()

  window.addEventListener('resize', resize)
  return ctx
}

type Point = [number, number]
class Curve {
  private _angleOffset: number = 40
  public currentPoint: Point
  public start: Point
  public startControlPoint: Point
  public endControlPoint: Point
  public end: Point
  public percentage: number = 0
  public speed: number = (Math.random() * 0.005) + 0.0005
  public color: string

  constructor (origin: Point, public angle: number, public length: number = 400) {
    this.start = origin
    this.currentPoint = [0, 0]
    this.end = this.getEndPoint()
    this.startControlPoint = this.getStartControlPoint()
    this.endControlPoint = this.getEndControlPoint()
    this.color = this.randColor()
  }

  private randColor = (): string => {
    const { floor, random } = Math
    return ['cyan', 'magenta', 'yellow'][floor(random() * 3)]
  }

  public get isComplete (): boolean {
    return this.percentage >= 1
  }

  private getEndPoint = (): Point => {
    const { cos, sin } = Math
    const x: number = cos(this.angle) * this.length
    const y: number = sin(this.angle) * this.length
    return [x, y]
  }

  private getStartControlPoint = (): Point => {
    const { cos, sin } = Math
    const angle: number = this.angle - (this._angleOffset / 60)
    const length: number = this.length / 3
    const x: number = cos(angle) * length
    const y: number = sin(angle) * length
    return [x, y]
  }

  private getEndControlPoint = (): Point => {
    const { cos, sin } = Math
    const angle: number = this.angle + (this._angleOffset / 60)
    const length: number = (this.length / 3) * 2
    const x: number = cos(angle) * length
    const y: number = sin(angle) * length
    return [x, y]
  }

  public animate = (): void => {
    function getXY (): Point {
      const x: number = cubicN(percentage, 0, startControlPoint[0], endControlPoint[0], end[0])
      const y: number = cubicN(percentage, 0, startControlPoint[1], endControlPoint[1], end[1])
      return [x, y]
    }

    // cubic helper formula
    function cubicN (T: number, a: number, b: number, c: number, d: number): number {
      const t2 = T * T
      const t3 = t2 * T
      return a + (-a * 3 + T * (3 * a - a * T)) * T + (3 * b + T * (-6 * b + b * 3 * T)) * T + (c * 3 - c * 3 * T) * t2 + d * t3
    }

    const { startControlPoint, endControlPoint, end, percentage } = this
    if (!this.isComplete) {
      this.percentage += this.speed
      this.currentPoint = getXY()
    }
  }
}

 class Burst {
  private _x: number
  private _y: number
  public curves: Curve[] = []

  constructor (x: number, y: number) {
    this._x = x
    this._y = y
    this.create()
  }

  public onPositionChange?: () => void

  public get x (): number { return this._x }
  public set x (value: number) {
    this._x = value
    if (this.onPositionChange) this.onPositionChange()
  }

  public get y (): number { return this._y }
  public set y (value: number) {
    this._y = value
    if (this.onPositionChange) this.onPositionChange()
  }

  private create (): void {
    const chunkSize: number = 6 / 32
    for (let i = 0; i <= 6; i += chunkSize) {
      this.curves.push(new Curve([this.x, this.y], i, 1300))
    }
  }

  public render = (ctx: Context) => {
    function renderCurve (curve: Curve): void {
      const { currentPoint, endControlPoint, startControlPoint, end } = curve
      save(() => {
        drawPath(() => {
          ctx.moveTo(0, 0)
          ctx.strokeStyle = 'rgba(80,80,80,0.4)'
          ctx.bezierCurveTo(...startControlPoint, ...endControlPoint, ...end)
          ctx.stroke()
        })
      })

      save(() => {
        ctx.translate(x, y)
        drawPath(() => {
          let [xi, yi] = currentPoint
          xi -= x
          yi -= y
          ctx.fillStyle = curve.color
          ctx.moveTo(0, 0)
          ctx.arc(xi, yi, 4, 0, Math.PI * 2)
          ctx.fill()
        })
      })
    }

    function renderCurves (): void {
      save(() => {
        ctx.translate(x, y)
        curves.forEach(renderCurve)
      })
    }

    function renderBackground (): void {
      save(() => {
        ctx.translate(0, 0)
        ctx.fillStyle = '#101219'
        drawPath(() => ctx.fillRect(...getFullScreenParams(ctx)))
      })
    }

    const { clear, save, drawPath } = getCtxUtils(ctx)
    const { curves, x, y } = this
    clear()
    renderBackground()
    renderCurves()
  }
}

window.onload = init

function init (): void {
  function animate (): void {
    burst.curves.forEach((curve: Curve, i: number) => {
      if (curve.isComplete) {
        const chunkSize = 6 / 32
        const newCurve: Curve = new Curve([burst.x, burst.y], i * chunkSize, 1300)
        burst.curves.splice(i, 1, newCurve)
      } else {
        curve.animate()
      }
    })
    burst.render(ctx)
    requestAnimationFrame(animate)
  }
  let [cx, cy] = [window.innerWidth / 2, window.innerHeight / 2]
  const burst = new Burst(cx, cy)

  const ctx = initCanvas(() => {
    [cx, cy] = [window.innerWidth / 2, window.innerHeight / 2]
    burst.x = cx
    burst.y = cy
  })

  burst.render(ctx)
  requestAnimationFrame(animate)
}