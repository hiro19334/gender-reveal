<script lang="ts">
  import { onMount } from 'svelte'
  import gsap from 'gsap'
  import type { SceneApi } from '../types'

  let { api }: { api: SceneApi } = $props()

  const W = 360
  const H = 640
  const ANCHOR = { x: 180, y: 502 } // 風船のひもが集まる位置（リボンのところ）

  // 風船の本体（原点が中心、高さ約80）
  const BODY =
    'M0 -38 C25 -38 36 -15 36 4 C36 27 18 42 0 44 C-18 42 -36 27 -36 4 C-36 -15 -25 -38 0 -38 Z'

  interface B {
    id: number
    x: number
    y: number
    s: number
    color: string
    special: boolean
    tint: number // ひもの束ね位置のずれ
  }

  // 中央に大きな「？」の風船、まわりに小さな風船をぐるっと並べる
  const balloons: B[] = $derived.by(() => {
    const n = api.config.balloon.count
    const others = n - 1
    const list: B[] = []
    for (let i = 0; i < others; i++) {
      const a = ((-90 + ((i + 0.5) * 360) / others) * Math.PI) / 180
      list.push({
        id: i,
        x: 180 + 122 * Math.cos(a),
        y: 322 + 108 * Math.sin(a) * 0.9,
        s: 0.92 + (i % 3) * 0.06,
        color: api.palette[i % api.palette.length],
        special: false,
        tint: (i - others / 2) * 2.2,
      })
    }
    list.push({ id: others, x: 180, y: 326, s: 1.32, color: '#fff0c4', special: true, tint: 0 })
    return list
  })

  type Phase = 'intro' | 'play' | 'drum' | 'done'
  let phase: Phase = 'intro'
  let remaining = $state(0)
  let hint = $state('')

  interface Live {
    rise: number
    bob: number
    rot: number
    sc: number
    gone: boolean
  }
  let lives: Live[] = []
  // イベントハンドラ内で作るアニメーションも、アンマウント時にまとめて止めるための入れ物
  const ctx = gsap.context(() => {})
  let swings: gsap.core.Tween[] = []
  let groups = $state<SVGGElement[]>([])
  let strings = $state<SVGPathElement[]>([])
  let shards = $state<SVGGElement[]>([])

  const rad = (d: number) => (d * Math.PI) / 180

  function posOf(i: number) {
    const b = balloons[i]
    const l = lives[i]
    return { x: b.x, y: b.y + l.rise + l.bob }
  }

  function render() {
    for (let i = 0; i < balloons.length; i++) {
      const b = balloons[i]
      const l = lives[i]
      if (!l || !groups[i]) continue
      const { x, y } = posOf(i)
      if (!l.gone) {
        groups[i].setAttribute('transform', `translate(${x} ${y}) rotate(${l.rot}) scale(${b.s * l.sc})`)
      }
      const r = rad(l.rot)
      const k = 50 * b.s * l.sc
      const kx = x - Math.sin(r) * k
      const ky = y + Math.cos(r) * k
      const ax = ANCHOR.x + b.tint
      const ay = ANCHOR.y
      const sway = (x - 180) * 0.12 + l.rot * 2
      strings[i].setAttribute(
        'd',
        `M${kx.toFixed(1)} ${ky.toFixed(1)} Q${((kx + ax) / 2 + sway).toFixed(1)} ${((ky + ay) / 2 + 24).toFixed(1)} ${ax} ${ay}`,
      )
    }
  }

  function crumbs(i: number, big: boolean) {
    const { x, y } = posOf(i)
    const g = shards[i]
    gsap.set(g, { x, y, autoAlpha: 1 })
    const parts = g.querySelectorAll<SVGPathElement>('path')
    parts.forEach((p, j) => {
      const ang = rad((j / parts.length) * 360 + Math.random() * 30)
      const dist = (big ? 120 : 70) + Math.random() * 40
      gsap.fromTo(
        p,
        { x: 0, y: 0, rotation: 0, scale: big ? 1.6 : 1, autoAlpha: 1 },
        {
          x: Math.cos(ang) * dist,
          y: Math.sin(ang) * dist + 24,
          rotation: Math.random() * 360 - 180,
          scale: 0.5,
          autoAlpha: 0,
          duration: 0.75,
          ease: 'power2.out',
        },
      )
    })
  }

  function vanish(i: number) {
    lives[i].gone = true
    gsap.set(groups[i], { autoAlpha: 0 })
    gsap.to(strings[i], { autoAlpha: 0, y: 36, duration: 0.7, ease: 'power1.in' })
  }

  function popOne(i: number) {
    const b = balloons[i]
    const { x, y } = posOf(i)
    api.pop()
    crumbs(i, false)
    api.burst(x / W, y / H, { colors: [b.color, '#ffffff', ...api.palette.slice(0, 2)], amount: 18, power: 0.55 })
    vanish(i)
    remaining -= 1
    hint = remaining > 1 ? '風船をタップして！' : 'さいごの「？」をタップ！'
  }

  function nudge(i: number) {
    const l = lives[i]
    hint = 'ほかの風船から割ってね'
    gsap.fromTo(l, { rot: -8 }, { rot: 0, duration: 0.7, ease: 'elastic.out(1.2, 0.3)' })
    api.tick()
  }

  function finale(i: number) {
    phase = 'drum'
    hint = 'どきどき…'
    const l = lives[i]
    const secs = api.config.drum
    api.drumroll(secs)
    const done = () => {
      const { x, y } = posOf(i)
      api.pop()
      crumbs(i, true)
      vanish(i)
      remaining = 0
      hint = ''
      phase = 'done'
      api.reveal({ x: x / W, y: y / H })
    }
    if (secs <= 0) return done()
    const tl = gsap.timeline({ onComplete: done })
    tl.to(l, { sc: 1.6, duration: secs, ease: 'power2.in' }, 0)
    if (!api.reduced) {
      tl.to(l, { rot: 7, duration: 0.06, yoyo: true, repeat: Math.max(1, Math.floor(secs / 0.06)), ease: 'none' }, 0)
    }
  }

  function tap(i: number) {
    if (phase !== 'play' || lives[i].gone) return
    ctx.add(() => {
      if (balloons[i].special) {
        if (remaining > 1) nudge(i)
        else finale(i)
      } else {
        popOne(i)
      }
    })
  }

  function onKey(e: KeyboardEvent, i: number) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      tap(i)
    }
  }

  onMount(() => {
    remaining = balloons.length
    lives = balloons.map(() => ({ rise: 560, bob: 0, rot: 0, sc: 1, gone: false }))
    gsap.ticker.add(render)
    render()
    swings = []
    ctx.add(() => {
      balloons.forEach((_b, i) => {
        const l = lives[i]
        gsap.to(l, { rise: 0, duration: api.reduced ? 0.3 : 1.5, delay: api.reduced ? 0 : i * 0.09, ease: 'power3.out' })
        if (!api.reduced) {
          gsap.to(l, {
            bob: -7,
            duration: 1.8 + (i % 4) * 0.35,
            delay: i * 0.2,
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
          })
          // 回転は少しずらして、風に揺れているように
          const swing = gsap.fromTo(
            l,
            { rot: -3 },
            { rot: 3, duration: 2.4 + (i % 3) * 0.4, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: i * 0.13 },
          )
          swing.pause()
          swings.push(swing)
        }
      })
      gsap.delayedCall(api.reduced ? 0.4 : 1.5 + balloons.length * 0.09, () => {
        phase = 'play'
        hint = '風船をタップして！'
        swings.forEach((t) => t.play()) // ゆらゆらは、遊べるようになってから全部の風船で始める
        api.tick()
      })
    })
    return () => {
      gsap.ticker.remove(render)
      ctx.revert()
    }
  })
