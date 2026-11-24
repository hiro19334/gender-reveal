<script lang="ts">
  import { onMount } from 'svelte'
  import gsap from 'gsap'

  let { palette, reduced = false }: { palette: string[]; reduced?: boolean } = $props()

  let c1: SVGGElement
  let c2: SVGGElement
  let c3: SVGGElement
  let waveBack: SVGGElement
  let waveFront: SVGGElement
  let root: SVGSVGElement

  // 提灯：ゆるい弧に沿って吊るす
  const lamps = Array.from({ length: 6 }, (_, i) => {
    const t = (i + 0.5) / 6
    return { x: 8 + t * 344, y: 20 + Math.sin(t * Math.PI) * 38, fill: palette[i % palette.length], i }
  })

  // 舞い散る桜の花びら（位置は固定の擬似乱数。再描画でも動かない）
  const petals = Array.from({ length: 9 }, (_, i) => ({
    x: 20 + ((i * 97) % 320),
    y: 90 + ((i * 61) % 380),
    s: 0.7 + (i % 3) * 0.25,
    rot: (i * 47) % 360,
  }))

  onMount(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      gsap.to(c1, { x: 40, duration: 40, ease: 'none', repeat: -1, yoyo: true })
      gsap.to(c2, { x: -50, duration: 48, ease: 'none', repeat: -1, yoyo: true })
      gsap.to(c3, { x: 30, duration: 54, ease: 'none', repeat: -1, yoyo: true })
      // 青海波は1タイルぶん流して継ぎ目なくループ
      gsap.fromTo(waveBack, { x: 0 }, { x: -40, duration: 14, ease: 'none', repeat: -1 })
      gsap.fromTo(waveFront, { x: 0 }, { x: 40, duration: 10, ease: 'none', repeat: -1 })
      root.querySelectorAll<SVGGElement>('.lamp').forEach((el, i) => {
        gsap.fromTo(
          el,
          { rotation: -3.5 },
          { rotation: 3.5, svgOrigin: `${lamps[i].x} ${lamps[i].y}`, duration: 2.6 + (i % 3) * 0.5, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: i * 0.3 },
        )
      })
      root.querySelectorAll<SVGGElement>('.petal').forEach((el, i) => {
        gsap.to(el, { y: 70 + (i % 4) * 25, x: (i % 2 ? 1 : -1) * 22, rotation: '+=120', duration: 9 + (i % 5) * 2, ease: 'sine.inOut', repeat: -1, yoyo: true, delay: -i })
      })
    })
    return () => ctx.revert()
  })
</script>

<!-- 和紙の質感（繊維っぽい細かいノイズ。アニメーションの再描画に巻き込まれないよう別SVG） -->
<svg class="grain" viewBox="0 0 360 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <filter id="wa-grain">
    <feTurbulence type="fractalNoise" baseFrequency="0.55 0.9" numOctaves="3" seed="11" />
    <feColorMatrix values="0 0 0 0 0.35  0 0 0 0 0.28  0 0 0 0 0.2  0 0 0 0.4 0" />
  </filter>
  <rect width="360" height="640" filter="url(#wa-grain)" opacity="0.5" />
</svg>

