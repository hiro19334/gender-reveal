<script lang="ts">
  import { onMount } from 'svelte'
  import gsap from 'gsap'
  import type { SceneApi } from '../types'

  let { api }: { api: SceneApi } = $props()

  const W = 360
  const H = 640
  const CX = 180
  const CY = 232 // くす玉の中心
  const R = 78
  const HANDLE_Y = 396
  const PULL_OK = 60 // これ以上引いて離したら割れる
  const PULL_MAX = 112

  // 答えの色を連想させない配色にする（黄・ミント・ラベンダー・もも）
  const cHalfA = '#fbe3a1'
  const cHalfB = '#bfe3c8'
  const cBand = '#cdbfe8'
  const cDot = '#f9d3a8'

  const HALF = `M0 ${-R} A${R} ${R} 0 0 0 0 ${R} Z`
  const fringe = Array.from({ length: 14 }, (_, i) => -R + 12 + i * 10.5)
  const chars = [...'おめでとう！']
  const streamers = Array.from({ length: 11 }, (_, i) => {
    const t = (i / 10) * 2 - 1 // -1〜1
    const x1 = t * 60
    const x2 = t * 120 + (i % 2 ? 26 : -26)
    return {
      d: `M0 -10 C${x1} -70 ${x2} -30 ${x2 + (i % 2 ? 10 : -10)} ${96 + (i % 3) * 22}`,
      color: [api.palette[1], api.palette[2], api.palette[3], api.palette[4], api.palette[5], '#fff'][i % 6],
    }
  })

  let phase: 'play' | 'drag' | 'drum' | 'open' = 'play'
  let hint = $state('ひもを下にひっぱってね')
  let svg: SVGSVGElement
  let ropeEl: SVGPathElement
  let stringEl: SVGPathElement
  let handleG: SVGGElement
  let ballG: SVGGElement
  let leftG: SVGGElement
  let rightG: SVGGElement
  let bannerG: SVGGElement
  let innerEl: SVGEllipseElement
  let streamEls = $state<SVGPathElement[]>([])
  let fringes = $state<SVGGElement[]>([])

  // アニメーションする値は普通のオブジェクトに入れ、毎フレーム属性へ書き出す
  const s = { pull: 0, bob: 0, rot: 0, sway: 0, open: 0, banner: 0, shake: 0, fade: 1 }
  const streamT = streamers.map(() => ({ v: 0 }))

  function render() {
    if (!ballG) return
    const by = CY + s.pull * 0.12 + s.bob
    ballG.setAttribute('transform', `translate(${CX} ${by}) rotate(${s.rot + s.shake})`)
    ropeEl.setAttribute('d', `M${CX} -12 L${CX} ${by - R - 6}`)
    const sy = by + R - 6
    const hy = HANDLE_Y + s.pull
    stringEl.setAttribute('d', `M${CX} ${sy} Q${CX + s.sway} ${(sy + hy) / 2} ${CX} ${hy - 12}`)
    handleG.setAttribute('transform', `translate(${CX} ${hy})`)
    handleG.style.opacity = String(s.fade)
    stringEl.style.opacity = String(s.fade)
    leftG.setAttribute('transform', `rotate(${s.open * 46}) translate(${-s.open * 6} 0)`)
    rightG.setAttribute('transform', `rotate(${-s.open * 46}) translate(${s.open * 6} 0)`)
    innerEl.style.opacity = String(Math.min(1, s.open * 3))
    // 切り口の波形のふちは、ひらきはじめてから見せる（閉じているときは合わせ目がすっきり見えるように）
    fringes.forEach((el) => el && (el.style.opacity = s.open > 0.02 ? '1' : '0'))
    bannerG.setAttribute('transform', `translate(0 -18) scale(1 ${Math.max(0.001, s.banner)})`)
    bannerG.style.opacity = s.banner > 0.01 ? '1' : '0'
    streamEls.forEach((el, i) => el && (el.style.strokeDashoffset = String(1 - streamT[i].v)))
  }

  // イベントハンドラ内で作るアニメーションも、アンマウント時にまとめて止めるための入れ物
  const ctx = gsap.context(() => {})

  let startY = 0
  let moved = 0
  let armed = false

  function down(e: PointerEvent) {
    if (phase !== 'play') return
    phase = 'drag'
    startY = e.clientY
    moved = 0
    armed = false
    gsap.killTweensOf(s, 'pull')
    try {
      handleG.setPointerCapture(e.pointerId)
    } catch {
      /* 取れなくても、そのまま続ける */
    }
    hint = ''
  }

  function move(e: PointerEvent) {
    if (phase !== 'drag') return
    const k = svg.getBoundingClientRect().height / H
    const dy = (e.clientY - startY) / k
    moved = Math.max(moved, Math.abs(dy))
    s.pull = Math.min(PULL_MAX, Math.max(0, dy))
    if (s.pull > PULL_OK && !armed) {
      armed = true
      api.tick()
    }
  }

  function up() {
    if (phase !== 'drag') return
    if (moved < 8) {
      // ちょん、とタップしただけでも引っぱったことにする
      pullAuto()
    } else if (s.pull >= PULL_OK) {
      phase = 'drum'
      release()
    } else {
      phase = 'play'
      hint = 'もっと下まで、ぐいっと！'
      ctx.add(() => gsap.to(s, { pull: 0, duration: 0.9, ease: 'elastic.out(1, 0.4)' }))
    }
  }

  function pullAuto() {
    phase = 'drum'
    hint = ''
    ctx.add(() => gsap.to(s, { pull: PULL_OK + 24, duration: 0.25, ease: 'power2.out', onComplete: release }))
  }

  // キーボード・スイッチ操作：持ち手にフォーカスして Enter / Space で引く
  function onKey(e: KeyboardEvent) {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    if (phase !== 'play') return
    api.tick()
    pullAuto()
  }

  function release() {
    ctx.add(releaseBody)
  }

  function releaseBody() {
    hint = 'どきどき…'
    gsap.to(s, { pull: 0, duration: 0.35, ease: 'power2.out' })
    gsap.to(s, { fade: 0, duration: 0.5, delay: 0.1 })
    const secs = api.config.drum
    api.drumroll(secs)
    if (secs <= 0) return open()
    // 割れる直前ほど、くす玉が大きくゆれる
    const tl = gsap.timeline({ onComplete: open })
    if (!api.reduced) {
      tl.to(s, { shake: 5, duration: 0.05, yoyo: true, repeat: Math.max(1, Math.floor(secs / 0.05)), ease: 'none' }, 0)
    }
    tl.to({}, { duration: secs }, 0)
  }

  function open() {
    ctx.add(openBody)
  }

  function openBody() {
    phase = 'open'
    hint = ''
    s.shake = 0
    gsap.killTweensOf(s, 'shake')
    api.pop()
    const x = CX / W
    const y = CY / H
    api.burst(x, y, { amount: 50, power: 1.15 })
    api.burst(x, y, { amount: 30, power: 0.8, colors: ['#ffffff', ...api.palette] })
    const tl = gsap.timeline()
    tl.to(s, { open: 1, duration: api.reduced ? 0.2 : 0.7, ease: 'back.out(1.8)' })
    streamT.forEach((t, i) => tl.to(t, { v: 1, duration: 0.9, ease: 'power2.out' }, 0.05 + i * 0.04))
    tl.to(s, { banner: 1, duration: api.reduced ? 0.2 : 1.1, ease: 'bounce.out' }, 0.25)
    tl.add(() => api.burst(x, y + 0.05, { amount: 36, power: 0.7 }), 0.6)
    tl.add(() => api.reveal({ x: 0.5, y: y + 0.05 }), api.reduced ? 0.7 : 2.0)
  }

  onMount(() => {
    gsap.ticker.add(render)
    render()
    ctx.add(() => {
      gsap.from(s, { pull: -140, duration: api.reduced ? 0.2 : 1.1, ease: 'bounce.out' })
      if (!api.reduced) {
        gsap.to(s, { bob: 5, duration: 2.1, ease: 'sine.inOut', yoyo: true, repeat: -1 })
        gsap.fromTo(s, { rot: -2.6 }, { rot: 2.6, duration: 2.8, ease: 'sine.inOut', yoyo: true, repeat: -1 })
        gsap.fromTo(s, { sway: -7 }, { sway: 7, duration: 2.2, ease: 'sine.inOut', yoyo: true, repeat: -1 })
      }
    })
    return () => {
      gsap.ticker.remove(render)
      ctx.revert()
    }
  })
