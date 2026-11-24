import type { Theme } from '../types'
import Background from './Background.svelte'

export const wa: Theme = {
  id: 'wa',
  name: '和風',
  vars: {
    '--paper': '#fbf5e6', // 生成り（和紙）
    '--ink': '#2f2a2e', // 墨色
    '--ink-soft': '#5d5358',
    '--sky1': '#cddbe3', // 淡い藍白
    '--sky2': '#f6ecd2', // 生成り〜卵色
    '--hill1': '#9db3b3', // 遠山（藍鼠）
    '--hill2': '#4d7080', // 波・手前（藍）
    '--cloud': '#fbf5e6', // 霞
  },
  // 朱・桜・山吹・萌黄・藤・浅葱
  palette: ['#e2674f', '#f1b3c0', '#efc355', '#a8c46a', '#b7a6d6', '#82c3c9'],
  Background,
}
