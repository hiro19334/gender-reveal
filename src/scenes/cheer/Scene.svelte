<script lang="ts">
  import { onMount } from 'svelte'
  import gsap from 'gsap'
  import type { SceneApi } from '../types'

  let { api }: { api: SceneApi } = $props()

  const W = 360
  const H = 640
  const CY = 424 // ふたりの高さ（足もとの少し上）
  const HEART = { x: 180, y: 254 }
  const HI = { x: 180, y: CY - 14 } // ハイタッチする場所
  const GAIN_ALT = 15 // 左右を交互にタップしたときに増える量（%）
  const GAIN_SAME = 2.5 // 同じ側をつづけてタップしたとき

  // 答えの色を連想させない配色（黄・ミント・ラベンダー・クリーム）
  const cSun = '#ffe08a'
  const cSunDeep = '#ffc94d'
  const cMoon = '#e3dcf7'
  const cMoonDeep = '#cfc4ee'
  const cMint = '#a9dcc0'
  const cCream = '#fff6d6'
  const cCheekSun = '#ffb067'
  const cCheekMoon = '#9fdcc0'

  const starPath = (cx: number, cy: number, r: number) => {
    const pts: string[] = []
    for (let i = 0; i < 10; i++) {
      const a = (-90 + i * 36) * (Math.PI / 180)
      const rr = i % 2 ? r * 0.46 : r
      pts.push(`${(cx + Math.cos(a) * rr).toFixed(1)} ${(cy + Math.sin(a) * rr).toFixed(1)}`)
    }
    return `M${pts.join(' L')} Z`
  }
  const rays = Array.from({ length: 10 }, (_, i) => {
    const a = ((i * 36 + 18) * Math.PI) / 180
    return { x: Math.cos(a) * 47, y: Math.sin(a) * 45 }
  })
  const HEART_D = 'M0 36 C-62 -6 -44 -46 -17 -42 C-6 -40 0 -32 0 -25 C0 -32 6 -40 17 -42 C44 -46 62 -6 0 36 Z'

  const kinds = [
    { kind: 'sun', x0: 92, label: 'おひさまを おうえんする' },
    { kind: 'moon', x0: 268, label: 'おつきさまを おうえんする' },
  ] as const

  // アニメーションする値は普通のオブジェクトに入れ、毎フレーム属性へ書き出す
  interface Ch {
    x: number
    hop: number
    sx: number
    sy: number
    rot: number
    wave: number
    up: number
    mouth: number
    cue: number
    pop: number
  }
  const mk = (x: number): Ch => ({ x, hop: 0, sx: 1, sy: 1, rot: 0, wave: 0, up: 0, mouth: 0, cue: 0, pop: 0 })
  const c: Ch[] = [mk(kinds[0].x0), mk(kinds[1].x0)]
  const s = { fill: 0, hs: 1, glow: 0, flash: 0 }

  let phase: 'intro' | 'play' | 'finish' | 'done' = 'intro'
  let hint = $state('')
  let canSkip = $state(false)
  let value = 0
  let last = -1
  let taps = 0
  let revealed = false

  let roots = $state<SVGGElement[]>([])
  let bodies = $state<SVGGElement[]>([])
  let armsL = $state<SVGGElement[]>([])
  let armsR = $state<SVGGElement[]>([])
  let mouthsOpen = $state<SVGGElement[]>([])
  let mouthsShut = $state<SVGGElement[]>([])
  let cues = $state<SVGCircleElement[]>([])
  let raysG = $state<SVGGElement>()
  let heartG: SVGGElement
  let fillRect: SVGRectElement
  let glowEl: SVGCircleElement
  let flashEl: SVGCircleElement

  function render() {
    if (!heartG) return
    const t = gsap.ticker.time
    for (let i = 0; i < 2; i++) {
      const k = c[i]
      if (!roots[i]) continue
      const bob = api.reduced ? 0 : Math.sin(t * 2.2 + i * 1.7) * 2.4
      roots[i].setAttribute('transform', `translate(${k.x} ${CY + k.hop + bob}) scale(${Math.max(0.001, k.pop)})`)
      bodies[i].setAttribute('transform', `rotate(${k.rot}) translate(0 44) scale(${k.sx} ${k.sy}) translate(0 -44)`)
      // 外がわの手は高くあげ、内がわの手はハイタッチの位置（まん中）へ向ける
      const outer = 36 - 20 * k.up
      const inner = 36 - 6 * k.up
      const amp = 32 * k.wave
      const l = i === 0 ? outer : inner
      const r = i === 0 ? inner : outer
      armsL[i].setAttribute('transform', `translate(-34 6) rotate(${-(l + Math.sin(t * 26 + i) * amp)})`)
      armsR[i].setAttribute('transform', `translate(34 6) rotate(${r + Math.sin(t * 26 + i + 1.9) * amp})`)
      mouthsOpen[i].style.opacity = String(k.mouth)
      mouthsShut[i].style.opacity = String(1 - k.mouth)
      cues[i].style.opacity = String(k.cue * (api.reduced ? 0.8 : 0.45 + 0.35 * Math.sin(t * 5)))
    }
    raysG?.setAttribute('transform', `rotate(${api.reduced ? 0 : t * 14})`)
    const h = 36 - 82 * s.fill
    fillRect.setAttribute('y', String(h))
    heartG.setAttribute('transform', `translate(${HEART.x} ${HEART.y}) scale(${s.hs})`)
    glowEl.setAttribute('r', String(Math.max(0.01, s.glow)))
    flashEl.setAttribute('r', String(Math.max(0.01, s.flash * 46)))
    flashEl.style.opacity = String(Math.max(0, 1 - s.flash * 0.9))
  }

  // イベントハンドラ内で作るアニメーションも、アンマウント時にまとめて止めるための入れ物
  const ctx = gsap.context(() => {})

  function cheer(i: number) {
    const k = c[i]
    gsap.killTweensOf(k, 'hop,sx,sy,wave,mouth')
    const hop = api.reduced ? -8 : -30
    const tl = gsap.timeline()
    tl.to(k, { hop, sx: 0.94, sy: 1.08, wave: 1, mouth: 1, duration: 0.17, ease: 'power2.out' })
    tl.to(k, { hop: 0, sx: 1.08, sy: 0.92, duration: 0.2, ease: 'power2.in' })
    tl.to(k, { sx: 1, sy: 1, duration: 0.35, ease: 'elastic.out(1.1, 0.4)' })
    tl.to(k, { wave: 0, duration: 0.3 }, 0.35)
    tl.to(k, { mouth: 0, duration: 0.2 }, 0.55)
  }

  function setCue(next: number) {
    gsap.to(c[next], { cue: 1, duration: 0.25 })
    gsap.to(c[1 - next], { cue: 0, duration: 0.15 })
  }

  function tap(i: number) {
    if (phase !== 'play') return
    ctx.add(() => {
      const alt = last !== i
      value = Math.min(100, value + (alt ? GAIN_ALT : GAIN_SAME))
      taps += 1
      last = i
      api.tick()
      cheer(i)
      const p = c[i]
      api.burst(p.x / W, (CY - 52) / H, { amount: 5, power: 0.35 })
      gsap.killTweensOf(s, 'fill,hs')
      gsap.to(s, { fill: value / 100, duration: 0.35, ease: 'power2.out' })
      gsap.fromTo(s, { hs: 1.16 }, { hs: 1, duration: 0.5, ease: 'elastic.out(1, 0.4)' })
      if (value >= 100) return finish(false)
      if (alt) {
        hint = taps >= 3 ? 'いいちょうし！' : 'つぎは、もうひとり！'
      } else {
        hint = 'かわるがわる タップしてね'
      }
      setCue(1 - i)
    })
  }

  function onKey(e: KeyboardEvent, i: number) {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    if (e.repeat) return
    tap(i)
  }

  function skip() {
    if (phase !== 'play') return
    ctx.add(() => finish(true))
  }

  function finish(skipped: boolean) {
    if (phase !== 'play') return
    phase = 'finish'
    canSkip = false
    hint = ''
    const secs = api.config.drum
    const red = api.reduced
    gsap.killTweensOf(c[0], 'cue')
    gsap.killTweensOf(c[1], 'cue')
    c[0].cue = 0
    c[1].cue = 0
    const tl = gsap.timeline()
    // 1) ハートがいっぱいになる
    tl.to(s, { fill: 1, duration: skipped ? 0.7 : 0.25, ease: 'power1.out' }, 0)
    const t1 = skipped ? 0.8 : 0.45
    tl.add(() => {
      hint = 'ふたりで ハイタッチ！'
      api.tick()
    }, t1)
    // 2) ふたりが真ん中へ寄ってハイタッチ
    const move = red ? 0.3 : 0.75
    for (let i = 0; i < 2; i++) {
      tl.to(c[i], { x: i === 0 ? 128 : 232, duration: move, ease: 'power2.inOut' }, t1)
      tl.to(c[i], { up: 1, mouth: 1, duration: move, ease: 'power2.out' }, t1)
      if (!red) tl.to(c[i], { hop: -26, duration: move / 2, ease: 'power2.out', yoyo: true, repeat: 1 }, t1)
    }
    const tc = t1 + move
    tl.add(() => {
      api.pop()
      hint = 'どきどき…'
      api.burst(HI.x / W, HI.y / H, { amount: 14, power: 0.5 })
      gsap.fromTo(s, { flash: 0 }, { flash: 1, duration: 0.5, ease: 'power2.out' })
    }, tc)
    for (let i = 0; i < 2; i++) {
      tl.to(c[i], { wave: 0.5, duration: 0.2 }, tc)
    }
    // 3) ためる（ドラムロール）。ふたりの間にだんだん光があつまる
    tl.add(() => {
      api.drumroll(secs)
    }, tc)
    if (secs > 0) {
      tl.to(s, { glow: 70, duration: secs, ease: 'power2.in' }, tc)
      if (!red) {
        for (let i = 0; i < 2; i++) {
          tl.to(c[i], { rot: i ? 3.5 : -3.5, duration: 0.06, yoyo: true, repeat: Math.max(1, Math.floor(secs / 0.06)), ease: 'none' }, tc)
        }
        tl.to(s, { hs: 1.12, duration: 0.12, yoyo: true, repeat: Math.max(1, Math.floor(secs / 0.12)), ease: 'none' }, tc)
      }
    }
    const td = tc + Math.max(0, secs)
    // 4) 光がはじける
    tl.add(() => {
      c[0].rot = 0
      c[1].rot = 0
      s.hs = 1
      api.pop()
      api.burst(HI.x / W, HI.y / H, { amount: 60, power: 1.2 })
      api.burst(HI.x / W, HI.y / H, { amount: 36, power: 0.8, colors: ['#ffffff', ...api.palette] })
    }, td)
    tl.to(s, { glow: 520, duration: red ? 0.25 : 0.7, ease: 'power3.out' }, td)
    tl.add(() => {
      phase = 'done'
      hint = ''
      if (revealed) return
      revealed = true
      api.reveal({ x: HI.x / W, y: HI.y / H })
    }, td + (red ? 0.35 : 0.65))
  }

  onMount(() => {
    gsap.ticker.add(render)
    render()
    ctx.add(() => {
      for (let i = 0; i < 2; i++) {
        gsap.to(c[i], { pop: 1, duration: api.reduced ? 0.2 : 0.8, delay: api.reduced ? 0 : 0.15 + i * 0.2, ease: 'back.out(1.8)' })
      }
      gsap.delayedCall(api.reduced ? 0.3 : 1.2, () => {
        phase = 'play'
        hint = 'かわるがわる タップしてね'
        canSkip = true
        gsap.to(c[0], { cue: 1, duration: 0.3 })
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
  <svg viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice" role="group" aria-label="おうえんペア">
    <defs>
      <clipPath id="cheer-heart"><path d={HEART_D} /></clipPath>
      <radialGradient id="cheer-glow">
        <stop offset="0" stop-color="#ffffff" stop-opacity="1" />
        <stop offset="0.45" stop-color={cCream} stop-opacity="0.95" />
        <stop offset="1" stop-color={cCream} stop-opacity="0" />
      </radialGradient>
    </defs>

    <!-- 足もとのかげ -->
    <ellipse cx="92" cy={CY + 52} rx="44" ry="7" fill="var(--ink)" opacity="0.12" />
    <ellipse cx="268" cy={CY + 52} rx="44" ry="7" fill="var(--ink)" opacity="0.12" />

    <!-- まん中のハートのメーター -->
    <g bind:this={heartG} transform="translate({HEART.x} {HEART.y})">
      <path d={HEART_D} fill="var(--paper)" />
      <g clip-path="url(#cheer-heart)">
        <rect bind:this={fillRect} x="-70" y="36" width="140" height="90" fill="#ffd36e" />
        <path d="M-40 -30 C-48 -18 -48 -4 -42 6" stroke="#fff" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.7" />
      </g>
      <path d={HEART_D} fill="none" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round" />
    </g>

    <!-- ふたり -->
    {#each kinds as k, i (k.kind)}
      <g
        class="chara"
        role="button"
        tabindex="0"
        aria-label={k.label}
        onpointerdown={() => tap(i)}
        onkeydown={(e) => onKey(e, i)}
      >
        <g bind:this={roots[i]} transform="translate({k.x0} {CY}) scale(0.001)">
          <circle bind:this={cues[i]} r="66" fill="none" stroke="var(--ink-soft)" stroke-width="3" stroke-dasharray="3 9" stroke-linecap="round" style="opacity:0" />
          <circle r="66" fill="transparent" />
          <g bind:this={bodies[i]}>
            {#if k.kind === 'sun'}
              <!-- しっぽ（ちいさなお日さま） -->
              <path d="M-34 26 C-50 34 -54 14 -64 20" stroke="var(--ink)" stroke-width="8" stroke-linecap="round" fill="none" />
              <path d="M-34 26 C-50 34 -54 14 -64 20" stroke={cSun} stroke-width="4" stroke-linecap="round" fill="none" />
              <g transform="translate(-66 20)">
                {#each [0, 72, 144, 216, 288] as a (a)}
                  <circle cx={Math.cos((a * Math.PI) / 180) * 8} cy={Math.sin((a * Math.PI) / 180) * 8} r="4" fill={cSunDeep} stroke="var(--ink)" stroke-width="1.6" />
                {/each}
                <circle r="6.4" fill={cSun} stroke="var(--ink)" stroke-width="1.8" />
              </g>
              <!-- 光のふち（ゆっくり回る） -->
              <g bind:this={raysG}>
                {#each rays as r, j (j)}
                  <circle cx={r.x} cy={r.y} r="9" fill={cSunDeep} stroke="var(--ink)" stroke-width="2.2" />
                {/each}
              </g>
            {:else}
              <!-- しっぽ（ほし） -->
              <path d="M34 26 C50 36 52 12 62 18" stroke="var(--ink)" stroke-width="8" stroke-linecap="round" fill="none" />
              <path d="M34 26 C50 36 52 12 62 18" stroke={cMoon} stroke-width="4" stroke-linecap="round" fill="none" />
              <path d={starPath(66, 16, 13)} fill={cSun} stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
            {/if}

            <!-- うで（ポンポン / はた） -->
            <g bind:this={armsL[i]}>
              <path d="M0 0 L0 -32" stroke="var(--ink)" stroke-width="9" stroke-linecap="round" />
              <path d="M0 0 L0 -32" stroke={k.kind === 'sun' ? cSun : cMoon} stroke-width="5" stroke-linecap="round" />
              {#if k.kind === 'sun'}
                {@render pompom()}
              {:else}
                {@render flag(1)}
              {/if}
            </g>
            <g bind:this={armsR[i]}>
              <path d="M0 0 L0 -32" stroke="var(--ink)" stroke-width="9" stroke-linecap="round" />
              <path d="M0 0 L0 -32" stroke={k.kind === 'sun' ? cSun : cMoon} stroke-width="5" stroke-linecap="round" />
              {#if k.kind === 'sun'}
                {@render pompom()}
              {:else}
                {@render flag(-1)}
              {/if}
            </g>

            <!-- からだ -->
            <ellipse rx="45" ry="43" fill={k.kind === 'sun' ? cSun : cMoon} stroke="var(--ink)" stroke-width="2.8" />
            <ellipse cx="0" cy="18" rx="24" ry="17" fill="#fff" opacity="0.5" />
            {#if k.kind === 'moon'}
              <circle cx="24" cy="-22" r="6" fill={cMoonDeep} />
              <circle cx="-30" cy="22" r="4.4" fill={cMoonDeep} />
              <circle cx="32" cy="14" r="3" fill={cMoonDeep} />
            {/if}
            <path d="M-32 -26 C-38 -16 -39 -4 -36 6" stroke="#fff" stroke-width="5" stroke-linecap="round" fill="none" opacity="0.75" />

            <!-- あたまのかざり -->
            {#if k.kind === 'sun'}
              <path d="M0 -42 C-2 -52 2 -58 6 -62" stroke="var(--ink)" stroke-width="6" stroke-linecap="round" fill="none" />
              <path d="M0 -42 C-2 -52 2 -58 6 -62" stroke={cMint} stroke-width="2.6" stroke-linecap="round" fill="none" />
              <path d="M5 -58 C-4 -72 -18 -66 -16 -56 C-10 -52 0 -54 5 -58 Z" fill={cMint} stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
              <path d="M6 -61 C14 -76 28 -70 26 -60 C20 -56 11 -57 6 -61 Z" fill={cMint} stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
            {:else}
              <path d="M-4 -70 A19 19 0 1 0 17 -41 A14 14 0 1 1 -4 -70 Z" fill={cSun} stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round" transform="translate(-6 8)" />
              <path d={starPath(22, -64, 7)} fill="#fff" stroke="var(--ink)" stroke-width="1.8" stroke-linejoin="round" />
            {/if}

            <!-- ほっぺ -->
            {#if k.kind === 'sun'}
              <circle cx="-26" cy="8" r="7.4" fill={cCheekSun} opacity="0.9" />
              <circle cx="26" cy="8" r="7.4" fill={cCheekSun} opacity="0.9" />
            {:else}
              <ellipse cx="-27" cy="8" rx="8.4" ry="6" fill={cCheekMoon} opacity="0.95" />
              <ellipse cx="27" cy="8" rx="8.4" ry="6" fill={cCheekMoon} opacity="0.95" />
              {#each [-30, -25] as x (x)}
                <path d="M{x} 5 l-1.6 4" stroke="#fff" stroke-width="1.4" stroke-linecap="round" />
              {/each}
              {#each [24, 29] as x (x)}
                <path d="M{x} 5 l-1.6 4" stroke="#fff" stroke-width="1.4" stroke-linecap="round" />
              {/each}
            {/if}

            <!-- かお -->
            {#if k.kind === 'sun'}
              <circle cx="-16" cy="-6" r="3.8" fill="var(--ink)" />
              <circle cx="16" cy="-6" r="3.8" fill="var(--ink)" />
              <circle cx="-14.8" cy="-7.2" r="1.2" fill="#fff" />
              <circle cx="17.2" cy="-7.2" r="1.2" fill="#fff" />
            {:else}
              <path d="M-21 -5 Q-16 -12 -11 -5" stroke="var(--ink)" stroke-width="3" stroke-linecap="round" fill="none" />
              <path d="M11 -5 Q16 -12 21 -5" stroke="var(--ink)" stroke-width="3" stroke-linecap="round" fill="none" />
            {/if}
            <g bind:this={mouthsShut[i]}>
              <path d="M-7 5 Q0 13 7 5" stroke="var(--ink)" stroke-width="2.8" stroke-linecap="round" fill="none" />
            </g>
            <g bind:this={mouthsOpen[i]} style="opacity:0">
              <path d="M-9 3 Q0 4 9 3 Q8 17 0 17 Q-8 17 -9 3 Z" fill="var(--ink)" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
              <ellipse cx="0" cy="13" rx="4.6" ry="3" fill="#f4a65c" />
            </g>
          </g>
        </g>
      </g>
    {/each}

    {#snippet pompom()}
      <g transform="translate(0 -38)">
        {#each [0, 60, 120, 180, 240, 300] as a (a)}
          <circle cx={Math.cos((a * Math.PI) / 180) * 8} cy={Math.sin((a * Math.PI) / 180) * 8} r="6.4" fill={cMint} stroke="var(--ink)" stroke-width="1.8" />
        {/each}
        <circle r="7.4" fill="#d5f0df" stroke="var(--ink)" stroke-width="1.8" />
      </g>
    {/snippet}
    {#snippet flag(d: number)}
      <g transform="translate(0 -32)">
        <path d="M0 0 L0 -22" stroke="var(--ink)" stroke-width="3" stroke-linecap="round" />
        <path d="M0 -22 L{d * 22} -17 L0 -10 Z" fill={cSun} stroke="var(--ink)" stroke-width="2.2" stroke-linejoin="round" />
        <circle cx={d * 8} cy="-17" r="2.4" fill="#fff" />
      </g>
    {/snippet}

    <!-- ハイタッチの「ぱちん」 -->
    <circle bind:this={flashEl} cx={HI.x} cy={HI.y - 10} r="0.01" fill="none" stroke="#fff3b0" stroke-width="6" style="opacity:0" />
    <!-- はじける光 -->
    <circle bind:this={glowEl} cx={HI.x} cy={HI.y} r="0.01" fill="url(#cheer-glow)" pointer-events="none" />
  </svg>

  <div class="hint" aria-live="polite">{#if hint}<span class="pill">{hint}</span>{/if}</div>

  {#if canSkip}
    <div class="skip">
      <button type="button" class="pill skipbtn" onclick={skip}>ぜんぶためる</button>
    </div>
  {/if}
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
  .chara {
    cursor: pointer;
  }
  .chara:focus {
    outline: none;
  }
  .chara:focus-visible {
    outline: 3px dashed var(--ink);
    outline-offset: 2px;
  }
  /* 演出中のヒント。背景の上でも読めるように、紙色の下地（ピル）を敷く */
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
    max-width: 90cqw;
    box-sizing: border-box;
  }
  .skip {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 7cqh;
    display: flex;
    justify-content: center;
  }
  .skipbtn {
    min-height: 44px;
    min-width: 44px;
    font-size: 4.4cqw;
    cursor: pointer;
  }
  .skipbtn:focus {
    outline: none;
  }
  .skipbtn:focus-visible {
    outline: 3px dashed var(--ink);
    outline-offset: 2px;
  }
</style>
