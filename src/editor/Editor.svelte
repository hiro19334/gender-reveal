<script lang="ts">
  import QRCode from 'qrcode'
  import { ANSWER_LABELS, ART_IDS, BOOK_MAX_PAGES, BOOK_TEXT_MAX, defaultConfig, feintColors, normalizeConfig, type Answer, type ConfettiShape, type FontId, type RevealConfig } from '../core/config'
  import { untrack } from 'svelte'
  import { decodeConfig, encodeConfig } from '../core/codec'
  import { THEMES, FONTS } from '../themes'
  import { SCENES } from '../scenes/registry'
  import Player from '../player/Player.svelte'
  import Art from '../scenes/picturebook/Art.svelte'
  import { ARTS } from '../scenes/picturebook/arts'

  let { initial = '' }: { initial?: string } = $props()

  const DRAFT_KEY = 'gr-draft-v1'

  function load(): RevealConfig {
    if (initial) {
      const r = decodeConfig(initial)
      if (r.ok) return r.config
    }
    try {
      const raw = localStorage.getItem(DRAFT_KEY)
      if (raw) return normalizeConfig(JSON.parse(raw))
    } catch {
      /* 下書きが読めなくても続ける */
    }
    return defaultConfig()
  }

  let cfg = $state<RevealConfig>(load())
  let maskAnswer = $state(false)
  let previewKey = $state(0)
  // プレビューに渡す設定。入力のたびに差し替えず、デバウンス後にまとめて更新する
  let previewCfg = $state.raw<RevealConfig>(untrack(() => normalizeConfig($state.snapshot(cfg))))
  let shareUrl = $state('')
  let qr = $state('')
  let stale = $state(false) // 共有URLを作ったあとに設定を変えた
  let copied = $state(false)

  // 画面幅：広いときは横並び（追従）、狭いときは「プレビューを見る」ボタンからシートで表示
  let wide = $state(false)
  let sheetOpen = $state(false)
  let sheetEl = $state<HTMLElement>()
  let closeBtn = $state<HTMLButtonElement>()
  let fabBtn = $state<HTMLButtonElement>()
  $effect(() => {
    const mq = matchMedia('(min-width: 880px)')
    const on = () => {
      wide = mq.matches
      if (wide) sheetOpen = false
    }
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  })
  // シートを開いている間は背面をスクロールさせない
  $effect(() => {
    if (!sheetOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeBtn?.focus()
    return () => {
      document.body.style.overflow = prev
    }
  })
  function openSheet() {
    previewCfg = normalizeConfig($state.snapshot(cfg))
    previewKey += 1
    sheetOpen = true
  }
  function closeSheet() {
    sheetOpen = false
    fabBtn?.focus()
  }
  function onSheetKey(e: KeyboardEvent) {
    if (e.key === 'Escape') {
      e.stopPropagation()
      closeSheet()
      return
    }
    if (e.key !== 'Tab' || !sheetEl) return
    // シートの外へフォーカスが出ないようにする
    const f = Array.from(sheetEl.querySelectorAll<HTMLElement>('button, input, a[href]')).filter((el) => !(el as HTMLButtonElement).disabled)
    if (!f.length) return
    const first = f[0]
    const last = f[f.length - 1]
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault()
      last.focus()
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault()
      first.focus()
    }
  }
  function restartPreview() {
    previewCfg = normalizeConfig($state.snapshot(cfg))
    previewKey += 1
  }

  const feintOk = $derived(feintColors(cfg) !== null)

  const answers = Object.keys(ANSWER_LABELS) as Answer[]
  const shapes: { id: ConfettiShape; name: string }[] = [
    { id: 'circle', name: 'まる・しかく' },
    { id: 'star', name: 'ほし' },
    { id: 'heart', name: 'ハート' },
    { id: 'sakura', name: 'さくら' },
  ]

  // 設定を変えたら、少し待ってプレビューを最初からやり直す。下書きも保存する
  let first = true
  $effect(() => {
    const snap = JSON.stringify($state.snapshot(cfg))
    try {
      localStorage.setItem(DRAFT_KEY, snap)
    } catch {
      /* 保存できなくても続ける */
    }
    if (untrack(() => shareUrl)) stale = true
    shareUrl = ''
    qr = ''
    if (first) {
      first = false
      return
    }
    const t = setTimeout(restartPreview, 700)
    return () => clearTimeout(t)
  })

  async function makeUrl() {
    const url = location.href.split('#')[0] + '#/r/' + encodeConfig(normalizeConfig($state.snapshot(cfg)))
    shareUrl = url
    stale = false
    qr = await QRCode.toDataURL(url, { margin: 2, width: 480, color: { dark: '#6a5648', light: '#fffaf0' } })
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl)
      copied = true
      setTimeout(() => (copied = false), 1500)
    } catch {
      /* 失敗したら、表示中のURLを手でコピーしてもらう */
    }
  }

  // 絵本のページ編集
  function addPage() {
    if (cfg.book.pages.length >= BOOK_MAX_PAGES) return
    const art = ART_IDS[cfg.book.pages.length % ART_IDS.length]
    cfg.book.pages.push({ art, text: '' })
  }
  function removePage(i: number) {
    if (cfg.book.pages.length <= 1) return
    cfg.book.pages.splice(i, 1)
  }
  function movePage(i: number, d: -1 | 1) {
    const j = i + d
    if (j < 0 || j >= cfg.book.pages.length) return
    const [p] = cfg.book.pages.splice(i, 1)
    cfg.book.pages.splice(j, 0, p)
  }

  function reset() {
    if (confirm('設定を最初の状態に戻しますか？')) cfg = defaultConfig()
  }
