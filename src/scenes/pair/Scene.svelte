<script lang="ts">
  import { onMount } from 'svelte'
  import gsap from 'gsap'
  import type { SceneApi } from '../types'

  let { api }: { api: SceneApi } = $props()

  type K = 'boy' | 'girl'
  const W = 360
  const H = 640
  const KS: K[] = ['boy', 'girl']
  const DIR: Record<K, number> = { boy: 1, girl: -1 } // 箱に向かう向き
  const HOME: Record<K, { x: number; y: number }> = { boy: { x: 52, y: 588 }, girl: { x: 308, y: 588 } }
  const GOAL: Record<K, { x: number; y: number }> = { boy: { x: 98, y: 494 }, girl: { x: 262, y: 494 } }
  const REST: Record<K, { x: number; y: number }> = { boy: { x: 146, y: 441 }, girl: { x: 214, y: 441 } }
  const KNOT = { x: 180, y: 392 } // 箱のリボンの結び目
  const CHEST_Y = 421 // 箱の底
  const LID_Y = 346 // ふたと本体の境目

  // 答えを連想させない配色（黄・ミント・ラベンダー・クリーム）
  const skin = '#fde3cf'
  const mint = '#9bd9b8'
  const mintDeep = '#7bc29c'
  const lav = '#cdbfe8'
  const lavDeep = '#b6a4da'
  const cream = '#fff4d6'
  const yellow = '#f7d65a'
  const neutral = ['#f7d65a', '#bfe3c8', '#cdbfe8', '#fff4d6', '#f9d3a8']

  function star(cx: number, cy: number, R: number, r: number) {
    const pts: string[] = []
    for (let i = 0; i < 10; i++) {
      const a = (-90 + i * 36) * (Math.PI / 180)
      const rr = i % 2 ? r : R
      pts.push(`${(cx + Math.cos(a) * rr).toFixed(2)} ${(cy + Math.sin(a) * rr).toFixed(2)}`)
    }
    return `M${pts.join('L')}Z`
  }
  function sparkle(R: number) {
    const r = R * 0.28
    return `M0 ${-R} L${r} ${-r} L${R} 0 L${r} ${r} L0 ${R} L${-r} ${r} L${-R} 0 L${-r} ${-r} Z`
  }

  const LID = 'M117 349 L117 337 Q117 314 180 314 Q243 314 243 337 L243 349 Z'
  const rays = Array.from({ length: 14 }, (_, i) => i * (360 / 14))
  // お花畑（毎回同じ配置）
  const flowerColors = ['#fff6c9', '#fbe3a1', '#ffffff', '#cdbfe8', '#f9d3a8']
  const flowers = Array.from({ length: 26 }, (_, i) => {
    const t = (i * 0.618033) % 1
    const u = (i * 0.414213 + 0.2) % 1
    const y = 436 + u * 190
    return { x: 14 + t * 332, y, s: 0.8 + ((y - 436) / 190) * 0.7, c: flowerColors[i % flowerColors.length] }
  })

  type C = {
    x: number; y: number; hop: number; idle: number; lean: number; sx: number; turn: number; sq: number
    step: number; hat: number; arm: number; grab: number; tug: number; star: number
  }
  const mk = (k: K): C => ({
    x: HOME[k].x, y: HOME[k].y, hop: 0, idle: 0, lean: 0, sx: 1, turn: 0, sq: 0,
    step: 0, hat: 0, arm: 0, grab: 0, tug: 0, star: 0,
  })
  const chars: Record<K, C> = { boy: mk('boy'), girl: mk('girl') }
  const s = { shake: 0, puff: 0, open: 0, glow: 0, spin: 0, fade: 1 }

  let hint = $state('ふたりをタップして、よんでみてね')
  const called = $state<Record<K, boolean>>({ boy: false, girl: false })
  const arrived: Record<K, boolean> = { boy: false, girl: false }
  let phase: 'play' | 'pull' | 'drum' | 'open' = 'play'
  let revealed = false
  let svg: SVGSVGElement

  type Els = {
    outer: SVGGElement; inner: SVGGElement; shadow: SVGEllipseElement
    legL: SVGGElement; legR: SVGGElement; hat: SVGGElement | null
    armIn: SVGPathElement[]; armOut: SVGPathElement[]; handIn: SVGCircleElement; handOut: SVGCircleElement
    sparks: SVGGElement[]; tail: SVGPathElement[]
  }
  let els: Record<K, Els> | null = null
  let chestG: SVGGElement
  let lidG: SVGGElement
  let innerEl: SVGEllipseElement
  let ribbonG: SVGGElement
  let raysG: SVGGElement
  let beamEl: SVGPathElement
  let haloEl: SVGCircleElement

  function grabEls(k: K): Els {
    const g = (sel: string) => svg.querySelector(`[data-k="${k}"] ${sel}`)
    const all = (sel: string) => [...svg.querySelectorAll(`[data-k="${k}"] ${sel}`)] as SVGPathElement[]
    return {
      outer: svg.querySelector(`[data-k="${k}"]`) as SVGGElement,
      inner: g('.inner') as SVGGElement,
      shadow: g('.shadow') as SVGEllipseElement,
      legL: g('.legL') as SVGGElement,
      legR: g('.legR') as SVGGElement,
      hat: g('.hat') as SVGGElement | null,
      armIn: all('.armIn'),
      armOut: all('.armOut'),
      handIn: g('.handIn') as SVGCircleElement,
      handOut: g('.handOut') as SVGCircleElement,
      sparks: [...svg.querySelectorAll(`[data-k="${k}"] .spark`)] as SVGGElement[],
      tail: [...svg.querySelectorAll(`.tail-${k}`)] as SVGPathElement[],
    }
  }

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t

  function render() {
    if (!els || !chestG) return
    for (const k of KS) {
      const c = chars[k]
      const d = DIR[k]
      const e = els[k]
      const lift = c.hop + c.idle
      const ox = c.x - d * c.tug * 10 + s.shake * 0.4
      e.outer.setAttribute('transform', `translate(${ox} ${c.y})`)
      const sx = Math.cos(c.turn) * c.sx
      e.inner.setAttribute('transform', `translate(0 ${-lift}) rotate(${d * (c.lean - c.tug * 8)}) scale(${sx} ${1 - c.sq})`)
      const sh = Math.max(0.6, 1 - lift / 70)
      e.shadow.setAttribute('transform', `scale(${sh} 1)`)
      e.legL.setAttribute('transform', `rotate(${c.step} -8 -16)`)
      e.legR.setAttribute('transform', `rotate(${-c.step} 8 -16)`)
      e.hat?.setAttribute('transform', `rotate(${c.hat} 0 -82)`)
      // 箱側の手（リボンをつかむ）
      const hix = d * lerp(22, 29, c.grab)
      const hiy = -lerp(25, 40, c.grab)
      for (const p of e.armIn) p.setAttribute('d', `M${d * 15} -46 L${hix} ${hiy}`)
      e.handIn.setAttribute('cx', String(hix))
      e.handIn.setAttribute('cy', String(hiy))
      // 反対側の手（ぼうしを振る／くるっと回るとき広げる）
      const up = k === 'boy' ? { x: -d * 31, y: -90 } : { x: -d * 37, y: -64 }
      const hox = lerp(-d * 23, up.x, c.arm)
      const hoy = lerp(-25, up.y, c.arm)
      for (const p of e.armOut) p.setAttribute('d', `M${-d * 15} -46 L${hox} ${hoy}`)
      e.handOut.setAttribute('cx', String(hox))
      e.handOut.setAttribute('cy', String(hoy))
      // ティアラのきらきら
      e.sparks.forEach((sp, i) => {
        const pos = i ? { x: -24, y: -108 } : { x: 17, y: -111 }
        sp.setAttribute('transform', `translate(${pos.x} ${pos.y}) scale(${c.star * (i ? 0.8 : 1)}) rotate(${c.star * 70})`)
        sp.style.opacity = c.star > 0.02 ? '1' : '0'
      })
      // リボンの端
      const hwx = ox + hix
      const hwy = c.y + hiy - lift
      const ex = lerp(REST[k].x, hwx, c.grab)
      const ey = lerp(REST[k].y, hwy, c.grab)
      const sag = (1 - c.tug) * 18 + 3
      const dd = `M${KNOT.x} ${KNOT.y} Q${(KNOT.x + ex) / 2} ${(KNOT.y + ey) / 2 + sag} ${ex} ${ey}`
      e.tail.forEach((t) => {
        t.setAttribute('d', dd)
        t.style.opacity = String(s.fade)
      })
    }
    chestG.setAttribute(
      'transform',
      `translate(180 ${CHEST_Y}) rotate(${s.shake}) scale(${1 + s.puff * 0.05} ${1 - s.puff * 0.04}) translate(-180 ${-CHEST_Y})`,
    )
    lidG.setAttribute('transform', `translate(0 ${-s.open * 30}) rotate(${-s.open * 9} 180 ${LID_Y})`)
    innerEl.style.opacity = String(Math.min(1, s.open * 3))
    ribbonG.style.opacity = String(s.fade)
    raysG.setAttribute('transform', `rotate(${s.spin}) scale(${s.glow * 1.9})`)
    raysG.style.opacity = String(Math.min(1, s.glow * 1.6) * (1 - Math.max(0, s.glow - 0.85) * 5))
    beamEl.setAttribute('transform', `scale(1 ${s.glow})`)
    beamEl.style.opacity = String(Math.min(0.9, s.glow * 1.5))
    haloEl.setAttribute('transform', `scale(${s.glow * 1.6})`)
    haloEl.style.opacity = String(Math.min(0.85, s.glow * 1.4))
  }

  function tickSpin(_t: number, dt: number) {
    s.spin += dt * 0.03
  }

  // イベントハンドラ内で作るアニメーションも、アンマウント時にまとめて止めるための入れ物
  const ctx = gsap.context(() => {})

  function updateHint() {
    if (phase !== 'play') return
    if (called.boy && called.girl) hint = 'ふたりが走ってくるよ'
    else if (called.boy || called.girl) hint = 'もうひとりも、よんでみてね'
  }

  function call(k: K) {
    if (phase !== 'play' || called[k]) return
    called[k] = true
    api.tick()
    updateHint()
    ctx.add(() => run(k))
  }

  function callBoth() {
    if (phase !== 'play') return
    for (const k of KS) call(k)
  }

  function onKey(e: KeyboardEvent, k: K) {
    if (e.key !== 'Enter' && e.key !== ' ') return
    e.preventDefault()
    call(k)
  }

  function run(k: K) {
    const c = chars[k]
    const g = GOAL[k]
    gsap.killTweensOf(c, 'idle')
    c.idle = 0
    const tl = gsap.timeline({ onComplete: () => arrive(k) })
    if (api.reduced) {
      tl.to(c, { x: g.x, y: g.y, duration: 0.25, ease: 'power2.out' })
      return
    }
    if (k === 'boy') {
      // ぼうしを持ち上げて、ふりふり
      tl.to(c, { arm: 1, duration: 0.2, ease: 'back.out(2)' })
      tl.to(c, { hat: -16, duration: 0.12, yoyo: true, repeat: 5, ease: 'sine.inOut' })
      tl.to(c, { hat: 0, duration: 0.05 })
    } else {
      // ティアラがきらっ
      tl.to(c, { star: 1, duration: 0.35, ease: 'back.out(3)' })
      tl.add(() => api.burst((c.x + 4) / W, (c.y - 108) / H, { amount: 10, power: 0.45, colors: neutral }))
      tl.to({}, { duration: 0.25 })
    }
    tl.addLabel('run')
    tl.to(c, { x: g.x, y: g.y, duration: 1.5, ease: 'power1.inOut' }, 'run')
    tl.to(c, { hop: 18, duration: 0.19, yoyo: true, repeat: 7, ease: 'power2.out' }, 'run')
    tl.to(c, { step: 28, duration: 0.19, yoyo: true, repeat: 7, ease: 'sine.inOut' }, 'run')
    tl.to(c, { lean: 6, duration: 0.3 }, 'run')
    tl.to(c, { lean: 0, duration: 0.25 }, 'run+=1.3')
    if (k === 'boy') {
      tl.to(c, { arm: 0, duration: 0.3 }, 'run')
    } else {
      // くるっと2回転
      tl.to(c, { turn: Math.PI * 4, duration: 1.5, ease: 'power1.inOut' }, 'run')
      tl.to(c, { arm: 1, duration: 0.2 }, 'run')
      tl.to(c, { arm: 0, duration: 0.3 }, 'run+=1.2')
      tl.to(c, { star: 0, duration: 0.4 }, 'run+=1.1')
    }
    tl.to(c, { sq: 0.12, duration: 0.08, yoyo: true, repeat: 1 })
  }

  function arrive(k: K) {
    arrived[k] = true
    if (arrived.boy && arrived.girl) ctx.add(begin)
  }

  function begin() {
    if (phase !== 'play') return
    phase = 'pull'
    hint = 'せーので、リボンをひっぱるよ'
    const q = api.reduced ? 0.4 : 1
    const tl = gsap.timeline({ onComplete: drum })
    tl.to([chars.boy, chars.girl], { grab: 1, duration: 0.4 * q, ease: 'back.out(2)' })
    for (let i = 0; i < 2; i++) {
      tl.add(() => api.tick())
      tl.to([chars.boy, chars.girl], { tug: 1, duration: 0.3 * q, ease: 'power2.out' })
      if (i === 0) tl.to([chars.boy, chars.girl], { tug: 0.1, duration: 0.25 * q, ease: 'power1.inOut' })
    }
  }

  function drum() {
    ctx.add(drumBody)
  }

  function drumBody() {
    phase = 'drum'
    hint = 'どきどき…'
    const secs = api.config.drum
    api.drumroll(secs)
    if (secs <= 0) return open()
    const tl = gsap.timeline({ onComplete: open })
    if (!api.reduced) {
      // 箱がだんだん大きくゆれて、ふくらむ
      tl.to(s, { shake: 4, duration: 0.05, yoyo: true, repeat: Math.max(1, Math.floor(secs / 0.05)), ease: 'none' }, 0)
      tl.to(s, { puff: 1, duration: secs, ease: 'power2.in' }, 0)
    }
    tl.to({}, { duration: secs }, 0)
  }

  function open() {
    ctx.add(openBody)
  }

  function openBody() {
    if (phase === 'open') return
    phase = 'open'
    hint = ''
    s.shake = 0
    gsap.killTweensOf(s, 'shake')
    api.pop()
    const x = 180 / W
    const y = (LID_Y - 6) / H
    const tl = gsap.timeline()
    tl.to(s, { puff: 0, duration: 0.1 }, 0)
    tl.to(s, { open: 1, duration: api.reduced ? 0.15 : 0.55, ease: 'back.out(2)' }, 0)
    tl.to(s, { glow: 1, duration: api.reduced ? 0.2 : 0.9, ease: 'power2.out' }, 0.05)
    tl.to(s, { fade: 0, duration: 0.35 }, 0)
    tl.to([chars.boy, chars.girl], { tug: 0, grab: 0, duration: 0.3 }, 0)
    tl.add(() => {
      api.burst(x, y, { amount: 46, power: 1.1, colors: neutral })
      api.burst(x, y, { amount: 28, power: 0.75, colors: ['#ffffff', '#fff3b5', ...neutral] })
    }, 0.1)
    if (!api.reduced) {
      tl.to(chars.boy, { hop: 16, duration: 0.18, yoyo: true, repeat: 5, ease: 'power2.out' }, 0.15)
      tl.to(chars.girl, { hop: 16, duration: 0.18, yoyo: true, repeat: 5, ease: 'power2.out' }, 0.25)
      tl.add(() => api.burst(x, y + 0.04, { amount: 30, power: 0.7, colors: neutral }), 0.7)
    }
    tl.add(() => {
      if (revealed) return
      revealed = true
      api.reveal({ x: 0.5, y: 0.5 })
    }, api.reduced ? 0.6 : 1.5)
  }

  onMount(() => {
    els = { boy: grabEls('boy'), girl: grabEls('girl') }
    gsap.ticker.add(render)
    gsap.ticker.add(tickSpin)
    render()
    ctx.add(() => {
      if (api.reduced) return
      KS.forEach((k, i) => {
        gsap.to(chars[k], { idle: 5, duration: 0.55 + i * 0.12, delay: i * 0.3, ease: 'sine.inOut', yoyo: true, repeat: -1 })
      })
    })
    return () => {
      gsap.ticker.remove(render)
      gsap.ticker.remove(tickSpin)
      ctx.revert()
    }
  })
