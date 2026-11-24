<script lang="ts">
  import { onMount } from 'svelte'
  import gsap from 'gsap'
  import type { SceneApi } from '../types'

  let { api }: { api: SceneApi } = $props()

  const W = 360
  const H = 640
  const SCALE = 0.86
  const HOVER = { x: 128, y: 236 } // 止まって（ホバリングして）待つ位置
  const KNOT = { x: 120, y: -40 } // くちばしの先（包みの結び目）。こうのとりの座標系

  // 包みの布は答えを連想させない、クリーム色にする
  const cloth = '#fff6df'
  const rays = Array.from({ length: 14 }, (_, i) => i * (360 / 14))

  let phase: 'fly' | 'play' | 'drum' | 'open' = 'fly'
  let hint = $state('')

  let storkG: SVGGElement
  let wingNear: SVGGElement
  let wingFar: SVGGElement
  let legsG: SVGGElement
  let swingG: SVGGElement
  let sackG: SVGGElement
  let earL: SVGGElement
  let earR: SVGGElement
  let raysG: SVGGElement
  let cloudA: SVGGElement
  let cloudB: SVGGElement
  let sackHit: SVGCircleElement

  // 毎フレーム属性へ書き出す値
  const s = {
    px: -150,
    py: 330,
    bob: 0,
    pitch: -10,
    freq: 2.4,
    amp: 34,
    phase: 0,
    swing: 0,
    shake: 0,
    puff: 1,
    sackAlpha: 1,
    ears: 0,
    glow: 0,
    spin: 0,
  }

  function render(_time: number, deltaMs: number) {
    if (!storkG) return
    s.phase += (deltaMs / 1000) * s.freq * Math.PI * 2
    s.spin += deltaMs * 0.03
    const flap = 12 + s.amp * Math.sin(s.phase) // 正のとき、羽の先が上がる
    storkG.setAttribute('transform', `translate(${s.px} ${s.py + s.bob}) scale(${SCALE}) rotate(${s.pitch})`)
    wingNear.setAttribute('transform', `rotate(${flap})`)
    wingFar.setAttribute('transform', `rotate(${flap * 0.8 - 6})`)
    legsG.setAttribute('transform', `rotate(${4 + Math.sin(s.phase - 1) * 4})`)
    swingG.setAttribute('transform', `rotate(${s.swing + s.shake})`)
    sackG.setAttribute('transform', `scale(${s.puff})`)
    sackG.style.opacity = String(s.sackAlpha)
    earL.setAttribute('transform', `rotate(${-s.ears * 78})`)
    earR.setAttribute('transform', `rotate(${s.ears * 78})`)
    raysG.setAttribute('transform', `rotate(${s.spin}) scale(${s.glow * 1.9})`)
    raysG.style.opacity = String(Math.min(1, s.glow * 1.6) * (1 - Math.max(0, s.glow - 0.85) * 6))
  }

  // イベントハンドラ内で作るアニメーションも、アンマウント時にまとめて止めるための入れ物
  const ctx = gsap.context(() => {})

  function sackCenter() {
    const stageEl = storkG?.closest('.stage')
    if (!stageEl || !sackHit) return { x: 0.5, y: 0.4 } // すでに取り外されているときの保険
    const stage = stageEl.getBoundingClientRect()
    const r = sackHit.getBoundingClientRect()
    return { x: (r.left + r.width / 2 - stage.left) / stage.width, y: (r.top + r.height / 2 - stage.top) / stage.height }
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      tap()
    }
  }

  function tap() {
    if (phase !== 'play') return
    ctx.add(tapBody)
  }

  function tapBody() {
    phase = 'drum'
    hint = 'どきどき…'
    const secs = api.config.drum
    api.drumroll(secs)
    if (secs <= 0) return open()
    const tl = gsap.timeline({ onComplete: open })
    if (!api.reduced) {
      // 包みがだんだん大きくゆれて、ふくらむ
      tl.to(s, { shake: 9, duration: 0.05, yoyo: true, repeat: Math.max(1, Math.floor(secs / 0.05)), ease: 'none' }, 0)
      tl.to(s, { puff: 1.22, duration: secs, ease: 'power2.in' }, 0)
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
    const c = sackCenter()
    const tl = gsap.timeline()
    tl.to(s, { ears: 1, duration: api.reduced ? 0.15 : 0.45, ease: 'back.out(2.2)' })
    tl.to(s, { glow: 1, duration: api.reduced ? 0.2 : 0.9, ease: 'power2.out' }, 0.05)
    tl.to(s, { sackAlpha: 0, puff: 1.5, duration: 0.45, ease: 'power1.in' }, 0.15)
    tl.add(() => {
      api.burst(c.x, c.y, { amount: 46, power: 1.1 })
      api.burst(c.x, c.y, { amount: 28, power: 0.75, colors: ['#ffffff', '#fff3b5', ...api.palette] })
    }, 0.2)
    tl.add(() => api.reveal(c), api.reduced ? 0.6 : 1.3)
  }

  onMount(() => {
    gsap.ticker.add(render)
    render(0, 0)
    ctx.add(() => {
      const t = api.reduced ? 0.2 : 2.7
      gsap.to(s, { px: HOVER.x, duration: t, ease: 'power2.out' })
      gsap.to(s, { py: HOVER.y, duration: t, ease: 'sine.out' })
      gsap.to(s, { pitch: 0, duration: t * 0.9, ease: 'power1.inOut' })
      gsap.to(s, { freq: 1.3, amp: 24, duration: 1.2, delay: t * 0.6, ease: 'power1.inOut' })
      gsap.delayedCall(t, () => {
        phase = 'play'
        hint = 'つつみを タップして！'
        api.tick()
      })
      if (!api.reduced) {
        gsap.to(s, { bob: 7, duration: 1.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: t })
        gsap.fromTo(s, { swing: -6 }, { swing: 6, duration: 1.7, ease: 'sine.inOut', yoyo: true, repeat: -1 })
        gsap.fromTo(cloudA, { x: -140 }, { x: 460, duration: 9, ease: 'none', repeat: -1 })
        gsap.fromTo(cloudB, { x: -220 }, { x: 380, duration: 13, ease: 'none', repeat: -1, delay: 2 })
      }
    })
    return () => {
      gsap.ticker.remove(render)
      ctx.revert()
    }
  })
</script>

<div class="scene">
  <svg viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice" role="group" aria-label="こうのとり">
    <!-- 手前をすばやく流れる雲（飛んでいる感じを出す） -->
    <g bind:this={cloudA}><use href="#cloud" x="0" y="320" width="84" height="37" opacity="0.9" /></g>
    <g bind:this={cloudB}><use href="#cloud" x="0" y="150" width="62" height="27" opacity="0.8" /></g>

    <g bind:this={storkG}>
      <g stroke-linejoin="round" stroke-linecap="round">
        <!-- 奥の羽 -->
        <g transform="translate(4 -14)">
          <g bind:this={wingFar}>
            <path
              d="M2 0 C-30 -14 -74 -12 -116 2 C-106 8 -98 8 -90 12 C-80 18 -72 18 -62 22 C-50 28 -34 26 -20 22 C-8 20 0 14 2 6 Z"
              fill="#e9e1d1"
              stroke="var(--ink)"
              stroke-width="2.6"
            />
          </g>
        </g>

        <!-- 足（うしろになびく） -->
        <g transform="translate(-14 22)">
          <g bind:this={legsG}>
            <path d="M0 2 L-58 22 M12 4 L-48 30" stroke="var(--ink)" stroke-width="6.4" fill="none" />
            <path d="M0 2 L-58 22 M12 4 L-48 30" stroke="#f6a35a" stroke-width="3.2" fill="none" />
            <path d="M-58 22 l-9 -3 m9 3 l-7 7 M-48 30 l-9 -3 m9 3 l-7 7" stroke="var(--ink)" stroke-width="2.6" fill="none" />
          </g>
        </g>

        <!-- 尾 -->
        <path d="M-42 -6 L-80 -16 L-72 -3 L-84 7 L-62 9 L-44 10 Z" fill="#fffdf7" stroke="var(--ink)" stroke-width="2.6" />
        <path d="M-72 -3 L-84 7 L-76 8 L-68 0 Z" fill="#5a4a42" />

        <!-- 体 -->
        <path
          d="M-48 -2 C-48 -20 -22 -28 4 -26 C30 -24 46 -14 46 2 C46 20 24 28 -4 26 C-30 24 -48 14 -48 -2 Z"
          fill="#fffdf7"
          stroke="var(--ink)"
          stroke-width="2.8"
        />
        <path d="M-24 8 C-14 16 6 18 22 12" fill="none" stroke="var(--ink)" stroke-width="1.6" opacity="0.35" />

        <!-- 首 -->
        <path d="M28 -16 C42 -32 46 -46 52 -56 L70 -46 C62 -36 60 -22 48 -4 Z" fill="#fffdf7" stroke="var(--ink)" stroke-width="2.6" />

        <!-- 頭 -->
        <circle cx="66" cy="-52" r="13" fill="#fffdf7" stroke="var(--ink)" stroke-width="2.8" />
        <circle cx="70" cy="-55" r="2.6" fill="var(--ink)" />
        <circle cx="71" cy="-56" r="0.9" fill="#fff" />
        <ellipse cx="64" cy="-47" rx="5" ry="3.4" fill="#ffb3a8" opacity="0.8" />
        <path d="M60 -64 C58 -72 66 -74 68 -67" fill="none" stroke="var(--ink)" stroke-width="2.2" />

        <!-- くちばし -->
        <path d="M77 -54 L128 -44 C131 -43 130 -40 126 -39 L77 -43 Z" fill="#f6a35a" stroke="var(--ink)" stroke-width="2.6" />
        <path d="M78 -48 L124 -42" stroke="var(--ink)" stroke-width="1.4" opacity="0.5" />

        <!-- 手前の羽 -->
        <g transform="translate(4 -14)">
          <g bind:this={wingNear}>
            <path
              d="M2 0 C-30 -14 -74 -12 -116 2 C-106 8 -98 8 -90 12 C-80 18 -72 18 -62 22 C-50 28 -34 26 -20 22 C-8 20 0 14 2 6 Z"
              fill="#fffdf7"
              stroke="var(--ink)"
              stroke-width="2.8"
            />
            <path d="M-116 2 C-100 -4 -84 -8 -70 -9 L-66 22 C-74 18 -80 18 -90 12 C-98 8 -106 8 -116 2 Z" fill="#5a4a42" />
            <path d="M-60 6 L-46 6 M-54 14 L-40 14 M-34 8 L-22 8" stroke="var(--ink)" stroke-width="1.6" opacity="0.4" fill="none" />
          </g>
        </g>
      </g>

      <!-- くちばしにさげた包み（結び目が支点） -->
      <g transform="translate({KNOT.x} {KNOT.y})">
        <g bind:this={swingG}>
          <!-- 光（ひらいたとき） -->
          <g transform="translate(0 54)">
            <g bind:this={raysG} style="opacity:0">
              {#each rays as a (a)}
                <path d="M0 0 L-9 -84 L9 -84 Z" fill="#fff3b5" stroke="#fff" stroke-width="1" transform="rotate({a})" />
              {/each}
              <circle r="30" fill="#fffbe0" />
            </g>
          </g>

          <!-- 布の結び目 -->
          <path d="M0 0 C-3 8 -3 14 0 20" stroke="var(--ink)" stroke-width="3" fill="none" stroke-linecap="round" />

          <!-- 耳（ひらくと外へ倒れる） -->
          <g transform="translate(0 18)">
            <g bind:this={earL}>
              <path d="M0 0 C-16 -14 -34 -10 -30 4 C-22 2 -10 4 0 6 Z" fill={cloth} stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round" />
            </g>
            <g bind:this={earR}>
              <path d="M0 0 C16 -14 34 -10 30 4 C22 2 10 4 0 6 Z" fill={cloth} stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round" />
            </g>
          </g>

          <!-- 本体の袋 -->
          <g transform="translate(0 54)">
            <g bind:this={sackG}>
              <path
                d="M-34 -30 C-42 12 -28 38 0 38 C28 38 42 12 34 -30 C20 -40 -20 -40 -34 -30 Z"
                fill={cloth}
                stroke="var(--ink)"
                stroke-width="2.8"
                stroke-linejoin="round"
              />
              <path d="M-26 -24 C-30 6 -20 28 -2 31" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.7" />
              {#each [[-16, -6], [14, -14], [18, 14], [-8, 20], [0, -26]] as [x, y], i (i)}
                <circle cx={x} cy={y} r="3.6" fill={api.palette[i % api.palette.length]} stroke="var(--ink)" stroke-width="1" />
              {/each}
              <!-- ぬい目とリボン -->
              <path d="M-34 -26 C-14 -16 14 -16 34 -26" fill="none" stroke="var(--ink)" stroke-width="1.8" stroke-dasharray="3 5" stroke-linecap="round" opacity="0.6" />
              <path d="M0 -18 C-14 -30 -18 -14 0 -16 C18 -14 14 -30 0 -18 Z" fill={api.palette[0]} stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
            </g>
          </g>
          <circle
            bind:this={sackHit}
            role="button"
            tabindex="0"
            aria-label="包みをひらく"
            onkeydown={onKey}
            cx="0"
            cy="54"
            r="52"
            fill="transparent"
            class="hit"
            onpointerdown={tap}
          />
        </g>
      </g>
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
    touch-action: manipulation;
  }
  .hit {
    cursor: pointer;
  }
  .hit:focus {
    outline: none;
  }
  .hit:focus-visible {
    outline: 3px dashed var(--ink);
    outline-offset: 2px;
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
