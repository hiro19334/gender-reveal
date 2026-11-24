<script lang="ts">
  import { onMount } from 'svelte'
  import gsap from 'gsap'

  let { palette, reduced = false }: { palette: string[]; reduced?: boolean } = $props()

  let c1: SVGGElement
  let c2: SVGGElement
  let bunting: SVGGElement
  let stars: SVGGElement

  // 旗飾り：ゆるい弧に沿って三角の旗を並べる
  const flags = Array.from({ length: 8 }, (_, i) => {
    const t = (i + 0.5) / 8
    return { x: 8 + t * 344, y: 20 + Math.sin(t * Math.PI) * 30, fill: palette[i % palette.length], rot: (t - 0.5) * 16 }
  })

  // 飾りの星（位置と大きさ、色の番号）
  const deco = [
    { x: 40, y: 150, s: 11, c: 1 },
    { x: 332, y: 226, s: 14, c: 0 },
    { x: 300, y: 300, s: 10, c: 3 },
    { x: 28, y: 372, s: 13, c: 5 },
    { x: 330, y: 452, s: 11, c: 2 },
    { x: 60, y: 508, s: 9, c: 4 },
  ]
  // 飾りの丸（塗り・輪っか）
  const dots = [
    { x: 100, y: 210, r: 9, c: 3, ring: false },
    { x: 236, y: 196, r: 12, c: 2, ring: true },
    { x: 330, y: 380, r: 8, c: 0, ring: false },
    { x: 34, y: 276, r: 10, c: 4, ring: true },
    { x: 180, y: 420, r: 7, c: 5, ring: false },
    { x: 296, y: 520, r: 10, c: 1, ring: true },
  ]
  const starPath = (s: number) => {
    const pts: string[] = []
    for (let i = 0; i < 10; i++) {
      const r = i % 2 === 0 ? s : s * 0.45
      const a = (Math.PI / 5) * i - Math.PI / 2
      pts.push(`${(Math.cos(a) * r).toFixed(1)} ${(Math.sin(a) * r).toFixed(1)}`)
    }
    return `M${pts.join(' L')} Z`
  }

  onMount(() => {
    if (reduced) return
    const ctx = gsap.context(() => {
      gsap.to(c1, { x: 36, duration: 30, ease: 'none', repeat: -1, yoyo: true })
      gsap.to(c2, { x: -40, duration: 36, ease: 'none', repeat: -1, yoyo: true })
      gsap.to(bunting, { rotation: 1, svgOrigin: '180 20', duration: 2.4, ease: 'sine.inOut', repeat: -1, yoyo: true })
      gsap.to(stars, { rotation: 6, svgOrigin: '180 320', duration: 5, ease: 'sine.inOut', repeat: -1, yoyo: true })
    })
    return () => ctx.revert()
  })
</script>

<svg class="bg" viewBox="0 0 360 640" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
  <defs>
    <linearGradient id="pop-sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="var(--sky1)" stop-opacity="0.55" />
      <stop offset="1" stop-color="var(--sky2)" stop-opacity="0.2" />
    </linearGradient>
    <pattern id="pop-stripe" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
      <rect width="26" height="13" fill="#ffd23f" opacity="0.2" />
    </pattern>
    <pattern id="pop-dots" width="22" height="22" patternUnits="userSpaceOnUse">
      <circle cx="5" cy="5" r="2.6" fill="#ff5d73" opacity="0.28" />
      <circle cx="16" cy="16" r="2.6" fill="#4d96ff" opacity="0.28" />
    </pattern>
    <symbol id="cloud" viewBox="0 0 100 44" overflow="visible">
      <path
        d="M10 38 C-2 38 -2 20 12 19 C12 4 34 -2 44 10 C52 -2 78 2 80 20 C98 18 104 38 88 38 Z"
        fill="var(--cloud)"
        stroke="var(--ink)"
        stroke-width="3"
        stroke-linejoin="round"
      />
    </symbol>
  </defs>

  <rect width="360" height="640" fill="var(--paper)" />
  <rect width="360" height="640" fill="url(#pop-sky)" />
  <rect width="360" height="640" fill="url(#pop-stripe)" />
  <rect width="360" height="640" fill="url(#pop-dots)" />

  <!-- 太陽（太い線の丸） -->
  <circle cx="294" cy="142" r="34" fill="#ffd23f" stroke="var(--ink)" stroke-width="3" />
  <circle cx="294" cy="142" r="18" fill="#ff9f43" stroke="var(--ink)" stroke-width="3" />

  <g bind:this={c1}><use href="#cloud" x="22" y="96" width="92" height="40" /></g>
  <g bind:this={c2}><use href="#cloud" x="196" y="236" width="104" height="46" /></g>

  <!-- 飾りの星と丸 -->
  <g bind:this={stars}>
    {#each deco as d (d.x)}
      <g transform="translate({d.x} {d.y})">
        <path d={starPath(d.s)} fill={palette[d.c % palette.length]} stroke="var(--ink)" stroke-width="2.4" stroke-linejoin="round" />
      </g>
    {/each}
    {#each dots as d (d.x)}
      <circle
        cx={d.x}
        cy={d.y}
        r={d.r}
        fill={d.ring ? 'none' : palette[d.c % palette.length]}
        stroke={d.ring ? palette[d.c % palette.length] : 'var(--ink)'}
        stroke-width={d.ring ? 4 : 2.4}
      />
    {/each}
  </g>

  <!-- 下のジグザグ帯 -->
  <path
    d="M0 560 L30 536 L60 560 L90 536 L120 560 L150 536 L180 560 L210 536 L240 560 L270 536 L300 560 L330 536 L360 560 L360 640 L0 640 Z"
    fill="var(--hill2)"
    stroke="var(--ink)"
    stroke-width="3"
    stroke-linejoin="round"
  />
  <path d="M0 600 Q45 576 90 600 T180 600 T270 600 T360 600 L360 640 L0 640 Z" fill="var(--hill1)" stroke="var(--ink)" stroke-width="3" />

  <!-- 旗飾り -->
  <g bind:this={bunting}>
    <path d="M0 16 Q180 70 360 16" fill="none" stroke="var(--ink)" stroke-width="3" stroke-linecap="round" />
    {#each flags as f (f.x)}
      <g transform="translate({f.x} {f.y}) rotate({f.rot})">
        <path d="M-15 0 L15 0 L0 32 Z" fill={f.fill} stroke="var(--ink)" stroke-width="2.6" stroke-linejoin="round" />
      </g>
    {/each}
  </g>
</svg>

<style>
  .bg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    display: block;
  }
</style>
