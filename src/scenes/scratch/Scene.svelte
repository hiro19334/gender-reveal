<script lang="ts">
  import { onMount } from 'svelte'
  import gsap from 'gsap'
  import { feintColors, revealColors } from '../../core/config'
  import type { SceneApi } from '../types'

  let { api }: { api: SceneApi } = $props()

  const NEUTRAL = '#e6dfd0'
  const DONE_RATIO = 0.58 // これだけ削れたら、残りは自動ではがす

  // カードの下に見せる色。答えを隠すプレビューでは中立色、フェイントなら逆の色（本当の色は発表で出す）
  const under = $derived.by(() => {
    if (api.masked) return [NEUTRAL]
    return (api.config.feint ? feintColors(api.config) : null) ?? revealColors(api.config)
  })
  const underBg = $derived(
    under.length > 1 ? `linear-gradient(110deg, ${under[0]} 50%, ${under[1]} 50%)` : under[0],
  )

  let hint = $state('銀色のところを、指でこすってね')
  let finished = $state(false)
  // イベントハンドラ内で作るアニメーションも、アンマウント時にまとめて止めるための入れ物
  const ctx = gsap.context(() => {})
  let card: HTMLDivElement
  let win: HTMLDivElement
  let canvas: HTMLCanvasElement

  let done = false
  let drawing = false
  let last = { x: 0, y: 0 }
  let lastSound = 0
  let lastFlake = 0
  let lastCheck = 0

  function paintFoil() {
    const ctx = canvas.getContext('2d')!
    const w = canvas.width
    const h = canvas.height
    const u = w / 300 // 300 を基準にした倍率
    ctx.globalCompositeOperation = 'source-over'
    ctx.clearRect(0, 0, w, h)

    const g = ctx.createLinearGradient(0, 0, w, h)
    g.addColorStop(0, '#cdd3da')
    g.addColorStop(0.3, '#f3f5f7')
    g.addColorStop(0.55, '#bcc3cb')
    g.addColorStop(0.8, '#edf0f3')
    g.addColorStop(1, '#c6cdd4')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, w, h)

    // ざらざらした粒
    for (let i = 0; i < 2600; i++) {
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.55)' : 'rgba(100,112,124,0.16)'
      ctx.fillRect(Math.random() * w, Math.random() * h, 1.6 * u, 1.6 * u)
    }
    // ななめのつや
    ctx.save()
    ctx.translate(w / 2, h / 2)
    ctx.rotate(-0.5)
    ctx.fillStyle = 'rgba(255,255,255,0.28)'
    ctx.fillRect(-w, -h * 0.18, w * 2, h * 0.07)
    ctx.fillRect(-w, h * 0.02, w * 2, h * 0.03)
    ctx.restore()

    // 手描き風の星とハート
    ctx.strokeStyle = 'rgba(106,86,72,0.4)'
    ctx.lineWidth = 2.2 * u
    ctx.lineJoin = 'round'
    const star = (cx: number, cy: number, r: number) => {
      ctx.beginPath()
      for (let i = 0; i < 10; i++) {
        const a = (Math.PI * 2 * i) / 10 - Math.PI / 2
        const rr = i % 2 ? r * 0.45 : r
        ctx[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rr, cy + Math.sin(a) * rr)
      }
      ctx.closePath()
      ctx.stroke()
    }
    star(w * 0.18, h * 0.16, 15 * u)
    star(w * 0.84, h * 0.24, 11 * u)
    star(w * 0.22, h * 0.84, 12 * u)
    star(w * 0.82, h * 0.86, 16 * u)

    // 文字
    const font = getComputedStyle(canvas).getPropertyValue('--font') || 'sans-serif'
    ctx.fillStyle = 'rgba(106,86,72,0.78)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = `900 ${38 * u}px ${font}`
    ctx.fillText('こすってね', w / 2, h * 0.45)
    ctx.font = `700 ${15 * u}px ${font}`
    ctx.fillText('ひみつの ジェンダーリビール', w / 2, h * 0.7)
  }

  function size() {
    const r = win.getBoundingClientRect()
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    canvas.width = Math.round(r.width * dpr)
    canvas.height = Math.round(r.height * dpr)
    paintFoil()
  }

  function point(e: PointerEvent) {
    const r = canvas.getBoundingClientRect()
    return {
      x: ((e.clientX - r.left) / r.width) * canvas.width,
      y: ((e.clientY - r.top) / r.height) * canvas.height,
      cx: (e.clientX - r.left) / r.width,
      cy: (e.clientY - r.top) / r.height,
    }
  }

  function stroke(from: { x: number; y: number }, to: { x: number; y: number }) {
    const ctx = canvas.getContext('2d')!
    ctx.globalCompositeOperation = 'destination-out'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = canvas.width * 0.17
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
  }

  const probe = document.createElement('canvas')
  probe.width = 36
  probe.height = 48
  function clearedRatio(): number {
    const p = probe.getContext('2d', { willReadFrequently: true })!
    p.clearRect(0, 0, 36, 48)
    p.drawImage(canvas, 0, 0, 36, 48)
    const d = p.getImageData(0, 0, 36, 48).data
    let n = 0
    for (let i = 3; i < d.length; i += 4) if (d[i] < 110) n++
    return n / (36 * 48)
  }

  function check(force = false) {
    const now = performance.now()
    if (!force && now - lastCheck < 220) return
    lastCheck = now
    if (clearedRatio() >= DONE_RATIO) finish()
  }

  // キーボード・スイッチ操作用：銀色を全部はがして、そのまま発表へ進む
  function scratchAll() {
    if (done) return
    const c = canvas.getContext('2d')!
    c.globalCompositeOperation = 'destination-out'
    c.fillRect(0, 0, canvas.width, canvas.height)
    finish()
  }

  function finish() {
    if (done) return
    ctx.add(finishBody)
  }

  function finishBody() {
    done = true
    finished = true
    drawing = false
    hint = ''
    api.pop()
    gsap.to(canvas, { autoAlpha: 0, duration: 0.5, ease: 'power1.out' })
    api.burst(0.5, 0.5, { amount: 36, power: 0.9, colors: ['#ffffff', '#e5e9ee', ...api.palette.slice(0, 3)] })
    if (!api.reduced) {
      gsap.fromTo(card, { scale: 1 }, { scale: 1.05, duration: 0.16, yoyo: true, repeat: 3, ease: 'sine.inOut' })
    }
    gsap.delayedCall(api.reduced ? 0.4 : 1.1, () => {
      const stageEl = card.closest('.stage')
      if (!stageEl) return
      const stage = stageEl.getBoundingClientRect()
      const c = card.getBoundingClientRect()
      api.reveal({ x: (c.left + c.width / 2 - stage.left) / stage.width, y: (c.top + c.height / 2 - stage.top) / stage.height })
    })
  }

  function down(e: PointerEvent) {
    if (done) return
    drawing = true
    try {
      canvas.setPointerCapture(e.pointerId)
    } catch {
      /* 取れなくても、そのまま続ける */
    }
    const p = point(e)
    last = p
    stroke(p, p)
    hint = ''
  }

  function move(e: PointerEvent) {
    if (!drawing || done) return
    const p = point(e)
    stroke(last, p)
    last = p
    const now = performance.now()
    if (now - lastSound > 90) {
      lastSound = now
      api.scratch()
    }
    if (now - lastFlake > 140) {
      lastFlake = now
      const s = card.closest('.stage')!.getBoundingClientRect()
      const c = canvas.getBoundingClientRect()
      api.burst((c.left + p.cx * c.width - s.left) / s.width, (c.top + p.cy * c.height - s.top) / s.height, {
        colors: ['#f4f6f8', '#cfd5dc', '#b7bec6'],
        amount: 4,
        power: 0.28,
        shape: 'circle',
      })
    }
    check()
  }

  function up() {
    if (!drawing) return
    drawing = false
    check(true)
  }

  onMount(() => {
    size()
    // フォントが読み込まれてから文字を描き直す（まだ削っていなければ）
    void document.fonts?.ready.then(() => {
      if (!done && !drawing && !lastSound) paintFoil()
    })
    ctx.add(() => {
      gsap.from(card, { y: 80, rotation: -4, autoAlpha: 0, duration: api.reduced ? 0.2 : 0.9, ease: 'back.out(1.5)' })
      if (!api.reduced) {
        gsap.to(card, { rotation: 0.8, duration: 2.6, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1 })
      }
    })
    return () => ctx.revert()
  })