</script>

<div class="scene">
  <svg bind:this={svg} viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice" role="group" aria-label="くす玉">
    <defs>
      <clipPath id="kus-half"><path d={HALF} /></clipPath>
      <radialGradient id="kus-inner" cx="0.5" cy="0.4" r="0.7">
        <stop offset="0" stop-color="#fff3d1" />
        <stop offset="1" stop-color="#e7b98d" />
      </radialGradient>
    </defs>

    <!-- 天井の金具とロープ -->
    <rect x="156" y="-6" width="48" height="14" rx="4" fill="#d9c7a0" stroke="var(--ink)" stroke-width="2.2" />
    <path bind:this={ropeEl} d="M180 -12 L180 150" stroke="var(--ink)" stroke-width="8" stroke-linecap="round" fill="none" />
    <path d="M180 -4 L180 146" stroke="#e7d3a8" stroke-width="4.4" stroke-linecap="round" stroke-dasharray="5 4" fill="none" />

    <!-- 中身（ひらいたときだけ見える） -->
    <g transform="translate({CX} {CY})">
      <ellipse bind:this={innerEl} cx="0" cy="0" rx="62" ry="{R - 4}" fill="url(#kus-inner)" stroke="var(--ink)" stroke-width="2.2" style="opacity:0" />
      {#each streamers as st, i (i)}
        <path
          bind:this={streamEls[i]}
          d={st.d}
          pathLength="1"
          fill="none"
          stroke={st.color}
          stroke-width="7"
          stroke-linecap="round"
          style="stroke-dasharray:1;stroke-dashoffset:1"
        />
      {/each}
      <!-- 垂れ幕 -->
      <g bind:this={bannerG} style="opacity:0">
        <rect x="-8" y="-6" width="16" height="10" fill="#d9c7a0" stroke="var(--ink)" stroke-width="1.8" />
        <path d="M-34 0 H34 V222 L0 206 L-34 222 Z" fill="var(--paper)" stroke="var(--ink)" stroke-width="2.6" stroke-linejoin="round" />
        <path d="M-27 8 H27 V208 L0 195 L-27 208 Z" fill="none" stroke={api.palette[0]} stroke-width="2" stroke-dasharray="2 5" stroke-linecap="round" />
        {#each chars as c, i (i)}
          <text x="0" y={34 + i * 28} text-anchor="middle" class="banner-ch">{c}</text>
        {/each}
      </g>
    </g>

    <!-- ひも（ここを引く） -->
    <path bind:this={stringEl} d="M180 300 L180 384" stroke="var(--ink)" stroke-width="2.4" stroke-linecap="round" fill="none" />

    <!-- くす玉本体 -->
    <g bind:this={ballG} transform="translate({CX} {CY})">
      <g transform="translate(0 {-R})">
        {#snippet half(fi: number)}
          <g transform="translate(0 {R})">
            <g clip-path="url(#kus-half)">
              <rect x="-90" y="-90" width="90" height="180" fill="var(--half-color)" />
              <path d="M0 {-R} C-40 -36 -40 36 0 {R}" stroke={cBand} stroke-width="11" fill="none" />
              <path d="M0 {-R} C-78 -46 -78 46 0 {R}" stroke={cBand} stroke-width="11" fill="none" />
              <path d="M-78 0 Q-39 9 0 0" stroke="#fff" stroke-width="7" fill="none" opacity="0.85" />
              {#each [[-60, -34], [-62, 30], [-24, -52], [-26, 52], [-20, -10], [-24, 14], [-48, 4]] as [x, y], i (i)}
                <circle cx={x} cy={y} r="5.4" fill={cDot} stroke="var(--ink)" stroke-width="1.3" />
              {/each}
              <!-- つや -->
              <path d="M-52 -42 C-62 -22 -62 2 -56 18" stroke="#fff" stroke-width="6" stroke-linecap="round" fill="none" opacity="0.6" />
            </g>
            <path d={HALF} fill="none" stroke="var(--ink)" stroke-width="2.8" stroke-linejoin="round" />
            <!-- 切り口の波形のふち -->
            <g bind:this={fringes[fi]} style="opacity:0">
              {#each fringe as y (y)}
                <circle cx="0" cy={y} r="6.4" fill="var(--half-color)" stroke="var(--ink)" stroke-width="1.8" />
              {/each}
            </g>
          </g>
        {/snippet}
        <g bind:this={leftG} style="--half-color:{cHalfA}">{@render half(0)}</g>
        <g bind:this={rightG} style="--half-color:{cHalfB}"><g transform="scale(-1 1)">{@render half(1)}</g></g>
      </g>
      <!-- 上のふた（ひらいても、ここでぶら下がっている） -->
      <g transform="translate(0 {-R})">
        <circle r="11" fill={cDot} stroke="var(--ink)" stroke-width="2.4" />
        <circle r="4" fill="#fff" stroke="var(--ink)" stroke-width="1.6" />
      </g>
    </g>

    <!-- 引くひもの持ち手 -->
    <g
      bind:this={handleG}
      class="handle"
      role="button"
      tabindex="0"
      aria-label="ひもを引く"
      onkeydown={onKey}
      onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up}>
      <circle r="42" fill="transparent" />
      <circle r="13" fill="none" stroke="var(--ink)" stroke-width="3.2" />
      <circle r="13" fill="none" stroke="#f0cf6a" stroke-width="1.6" />
      <rect x="-6" y="12" width="12" height="16" rx="3" fill="#f0cf6a" stroke="var(--ink)" stroke-width="2" />
      {#each [-5, 0, 5] as dx (dx)}
        <path d="M{dx} 28 q{dx / 2} 10 {dx} 20" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" fill="none" />
      {/each}
    </g>
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
    touch-action: none;
  }
  .handle {
    cursor: grab;
  }
  .handle:focus {
    outline: none;
  }
  .handle:focus-visible {
    outline: 3px dashed var(--ink);
    outline-offset: 2px;
  }
  .banner-ch {
    font-family: var(--font);
    font-weight: 900;
    font-size: 25px;
    fill: var(--ink);
  }
  /* 演出中のヒント。波やギザギザの上でも読めるように、紙色の下地（ピル）を敷く */
  .hint {
    position: absolute;
    left: 0;
    right: 0;
    top: 72cqh;
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
