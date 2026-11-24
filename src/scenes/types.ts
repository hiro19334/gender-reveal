import type { ConfettiShape, RevealConfig } from '../core/config'

/** 演出（シーン）が Player から受け取る道具。演出は「発表の直前まで」を担当し、最後に reveal() を呼ぶ */
export interface SceneApi {
  config: RevealConfig
  reduced: boolean
  palette: string[]
  /** 答えを隠したいプレビュー中は true。演出の中で答えの色を見せてはいけない */
  masked: boolean
  pop(): void
  scratch(): void
  tick(): void
  drumroll(sec: number): void
  /** x, y はステージ内の位置（0〜1） */
  burst(
    x: number,
    y: number,
    o?: { colors?: string[]; amount?: number; power?: number; shape?: ConfettiShape },
  ): void
  reveal(origin: { x: number; y: number }): void
}
