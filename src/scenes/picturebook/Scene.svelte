<script lang="ts">
  import { onMount } from 'svelte'
  import gsap from 'gsap'
  import type { SceneApi } from '../types'
  import Art from './Art.svelte'

  let { api }: { api: SceneApi } = $props()

  const pages = $derived(api.config.book.pages)
  const total = $derived(pages.length)
  // 0 = 表紙、1〜total = 本文のページ
  let idx = $state(0)
  let busy = false
  let drumming = $state(false)
  let hint = $state('タップで ひらく')

  const parents = $derived(api.config.text.parents.trim())
  const lastIdx = $derived(total)

  let book: HTMLDivElement
  let leaves = $state<HTMLDivElement[]>([])
  let shades = $state<HTMLDivElement[]>([])
  const SWIPE = 36 // これ以上横に動かしたらスワイプ（左右どちらでも めくる）

  // イベントハンドラ内で作るアニメーションも、アンマウント時にまとめて止めるための入れ物
  const ctx = gsap.context(() => {})

  function setHint(i: number) {
    hint = i === 0 ? 'タップで ひらく' : i === lastIdx ? 'さいごのページ… タップして！' : 'タップで めくる'
  }

  function next() {
    if (busy) return
    if (idx >= lastIdx) return finale()
    ctx.add(nextBody)
  }

  function nextBody() {
    busy = true
    api.tick()
    const leaf = leaves[idx]
    const shade = shades[idx]
    const done = () => {
      leaf.style.visibility = 'hidden'
      idx += 1
      setHint(idx)
      busy = false
    }
    if (api.reduced) {
      gsap.to(leaf, { opacity: 0, duration: 0.25, ease: 'none', onComplete: done })
      return
    }
    // 左のとじ目を軸に、紙がめくれて手前に起き上がる
    const tl = gsap.timeline({ onComplete: done })
    tl.to(leaf, { rotationY: -96, duration: 0.8, ease: 'power2.inOut' }, 0)
    tl.to(shade, { opacity: 0.55, duration: 0.5, ease: 'power1.in' }, 0)
    tl.to(leaf, { opacity: 0, duration: 0.25, ease: 'none' }, 0.55)
  }

  function finale() {
    ctx.add(finaleBody)
  }

  function finaleBody() {
    busy = true
    drumming = true
    hint = 'どきどき…'
    const secs = api.config.drum
    api.drumroll(secs)
    const finish = () => {
      api.pop()
      api.burst(0.5, 0.45, { amount: 40, power: 1.1 })
      api.reveal({ x: 0.5, y: 0.45 })
    }
    if (secs <= 0) return finish()
    const tl = gsap.timeline({ onComplete: finish })
    if (!api.reduced) {
      // 本がだんだん大きくふるえる
      tl.to(book, { x: 1.4, rotation: 0.6, duration: 0.05, yoyo: true, repeat: Math.max(1, Math.floor(secs / 0.05)), ease: 'none' }, 0)
      tl.to(book, { scale: 1.04, duration: secs, ease: 'power2.in' }, 0)
    }
    tl.to({}, { duration: secs }, 0)
  }

  // タップ・スワイプ（左右どちらでも）・キーボード
  let down: { x: number; y: number } | null = null
  function onDown(e: PointerEvent) {
    down = { x: e.clientX, y: e.clientY }
  }
  function onUp(e: PointerEvent) {
    if (!down) return
    const dx = e.clientX - down.x
    const dy = e.clientY - down.y
    down = null
    if (Math.abs(dy) > Math.abs(dx) * 1.5 && Math.abs(dy) > SWIPE) return // 縦のスクロールは無視
    next()
  }
  function onKey(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault()
      next()
    }
  }

  onMount(() => {
    ctx.add(() => {
      gsap.set(leaves, { transformPerspective: 0, transformOrigin: '0% 50%' })
    })
    return () => ctx.revert()
  })
</script>

