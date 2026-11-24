<script lang="ts">
  import { onMount } from 'svelte'
  import gsap from 'gsap'

  let { palette, reduced = false }: { palette: string[]; reduced?: boolean } = $props()

  let c1: SVGGElement
  let c2: SVGGElement
  let c3: SVGGElement
  let bunting: SVGGElement

  // 旗飾り：ゆるい弧に沿って三角の旗を並べる
  const flags = Array.from({ length: 9 }, (_, i) => {
    const t = (i + 0.5) / 9
    const x = 6 + t * 348
    const y = 22 + Math.sin(t * Math.PI) * 34
    return { x, y, fill: palette[i % palette.length], rot: (t - 0.5) * 18 }
  })

  // 花：丘の前に点々と
  const flowers = [
    { x: 38, y: 598, r: 7, c: 0 },
    { x: 92, y: 612, r: 6, c: 1 },
    { x: 150, y: 604, r: 8, c: 3 },
    { x: 214, y: 618, r: 6, c: 2 },
    { x: 268, y: 600, r: 7, c: 4 },
    { x: 322, y: 612, r: 8, c: 0 },
  ]

  onMount(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      gsap.to(c1, { x: 40, duration: 38, ease: 'none', repeat: -1, yoyo: true })
      gsap.to(c2, { x: -50, duration: 46, ease: 'none', repeat: -1, yoyo: true })
      gsap.to(c3, { x: 30, duration: 52, ease: 'none', repeat: -1, yoyo: true })
      gsap.to(bunting, {
        rotation: 0.8,
        svgOrigin: '180 20',
        duration: 3.2,
        ease: 'sine.inOut',
        repeat: -1,
        yoyo: true,
      })
    })
    return () => ctx.revert()
  })
</script>

<!-- 紙の質感（ほぼ動かない層。別のSVGに分けて、アニメーションの再描画に巻き込まれないようにする） -->
<svg class="grain" viewBox="0 0 360 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <filter id="paper-grain">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
    <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.35  0 0 0 0 0.25  0 0 0 0.35 0" />
  </filter>
  <rect width="360" height="640" filter="url(#paper-grain)" opacity="0.5" />
</svg>

<svg class="bg" viewBox="0 0 360 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--sky1)" />
      <stop offset="1" stop-color="var(--sky2)" />
    </linearGradient>
    <symbol id="cloud" viewBox="0 0 100 44" overflow="visible">
      <path
        d="M10 38 C-2 38 -2 20 12 19 C12 4 34 -2 44 10 C52 -2 78 2 80 20 C98 18 104 38 88 38 Z"
        fill="var(--cloud)"
        stroke="var(--ink)"
        stroke-width="1.6"
        stroke-linejoin="round"
        opacity="0.95"
      />
    </symbol>
  </defs>

  <rect width="360" height="640" fill="url(#sky)" />

  <!-- 太陽（ぼんやり） -->
  <circle cx="300" cy="120" r="46" fill="#fff6d6" opacity="0.8" />
  <circle cx="300" cy="120" r="30" fill="#ffefb5" opacity="0.9" />

  <g bind:this={c1}><use href="#cloud" x="24" y="96" width="92" height="40" /></g>
  <g bind:this={c2}><use href="#cloud" x="210" y="180" width="110" height="48" /></g>
  <g bind:this={c3}><use href="#cloud" x="60" y="260" width="78" height="34" /></g>

  <!-- 丘 -->
  <path
    d="M0 520 C70 478 130 488 190 506 C250 524 310 478 360 490 L360 640 L0 640 Z"
    fill="var(--hill1)"
    stroke="var(--ink)"
    stroke-width="1.6"
    stroke-linejoin="round"
  />
  <path
    d="M0 572 C60 546 140 556 200 574 C260 592 320 560 360 566 L360 640 L0 640 Z"
    fill="var(--hill2)"
    stroke="var(--ink)"
    stroke-width="1.6"
    stroke-linejoin="round"
  />
  {#each flowers as f (f.x)}
    <g transform="translate({f.x} {f.y})">
      <path d="M0 0 V14" stroke="var(--ink)" stroke-width="1.4" stroke-linecap="round" />
      {#each [0, 72, 144, 216, 288] as a (a)}
        <ellipse
          cx="0"
          cy={-f.r * 0.9}
          rx={f.r * 0.55}
          ry={f.r * 0.8}
          fill={palette[f.c % palette.length]}
          stroke="var(--ink)"
          stroke-width="1"
          transform="rotate({a})"
        />
      {/each}
      <circle r={f.r * 0.45} fill="#fff3b0" stroke="var(--ink)" stroke-width="1" />
    </g>
  {/each}

  <!-- 旗飾り -->
  <g bind:this={bunting}>
    <path
      d="M0 18 Q180 78 360 18"
      fill="none"
      stroke="var(--ink)"
      stroke-width="1.6"
      stroke-linecap="round"
    />
    {#each flags as f (f.x)}
      <g transform="translate({f.x} {f.y}) rotate({f.rot})">
        <path
          d="M-14 0 L14 0 L0 30 Z"
          fill={f.fill}
          stroke="var(--ink)"
          stroke-width="1.4"
          stroke-linejoin="round"
        />
      </g>
    {/each}
  </g>
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
