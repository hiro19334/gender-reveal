<script lang="ts">
  // おくるみにくるまれた赤ちゃん（やさしい水彩）。男女どちらでもない絵にして、おくるみを答えの色にする
  let { color, color2 = null, twins = false }: { color: string; color2?: string | null; twins?: boolean } = $props()
</script>

<!-- 赤ちゃん1人分（おくるみ・耳・頭・顔・おて）。c2 があればおくるみを2色に分ける -->
{#snippet figure(c1: string, c2: string | null = null)}
  <g>
    <!-- おくるみ -->
    <g clip-path="url(#baby-blanket-clip)">
      <rect x="20" y="84" width="170" height="120" fill={c1} />
      {#if c2}
        <rect x="100" y="84" width="90" height="120" fill={c2} />
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

    <!-- 耳（内側ほんのりピンク） -->
    <circle cx="46" cy="88" r="9" fill="#ffddc4" stroke="var(--ink)" stroke-width="2.8" />
    <circle cx="154" cy="88" r="9" fill="#ffddc4" stroke="var(--ink)" stroke-width="2.8" />
    <circle cx="46" cy="89" r="4" fill="#ffb7a8" opacity="0.8" />
    <circle cx="154" cy="89" r="4" fill="#ffb7a8" opacity="0.8" />

    <!-- 頭（ぷっくり大きく） -->
    <ellipse cx="100" cy="80" rx="56" ry="49" fill="#ffe6d2" stroke="var(--ink)" stroke-width="3.2" />
    <!-- おでこのつや -->
    <path d="M62 56 C70 44 84 40 94 41" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity="0.7" />

    <!-- 髪：ちょこんとひと房、くるん -->
    <path d="M97 34 C88 18 108 8 117 21 C123 30 112 37 107 30 C104 26 108 22 111 24" fill="none" stroke="var(--ink)" stroke-width="3.2" />
    <path d="M76 40 C72 32 81 27 87 33" fill="none" stroke="var(--ink)" stroke-width="2.6" />

    <!-- ほっぺ：まあるく、ふんわり -->
    <ellipse cx="62" cy="101" rx="15" ry="11" fill="url(#baby-cheek)" />
    <ellipse cx="138" cy="101" rx="15" ry="11" fill="url(#baby-cheek)" />
    <!-- ほっぺの色えんぴつ線 -->
    <g stroke="#ff8f86" stroke-width="1.6" stroke-linecap="round" opacity="0.7">
      <path d="M55 99 l3 -3 M60 101 l3 -3 M65 103 l3 -3" />
      <path d="M131 103 l3 -3 M136 101 l3 -3 M141 99 l3 -3" />
    </g>

    <!-- 目：まんまる、きらきら（顔の低めに置くと幼く見える） -->
    <ellipse cx="78" cy="93" rx="8.2" ry="10" fill="var(--ink)" />
    <ellipse cx="122" cy="93" rx="8.2" ry="10" fill="var(--ink)" />
    <circle cx="81" cy="89" r="3.4" fill="#fff" />
    <circle cx="125" cy="89" r="3.4" fill="#fff" />
    <circle cx="75" cy="97" r="1.7" fill="#fff" />
    <circle cx="119" cy="97" r="1.7" fill="#fff" />
    <!-- 眉は、ちょん -->
    <path d="M70 76 q6 -4 12 -1 M118 75 q6 -3 12 1" fill="none" stroke="var(--ink)" stroke-width="2" stroke-linecap="round" opacity="0.55" />

    <!-- 鼻（ちょん）と口（にっこり小さく） -->
    <ellipse cx="100" cy="100" rx="2.6" ry="1.9" fill="#f2a58f" stroke="var(--ink)" stroke-width="1.4" />
    <path d="M91 106 Q95.5 112 100 106 Q104.5 112 109 106" fill="none" stroke="var(--ink)" stroke-width="2.6" />

    <!-- ちいさなおててで、おくるみをぎゅっ -->
    <circle cx="62" cy="136" r="10" fill="#ffe6d2" stroke="var(--ink)" stroke-width="2.8" />
    <circle cx="138" cy="136" r="10" fill="#ffe6d2" stroke="var(--ink)" stroke-width="2.8" />
    <path d="M58 133 q1.6 -3 4 -1.4 M134 133 q1.6 -3 4 -1.4 M62 131 q1.4 -3 4 -1.4" fill="none" stroke="var(--ink)" stroke-width="1.6" opacity="0.55" />
  </g>
{/snippet}

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

    {#if twins}
      <!-- ふたご：小さめの赤ちゃんを2人、少し重ねて並べる -->
      <g transform="translate(-4 38) scale(0.64)">{@render figure(color)}</g>
      <g transform="translate(78 38) scale(0.64)">{@render figure(color2 ?? color)}</g>
    {:else}
      {@render figure(color, color2)}
    {/if}

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
