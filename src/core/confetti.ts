import confetti from 'canvas-confetti'
import type { ConfettiShape } from './config'

type Shape = confetti.Shape

const HEART =
  'M167 72c19,-38 37,-56 75,-56 42,0 76,33 76,75 0,76 -76,151 -151,227 -76,-76 -151,-151 -151,-227 0,-42 33,-75 75,-75 38,0 57,18 76,56z'

/**
 * 桜の花。画像（ビットマップ）だと iPhone の Safari で透過が崩れることがあるため、
 * 線で描いた形（Path2D）にする。色は紙吹雪ごとに SAKURA_COLORS から選ばれる。
 */
function sakuraPath(): string {
  const petal = (deg: number) => {
    const r = (deg * Math.PI) / 180
    const P = (x: number, y: number) => {
      const X = 50 + x * Math.cos(r) - y * Math.sin(r)
      const Y = 50 + x * Math.sin(r) + y * Math.cos(r)
      return `${X.toFixed(1)} ${Y.toFixed(1)}`
    }
    // 先に小さな切れ込みのある花びら（中心 → 外へ）
    return `M50 50 C${P(-13, -8)} ${P(-15, -26)} ${P(-4, -30)} L${P(0, -25)} L${P(4, -30)} C${P(15, -26)} ${P(13, -8)} 50 50Z`
  }
  return [0, 72, 144, 216, 288].map(petal).join('')
}
const SAKURA_PATH = sakuraPath()
/** 桜は答えの色にせず、いつも桜色の濃淡にする */
const SAKURA_COLORS = ['#ff9bb8', '#ffb3c8', '#ffc7d6', '#f77fa3', '#ffffff']
const SAKURA_SCALE = 10 / 62

export function makeShapes(shape: ConfettiShape, _scalar: number): Shape[] {
  switch (shape) {
    case 'star':
      return ['star']
    case 'heart':
      return [confetti.shapeFromPath({ path: HEART })]
    case 'sakura':
      return [confetti.shapeFromPath({ path: SAKURA_PATH, matrix: [SAKURA_SCALE, 0, 0, SAKURA_SCALE, -50 * SAKURA_SCALE, -50 * SAKURA_SCALE] as unknown as DOMMatrix })]
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
        colors: o.shape === 'sakura' ? SAKURA_COLORS : o.colors,
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
          colors: o.shape === 'sakura' ? SAKURA_COLORS : o.colors,
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
