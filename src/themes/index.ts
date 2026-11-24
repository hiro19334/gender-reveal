import type { ThemeId } from '../core/config'
import { ehon } from './ehon/theme'
import { pop } from './pop/theme'
import { wa } from './wa/theme'
import type { Theme } from './types'

export const THEMES: Record<ThemeId, Theme> = { ehon, pop, wa }
export { themeStyle, FONTS } from './types'
export type { Theme } from './types'