</script>

<div class="scene">
  <svg viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice" role="group" aria-label="風船">
    <defs>
      <radialGradient id="shine" cx="0.35" cy="0.3" r="0.8">
        <stop offset="0" stop-color="#fff" stop-opacity="0.55" />
        <stop offset="0.6" stop-color="#fff" stop-opacity="0" />
      </radialGradient>
    </defs>

    <!-- ひも -->
    {#each balloons as b, i (b.id)}
      <path
        bind:this={strings[i]}
        d="M180 400 L180 500"
        fill="none"
        stroke="var(--ink)"
        stroke-width="1.5"
        stroke-linecap="round"
      />
    {/each}

    <!-- リボン -->
    <g stroke="var(--ink)" stroke-width="1.7" stroke-linejoin="round" stroke-linecap="round">
      <path d="M180 504 C150 476 134 510 160 522 C172 526 179 514 180 504 Z" fill={api.palette[0]} />
      <path d="M180 504 C210 476 226 510 200 522 C188 526 181 514 180 504 Z" fill={api.palette[0]} />
      <path d="M179 508 C172 526 166 538 156 550" fill="none" />
      <path d="M181 508 C188 526 194 538 204 550" fill="none" />
      <circle cx="180" cy="506" r="5.5" fill={api.palette[1]} />
    </g>

    <!-- 風船 -->
    {#each balloons as b, i (b.id)}
      <g
        bind:this={groups[i]}
        class="balloon"
        class:special={b.special}
        role="button"
        tabindex="0"
        aria-label={b.special ? '？の風船を割る' : `風船${i + 1}を割る`}
        onkeydown={(e) => onKey(e, i)}
        transform="translate({b.x} {b.y + 560}) scale({b.s})"
        onpointerdown={() => tap(i)}
      >
        <circle r="50" fill="transparent" />
        <!-- 手描き風に、少しずらした輪郭をもう1本 -->
        <path d={BODY} fill="none" stroke="var(--ink)" stroke-width="1.2" opacity="0.35" transform="rotate(2.2) translate(1.4 0.8)" />
        <path d={BODY} fill={b.color} stroke="var(--ink)" stroke-width="2.2" stroke-linejoin="round" />
        <path d={BODY} fill="url(#shine)" />
        <path d="M-22 -18 C-25 -8 -23 1 -18 9" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.65" />
        <path d="M0 44 L-6 54 L6 54 Z" fill={b.color} stroke="var(--ink)" stroke-width="1.8" stroke-linejoin="round" />
        {#if b.special}
          <text x="0" y="12" text-anchor="middle" class="q">?</text>
          <path d="M-24 -26 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#fff" stroke="var(--ink)" stroke-width="1.2" stroke-linejoin="round" />
        {/if}
      </g>
    {/each}

    <!-- 割れたかけら -->
    {#each balloons as b, i (b.id)}
      <g bind:this={shards[i]} style="opacity:0" pointer-events="none">
        {#each Array(8) as _, j (j)}
          <path
            d="M0 0 C7 -4 14 -1 16 6 C9 4 4 4 0 0 Z"
            fill={b.color}
            stroke="var(--ink)"
            stroke-width="1.2"
            stroke-linejoin="round"
          />
        {/each}
      </g>
    {/each}
  </svg>

  <div class="hint" aria-live="polite">{#if hint}<span class="pill">{hint}</span>{/if}</div>
</div>

<style>
  .scene {
    position: absolute;
    inset: 0;
    z-index: 3;
  }
  svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
    touch-action: manipulation;
  }
  .balloon {
    cursor: pointer;
  }
  .balloon:focus {
    outline: none;
  }
  .balloon:focus-visible {
    outline: 3px dashed var(--ink);
    outline-offset: 2px;
  }
  .q {
    font-family: var(--font);
    font-weight: 900;
    font-size: 40px;
    fill: var(--ink);
  }
  /* 演出中のヒント。波やギザギザの上でも読めるように、紙色の下地（ピル）を敷く */
  .hint {
    position: absolute;
    left: 0;
    right: 0;
    top: 17cqh;
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
    font-size: 5.2cqw;
    color: var(--ink);
    text-align: center;
  }
</style>
