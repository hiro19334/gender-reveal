import type { Component } from 'svelte'
import type { FontId, RevealConfig, ThemeId } from '../core/config'

export interface Theme {
  id: ThemeId
  name: string
  /** CSS変数。色・線・フォントなどの見た目はここに集める */
  vars: Record<string, string>
  /** はずれ風船・旗飾りなどに使う配色 */
  palette: string[]
  /** 背景のイラスト（空・丘・花・旗飾りなど） */
  Background: Component<{ palette: string[]; reduced?: boolean }>
}

export const FONTS: Record<FontId, { name: string; css: string }> = {
  maru: { name: '丸ゴシック', css: "'Zen Maru Gothic', 'Hiragino Maru Gothic ProN', sans-serif" },
  hand: { name: '手書き風', css: "'Klee One', 'Hiragino Kaku Gothic ProN', cursive" },
  mincho: { name: '明朝', css: "'Shippori Mincho', 'Hiragino Mincho ProN', serif" },
}

export function themeStyle(theme: Theme, config: RevealConfig): string {
  const vars = { ...theme.vars, '--font': FONTS[config.font].css }
  return Object.entries(vars)
    .map(([k, v]) => `${k}:${v}`)
    .join(';')
}
