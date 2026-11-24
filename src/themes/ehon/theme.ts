import type { Theme } from '../types'
import Background from './Background.svelte'

export const ehon: Theme = {
  id: 'ehon',
  name: 'やさしい水彩',
  vars: {
    '--paper': '#fffaf0',
    '--ink': '#6a5648',
    '--ink-soft': '#6e5d50',
    '--sky1': '#cfe8f3',
    '--sky2': '#fdf1d9',
    '--hill1': '#c2e0b2',
    '--hill2': '#a6d19c',
    '--cloud': '#ffffff',
  },
  palette: ['#f7c9c2', '#fbe3a1', '#bfe3c8', '#cdbfe8', '#f9d3a8', '#bfe0ee'],
  Background,
}