<div class="scene">
  <!-- svelte-ignore a11y_no_noninteractive_tabindex -->
  <div
    class="book"
    bind:this={book}
    role="button"
    tabindex="0"
    aria-label="絵本。タップでページをめくる"
    onpointerdown={onDown}
    onpointerup={onUp}
    onpointercancel={() => (down = null)}
    onkeydown={onKey}
  >
    {#each Array(total + 1) as _, i (i)}
      <div class="leaf" bind:this={leaves[i]} style:z-index={total + 1 - i}>
        {#if i === 0}
          <div class="page cover">
            <div class="cover-art"><Art id="cover" /></div>
            <h2>
              {#if parents}
                <span class="nm">{parents}</span>の<br />おはなし
              {:else}
                あかちゃんが<br />くるまでの<br />おはなし
              {/if}
            </h2>
            <p class="sub">{api.config.text.baby}と わたしたち</p>
          </div>
        {:else}
          {@const p = pages[i - 1]}
          <div class="page">
            <div class="art" class:big={!p.text}><Art id={p.art} /></div>
            {#if p.text}<p class="txt">{p.text}</p>{/if}
            <span class="no">{i} / {total}</span>
          </div>
        {/if}
        <div class="spine"></div>
        <div class="shade" bind:this={shades[i]}></div>
      </div>
    {/each}
  </div>

  <div class="hint" class:drum={drumming} aria-live="polite">{#if hint}<span class="pill">{hint}</span>{/if}</div>
</div>

<style>
  .scene {
    position: absolute;
    inset: 0;
    z-index: 3;
  }
  .book {
    position: absolute;
    left: 7cqw;
    right: 7cqw;
    top: 7cqh;
    bottom: 14cqh;
    perspective: 190cqw;
    cursor: pointer;
    touch-action: pan-y;
    outline: none;
  }
  .book:focus-visible {
    outline: 0.6cqw dashed var(--ink);
    outline-offset: 1cqw;
  }
  .leaf {
    position: absolute;
    inset: 0;
    backface-visibility: hidden;
    transform-style: preserve-3d;
    will-change: transform;
  }
  .page {
    position: absolute;
    inset: 0;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 7cqw 6cqw 9cqw 9cqw;
    background: var(--paper);
    border: 0.8cqw solid var(--ink);
    border-radius: 1.6cqw 4cqw 4cqw 1.6cqw;
    box-shadow:
      0 1.4cqw 0 rgba(106, 86, 72, 0.25),
      inset 0 0 6cqw rgba(190, 150, 100, 0.12);
    overflow: hidden;
  }
  /* とじ目 */
  .spine {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 5cqw;
    border-radius: 1.6cqw 0 0 1.6cqw;
    background: linear-gradient(90deg, rgba(106, 86, 72, 0.3), rgba(106, 86, 72, 0.06) 60%, transparent);
    pointer-events: none;
  }
  .shade {
    position: absolute;
    inset: 0;
    border-radius: 1.6cqw 4cqw 4cqw 1.6cqw;
    background: linear-gradient(90deg, rgba(106, 86, 72, 0.1), rgba(106, 86, 72, 0.45));
    opacity: 0;
    pointer-events: none;
  }
  .art {
    width: 100%;
    flex: 0 0 auto;
    aspect-ratio: 6 / 5;
    margin-top: 0;
  }
  .art.big {
    flex: 1 1 auto;
    aspect-ratio: auto;
    margin-top: 0;
    min-height: 0;
  }
  .txt {
    margin: 4cqh 0 0;
    width: 100%;
    font-size: 5.2cqw;
    line-height: 1.75;
    font-weight: 700;
    color: var(--ink);
    text-align: left;
    line-break: strict;
    word-break: auto-phrase;
    overflow-wrap: anywhere;
    text-wrap: pretty;
    white-space: pre-wrap;
  }
  .no {
    position: absolute;
    bottom: 2.6cqw;
    right: 5cqw;
    font-size: 4.2cqw;
    color: var(--ink-soft);
  }
  .cover {
    justify-content: center;
    text-align: center;
    background:
      radial-gradient(circle at 20% 15%, rgba(255, 255, 255, 0.55), transparent 55%),
      #fbe9c8;
    border-width: 1cqw;
  }
  .cover::before {
    content: '';
    position: absolute;
    inset: 2.6cqw 2.6cqw 2.6cqw 6.4cqw;
    border: 0.5cqw dashed rgba(106, 86, 72, 0.5);
    border-radius: 2.4cqw 3cqw 3cqw 2.4cqw;
    pointer-events: none;
  }
  .cover-art {
    width: 70%;
    aspect-ratio: 6 / 5;
  }
  h2 {
    margin: 3cqh 0 0;
    font-size: 8cqw;
    line-height: 1.45;
    font-weight: 900;
    color: var(--ink);
    text-wrap: balance;
    overflow-wrap: anywhere;
    max-width: 100%;
  }
  .nm {
    display: inline-block;
    max-width: 100%;
  }
  .sub {
    margin: 2.4cqh 0 0;
    font-size: 4cqw;
    color: var(--ink-soft);
    overflow-wrap: anywhere;
    text-wrap: balance;
  }
  /* 演出中のヒント。波やギザギザの上でも読めるように、紙色の下地（ピル）を敷く */
  .hint {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 5cqh;
    display: flex;
    justify-content: center;
    min-height: 1.6em;
    pointer-events: none;
  }
  .pill {
    padding: 0.5em 1.3em;
    border-radius: 999px;
    background: color-mix(in srgb, var(--paper) 86%, transparent);
    border: 0.4cqw solid color-mix(in srgb, var(--ink) 30%, transparent);
    font-family: var(--font);
    font-weight: 700;
    font-size: 4.6cqw;
    color: var(--ink);
    text-align: center;
  }
  .hint.drum .pill {
    font-size: 6cqw;
  }
</style>
