<script lang="ts">
  import { onMount } from 'svelte'
  import { daysUntil, greetingText, type RevealConfig } from '../core/config'
  import { drumroll, pop, scratch, setSoundEnabled, stopAll, tick, unlockAudio } from '../core/audio'
  import { makeFx, type Fx } from '../core/confetti'
  import { THEMES, themeStyle } from '../themes'
  import { SCENES } from '../scenes/registry'
  import type { SceneApi } from '../scenes/types'
  import RevealOverlay from '../components/RevealOverlay.svelte'

  let { config, maskAnswer = false }: { config: RevealConfig; maskAnswer?: boolean } = $props()

  const theme = $derived(THEMES[config.theme])
  const Scene = $derived(SCENES[config.scene].component)
  const days = $derived(daysUntil(config.dueDate))

  let phase = $state<'ready' | 'playing' | 'revealed'>('ready')
  let origin = $state({ x: 0.5, y: 0.5 })
  let canvas: HTMLCanvasElement
  let fx = $state.raw<Fx | null>(null)
  // 子（背景）の onMount は親より先に走るので、最初の描画前に同期で決めておく
  const prefersReduced = () => {
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches
    } catch {
      return false
    }
  }
  let reduced = $state(prefersReduced())
  /** アンマウント後に遅れて届く演出の呼び出しを捨てるための印 */
  let alive = true

  onMount(() => {
    fx = makeFx(canvas, reduced)
    return () => {
      alive = false
      fx?.reset()
      stopAll()
    }
  })

  /** 演出中（playing/revealed）の呼び出しだけ通す。リセット後・破棄後は捨てる */
  const live = () => alive && phase !== 'ready'

  function start() {
    setSoundEnabled(config.sound)
    unlockAudio()
    tick()
    phase = 'playing'
  }

  function replay() {
    fx?.reset()
    stopAll()
    phase = 'ready'
  }

  const api: SceneApi = $derived({
    config,
    reduced,
    palette: theme.palette,
    masked: maskAnswer,
    pop: () => live() && pop(),
    scratch: () => live() && scratch(),
    tick: () => live() && tick(),
    drumroll: (sec) => live() && drumroll(sec),
    burst: (x, y, o) =>
      live() &&
      fx?.burst(x, y, {
        colors: o?.colors ?? theme.palette,
        amount: o?.amount ?? 20,
        shape: o?.shape ?? config.confetti.shape,
        power: o?.power,
      }),
    reveal: (o) => {
      if (!alive || phase !== 'playing') return
      origin = o
      phase = 'revealed'
    },
  })
</script>

<div class="stage" style={themeStyle(theme, config)}>
  <theme.Background {reduced} palette={theme.palette} />

  {#if phase !== 'ready'}
    <Scene {api} />
  {/if}

  <canvas class="fx" bind:this={canvas}></canvas>

  {#if phase === 'ready'}
    <div class="ready">
      <div class="card">
        <p class="from">{config.text.parents ? `${config.text.parents}より` : 'ジェンダーリビールが届いています'}</p>
        <h1>{greetingText(config)}</h1>
        {#if days !== null}
          <p class="days">うまれるまで あと <b>{days}</b> 日</p>
        {/if}
        <button class="go" onclick={start}>はじめる</button>
        {#if config.sound}<p class="sound">♪ 音が出ます</p>{/if}
      </div>
    </div>
  {/if}

  {#if phase === 'revealed'}
    <RevealOverlay {config} {origin} masked={maskAnswer} fx={fx!} {reduced} palette={theme.palette} onReplay={replay} />
  {/if}
</div>

<style>
  .stage {
    position: relative;
    container-type: size;
    /* 9:16 を保ったまま、置かれた枠に収める（横長の画面では高さ基準、縦に細長い画面では幅基準） */
    aspect-ratio: 9 / 16;
    height: min(100%, calc(100vw * 16 / 9));
    max-width: 100%;
    overflow: hidden;
    color: var(--ink);
    font-family: var(--font);
    background: var(--sky1);
    user-select: none;
    -webkit-user-select: none;
    -webkit-tap-highlight-color: transparent;
  }
  .fx {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    z-index: 8;
  }
  .ready {
    position: absolute;
    inset: 0;
    z-index: 4;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 9cqw;
  }
  .card {
    width: 100%;
    text-align: center;
    background: var(--paper);
    border: 0.8cqw solid var(--ink);
    border-radius: 7cqw;
    padding: 9cqw 6cqw 7cqw;
    box-shadow: 0 1.6cqw 0 rgba(106, 86, 72, 0.25);
  }
  .from {
    margin: 0 0 2cqw;
    font-size: 3.8cqw;
    color: var(--ink-soft);
    text-wrap: balance;
  }
  h1 {
    margin: 0 0 5cqw;
    font-size: 7cqw;
    line-height: 1.35;
    font-weight: 900;
    word-break: keep-all;
    overflow-wrap: anywhere;
    text-wrap: balance;
  }
  .days {
    margin: 0 0 5cqw;
    font-size: 4.2cqw;
    text-wrap: balance;
  }
  .days b {
    font-size: 7cqw;
  }
  .go {
    font-family: var(--font);
    font-weight: 900;
    font-size: 5.6cqw;
    /* 白文字では 2:1 を切るため、文字は墨色（大きな太字なので 3:1 で足りる） */
    color: var(--ink);
    background: #f2a59d;
    border: 0.8cqw solid var(--ink);
    border-radius: 8cqw;
    padding: 2.6cqw 12cqw;
    box-shadow: 0 1.2cqw 0 var(--ink);
    cursor: pointer;
  }
  .go:active {
    transform: translateY(1cqw);
    box-shadow: 0 0.2cqw 0 var(--ink);
  }
  .sound {
    margin: 4cqw 0 0;
    font-size: 3.2cqw;
    color: var(--ink-soft);
    text-wrap: balance;
  }
</style>
