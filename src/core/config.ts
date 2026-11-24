// 発表の設定。すべてURLのハッシュに入れて持ち運ぶ（サーバーもDBも使わない）

export const SCHEMA_VERSION = 1

export const ANSWERS = ['girl', 'boy', 'gg', 'bb', 'gb'] as const
export type Answer = (typeof ANSWERS)[number]
export type SceneId = 'balloon' | 'scratch' | 'kusudama' | 'stork' | 'picturebook' | 'cheer' | 'pair'
export const SCENE_IDS: readonly SceneId[] = ['balloon', 'scratch', 'kusudama', 'stork', 'picturebook', 'cheer', 'pair']
export type ThemeId = 'ehon' | 'pop' | 'wa'
export const THEME_IDS: readonly ThemeId[] = ['ehon', 'pop', 'wa']
export const FONT_IDS = ['maru', 'hand', 'mincho'] as const
export type FontId = (typeof FONT_IDS)[number]
export const SHAPES = ['circle', 'star', 'heart', 'sakura'] as const
export type ConfettiShape = (typeof SHAPES)[number]

export interface RevealConfig {
  v: number
  answer: Answer
  scene: SceneId
  theme: ThemeId
  colors: { girl: string; boy: string }
  text: { baby: string; parents: string; greeting: string; reveal: string; message: string }
  dueDate: string // YYYY-MM-DD。空なら表示しない
  drum: number // ドラムロールの秒数
  feint: boolean // 一度逆の色を見せてから本当の色へ
  confetti: { amount: number; shape: ConfettiShape }
  sound: boolean
  font: FontId
  balloon: { count: number }
  /** 絵本の演出：ページ（挿絵＋文章） */
  book: { pages: BookPage[] }
}

/** 絵本の挿絵プリセット（絵は src/scenes/picturebook/Art.svelte） */
export const ART_IDS = ['meet', 'belly', 'echo', 'family', 'clothes', 'moon', 'bear', 'cradle'] as const
export type ArtId = (typeof ART_IDS)[number]
export interface BookPage {
  art: ArtId
  text: string
}
export const BOOK_MAX_PAGES = 6
export const BOOK_TEXT_MAX = 60

export const ANSWER_LABELS: Record<Answer, string> = {
  girl: '女の子',
  boy: '男の子',
  gg: '女の子の\u200bふたご',
  bb: '男の子の\u200bふたご',
  gb: '男の子と女の子の\u200bふたご',
}

export const defaultConfig = (): RevealConfig => ({
  v: SCHEMA_VERSION,
  answer: 'girl',
  scene: 'balloon',
  theme: 'ehon',
  colors: { girl: '#f4a6b8', boy: '#8ec5e8' },
  text: { baby: '赤ちゃん', parents: '', greeting: '', reveal: '', message: '' },
  dueDate: '',
  drum: 3,
  feint: false,
  confetti: { amount: 60, shape: 'circle' },
  sound: true,
  font: 'maru',
  balloon: { count: 5 },
  book: {
    pages: [
      { art: 'meet', text: 'あるところに、なかよしの ふたりが いました。' },
      { art: 'belly', text: 'ある日、ふたりの もとに ちいさな いのちが やってきました。' },
      { art: 'echo', text: 'さて、うまれてくるのは だれでしょう？' },
    ],
  },
})

const oneOf = <T extends string>(v: unknown, list: readonly T[], d: T): T =>
  typeof v === 'string' && (list as readonly string[]).includes(v) ? (v as T) : d
/** 前後の空白を取り除いてから長さを制限する */
const str = (v: unknown, d: string, max = 80) => (typeof v === 'string' ? v.trim().slice(0, max).trim() : d)
const num = (v: unknown, d: number, min: number, max: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : d
const bool = (v: unknown, d: boolean) => (typeof v === 'boolean' ? v : d)
const color = (v: unknown, d: string) => (typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : d)
const obj = (v: unknown): Record<string, unknown> =>
  typeof v === 'object' && v !== null ? (v as Record<string, unknown>) : {}

/** YYYY-MM-DD として実在する日付だけ通す（9999-99-99 や 2026-02-31 は空にする） */
function validDate(v: unknown): string {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return ''
  const [y, m, d] = v.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d))
  // 年は 0000〜0099 だと Date.UTC が 1900 年代に読み替えるため、setUTCFullYear で合わせる
  t.setUTCFullYear(y)
  return t.getUTCFullYear() === y && t.getUTCMonth() === m - 1 && t.getUTCDate() === d ? v : ''
}