<svg bind:this={root} class="bg" viewBox="0 0 360 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--sky1)" />
      <stop offset="1" stop-color="var(--sky2)" />
    </linearGradient>

    <!-- すやり霞：横に長い帯状の霞 -->
    <symbol id="cloud" viewBox="0 0 100 44" overflow="visible">
      <path
        d="M2 26 C10 18 22 20 30 16 C40 10 54 14 62 18 C74 20 90 16 98 24 C90 32 76 30 66 32 C54 36 40 32 30 34 C20 36 10 34 2 26 Z"
        fill="var(--cloud)"
        stroke="var(--ink)"
        stroke-width="1.2"
        stroke-linejoin="round"
        opacity="0.92"
      />
      <path d="M14 26 H40 M52 24 H84" stroke="var(--ink-soft)" stroke-width="0.8" stroke-linecap="round" opacity="0.5" />
    </symbol>

    <!-- 麻の葉（正方タイルで近似） -->
    <pattern id="asanoha" width="36" height="36" patternUnits="userSpaceOnUse">
      <g fill="none" stroke="var(--ink-soft)" stroke-width="0.7" stroke-linejoin="round">
        <path d="M18 0 L36 18 L18 36 L0 18 Z" />
        <path d="M0 0 L36 36 M36 0 L0 36 M18 0 V36 M0 18 H36" />
        <path d="M9 9 L27 9 L27 27 L9 27 Z" opacity="0.6" />
      </g>
    </pattern>

    <!-- 青海波：幅40・高さ20のタイル -->
    <pattern id="seigaiha" width="40" height="20" patternUnits="userSpaceOnUse">
      {#each [[20, 0], [0, 10], [40, 10], [20, 20]] as [cx, cy] (`${cx}-${cy}`)}
        <g>
          <circle {cx} {cy} r="20" fill="var(--hill2)" />
          <circle {cx} {cy} r="20" fill="none" stroke="#fbf5e6" stroke-width="1" opacity="0.8" />
          <circle {cx} {cy} r="14" fill="none" stroke="#fbf5e6" stroke-width="1" opacity="0.65" />
          <circle {cx} {cy} r="8" fill="none" stroke="#fbf5e6" stroke-width="1" opacity="0.5" />
        </g>
      {/each}
    </pattern>

    <!-- 桜の花びら -->
    <symbol id="petal" viewBox="-6 -6 12 12" overflow="visible">
      <path d="M0 5 C-6 2 -5 -4 -2 -5 L0 -3 L2 -5 C5 -4 6 2 0 5 Z" fill={palette[1]} stroke="var(--ink-soft)" stroke-width="0.6" stroke-linejoin="round" />
    </symbol>
  </defs>

  <rect width="360" height="640" fill="url(#sky)" />
  <rect width="360" height="400" fill="url(#asanoha)" opacity="0.1" />

  <!-- 日の丸のような朱の太陽 -->
  <circle cx="290" cy="150" r="46" fill="#e2674f" opacity="0.18" />
  <circle cx="290" cy="150" r="32" fill="#d9503a" opacity="0.9" />

  <g bind:this={c1}><use href="#cloud" x="18" y="110" width="110" height="48" /></g>
  <g bind:this={c2}><use href="#cloud" x="200" y="210" width="130" height="56" /></g>

  <!-- 遠山 -->
  <path
    d="M0 470 L40 420 L70 444 L116 392 L160 450 L210 424 L262 462 L310 418 L360 446 L360 560 L0 560 Z"
    fill="var(--hill1)"
    stroke="var(--ink)"
    stroke-width="1.4"
    stroke-linejoin="round"
    opacity="0.9"
  />
  <!-- 富士のような山（雪の冠つき） -->
  <path d="M60 548 L150 400 L162 400 L252 548 Z" fill="var(--hill2)" stroke="var(--ink)" stroke-width="1.4" stroke-linejoin="round" />
  <path d="M141 416 L150 400 L162 400 L171 416 L162 410 L156 418 L150 410 Z" fill="#fbf5e6" stroke="var(--ink)" stroke-width="1" stroke-linejoin="round" />
  <g bind:this={c3}><use href="#cloud" x="70" y="448" width="150" height="58" /></g>

  <!-- 波（奥と手前を逆向きに流す） -->
  <g>
    <rect x="0" y="536" width="360" height="104" fill="var(--hill2)" />
    <g bind:this={waveBack} opacity="0.75">
      <rect x="-40" y="536" width="480" height="104" fill="url(#seigaiha)" />
    </g>
    <path d="M0 536 H360" stroke="var(--ink)" stroke-width="1.2" />
  </g>
  <g>
    <rect x="0" y="588" width="360" height="52" fill="var(--hill2)" />
    <g bind:this={waveFront}>
      <rect x="-80" y="588" width="520" height="52" fill="url(#seigaiha)" />
    </g>
    <path d="M0 588 H360" stroke="var(--ink)" stroke-width="1.2" />
  </g>

  <!-- 桜の花びら -->
  {#each petals as p, i (i)}
    <g class="petal" opacity="0.75">
      <use href="#petal" x={p.x} y={p.y} width={12 * p.s} height={12 * p.s} transform="rotate({p.rot} {p.x} {p.y})" />
    </g>
  {/each}

  <!-- 提灯 -->
  <path d="M0 16 Q180 78 360 16" fill="none" stroke="var(--ink)" stroke-width="1.5" stroke-linecap="round" />
  {#each lamps as l (l.i)}
    <g class="lamp">
      <g transform="translate({l.x} {l.y})">
        <path d="M0 0 V6" stroke="var(--ink)" stroke-width="1.4" />
        <rect x="-7" y="5" width="14" height="4" rx="1" fill="var(--ink)" />
        <path d="M-7 9 C-18 16 -18 34 -7 42 H7 C18 34 18 16 7 9 Z" fill={l.fill} stroke="var(--ink)" stroke-width="1.4" stroke-linejoin="round" />
        <path d="M-12 18 H12 M-14 25 H14 M-12 32 H12" stroke="var(--ink)" stroke-width="0.9" opacity="0.55" />
        <rect x="-7" y="41" width="14" height="4" rx="1" fill="var(--ink)" />
        <path d="M-3 45 V54 M0 45 V56 M3 45 V54" stroke="var(--ink)" stroke-width="1" stroke-linecap="round" />
      </g>
    </g>
  {/each}
</svg>

<style>
  .bg,
  .grain {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
  }
  .grain {
    z-index: 1;
    pointer-events: none;
    mix-blend-mode: multiply;
  }
</style>