</script>

{#snippet person(k: K)}
  <g data-k={k}>
    <ellipse class="shadow" cx="0" cy="2" rx="25" ry="6" fill="#4a5a3a" opacity="0.18" />
    <g class="inner">
      {#if k === 'girl'}
        <!-- うしろ髪 -->
        <path d="M-26 -70 Q-28 -99 0 -98 Q28 -99 26 -70 Q27 -52 20 -47 L-20 -47 Q-27 -52 -26 -70 Z" fill="#8a604a" stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round" />
      {/if}
      <!-- あし -->
      <g class="legL">
        <rect x="-12" y="-17" width="8" height="15" rx="4" fill={skin} stroke="var(--ink)" stroke-width="2" />
        <ellipse cx="-9" cy="-1.5" rx="8" ry="4.2" fill={lavDeep} stroke="var(--ink)" stroke-width="2" />
      </g>
      <g class="legR">
        <rect x="4" y="-17" width="8" height="15" rx="4" fill={skin} stroke="var(--ink)" stroke-width="2" />
        <ellipse cx="9" cy="-1.5" rx="8" ry="4.2" fill={lavDeep} stroke="var(--ink)" stroke-width="2" />
      </g>
      <!-- からだ -->
      {#if k === 'boy'}
        <path d="M-17 -49 Q-19 -30 -16 -18 L16 -18 Q19 -30 17 -49 Q0 -55 -17 -49 Z" fill={mint} stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round" />
        <path d="M-16.4 -27 L16.4 -27 L17 -15 L2 -15 L0 -19 L-2 -15 L-17 -15 Z" fill={lav} stroke="var(--ink)" stroke-width="2.2" stroke-linejoin="round" />
        <circle cx="0" cy="-40" r="2.2" fill={cream} stroke="var(--ink)" stroke-width="1.2" />
        <circle cx="0" cy="-33" r="2.2" fill={cream} stroke="var(--ink)" stroke-width="1.2" />
      {:else}
        <path d="M-15 -51 Q0 -57 15 -51 L25 -14 Q0 -8 -25 -14 Z" fill={cream} stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round" />
        <path d="M-23.8 -19 Q0 -13 23.8 -19 L25 -14 Q0 -8 -25 -14 Z" fill={lav} stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
        <path d="M0 -44 C-10 -52 -13 -40 0 -43 C13 -40 10 -52 0 -44 Z" fill={mint} stroke="var(--ink)" stroke-width="1.8" stroke-linejoin="round" />
        <circle cx="-8" cy="-30" r="2" fill={mint} />
        <circle cx="9" cy="-26" r="2" fill={mint} />
        <circle cx="1" cy="-22" r="2" fill={lav} />
      {/if}
      <!-- うで（箱の側） -->
      <path class="armIn" d="M15 -46 L22 -25" stroke="var(--ink)" stroke-width="9.6" stroke-linecap="round" fill="none" />
      <path class="armIn" d="M15 -46 L22 -25" stroke={skin} stroke-width="5.6" stroke-linecap="round" fill="none" />
      <circle class="handIn" cx="22" cy="-25" r="4.6" fill={skin} stroke="var(--ink)" stroke-width="1.8" />
      <!-- うで（反対側） -->
      <path class="armOut" d="M-15 -46 L-23 -25" stroke="var(--ink)" stroke-width="9.6" stroke-linecap="round" fill="none" />
      <path class="armOut" d="M-15 -46 L-23 -25" stroke={skin} stroke-width="5.6" stroke-linecap="round" fill="none" />
      <circle class="handOut" cx="-23" cy="-25" r="4.6" fill={skin} stroke="var(--ink)" stroke-width="1.8" />
      <!-- あたま -->
      <circle cx="0" cy="-70" r="23" fill={skin} stroke="var(--ink)" stroke-width="2.6" />
      {#if k === 'boy'}
        <ellipse cx="-20" cy="-77" rx="4.5" ry="5.5" fill="#6e5443" stroke="var(--ink)" stroke-width="1.8" />
        <ellipse cx="20" cy="-77" rx="4.5" ry="5.5" fill="#6e5443" stroke="var(--ink)" stroke-width="1.8" />
        <path d="M-18 -75 Q-9 -68 0 -74 Q9 -68 18 -75 L18 -80 L-18 -80 Z" fill="#6e5443" stroke="var(--ink)" stroke-width="1.8" stroke-linejoin="round" />
      {:else}
        <path d="M-23 -73 Q-12 -91 3 -87 Q17 -85 23 -71 Q12 -80 0 -78 Q-12 -77 -23 -73 Z" fill="#8a604a" stroke="var(--ink)" stroke-width="2" stroke-linejoin="round" />
      {/if}
      <!-- かお -->
      <ellipse cx="-8.5" cy="-66" rx="2.7" ry="3.3" fill="var(--ink)" />
      <ellipse cx="8.5" cy="-66" rx="2.7" ry="3.3" fill="var(--ink)" />
      <circle cx="-7.6" cy="-67.2" r="0.95" fill="#fff" />
      <circle cx="9.4" cy="-67.2" r="0.95" fill="#fff" />
      <ellipse cx="-15" cy="-60" rx="4.4" ry="2.7" fill="#f9c9a8" opacity="0.85" />
      <ellipse cx="15" cy="-60" rx="4.4" ry="2.7" fill="#f9c9a8" opacity="0.85" />
      <path d="M-4.2 -59.5 Q0 -55 4.2 -59.5" stroke="var(--ink)" stroke-width="1.9" stroke-linecap="round" fill="none" />
      {#if k === 'boy'}
        <!-- ぼうし（黄色におほしさま） -->
        <g class="hat">
          <ellipse cx="0" cy="-82" rx="28" ry="6.6" fill="#f4cd4c" stroke="var(--ink)" stroke-width="2.4" />
          <path d="M-21 -83 Q-23 -109 0 -109 Q23 -109 21 -83 Q0 -77 -21 -83 Z" fill={yellow} stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round" />
          <path d="M-21.6 -88 Q0 -82 21.6 -88" stroke={lav} stroke-width="4.4" stroke-linecap="round" fill="none" />
          <path d={star(0, -98, 7.4, 3.3)} fill={cream} stroke="var(--ink)" stroke-width="1.5" stroke-linejoin="round" />
          <circle cx="0" cy="-110" r="4.4" fill={cream} stroke="var(--ink)" stroke-width="2" />
          <path d="M-14 -103 C-17 -98 -17 -94 -16 -91" stroke="#fff" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.7" />
        </g>
      {:else}
        <!-- ティアラ（ミントの小さな星）とリボン -->
        <g class="tiara">
          <path d="M-17 -89 L-14 -101 L-7 -94 L0 -106 L7 -94 L14 -101 L17 -89 Q0 -83 -17 -89 Z" fill="#e8def8" stroke="var(--ink)" stroke-width="2.2" stroke-linejoin="round" />
          <path d={star(0, -94.5, 6.2, 2.8)} fill={mint} stroke="var(--ink)" stroke-width="1.4" stroke-linejoin="round" />
          <circle cx="-14" cy="-101" r="2" fill={mint} stroke="var(--ink)" stroke-width="1.2" />
          <circle cx="14" cy="-101" r="2" fill={mint} stroke="var(--ink)" stroke-width="1.2" />
          <circle cx="0" cy="-106" r="2.2" fill={mint} stroke="var(--ink)" stroke-width="1.2" />
        </g>
        <path d="M-21 -88 C-33 -98 -35 -81 -21 -88 C-9 -95 -8 -81 -21 -88 Z" fill={mint} stroke="var(--ink)" stroke-width="1.9" stroke-linejoin="round" />
        <circle cx="-21" cy="-88" r="2.4" fill={mintDeep} stroke="var(--ink)" stroke-width="1.2" />
        <g class="spark" style="opacity:0"><path d={sparkle(9)} fill="#fff9d0" stroke="var(--ink)" stroke-width="1.4" stroke-linejoin="round" /></g>
        <g class="spark" style="opacity:0"><path d={sparkle(9)} fill="#fff9d0" stroke="var(--ink)" stroke-width="1.4" stroke-linejoin="round" /></g>
      {/if}
    </g>
    <circle
      class="hit"
      role="button"
      tabindex={called[k] ? -1 : 0}
      aria-label={k === 'boy' ? 'ぼうしの子をよぶ' : 'ティアラの子をよぶ'}
      aria-disabled={called[k]}
      onkeydown={(e) => onKey(e, k)}
      onpointerdown={() => call(k)}
      cx="0"
      cy="-52"
      r="46"
      fill="transparent"
    />
  </g>
{/snippet}

<div class="scene">
  <svg bind:this={svg} viewBox="0 0 {W} {H}" preserveAspectRatio="xMidYMid slice" role="group" aria-label="お花畑の丘と、ハートの宝箱">
    <defs>
      <clipPath id="pair-lid"><path d={LID} /></clipPath>
      <linearGradient id="pair-beam" x1="0" y1="1" x2="0" y2="0">
        <stop offset="0" stop-color="#fffbe0" stop-opacity="0.95" />
        <stop offset="1" stop-color="#fff3b0" stop-opacity="0" />
      </linearGradient>
      <radialGradient id="pair-halo">
        <stop offset="0" stop-color="#fffbe0" stop-opacity="0.95" />
        <stop offset="1" stop-color="#fff3b0" stop-opacity="0" />
      </radialGradient>
    </defs>

    <!-- お花畑の丘 -->
    <path d="M-20 458 C60 412 120 394 180 394 C240 394 300 412 380 458 V660 H-20 Z" fill="#d3e9b7" stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round" />
    <path d="M-20 522 C80 470 280 470 380 522 V660 H-20 Z" fill="#bddea0" stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round" />
    {#each flowers as f, i (i)}
      <g transform="translate({f.x} {f.y}) scale({f.s})">
        <path d="M0 0 V9" stroke="#7fae6a" stroke-width="1.8" stroke-linecap="round" />
        {#each [0, 72, 144, 216, 288] as a (a)}
          <circle cx="0" cy="-4.2" r="3.1" fill={f.c} stroke="var(--ink)" stroke-width="1" transform="rotate({a})" />
        {/each}
        <circle r="2.2" fill="#f4c95d" stroke="var(--ink)" stroke-width="0.9" />
      </g>
    {/each}

    <!-- あふれる光（箱のうしろ） -->
    <g transform="translate(180 {LID_Y})">
      <path bind:this={beamEl} d="M-48 0 L-120 -330 L120 -330 L48 0 Z" fill="url(#pair-beam)" style="opacity:0" />
      <g bind:this={raysG} style="opacity:0">
        {#each rays as a (a)}
          <path d="M0 0 L-10 -170 L10 -170 Z" fill="#fff3b0" opacity="0.8" transform="rotate({a})" />
        {/each}
      </g>
    </g>

    <!-- 宝箱 -->
    <ellipse cx="180" cy={CHEST_Y + 3} rx="76" ry="9" fill="#4a5a3a" opacity="0.2" />
    <g bind:this={chestG}>
      <rect x="122" y={LID_Y - 1} width="116" height="76" rx="7" fill="#ead0a0" stroke="var(--ink)" stroke-width="2.6" />
      <path d="M123 372 H237 M123 397 H237" stroke="var(--ink)" stroke-width="1.6" opacity="0.22" stroke-linecap="round" />
      {#each [132, 216] as bx (bx)}
        <rect x={bx} y={LID_Y - 1} width="12" height="76" fill={lav} stroke="var(--ink)" stroke-width="1.8" />
        <circle cx={bx + 6} cy={LID_Y + 12} r="2.2" fill={cream} stroke="var(--ink)" stroke-width="1" />
        <circle cx={bx + 6} cy={CHEST_Y - 12} r="2.2" fill={cream} stroke="var(--ink)" stroke-width="1" />
      {/each}
      <ellipse bind:this={innerEl} cx="180" cy={LID_Y} rx="55" ry="8" fill="#fff6c9" stroke="var(--ink)" stroke-width="2" style="opacity:0" />
      <!-- リボン（箱の正面で結んである） -->
      <g bind:this={ribbonG}>
        <rect x="171" y={LID_Y} width="18" height="75" fill={mint} stroke="var(--ink)" stroke-width="2" />
        <path d="M180 392 C160 372 144 384 150 400 C156 412 172 402 180 392 Z" fill={mint} stroke="var(--ink)" stroke-width="2.2" stroke-linejoin="round" />
        <path d="M180 392 C200 372 216 384 210 400 C204 412 188 402 180 392 Z" fill={mint} stroke="var(--ink)" stroke-width="2.2" stroke-linejoin="round" />
        <circle cx="180" cy="392" r="6.2" fill={mintDeep} stroke="var(--ink)" stroke-width="2" />
      </g>
      <!-- ふた -->
      <g bind:this={lidG}>
        <path d={LID} fill="#f3dcaa" stroke="var(--ink)" stroke-width="2.6" stroke-linejoin="round" />
        <g clip-path="url(#pair-lid)">
          <rect x="126" y="300" width="12" height="52" fill={lav} stroke="var(--ink)" stroke-width="1.8" />
          <rect x="222" y="300" width="12" height="52" fill={lav} stroke="var(--ink)" stroke-width="1.8" />
          <path d="M126 326 Q180 318 234 326" stroke="#fff" stroke-width="4" fill="none" opacity="0.5" stroke-linecap="round" />
        </g>
        <path d="M117 345 H243" stroke="var(--ink)" stroke-width="2.2" />
        <!-- ハートの飾り -->
        <path d="M180 345 C163 334 166 319 175 319 C178 319 180 322 180 324 C180 322 182 319 185 319 C194 319 197 334 180 345 Z" fill="#f6cf5e" stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round" />
        <ellipse cx="173.5" cy="324.5" rx="2.6" ry="1.7" fill="#fff" opacity="0.8" transform="rotate(-30 173.5 324.5)" />
      </g>
      <!-- ふたの上のきらめき -->
      <circle bind:this={haloEl} cx="180" cy={LID_Y} r="64" fill="url(#pair-halo)" style="opacity:0;pointer-events:none" />
    </g>

    <!-- リボンの端（ふたりが持つ） -->
    {#each KS as k (k)}
      <path class="tail-{k}" d="M180 392 L{REST[k].x} {REST[k].y}" stroke="var(--ink)" stroke-width="10" stroke-linecap="round" fill="none" />
      <path class="tail-{k}" d="M180 392 L{REST[k].x} {REST[k].y}" stroke={mint} stroke-width="5.6" stroke-linecap="round" fill="none" />
    {/each}

    {@render person('boy')}
    {@render person('girl')}
  </svg>

  <div class="hint" aria-live="polite">{#if hint}<span class="pill">{hint}</span>{/if}</div>
  {#if !(called.boy && called.girl)}
    <button class="call" type="button" onclick={callBoth}>ふたりをよぶ</button>
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
  /* 演出中のヒント。背景の上でも読めるように、紙色の下地（ピル）を敷く */
  .hint {
    position: absolute;
    left: 0;
    right: 0;
    top: 11cqh;
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
  .call {
    position: absolute;
    left: 50%;
    bottom: 4cqh;
    transform: translateX(-50%);
    padding: 1.2cqw 4.8cqw;
    min-height: 44px;
    border: 0.4cqw solid color-mix(in srgb, var(--ink) 35%, transparent);
    border-radius: 999px;
    background: color-mix(in srgb, var(--paper) 86%, transparent);
    font-family: var(--font);
    font-weight: 700;
    font-size: 4.2cqw;
    color: var(--ink);
    cursor: pointer;
    white-space: nowrap;
  }
  .call:focus-visible {
    outline: 0.7cqw dashed var(--ink);
    outline-offset: 0.8cqw;
  }
</style>
