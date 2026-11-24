import { describe, expect, it } from 'vitest'
import LZString from 'lz-string'
import { MAX_DATA_LENGTH, decodeConfig, encodeConfig } from './codec'
import { ART_IDS, daysUntil, defaultConfig, feintColors, greetingText, normalizeConfig, revealColors, revealText } from './config'

describe('codec', () => {
  it('往復で一致する（日本語の文言を含む）', () => {
    const c = defaultConfig()
    c.answer = 'gb'
    c.text.baby = 'もも🍑ちゃん'
    c.text.message = 'みんなに会えるのを楽しみにしてるね'
    c.feint = true
    const r = decodeConfig(encodeConfig(c))
    expect(r.ok && r.config).toEqual(c)
  })

  it('URLに答えが平文で出ない', () => {
    for (const a of ['girl', 'boy'] as const) {
      const c = defaultConfig()
      c.answer = a
      const url = encodeConfig(c)
      expect(url).not.toContain(a)
      expect(url).not.toMatch(/^[\w-]*(girl|boy)/i)
      // 圧縮だけの文字列（難読化なし）とは別物になっている
      expect(url).not.toBe(LZString.compressToEncodedURIComponent(JSON.stringify(c)))
    }
  })

  it('項目が足りない古いデータは既定値で補う', () => {
    const partial = normalizeConfig({ v: 1, answer: 'boy', text: { baby: 'たろう' } })
    expect(partial.answer).toBe('boy')
    expect(partial.text.baby).toBe('たろう')
    expect(partial.balloon.count).toBe(defaultConfig().balloon.count)
  })

  it('壊れた値は既定値に戻し、範囲外は丸める', () => {
    const c = normalizeConfig({ answer: 'x', colors: { girl: 'red' }, drum: 999, balloon: { count: 1 } })
    expect(c.answer).toBe('girl')
    expect(c.colors.girl).toBe(defaultConfig().colors.girl)
    expect(c.drum).toBe(8)
    expect(c.balloon.count).toBe(3)
  })

  it('演出の指定：5種は通り、知らない演出は風船に戻す', () => {
    for (const scene of ['balloon', 'scratch', 'kusudama', 'stork', 'picturebook'] as const) {
      const c = { ...defaultConfig(), scene }
      const r = decodeConfig(encodeConfig(c))
      expect(r.ok && r.config.scene).toBe(scene)
    }
    expect(normalizeConfig({ scene: 'unknown' }).scene).toBe('balloon')
  })

  it('絵本のページが往復で一致する', () => {
    const c = defaultConfig()
    c.scene = 'picturebook'
    c.book.pages = [
      { art: 'moon', text: 'おつきさまに おねがい🌙' },
      { art: 'cradle', text: '' },
      { art: 'bear', text: 'くまさんも まってるよ' },
      { art: 'clothes', text: 'ちいさな おようふく' },
      { art: 'family', text: 'はやく あいたいな' },
      { art: 'echo', text: 'エコーで見たよ' },
    ]
    const r = decodeConfig(encodeConfig(c))
    expect(r.ok && r.config).toEqual(c)
    expect(r.ok && r.config.scene).toBe('picturebook')
  })

  it('絵本の設定：古いデータは既定の3ページ、壊れた値は丸める', () => {
    expect(normalizeConfig({ v: 1 }).book.pages).toHaveLength(3)
    expect(normalizeConfig({ book: { pages: 'x' } }).book.pages).toHaveLength(3)
    expect(normalizeConfig({ book: { pages: [] } }).book.pages).toHaveLength(3)
    const c = normalizeConfig({
      book: {
        pages: [
          { art: 'unknown', text: 'あ'.repeat(500) },
          { art: 'moon', text: 123 },
          null,
          ...Array.from({ length: 10 }, () => ({ art: 'bear', text: 'x' })),
        ],
      },
    })
    expect(c.book.pages).toHaveLength(6)
    for (const p of c.book.pages) expect((ART_IDS as readonly string[]).includes(p.art)).toBe(true)
    expect(c.book.pages[0].text).toHaveLength(60)
    expect(c.book.pages[1]).toEqual({ art: 'moon', text: '' })
  })

  it('壊れたURL・新しすぎるバージョンは開かない', () => {
    expect(decodeConfig('')).toEqual({ ok: false, reason: 'invalid' })
    expect(decodeConfig('!!!not-valid!!!')).toEqual({ ok: false, reason: 'invalid' })
    const future = { ...defaultConfig(), v: 99 }
    // 99 を SCHEMA_VERSION より大きい値として持つデータ
    expect(decodeConfig(encodeConfig(future))).toEqual({ ok: false, reason: 'newer' })
  })

  it('長すぎるデータ（展開爆弾）は展開せずに弾く', () => {
    expect(decodeConfig('a'.repeat(4001))).toEqual({ ok: false, reason: 'invalid' })
    const bomb = LZString.compressToEncodedURIComponent('a'.repeat(1_000_000))
    expect(decodeConfig(bomb.repeat(Math.ceil(4001 / bomb.length)))).toEqual({ ok: false, reason: 'invalid' })
    // 爆弾の圧縮自体が遅いので、CI の遅いマシンでも落ちないよう余裕を持たせる
  }, 30_000)

  it('正規の最大構成（絵本6ページ・文言最大）は長さ制限を通る', () => {
    const c = defaultConfig()
    c.scene = 'picturebook'
    c.answer = 'gb'
    c.dueDate = '2026-12-31'
    c.text = { baby: 'あ'.repeat(12), parents: 'い'.repeat(20), greeting: 'う'.repeat(30), reveal: 'え'.repeat(30), message: 'お'.repeat(80) }
    // 圧縮されにくいよう、ページごとに違う文字を使う
    const chars = 'かきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろ🌙🍑'
    c.book.pages = ART_IDS.slice(0, 6).map((art, i) => ({
      art,
      text: Array.from({ length: 60 }, (_, j) => chars[(i * 7 + j * 3) % chars.length]).join(''),
    }))
    const url = encodeConfig(c)
    expect(url.length).toBeLessThan(MAX_DATA_LENGTH)
    const r = decodeConfig(url)
    expect(r.ok && r.config).toEqual(c)
  })
})