</script>

<div class="scene">
  <div class="card" bind:this={card} role="group" aria-label="スクラッチカード">
    <span class="tape l" style:background={api.palette[1]}></span>
    <span class="tape r" style:background={api.palette[2]}></span>
    <div class="win" bind:this={win} role="img" aria-label="銀色のスクラッチ。指でこすると、下の色があらわれます">
      <div class="under" style:background={underBg}>
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <path
            d="M50 12 l10 24 26 3 -20 17 6 26 -22 -14 -22 14 6 -26 -20 -17 26 -3z"
            fill="#fff"
            fill-opacity="0.55"
            stroke="var(--ink)"
            stroke-width="2.2"
            stroke-linejoin="round"
          />
        </svg>
      </div>
      <!-- svelte-ignore a11y_no_static_element_interactions -->
      <canvas
        bind:this={canvas}
        aria-label="こすって削る場所"
        onpointerdown={down}
        onpointermove={move}
        onpointerup={up}
        onpointercancel={up}
      ></canvas>
    </div>
  </div>
  <div class="hint" aria-live="polite">{#if hint}<span class="pill">{hint}</span>{/if}</div>
  {#if !finished}
    <button class="all" type="button" onclick={scratchAll}>ぜんぶこする</button>
  {/if}
</div>

<style>
  .scene {
    position: absolute;
    inset: 0;
    z-index: 3;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-top: 2cqh;
    padding-bottom: 14cqh;
  }
  .card {
    position: relative;
    width: 76cqw;
    aspect-ratio: 3 / 4;
    padding: 3.6cqw;
    background: var(--paper);
    border: 0.9cqw solid var(--ink);
    border-radius: 5cqw;
    box-shadow: 0 1.8cqw 0 rgba(106, 86, 72, 0.28);
  }
  .tape {
    position: absolute;
    top: -2.6cqw;
    width: 17cqw;
    height: 5.6cqw;
    opacity: 0.92;
    border: 0.5cqw solid rgba(106, 86, 72, 0.5);
    background-image: repeating-linear-gradient(135deg, rgba(255, 255, 255, 0.45) 0 1.2cqw, transparent 1.2cqw 2.4cqw);
  }
  .tape.l {
    left: -4cqw;
    transform: rotate(-24deg);
  }
  .tape.r {
    right: -4cqw;
    transform: rotate(22deg);
  }
  .win {
    position: relative;
    width: 100%;
    height: 100%;
    border-radius: 3cqw;
    overflow: hidden;
    border: 0.7cqw solid var(--ink);
  }
  .under {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background-image: radial-gradient(circle, rgba(255, 255, 255, 0.5) 0.8cqw, transparent 0.9cqw);
    background-size: 6.4cqw 6.4cqw;
    background-blend-mode: normal;
  }
  .under svg {
    width: 52%;
    filter: drop-shadow(0 1cqw 0 rgba(106, 86, 72, 0.2));
  }
  canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    touch-action: none;
    cursor: grab;
  }
  /* 演出中のヒント。波やギザギザの上でも読めるように、紙色の下地（ピル）を敷く */
  .hint {
    position: relative;
    width: 100%;
    margin-top: 6cqw;
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
    font-size: 5cqw;
    color: var(--ink);
    text-align: center;
  }
  .all {
    margin-top: 2.4cqw;
    padding: 1.2cqw 4.4cqw;
    min-height: 44px;
    border: 0.4cqw solid color-mix(in srgb, var(--ink) 35%, transparent);
    border-radius: 999px;
    background: color-mix(in srgb, var(--paper) 80%, transparent);
    font-family: var(--font);
    font-weight: 700;
    font-size: 4.2cqw;
    color: var(--ink);
    cursor: pointer;
  }
  .all:focus-visible {
    outline: 0.7cqw dashed var(--ink);
    outline-offset: 0.8cqw;
    color: var(--ink);
    background: color-mix(in srgb, var(--paper) 86%, transparent);
  }
</style>
