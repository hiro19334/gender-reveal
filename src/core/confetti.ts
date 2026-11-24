import confetti from 'canvas-confetti'
import type { ConfettiShape } from './config'

type Shape = confetti.Shape

const HEART =
  'M167 72c19,-38 37,-56 75,-56 42,0 76,33 76,75 0,76 -76,151 -151,227 -76,-76 -151,-151 -151,-227 0,-42 33,-75 75,-75 38,0 57,18 76,56z'

/** 桜の花びら。絵文字は端末ごとに絵と透過の扱いが違うので、自分で描いた透明背景の画像を使う */
const sakuraCache = new Map<number, Shape>()
function sakuraShape(scalar: number): Shape {
  const hit = sakuraCache.get(scalar)
  if (hit) return hit
  const S = 64
  const c = new OffscreenCanvas(S, S)
  const g = c.getContext('2d')!
  g.clearRect(0, 0, S, S)
  g.translate(S / 2, S / 2)
  for (let i = 0; i < 5; i++) {
    g.save()
    g.rotate((Math.PI * 2 * i) / 5)
    // 先に切れ込みのある花びら
    g.beginPath()
    g.moveTo(0, 0)
    g.bezierCurveTo(-13, -8, -15, -26, -4, -30)
    g.lineTo(0, -25)
    g.lineTo(4, -30)
    g.bezierCurveTo(15, -26, 13, -8, 0, 0)
    g.closePath()
    const grad = g.createLinearGradient(0, 0, 0, -30)
    grad.addColorStop(0, '#f27aa0')
    grad.addColorStop(0.5, '#ffb3c8')
    grad.addColorStop(1, '#ffe3ec')
    g.fillStyle = grad
    g.fill()
    g.restore()
  }
  g.beginPath()
  g.arc(0, 0, 3.2, 0, Math.PI * 2)
  g.fillStyle = '#f2c14e'
  g.fill()
  // 絵文字と同じ見た目の大きさになるよう縮める（描画側が scalar 倍で広げるため 1/scalar も掛ける）
  const m = 22 / S / scalar
  const shape = {
    type: 'bitmap',
    bitmap: c.transferToImageBitmap(),
    matrix: [m, 0, 0, m, (-S * m) / 2, (-S * m) / 2],
  } as unknown as Shape
  sakuraCache.set(scalar, shape)
  return shape
}

export function makeShapes(shape: ConfettiShape, scalar: number): Shape[] {
  switch (shape) {
    case 'star':
      return ['star']
    case 'heart':
      return [confetti.shapeFromPath({ path: HEART })]
    case 'sakura':
      return [sakuraShape(scalar)]
    default:
      return ['circle', 'square']
  }
}

export interface Fx {
  /** x, y はステージ内の位置（0〜1） */
  burst(x: number, y: number, o: { colors: string[]; amount: number; shape: ConfettiShape; power?: number }): void
  /** 上から降らせる */
  rain(o: { colors: string[]; amount: number; shape: ConfettiShape; ms: number }): void
  reset(): void
}

const scalarOf = (shape: ConfettiShape) => (shape === 'sakura' ? 2 : shape === 'heart' ? 1.6 : 1.1)

export function makeFx(canvas: HTMLCanvasElement, reduced: boolean): Fx {
  const fire = confetti.create(canvas, { resize: true, useWorker: false })
  const k = reduced ? 0.35 : 1
  let timers: number[] = []
  /** 画面の回転・リサイズ後も、描画サイズと表示サイズを合わせる */
  const fit = () => {
    const r = canvas.getBoundingClientRect()
    const w = Math.round(r.width)
    const h = Math.round(r.height)
    if (w > 0 && h > 0 && (canvas.width !== w || canvas.height !== h)) {
      canvas.width = w
      canvas.height = h
    }
  }
  return {
    burst(x, y, o) {
      fit()
      const scalar = scalarOf(o.shape)
      void fire({
        particleCount: Math.round(o.amount * k),
        spread: 75,
        startVelocity: 38 * (o.power ?? 1),
        gravity: 0.9,
        ticks: 220,
        origin: { x, y },
        colors: o.colors,
        shapes: makeShapes(o.shape, scalar),
        scalar,
        disableForReducedMotion: false,
      })
    },
    rain(o) {
      const scalar = scalarOf(o.shape)
      const end = performance.now() + o.ms
      const step = () => {
        if (performance.now() > end) return
        fit()
        void fire({
          particleCount: Math.max(1, Math.round((o.amount / 14) * k)),
          angle: 90,
          spread: 120,
          startVelocity: 12,
          gravity: 0.55,
          ticks: 320,
          origin: { x: Math.random(), y: -0.05 },
          colors: o.colors,
          shapes: makeShapes(o.shape, scalar),
          scalar,
        })
        timers.push(window.setTimeout(step, 90))
      }
      step()
    },
    reset() {
      timers.forEach(clearTimeout)
      timers = []
      fire.reset()
    },
  }
}
