import type { Component } from 'svelte'
import type { SceneId } from '../core/config'
import type { SceneApi } from './types'
import Balloon from './balloon/Scene.svelte'
import Scratch from './scratch/Scene.svelte'
import Kusudama from './kusudama/Scene.svelte'
import Stork from './stork/Scene.svelte'
import PictureBook from './picturebook/Scene.svelte'

export interface SceneDef {
  id: SceneId
  name: string
  blurb: string
  /** ドラムロールの長さの設定が効く演出か */
  usesDrum: boolean
  component: Component<{ api: SceneApi }>
}

export const SCENES: Record<SceneId, SceneDef> = {
  balloon: { id: 'balloon', name: '風船', blurb: 'たくさんの風船を割って、最後の「？」で発表', usesDrum: true, component: Balloon },
  scratch: { id: 'scratch', name: 'スクラッチ', blurb: '銀色のカードを指でこすって、色を出す', usesDrum: false, component: Scratch },
  kusudama: { id: 'kusudama', name: 'くす玉', blurb: 'ひもを引っぱって、くす玉を割る', usesDrum: true, component: Kusudama },
  stork: { id: 'stork', name: 'こうのとり', blurb: 'こうのとりが運んできた包みをタップして、ひらく', usesDrum: true, component: Stork },
  picturebook: { id: 'picturebook', name: '絵本', blurb: '絵本のページをめくって、最後のページで発表', usesDrum: false, component: PictureBook },
}
