import type { Theme } from '../types'
import Background from './Background.svelte'

export const pop: Theme = {
  id: 'pop',
  name: 'ポップ',
  vars: {
    '--paper': '#fffdf5',
    '--ink': '#2b2540',
    '--ink-soft': '#5c5478',
    '--sky1': '#ffe45e',
    '--sky2': '#ffffff',
    '--hill1': '#4fd1c5',
    '--hill2': '#ff7a8a',
    '--cloud': '#ffffff',
  },
  palette: ['#ff5d73', '#ffd23f', '#2ec4b6', '#4d96ff', '#ff9f43', '#a66cff'],
  Background,
}
