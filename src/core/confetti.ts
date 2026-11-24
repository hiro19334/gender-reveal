import confetti from 'canvas-confetti'
import type { ConfettiShape } from './config'

type Shape = confetti.Shape

const HEART =
  'M167 72c19,-38 37,-56 75,-56 42,0 76,33 76,75 0,76 -76,151 -151,227 -76,-76 -151,-151 -151,-227 0,-42 33,-75 75,-75 38,0 57,18 76,56z'

export function makeShapes(shape: ConfettiShape, scalar: number): Shape[] {
  switch (shape) {
    case 'star':
      return ['star']
    case 'heart':
      return [confetti.shapeFromPath({ path: HEART })]
    case 'sakura':
      return [confetti.shapeFromText({ text: '🌸', scalar })]
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
