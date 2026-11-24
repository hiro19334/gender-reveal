<script lang="ts">
  // おくるみにくるまれた赤ちゃん（やさしい水彩）。男女どちらでもない絵にして、おくるみを答えの色にする
  let { color, color2 = null }: { color: string; color2?: string | null } = $props()
</script>

<svg viewBox="0 0 200 200" class="baby" aria-hidden="true">
  <defs>
    <!-- 手描きのゆらぎ（線が少しゆがむ）＋ クレヨンのかすれ（塗りに細かい抜け） -->
    <filter id="baby-sketch" x="-4%" y="-4%" width="108%" height="108%">
      <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="4" result="warp" />
      <feDisplacementMap in="SourceGraphic" in2="warp" scale="3.4" xChannelSelector="R" yChannelSelector="G" result="wobbly" />
      <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="1" seed="9" result="grain" />
      <feColorMatrix in="grain" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 -1.3 1.6" result="holes" />
      <feComposite in="wobbly" in2="holes" operator="in" />
    </filter>
    <radialGradient id="baby-cheek">
      <stop offset="0" stop-color="#ff8f86" stop-opacity="0.95" />
      <stop offset="1" stop-color="#ff8f86" stop-opacity="0" />
    </radialGradient>
    <clipPath id="baby-blanket-clip">
      <path d="M40 120 C40 98 66 90 100 90 C134 90 160 98 160 120 L170 174 C171 188 158 192 146 192 L54 192 C42 192 29 188 30 174 Z" />
    </clipPath>
  </defs>

  <g filter="url(#baby-sketch)" stroke-linejoin="round" stroke-linecap="round">
    <!-- 台紙：クリーム色の丸に、点線のぬい目 -->
    <circle cx="100" cy="108" r="97" fill="#fff6df" stroke="var(--ink)" stroke-width="3" />
    <circle cx="100" cy="108" r="89" fill="none" stroke="var(--ink)" stroke-width="1.6" stroke-dasharray="2 7" opacity="0.55" />

    <!-- おくるみ -->
    <g clip-path="url(#baby-blanket-clip)">
      <rect x="20" y="84" width="170" height="120" fill={color} />
      {#if color2}
        <rect x="100" y="84" width="90" height="120" fill={color2} />
      {/if}
      <!-- 星と水玉 -->
      {#each [[56, 152], [92, 170], [134, 150], [150, 176], [70, 182], [116, 184]] as [x, y], i (x)}
        {#if i % 2 === 0}
          <circle cx={x} cy={y} r="4.6" fill="#fff" opacity="0.7" />
        {:else}
          <path d="M{x} {y - 7} l2.2 4.8 5 1 -3.8 3.4 1 5.2 -4.4 -2.6 -4.4 2.6 1 -5.2 -3.8 -3.4 5 -1z" fill="#fff" opacity="0.75" />
        {/if}
      {/each}
      <!-- 折り返し -->
      <path d="M32 124 C70 142 130 142 168 124 L172 146 C130 164 70 164 28 146 Z" fill="#fff" opacity="0.38" />
      <!-- 色鉛筆の影（右下にななめの線） -->
      <g stroke="var(--ink)" stroke-width="1.5" opacity="0.28">
        <path d="M138 160 l9 -11" />
        <path d="M145 170 l11 -13" />
        <path d="M134 178 l12 -14" />
        <path d="M150 182 l9 -10" />
      </g>
    </g>
    <path
      d="M40 120 C40 98 66 90 100 90 C134 90 160 98 160 120 L170 174 C171 188 158 192 146 192 L54 192 C42 192 29 188 30 174 Z"
      fill="none"
      stroke="var(--ink)"
      stroke-width="3"
    />
    <path d="M35 128 C72 146 128 146 165 128" fill="none" stroke="var(--ink)" stroke-width="2.4" />

    <!-- 耳 -->
    <circle cx="53" cy="84" r="8" fill="#ffddc4" stroke="var(--ink)" stroke-width="2.8" />
    <circle cx="147" cy="84" r="8" fill="#ffddc4" stroke="var(--ink)" stroke-width="2.8" />

    <!-- 頭（大きめ） -->
    <ellipse cx="100" cy="78" rx="48" ry="43" fill="#ffe3cc" stroke="var(--ink)" stroke-width="3.2" />

    <!-- 髪：ちょこんと、くるん -->
    <path d="M93 36 C85 22 103 12 111 23 C117 31 107 37 103 31" fill="none" stroke="var(--ink)" stroke-width="3.2" />
    <path d="M76 44 C70 35 80 29 86 36" fill="none" stroke="var(--ink)" stroke-width="2.8" />
    <path d="M119 39 C125 31 135 37 128 45" fill="none" stroke="var(--ink)" stroke-width="2.8" />

    <!-- ほっぺ -->
    <circle cx="68" cy="93" r="13" fill="url(#baby-cheek)" />
    <circle cx="132" cy="93" r="13" fill="url(#baby-cheek)" />

    <!-- 目：にっこり閉じた目 -->
    <path d="M73 81 Q82 70 91 81" fill="none" stroke="var(--ink)" stroke-width="3.6" />
    <path d="M109 81 Q118 70 127 81" fill="none" stroke="var(--ink)" stroke-width="3.6" />

    <!-- 鼻と口 -->
    <path d="M97.5 89 Q100 92 102.5 89" fill="none" stroke="var(--ink)" stroke-width="2.4" />
    <path d="M90 97 Q100 110 110 97 Q100 101 90 97 Z" fill="#e8767a" stroke="var(--ink)" stroke-width="2.6" />

    <!-- ちいさなおててで、おくるみをぎゅっ -->
    <circle cx="60" cy="130" r="11" fill="#ffe3cc" stroke="var(--ink)" stroke-width="2.8" />
    <circle cx="140" cy="130" r="11" fill="#ffe3cc" stroke="var(--ink)" stroke-width="2.8" />
    <path d="M55 126 q2 -3 5 -1 M135 126 q2 -3 5 -1" fill="none" stroke="var(--ink)" stroke-width="1.8" opacity="0.6" />

    <!-- きらきら -->
    <path d="M28 44 l3.2 8.4 8.4 3.2 -8.4 3.2 -3.2 8.4 -3.2 -8.4 -8.4 -3.2 8.4 -3.2z" fill="#ffe38a" stroke="var(--ink)" stroke-width="1.8" />
    <path d="M172 30 l2.6 6.6 6.6 2.6 -6.6 2.6 -2.6 6.6 -2.6 -6.6 -6.6 -2.6 6.6 -2.6z" fill="#ffe38a" stroke="var(--ink)" stroke-width="1.6" />
    <circle cx="176" cy="150" r="3" fill="#ffe38a" stroke="var(--ink)" stroke-width="1.4" />
  </g>
</svg>

<style>
  .baby {
    width: 100%;
    height: 100%;
    display: block;
    overflow: visible;
  }
</style>
