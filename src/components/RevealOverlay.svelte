<script lang="ts">
  import { onMount } from 'svelte'
  import gsap from 'gsap'
  import { NEUTRAL, colorsBackground as bg, feintColors, revealColors, revealText, type RevealConfig } from '../core/config'
  import { fanfare } from '../core/audio'
  import type { Fx } from '../core/confetti'
  import Baby from './Baby.svelte'

  let {
    config,
    origin,
    masked,
    fx,
    reduced,
    palette,
    onReplay,
  }: {
    config: RevealConfig
    origin: { x: number; y: number }
    masked: boolean
    fx: Fx
    reduced: boolean
    palette: string[]
    onReplay: () => void
  } = $props()

  const trueColors = $derived(masked ? [NEUTRAL] : revealColors(config))
  const fake = $derived(masked ? null : config.feint ? feintColors(config) : null)
  const title = $derived(masked ? '？？？' : revealText(config))

  const circle = (r: number) => `circle(${r}% at ${origin.x * 100}% ${origin.y * 100}%)`

  let washB: HTMLDivElement
  let babyEl: HTMLDivElement
  let titleEl: HTMLDivElement
  let root: HTMLDivElement
  let againEl: HTMLButtonElement
  /** 読み上げ用。演出が終わる直前に入れて、画面の発表と同じタイミングで伝える */
  let announce = $state('')

  onMount(() => {
    const ctx = gsap.context(() => {
      const t = reduced ? 0.4 : 1
      const extras = root.querySelectorAll('.extras')
      const washA = root.querySelector('.washA')
      const fakeText = root.querySelector('.fake')
      gsap.set([washA, washB].filter(Boolean), { clipPath: circle(0) })
      gsap.set([babyEl, titleEl, extras, ...(fakeText ? [fakeText] : [])], { autoAlpha: 0 })
      const tl = gsap.timeline({
        // 演出が終わったら「もういちど見る」へフォーカスを移す（スクロールはさせない）
        onComplete: () => againEl?.focus({ preventScroll: true }),
      })

      if (fake && washA && fakeText) {
        tl.to(washA, { clipPath: circle(150), duration: 0.6 * t, ease: 'power2.out' })
        tl.to(fakeText, { autoAlpha: 1, scale: 1, duration: 0.3, ease: 'back.out(2)' }, '-=0.2')
        if (!reduced) tl.to(fakeText, { rotation: 3, duration: 0.08, yoyo: true, repeat: 7 })
        tl.to({}, { duration: 0.5 })
        tl.to(fakeText, { autoAlpha: 0, duration: 0.2 })
      }

      tl.to(washB, { clipPath: circle(150), duration: 0.8 * t, ease: 'power2.out' })
      tl.add(() => {
        fanfare()
        announce = title
        if (masked) return
        const cs = revealColors(config)
        const colors = [...cs, '#ffffff', ...palette.slice(0, 3)]
        fx.burst(origin.x, origin.y, { colors, amount: config.confetti.amount * 1.6, shape: config.confetti.shape, power: 1.25 })
        fx.burst(0.15, 0.85, { colors, amount: config.confetti.amount, shape: config.confetti.shape, power: 1.1 })
        fx.burst(0.85, 0.85, { colors, amount: config.confetti.amount, shape: config.confetti.shape, power: 1.1 })
        fx.rain({ colors, amount: config.confetti.amount, shape: config.confetti.shape, ms: 5000 })
      }, '-=0.35')
      tl.fromTo(
        babyEl,
        { y: 80, scale: 0.2, autoAlpha: 0 },
        { y: 0, scale: 1, autoAlpha: 1, duration: 0.9 * t, ease: 'back.out(1.7)' },
        '-=0.2',
      )
      tl.fromTo(
        titleEl,
        { scale: 0.4, autoAlpha: 0 },
        { scale: 1, autoAlpha: 1, duration: 0.7 * t, ease: 'back.out(2.2)' },
        '-=0.5',
      )
      tl.fromTo(extras, { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.2 }, '-=0.2')

      if (!reduced) {
        tl.add(() => {
          gsap.to(babyEl, { y: -8, rotation: 2.5, duration: 1.4, ease: 'sine.inOut', yoyo: true, repeat: -1 })
        })
      }
    })
    return () => ctx.revert()
  })
</script>

<div class="overlay" bind:this={root}>
  {#if fake}
    <div class="wash washA" style:background={bg(fake)}></div>
    <div class="fake">…と思った？</div>
  {/if}
  <div class="wash" bind:this={washB} style:background={bg(trueColors)}></div>

  <div class="content">
    <div class="baby" bind:this={babyEl}>
      <Baby color={trueColors[0]} color2={trueColors[1] ?? null} />
    </div>
    <div class="sr" role="status">{announce}</div>
    <div class="title" class:long={title.length > 8} bind:this={titleEl} aria-hidden="true">{title}</div>
    <div class="extras">
      {#if masked}
        <p class="note">プレビューでは答えを隠しています</p>
      {:else if config.text.message}
        <p class="msg">{config.text.message}</p>
      {/if}
    </div>
    <div class="extras">
      <button class="again" bind:this={againEl} onclick={onReplay}>もういちど見る</button>
    </div>
  </div>
</div>

<style>
  .overlay {
    position: absolute;
    inset: 0;
    z-index: 5;
  }
  .wash {
    position: absolute;
    inset: 0;
  }
  .fake {
    position: absolute;
    left: 0;
    right: 0;
    top: 42%;
    text-align: center;
    font-family: var(--font);
    font-weight: 700;
    font-size: 9cqw;
    color: #fff;
    text-shadow: 0 2px 0 rgba(106, 86, 72, 0.35);
  }
  .content {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 3cqh;
    padding: 0 8cqw;
    text-align: center;
  }
  .baby {
    width: 52cqw;
    height: 52cqw;
    filter: drop-shadow(0 6px 0 rgba(106, 86, 72, 0.18));
    /* ふわふわ動かしても、絵のフィルターを描き直さないよう専用の層にする */
    will-change: transform;
  }
  .title {
    font-family: var(--font);
    font-weight: 900;
    font-size: 11cqw;
    line-height: 1.25;
    color: #fff;
    -webkit-text-stroke: 1.2cqw var(--ink);
    paint-order: stroke fill;
    text-shadow: 0 1.2cqw 0 rgba(106, 86, 72, 0.35);
    word-break: keep-all;
    overflow-wrap: anywhere;
    text-wrap: balance;
  }
  .title.long {
    font-size: 8.4cqw;
  }
  .msg,
  .note {
    margin: 0;
    font-family: var(--font);
    font-size: 4.4cqw;
    line-height: 1.7;
    color: var(--ink);
    background: rgba(255, 250, 240, 0.85);
    padding: 1.6cqw 4cqw;
    border-radius: 4cqw;
    text-wrap: balance;
  }
  .note {
    font-size: 3.6cqw;
    color: var(--ink-soft);
  }
  .again {
    font-family: var(--font);
    font-weight: 700;
    font-size: 4cqw;
    color: var(--ink);
    background: var(--paper);
    border: 0.7cqw solid var(--ink);
    border-radius: 6cqw;
    padding: 1.8cqw 6cqw;
    min-height: 44px;
    cursor: pointer;
  }
  .again:focus-visible {
    outline: 0.8cqw solid var(--ink);
    outline-offset: 0.6cqw;
  }
  .sr {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }
</style>