</script>

{#snippet previewBody()}
  <div class="frame">
    {#key previewKey}
      <Player config={previewCfg} {maskAnswer} />
    {/key}
  </div>
  <label class="check"><input type="checkbox" bind:checked={maskAnswer} /> プレビューでは答えを隠す（自分は見たくない）</label>
  <button class="sub" onclick={restartPreview}>プレビューをはじめから</button>
{/snippet}

<div class="editor">
  <header>
    <h1>ジェンダーリビールをつくる</h1>
    <p>答えや演出を選ぶと、URLができます。そのURLを送るだけで、相手はアプリなしで開けます。</p>
  </header>

  <div class="cols">
    {#if wide}
      <section class="preview">
        {@render previewBody()}
      </section>
    {/if}

    <section class="form">
      <details open>
        <summary>答え</summary>
        <div class="radios">
          {#each answers as a (a)}
            <label class:on={cfg.answer === a}><input type="radio" name="answer" bind:group={cfg.answer} value={a} />{ANSWER_LABELS[a]}</label>
          {/each}
        </div>
        <div class="row">
          <label>女の子の色 <input type="color" bind:value={cfg.colors.girl} /></label>
          <label>男の子の色 <input type="color" bind:value={cfg.colors.boy} /></label>
        </div>
        <p class="hint">色はなんでもOK。ピンクと青にしなくても大丈夫です。</p>
      </details>

      <details open>
        <summary>演出とテーマ</summary>
        <div class="radios">
          {#each Object.values(SCENES) as s (s.id)}
            <label class:on={cfg.scene === s.id}><input type="radio" name="scene" bind:group={cfg.scene} value={s.id} />{s.name}</label>
          {/each}
        </div>
        <p class="hint">{SCENES[cfg.scene].blurb}</p>
        <div class="radios">
          {#each Object.values(THEMES) as t (t.id)}
            <label class:on={cfg.theme === t.id}><input type="radio" name="theme" bind:group={cfg.theme} value={t.id} />{t.name}</label>
          {/each}
        </div>
        {#if cfg.scene === 'balloon'}
          <label class="field">風船の数 <b>{cfg.balloon.count}個</b>
            <input type="range" min="3" max="9" step="1" bind:value={cfg.balloon.count} aria-valuetext="{cfg.balloon.count}個" />
          </label>
        {/if}
      </details>

      {#if cfg.scene === 'picturebook'}
        <details>
          <summary>絵本のページ（{cfg.book.pages.length} / {BOOK_MAX_PAGES}ページ）</summary>
          <p class="hint">表紙のあとに、ここでつくったページが順に並びます。最後のページをめくると発表です。</p>
          {#each cfg.book.pages as pg, i (i)}
            <div class="pg">
              <div class="pghead">
                <b>{i + 1}ページ目</b>
                <span class="pgbtns">
                  <button class="mini" onclick={() => movePage(i, -1)} disabled={i === 0} aria-label="{i + 1}ページ目を前へ">↑</button>
                  <button class="mini" onclick={() => movePage(i, 1)} disabled={i === cfg.book.pages.length - 1} aria-label="{i + 1}ページ目を後ろへ">↓</button>
                  <button class="mini del" onclick={() => removePage(i)} disabled={cfg.book.pages.length <= 1} aria-label="{i + 1}ページ目を削除">削除</button>
                </span>
              </div>
              <div class="arts" role="radiogroup" aria-label="挿絵">
                {#each ARTS as a (a.id)}
                  <button class="art" class:on={pg.art === a.id} role="radio" aria-checked={pg.art === a.id} title={a.name} onclick={() => (pg.art = a.id)}>
                    <Art id={a.id} />
                    <span>{a.name}</span>
                  </button>
                {/each}
              </div>
              <label class="field">文章（空でもOK）
                <textarea rows="2" maxlength={BOOK_TEXT_MAX} bind:value={pg.text} placeholder="例：ふたりは ある日 出会いました"></textarea>
                <span class="count">{pg.text.length} / {BOOK_TEXT_MAX}</span>
              </label>
            </div>
          {/each}
          <button class="sub" onclick={addPage} disabled={cfg.book.pages.length >= BOOK_MAX_PAGES}>＋ ページを足す</button>
          <label class="field">最後のページのあとのドラムロール <b>{cfg.drum}秒</b>
            <input type="range" min="0" max="8" step="0.5" bind:value={cfg.drum} aria-valuetext="{cfg.drum}秒" />
          </label>
        </details>
      {/if}

      <details>
        <summary>文言</summary>
        <label class="field">赤ちゃんの呼び名<input type="text" maxlength="12" bind:value={cfg.text.baby} placeholder="赤ちゃん" /></label>
        <label class="field">差出人（パパ・ママなど）<input type="text" maxlength="20" bind:value={cfg.text.parents} placeholder="例：たろう・はなこ" /></label>
        <label class="field">はじめのあいさつ<input type="text" maxlength="30" bind:value={cfg.text.greeting} placeholder="空なら「{cfg.text.baby}のジェンダーリビール」" /></label>
        <label class="field">発表の文言<input type="text" maxlength="30" bind:value={cfg.text.reveal} placeholder="空なら「{ANSWER_LABELS[cfg.answer]}です！」" /></label>
        <label class="field">おわりのひとこと<textarea rows="2" maxlength="80" bind:value={cfg.text.message} placeholder="例：みんなに会えるのを楽しみにしてるね"></textarea></label>
        <label class="field">予定日（「あと◯日」を出す）<input type="date" bind:value={cfg.dueDate} /></label>
      </details>

      <details>
        <summary>盛り上げ</summary>
        {#if SCENES[cfg.scene].usesDrum}
          <label class="field">ドラムロールの長さ <b>{cfg.drum}秒</b>
            <input type="range" min="0" max="8" step="0.5" bind:value={cfg.drum} aria-valuetext="{cfg.drum}秒" />
          </label>
        {:else}
          <p class="hint">{SCENES[cfg.scene].name}では、ドラムロールはありません。</p>
        {/if}
        <label class="check" class:off={!feintOk}><input type="checkbox" bind:checked={cfg.feint} disabled={!feintOk} /> フェイント（一度ちがう色を見せてから本当の色へ）</label>
        {#if !feintOk}<p class="hint">男の子と女の子のふたごでは使えません。</p>{/if}
        <label class="field">紙吹雪の量 <b>{cfg.confetti.amount}個</b>
          <input type="range" min="10" max="200" step="10" bind:value={cfg.confetti.amount} aria-valuetext="{cfg.confetti.amount}個" />
        </label>
        <div class="radios">
          {#each shapes as s (s.id)}
            <label class:on={cfg.confetti.shape === s.id}><input type="radio" name="shape" bind:group={cfg.confetti.shape} value={s.id} />{s.name}</label>
          {/each}
        </div>
      </details>

      <details>
        <summary>音と文字</summary>
        <label class="check"><input type="checkbox" bind:checked={cfg.sound} /> 音を出す</label>
        <div class="radios">
          {#each Object.keys(FONTS) as f (f)}
            <label class:on={cfg.font === f}><input type="radio" name="font" bind:group={cfg.font} value={f as FontId} />{FONTS[f as FontId].name}</label>
          {/each}
        </div>
      </details>

      <div class="share">
        <button class="main" onclick={makeUrl}>共有URLをつくる</button>
        <button class="sub" onclick={reset}>設定をリセット</button>
        {#if stale && !shareUrl}
          <p class="stale" role="status">設定を変えました。URLをつくり直してください。</p>
        {/if}
        {#if shareUrl}
          <div class="out">
            <textarea readonly rows="4" onclick={(e) => e.currentTarget.select()}>{shareUrl}</textarea>
            <div class="outrow">
              <button class="sub" onclick={copy}>{copied ? 'コピーしました' : 'URLをコピー'}</button>
              <a class="sub" href={shareUrl} target="_blank" rel="noopener">ひらいてみる</a>
            </div>
            <img class="qr" src={qr} alt="共有URLのQRコード" width="240" height="240" />
            <p class="hint">URLに答えが入っています（そのままでは読めません）。送る相手以外には見せないでください。</p>
          </div>
        {/if}
      </div>
    </section>
  </div>

  {#if !wide}
    <button class="fab" bind:this={fabBtn} onclick={openSheet}>プレビューを見る</button>
  {/if}
</div>

{#if !wide && sheetOpen}
  <!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
  <div class="sheet" role="dialog" aria-modal="true" aria-label="プレビュー" tabindex="-1" bind:this={sheetEl} onkeydown={onSheetKey}>
    <div class="sheetbody">
      <button class="sub close" bind:this={closeBtn} onclick={closeSheet}>とじる</button>
      {@render previewBody()}
    </div>
  </div>
{/if}

<style>
  .editor {
    max-width: 1040px;
    margin: 0 auto;
    padding: 20px 16px 96px;
    color: #5b4a3f;
  }
  /* キーボード操作時のフォーカスリング（全要素共通） */
  .editor :global(:focus-visible),
  .sheet :global(:focus-visible) {
    outline: 3px solid #1f5fbf;
    outline-offset: 2px;
  }
  /* 見えない input を使うチップは、ラベル側にリングを出す */
  .radios label:has(input:focus-visible) {
    outline: 3px solid #1f5fbf;
    outline-offset: 2px;
  }
  header h1 {
    margin: 0 0 4px;
    font-size: 1.5rem;
  }
  header p {
    margin: 0 0 20px;
    color: #6e5d50;
    font-size: 0.9rem;
  }
  .cols {
    display: grid;
    gap: 24px;
    grid-template-columns: 1fr;
  }
  .preview {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
  }
  .frame {
    width: min(100%, 340px);
    aspect-ratio: 9 / 16;
    border: 3px solid #6a5648;
    border-radius: 22px;
    overflow: hidden;
    background: #fff;
    box-shadow: 0 6px 0 rgba(106, 86, 72, 0.2);
  }
  @media (min-width: 880px) {
    .cols {
      grid-template-columns: 360px 1fr;
      align-items: start;
    }
    .editor {
      padding-bottom: 60px;
    }
    .preview {
      position: sticky;
      top: 16px;
    }
  }
  .sheet {
    position: fixed;
    inset: 0;
    z-index: 50;
    background: #3c2d23;
    display: flex;
    justify-content: center;
    overflow-y: auto;
  }
  .sheetbody {
    width: 100%;
    max-width: 420px;
    min-height: 100%;
    box-sizing: border-box;
    padding: 12px 16px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    color: #fffaf0;
  }
  .sheetbody .close {
    align-self: flex-end;
  }
  .sheetbody .frame {
    width: min(100%, calc((100dvh - 190px) * 9 / 16));
    flex: none;
  }
  .sheetbody .check {
    color: #fffaf0;
  }
  .fab {
    position: fixed;
    left: 50%;
    bottom: max(16px, env(safe-area-inset-bottom));
    transform: translateX(-50%);
    z-index: 40;
    min-height: 48px;
    padding: 0 26px;
    font-weight: 900;
    font-size: 1rem;
    background: #fde9c9;
    color: #4a3a30;
    border: 3px solid #6a5648;
    border-radius: 999px;
    box-shadow: 0 4px 0 #6a5648;
    white-space: nowrap;
  }
  details {
    background: #fffaf0;
    border: 2px solid #e6d9c4;
    border-radius: 14px;
    padding: 10px 14px;
    margin-bottom: 12px;
  }
  summary {
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    list-style: none;
  }
  summary::-webkit-details-marker {
    display: none;
  }
  summary::before {
    content: '▸';
    display: inline-block;
    width: 1em;
    transition: transform 0.15s;
  }
  details[open] > summary::before {
    transform: rotate(90deg);
  }
  .radios {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin: 10px 0;
  }
  .radios label {
    border: 2px solid #e0cfb4;
    border-radius: 999px;
    position: relative;
    display: inline-flex;
    align-items: center;
    min-height: 44px;
    box-sizing: border-box;
    padding: 0 16px;
    cursor: pointer;
    font-size: 0.9rem;
    background: #fff;
  }
  .radios label.on {
    border-color: #6a5648;
    background: #fde9c9;
    font-weight: 700;
  }
  .radios input {
    position: absolute;
    opacity: 0;
    pointer-events: none;
  }
  .row {
    display: flex;
    gap: 18px;
    flex-wrap: wrap;
    margin: 6px 0;
  }
  .row label {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
  }
  input[type='color'] {
    width: 52px;
    height: 44px;
    padding: 2px;
    cursor: pointer;
  }
  .field {
    display: block;
    margin: 12px 0;
    font-size: 0.88rem;
  }
  .field input[type='text'],
  .field input[type='date'],
  .field textarea {
    display: block;
    width: 100%;
    box-sizing: border-box;
    margin-top: 4px;
    padding: 11px 10px;
    font: inherit;
    border: 2px solid #e0cfb4;
    border-radius: 10px;
    background: #fff;
    color: inherit;
  }
  .field input[type='range'] {
    display: block;
    width: 100%;
    height: 44px;
    margin: 0;
    cursor: pointer;
  }
  .check {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 44px;
    margin: 4px 0;
    font-size: 0.88rem;
    cursor: pointer;
  }
  .check input {
    width: 22px;
    height: 22px;
    flex: none;
    margin: 0;
    cursor: pointer;
  }
  .check.off {
    opacity: 0.5;
    cursor: default;
  }
  .check.off input {
    cursor: default;
  }
  .hint {
    margin: 6px 0;
    font-size: 0.8rem;
    color: #6e5d50;
  }
  .stale {
    margin: 0;
    padding: 10px 12px;
    border: 2px solid #b3463a;
    border-radius: 10px;
    background: #fff;
    color: #8f3027;
    font-size: 0.88rem;
    font-weight: 700;
  }
  .qr {
    width: 240px;
    height: 240px;
    max-width: 100%;
    image-rendering: pixelated;
    border-radius: 8px;
  }
  .share {
    margin-top: 18px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 12px;
  }
  .share > .stale,
  .share > .out {
    flex-basis: 100%;
  }
  button,
  a.sub {
    font: inherit;
    cursor: pointer;
  }
  .main {
    font-weight: 900;
    font-size: 1.05rem;
    background: #f2a59d;
    color: #4a3a30;
    border: 3px solid #6a5648;
    border-radius: 999px;
    min-height: 48px;
    padding: 10px 28px;
    box-shadow: 0 4px 0 #6a5648;
  }
  .sub {
    background: #fffaf0;
    color: #5b4a3f;
    border: 2px solid #6a5648;
    border-radius: 999px;
    min-height: 44px;
    box-sizing: border-box;
    padding: 0 18px;
    font-size: 0.88rem;
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .pg {
    border: 2px solid #e6d9c4;
    border-radius: 12px;
    background: #fff;
    padding: 10px 12px;
    margin: 10px 0;
  }
  .pghead {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    font-size: 0.9rem;
  }
  .pgbtns {
    display: flex;
    gap: 6px;
  }
  .mini {
    font: inherit;
    font-size: 0.8rem;
    min-width: 44px;
    min-height: 44px;
    padding: 0 12px;
    border: 2px solid #6a5648;
    border-radius: 999px;
    background: #fffaf0;
    color: #5b4a3f;
  }
  .mini.del {
    color: #a33d32;
    border-color: #a33d32;
  }
  .mini:disabled,
  .sub:disabled {
    opacity: 0.35;
    cursor: default;
  }
  .arts {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(76px, 1fr));
    gap: 6px;
    margin: 10px 0 2px;
    --ink: #6a5648;
  }
  .art {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 4px 2px 5px;
    border: 2px solid #e0cfb4;
    border-radius: 10px;
    background: #fffdf7;
    font: inherit;
    font-size: 0.72rem;
    line-height: 1.25;
    color: #5b4a3f;
    cursor: pointer;
    min-height: 44px;
  }
  .art :global(svg) {
    width: 100%;
    height: auto;
    aspect-ratio: 6 / 5;
  }
  .art.on {
    border-color: #6a5648;
    background: #fde9c9;
    font-weight: 700;
  }
  .count {
    display: block;
    text-align: right;
    font-size: 0.72rem;
    color: #6e5d50;
  }
  .out {
    margin-top: 2px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: flex-start;
  }
  .out textarea {
    width: 100%;
    box-sizing: border-box;
    font: 0.75rem monospace;
    padding: 8px;
    border: 2px solid #e0cfb4;
    border-radius: 10px;
  }
  .outrow {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }
</style>