/** 発表の色が決まらない（マスク中など）ときに使う、答えを示さない色 */
export const NEUTRAL = '#e6dfd0'

/** 1色ならそのまま、2色なら左右半分ずつのグラデーション（背景用） */
export const colorsBackground = (cs: string[]) =>
  cs.length > 1 ? `linear-gradient(110deg, ${cs[0]} 50%, ${cs[1]} 50%)` : cs[0]

/** 不完全・古い・壊れた設定を、既定値で補って正しい形にそろえる */
export function normalizeConfig(input: unknown): RevealConfig {
  const d = defaultConfig()
  const o = obj(input)
  const colors = obj(o.colors)
  const text = obj(o.text)
  const conf = obj(o.confetti)
  const balloon = obj(o.balloon)
  const book = obj(o.book)
  return {
    v: SCHEMA_VERSION,
    answer: oneOf(o.answer, ANSWERS, d.answer),
    scene: oneOf(o.scene, SCENE_IDS, d.scene),
    theme: oneOf(o.theme, THEME_IDS, d.theme),
    colors: { girl: color(colors.girl, d.colors.girl), boy: color(colors.boy, d.colors.boy) },
    text: {
      baby: str(text.baby, d.text.baby, 12) || d.text.baby, // 空なら「赤ちゃん」に戻す
      parents: str(text.parents, d.text.parents, 20),
      greeting: str(text.greeting, d.text.greeting, 30),
      reveal: str(text.reveal, d.text.reveal, 30),
      message: str(text.message, d.text.message, 80),
    },
    dueDate: validDate(o.dueDate),
    drum: num(o.drum, d.drum, 0, 8),
    feint: bool(o.feint, d.feint),
    confetti: {
      amount: num(conf.amount, d.confetti.amount, 10, 200),
      shape: oneOf(conf.shape, SHAPES, d.confetti.shape),
    },
    sound: bool(o.sound, d.sound),
    font: oneOf(o.font, FONT_IDS, d.font),
    balloon: { count: Math.round(num(balloon.count, d.balloon.count, 3, 9)) },
    book: { pages: normalizeBookPages(book.pages, d.book.pages) },
  }
}

/** ページは1〜6枚。挿絵は既知のIDだけ、文章は長さを制限する。配列でなければ既定、空なら既定 */
function normalizeBookPages(v: unknown, d: BookPage[]): BookPage[] {
  if (!Array.isArray(v)) return d.map((p) => ({ ...p }))
  const pages = v.slice(0, BOOK_MAX_PAGES).map((p, i) => {
    const o = obj(p)
    return { art: oneOf(o.art, ART_IDS, ART_IDS[i % ART_IDS.length]), text: str(o.text, '', BOOK_TEXT_MAX) }
  })
  return pages.length > 0 ? pages : d.map((p) => ({ ...p }))
}

/** 発表で使う色（ふたごで性別が違うときは2色） */
export function revealColors(c: RevealConfig): string[] {
  switch (c.answer) {
    case 'girl':
    case 'gg':
      return [c.colors.girl]
    case 'boy':
    case 'bb':
      return [c.colors.boy]
    case 'gb':
      return [c.colors.girl, c.colors.boy]
  }
}

/** フェイント用の「逆の色」。性別がまざるふたごは対象外（null） */
export function feintColors(c: RevealConfig): string[] | null {
  switch (c.answer) {
    case 'girl':
    case 'gg':
      return [c.colors.boy]
    case 'boy':
    case 'bb':
      return [c.colors.girl]
    case 'gb':
      return null
  }
}

export const revealText = (c: RevealConfig) => c.text.reveal || `${ANSWER_LABELS[c.answer]}です！`
/** 「ジェンダーリビール」の前で改行できるようにする（途中で「ジェンダーリ／ビール」と割れないように） */
const breakBeforeWord = (t: string) => t.replace(/(?<!\u200b)ジェンダーリビール/g, '\u200bジェンダーリビール')
export const greetingText = (c: RevealConfig) => breakBeforeWord(c.text.greeting || `${c.text.baby}の\u200bジェンダーリビール`)

/** 予定日までの日数。未設定・過ぎている場合は null */
export function daysUntil(dueDate: string, now = new Date()): number | null {
  if (!dueDate) return null
  const [y, m, d] = dueDate.split('-').map(Number)
  const due = Date.UTC(y, m - 1, d)
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  const diff = Math.round((due - today) / 86400000)
  return diff >= 0 ? diff : null
}