describe('config', () => {
  it('予定日は実在する日付だけ通す', () => {
    for (const bad of ['9999-99-99', '2026-02-31', '2026-13-01', '2026-00-10', '2026-04-31', '2026-1-1', 'abc', 123]) {
      expect(normalizeConfig({ dueDate: bad }).dueDate).toBe('')
    }
    expect(normalizeConfig({ dueDate: '2028-02-29' }).dueDate).toBe('2028-02-29')
    expect(normalizeConfig({ dueDate: '2026-02-29' }).dueDate).toBe('')
    expect(normalizeConfig({ dueDate: '2026-12-31' }).dueDate).toBe('2026-12-31')
  })

  it('文言は前後の空白を落とし、呼び名が空なら「赤ちゃん」に戻す', () => {
    const c = normalizeConfig({
      text: { baby: '   ', parents: '  たろう・はなこ ', greeting: '　ようこそ　', reveal: ' ふたり！ ', message: ' \n よろしくね \n' },
    })
    expect(c.text.baby).toBe('赤ちゃん')
    expect(c.text.parents).toBe('たろう・はなこ')
    expect(c.text.greeting).toBe('ようこそ')
    expect(c.text.reveal).toBe('ふたり！')
    expect(c.text.message).toBe('よろしくね')
    expect(greetingText(normalizeConfig({ text: { baby: '' } }))).toBe('赤ちゃんの\u200bジェンダーリビール')
    expect(normalizeConfig({ text: { greeting: '   ' } }).text.greeting).toBe('')
    expect(normalizeConfig({ book: { pages: [{ art: 'moon', text: '  やあ ' }] } }).book.pages[0].text).toBe('やあ')
  })

  it('色・文言・フェイント', () => {
    const c = defaultConfig()
    expect(revealColors(c)).toEqual([c.colors.girl])
    expect(feintColors(c)).toEqual([c.colors.boy])
    expect(revealText(c)).toBe('女の子です！')
    c.answer = 'gb'
    expect(revealColors(c)).toEqual([c.colors.girl, c.colors.boy])
    expect(feintColors(c)).toBeNull()
    c.text.reveal = 'ふたり、きます！'
    expect(revealText(c)).toBe('ふたり、きます！')
  })

  it('予定日までの日数', () => {
    const now = new Date(2026, 10, 23)
    expect(daysUntil('2026-12-03', now)).toBe(10)
    expect(daysUntil('2026-11-23', now)).toBe(0)
    expect(daysUntil('2026-11-01', now)).toBeNull()
    expect(daysUntil('', now)).toBeNull()
  })
})
