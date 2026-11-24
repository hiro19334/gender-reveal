<script lang="ts">
  // 絵本の挿絵。クリーム紙・茶色の線・淡い色で、答えの色は連想させない
  // 差し色は、答えの色を連想させない淡い4色に固定する（テーマによらず同じ）
  let { id, accent = ['#f9d3a8', '#bfe3c8', '#cdbfe8', '#fbe3a1'] }: { id: string; accent?: string[] } = $props()
  const uid = `pbart-${Math.random().toString(36).slice(2, 8)}`
  const a = (i: number) => accent[i % accent.length]
  const cream = '#fffdf7'
  const skin = '#fde3cc'
</script>

<svg viewBox="0 0 240 200" class="art" role="img" aria-label="挿絵" preserveAspectRatio="xMidYMid meet">
  <defs>
    <!-- 手描きのゆらぎ（線が少しゆがむ） -->
    <filter id={uid} x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="w" />
      <feDisplacementMap in="SourceGraphic" in2="w" scale="3" xChannelSelector="R" yChannelSelector="G" />
    </filter>
  </defs>
  <g
    filter="url(#{uid})"
    stroke="var(--ink, #6a5648)"
    stroke-width="2.6"
    stroke-linejoin="round"
    stroke-linecap="round"
    fill="none"
  >
    {#if id === 'meet'}
      <!-- ふたりの出会い -->
      <ellipse cx="120" cy="184" rx="100" ry="8" fill={a(1)} opacity="0.5" stroke="none" />
      <!-- ひとり目 -->
      <path d="M52 182 C50 146 58 120 78 120 C98 120 106 146 104 182 Z" fill={a(3)} />
      <circle cx="78" cy="98" r="20" fill={skin} />
      <path d="M58 94 C58 74 98 74 98 94 C90 86 70 86 58 94 Z" fill="#8a6a55" />
      <circle cx="72" cy="100" r="1.8" fill="var(--ink, #6a5648)" stroke="none" />
      <circle cx="85" cy="100" r="1.8" fill="var(--ink, #6a5648)" stroke="none" />
      <path d="M74 108 Q78 112 82 108" />
      <!-- ふたり目 -->
      <path d="M136 182 C132 146 142 120 164 120 C186 120 194 146 190 182 Z" fill={a(2)} />
      <circle cx="164" cy="98" r="20" fill={skin} />
      <path d="M143 98 C140 72 188 72 185 98 C186 112 182 120 180 124 C186 100 170 84 160 86 C152 90 146 96 146 118 C143 114 143 106 143 98 Z" fill="#a98467" />
      <circle cx="158" cy="100" r="1.8" fill="var(--ink, #6a5648)" stroke="none" />
      <circle cx="171" cy="100" r="1.8" fill="var(--ink, #6a5648)" stroke="none" />
      <path d="M160 108 Q164 112 168 108" />
      <ellipse cx="153" cy="106" rx="4" ry="2.6" fill="#ffb3a8" opacity="0.6" stroke="none" />
      <ellipse cx="177" cy="106" rx="4" ry="2.6" fill="#ffb3a8" opacity="0.6" stroke="none" />
      <!-- ハート -->
      <path d="M121 70 C106 56 108 42 120 46 C132 42 134 56 121 70 Z" fill="#f6b5ab" />
      <path d="M96 40 C90 34 91 28 96 30 C101 28 102 34 96 40 Z" fill={a(0)} stroke-width="2" />
      <path d="M148 34 C142 28 143 22 148 24 C153 22 154 28 148 34 Z" fill={a(3)} stroke-width="2" />
    {:else if id === 'belly'}
      <!-- おなかの赤ちゃん -->
      <ellipse cx="120" cy="186" rx="86" ry="8" fill={a(1)} opacity="0.5" stroke="none" />
      <path d="M74 186 C70 150 76 116 100 112 L140 112 C164 116 172 150 166 186 Z" fill={a(1)} />
      <circle cx="120" cy="78" r="24" fill={skin} />
      <path d="M95 80 C90 50 150 50 145 80 C140 66 126 60 118 62 C106 62 98 68 95 80 Z" fill="#8a6a55" />
      <circle cx="111" cy="82" r="1.8" fill="var(--ink, #6a5648)" stroke="none" />
      <circle cx="129" cy="82" r="1.8" fill="var(--ink, #6a5648)" stroke="none" />
      <path d="M114 91 Q120 96 126 91" />
      <ellipse cx="104" cy="90" rx="4.5" ry="3" fill="#ffb3a8" opacity="0.6" stroke="none" />
      <ellipse cx="136" cy="90" rx="4.5" ry="3" fill="#ffb3a8" opacity="0.6" stroke="none" />
      <!-- おなか -->
      <circle cx="120" cy="150" r="30" fill={a(3)} />
      <path d="M120 162 C106 150 108 138 120 142 C132 138 134 150 120 162 Z" fill="#f6b5ab" stroke-width="2.2" />
      <!-- 手 -->
      <path d="M92 124 C88 142 94 156 104 164" stroke-width="3" />
      <path d="M148 124 C152 142 146 156 136 164" stroke-width="3" />
      <path d="M52 60 l4 -9 l4 9 l9 4 l-9 4 l-4 9 l-4 -9 l-9 -4 Z" fill={a(3)} stroke-width="2" />
      <path d="M184 44 l3 -7 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 Z" fill={a(2)} stroke-width="2" />
    {:else if id === 'echo'}
      <!-- エコー -->
      <rect x="34" y="22" width="172" height="136" rx="14" fill="#7c6a5e" />
      <rect x="44" y="32" width="152" height="116" rx="8" fill="#3f352f" stroke-width="2" />
      <path d="M120 34 L66 146 L174 146 Z" fill="#6f625a" stroke="none" opacity="0.8" />
      <path d="M120 34 L66 146 M120 34 L174 146" stroke="#d9cdbd" stroke-width="1.6" stroke-dasharray="3 5" />
      <!-- 赤ちゃん（まるまった姿） -->
      <path d="M96 118 C84 96 98 72 124 74 C150 76 154 104 138 118 C128 126 108 128 96 118 Z" fill="#e9dcc8" stroke="#fffdf7" stroke-width="2.2" />
      <circle cx="132" cy="90" r="14" fill="#efe3d0" stroke="#fffdf7" stroke-width="2.2" />
      <path d="M142 96 q4 4 0 8" stroke="#fffdf7" stroke-width="1.8" />
      <path d="M96 118 q-10 8 -4 16 q6 4 12 -4" stroke="#fffdf7" stroke-width="2.2" fill="#e9dcc8" />
      <circle cx="82" cy="46" r="2.2" fill="#fffdf7" stroke="none" />
      <text x="176" y="46" font-size="10" fill="#d9cdbd" stroke="none" text-anchor="end" font-family="monospace">♡ 12w</text>
      <circle cx="120" cy="182" r="9" fill={a(0)} />
      <circle cx="84" cy="182" r="6" fill={a(3)} />
      <circle cx="156" cy="182" r="6" fill={a(1)} />
    {:else if id === 'family'}
      <!-- 待ち遠しい家族（ちいさなイスをあけて待っている） -->
      <ellipse cx="120" cy="186" rx="100" ry="8" fill={a(1)} opacity="0.5" stroke="none" />
      <path d="M30 186 C28 150 36 126 56 126 C76 126 84 150 82 186 Z" fill={a(0)} />
      <circle cx="56" cy="104" r="19" fill={skin} />
      <path d="M37 100 C36 78 76 78 75 100 C68 90 48 90 37 100 Z" fill="#8a6a55" />
      <circle cx="50" cy="106" r="1.8" fill="var(--ink, #6a5648)" stroke="none" />
      <circle cx="63" cy="106" r="1.8" fill="var(--ink, #6a5648)" stroke="none" />
      <path d="M52 114 Q56 118 60 114" />
      <path d="M158 186 C156 150 164 126 184 126 C204 126 212 150 210 186 Z" fill={a(2)} />
      <circle cx="184" cy="104" r="19" fill={skin} />
      <path d="M164 106 C160 78 208 78 204 106 C205 118 202 124 200 128 C206 104 190 90 180 92 C172 96 166 100 166 124 C163 120 164 112 164 106 Z" fill="#a98467" />
      <circle cx="178" cy="106" r="1.8" fill="var(--ink, #6a5648)" stroke="none" />
      <circle cx="191" cy="106" r="1.8" fill="var(--ink, #6a5648)" stroke="none" />
      <path d="M180 114 Q184 118 188 114" />
      <!-- 手をつなぐ先に、あけてある小さなスペース -->
      <path d="M82 150 C94 146 108 150 114 154" stroke-width="3" />
      <path d="M158 150 C146 146 132 150 126 154" stroke-width="3" />
      <rect x="104" y="148" width="32" height="38" rx="6" fill="none" stroke-dasharray="4 6" />
      <path d="M120 176 C108 166 110 156 120 160 C130 156 132 166 120 176 Z" fill="#f6b5ab" stroke-width="2" />
      <path d="M118 52 l5 -11 l5 11 l11 5 l-11 5 l-5 11 l-5 -11 l-11 -5 Z" fill={a(3)} stroke-width="2.2" />
    {:else if id === 'clothes'}
      <!-- ベビー服 -->
      <path d="M20 40 C80 56 160 56 220 40" stroke-width="2" />
      <path d="M52 44 l-4 -12 M170 46 l4 -12" stroke-width="2" />
      <!-- ロンパース -->
      <path d="M72 52 L50 62 L38 92 L56 100 L70 86 L72 130 C72 148 84 156 96 158 L96 170 L144 170 L144 158 C156 156 168 148 168 130 L170 86 L184 100 L202 92 L190 62 L168 52 C162 66 144 72 120 72 C96 72 78 66 72 52 Z" fill={a(3)} transform="scale(0.78) translate(34 22)" />
      <g transform="scale(0.78) translate(34 22)">
        <path d="M100 160 L100 170 M120 160 L120 170 M140 160 L140 170" stroke-width="2" />
        <circle cx="100" cy="164" r="3" fill={cream} stroke-width="1.8" />
        <circle cx="120" cy="164" r="3" fill={cream} stroke-width="1.8" />
        <circle cx="140" cy="164" r="3" fill={cream} stroke-width="1.8" />
        <path d="M120 112 C102 98 104 84 120 92 C136 84 138 98 120 112 Z" fill="#f6b5ab" stroke-width="2.4" />
      </g>
      <!-- くつした -->
      <path d="M186 98 L186 126 C186 136 176 142 168 142 L158 142 C154 142 154 134 158 132 L164 128 L164 98 Z" fill={a(1)} />
      <path d="M164 108 L186 108" stroke-width="2" />
      <path d="M26 128 l3 -8 l3 8 l8 3 l-8 3 l-3 8 l-3 -8 l-8 -3 Z" fill={a(2)} stroke-width="2" />
      <path d="M204 160 C198 154 199 148 204 150 C209 148 210 154 204 160 Z" fill="#f6b5ab" stroke-width="2" />
    {:else if id === 'moon'}
      <!-- 月と星 -->
      <path d="M142 24 C92 24 60 62 66 108 C72 154 118 178 160 164 C122 156 102 124 108 90 C112 64 124 40 142 24 Z" fill={a(3)} transform="translate(8 0)" />
      <path d="M142 24 C92 24 60 62 66 108 C72 154 118 178 160 164 C122 156 102 124 108 90 C112 64 124 40 142 24 Z" fill="none" transform="translate(8 0)" />
      <!-- 寝顔 -->
      <path d="M84 104 q5 4 10 0 M100 124 q5 4 10 0" stroke-width="2.2" />
      <path d="M90 124 q4 4 8 1" stroke-width="2" />
      <ellipse cx="88" cy="118" rx="4" ry="2.6" fill="#ffb3a8" opacity="0.6" stroke="none" />
      <path d="M170 56 l5 -12 l5 12 l12 5 l-12 5 l-5 12 l-5 -12 l-12 -5 Z" fill={a(3)} />
      <path d="M200 112 l3.5 -8 l3.5 8 l8 3.5 l-8 3.5 l-3.5 8 l-3.5 -8 l-8 -3.5 Z" fill={a(2)} stroke-width="2.2" />
      <path d="M176 156 l3 -7 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 Z" fill={a(1)} stroke-width="2" />
      <path d="M40 40 l3 -7 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 Z" fill={a(0)} stroke-width="2" />
      <circle cx="30" cy="150" r="3" fill={cream} stroke-width="1.8" />
      <circle cx="214" cy="40" r="2.5" fill={cream} stroke-width="1.8" />
    {:else if id === 'bear'}
      <!-- くまのぬいぐるみ -->
      <ellipse cx="120" cy="186" rx="70" ry="7" fill={a(1)} opacity="0.5" stroke="none" />
      <circle cx="82" cy="52" r="17" fill="#e6c9a3" />
      <circle cx="158" cy="52" r="17" fill="#e6c9a3" />
      <circle cx="82" cy="54" r="8" fill="#f6dcc2" stroke-width="2" />
      <circle cx="158" cy="54" r="8" fill="#f6dcc2" stroke-width="2" />
      <path d="M86 150 C70 160 70 184 90 184 L150 184 C170 184 170 160 154 150 Z" fill="#e6c9a3" />
      <ellipse cx="120" cy="128" rx="44" ry="42" fill="#e6c9a3" />
      <ellipse cx="120" cy="136" rx="26" ry="28" fill="#f6dcc2" stroke-width="2.2" />
      <path d="M76 112 C60 112 56 134 72 138 M164 112 C180 112 184 134 168 138" fill="#e6c9a3" />
      <circle cx="120" cy="76" r="36" fill="#e6c9a3" />
      <ellipse cx="120" cy="88" rx="16" ry="13" fill="#f6dcc2" stroke-width="2.2" />
      <ellipse cx="120" cy="82" rx="5" ry="3.6" fill="var(--ink, #6a5648)" stroke="none" />
      <path d="M120 86 L120 92 M112 94 Q120 100 128 94" stroke-width="2.2" />
      <circle cx="104" cy="70" r="2.8" fill="var(--ink, #6a5648)" stroke="none" />
      <circle cx="136" cy="70" r="2.8" fill="var(--ink, #6a5648)" stroke="none" />
      <ellipse cx="97" cy="82" rx="5" ry="3.2" fill="#ffb3a8" opacity="0.6" stroke="none" />
      <ellipse cx="143" cy="82" rx="5" ry="3.2" fill="#ffb3a8" opacity="0.6" stroke="none" />
      <!-- リボン -->
      <path d="M120 108 C104 98 100 118 120 114 C140 118 136 98 120 108 Z" fill={a(2)} />
      <circle cx="120" cy="111" r="3" fill={a(3)} stroke-width="2" />
      <path d="M190 44 C184 36 186 30 190 32 C194 30 196 36 190 44 Z" fill="#f6b5ab" stroke-width="2" />
    {:else if id === 'cradle'}
      <!-- ゆりかご -->
      <path d="M120 10 L120 34" stroke-width="2.4" />
      <path d="M72 34 L168 34" stroke-width="2.4" />
      <path d="M80 34 L80 52 M120 34 L120 40 M160 34 L160 52" stroke-width="1.8" />
      <circle cx="80" cy="60" r="8" fill={a(3)} stroke-width="2.2" />
      <path transform="translate(0 -9) scale(1 1)" d="M120 50 l5 8 l9 1 l-7 6 l2 9 l-9 -5 l-9 5 l2 -9 l-7 -6 l9 -1 Z" fill={a(2)} stroke-width="2.2" />
      <circle cx="160" cy="60" r="8" fill={a(1)} stroke-width="2.2" />
      <!-- 本体 -->
      <path d="M44 108 L196 108 C196 150 168 168 120 168 C72 168 44 150 44 108 Z" fill={a(0)} />
      <path d="M44 108 C60 94 180 94 196 108" fill="#fff6df" />
      <path d="M60 126 C90 138 150 138 180 126" stroke-width="2" stroke-dasharray="3 6" opacity="0.7" />
      <!-- ねんねの赤ちゃん（ふとんから顔だけ） -->
      <circle cx="98" cy="102" r="6" fill={skin} stroke-width="2.2" />
      <circle cx="142" cy="102" r="6" fill={skin} stroke-width="2.2" />
      <ellipse cx="120" cy="97" rx="24" ry="21.5" fill={skin} />
      <path d="M118 77 C113 66 128 61 133 70 C136 76 128 80 125 75 C123 72 126 69 128 71" stroke-width="2.2" />
      <ellipse cx="110" cy="101" rx="3.6" ry="4.6" fill="var(--ink, #6a5648)" stroke="none" />
      <ellipse cx="130" cy="101" rx="3.6" ry="4.6" fill="var(--ink, #6a5648)" stroke="none" />
      <circle cx="111.6" cy="99" r="1.5" fill="#fff" stroke="none" />
      <circle cx="131.6" cy="99" r="1.5" fill="#fff" stroke="none" />
      <path d="M116 108 q2 2.6 4 0 q2 2.6 4 0" stroke-width="1.8" />
      <ellipse cx="102" cy="108" rx="6" ry="4" fill="#ffb3a8" opacity="0.7" stroke="none" />
      <ellipse cx="138" cy="108" rx="6" ry="4" fill="#ffb3a8" opacity="0.7" stroke="none" />
      <path d="M56 116 C80 126 160 126 184 116 L186 138 C160 150 80 150 54 138 Z" fill={a(1)} />
      <path d="M70 176 L170 176" stroke-width="3" />
      <path d="M206 100 l3 -7 l3 7 l7 3 l-7 3 l-3 7 l-3 -7 l-7 -3 Z" fill={a(3)} stroke-width="2" />
    {:else}
      <!-- 表紙の飾り（おくるみにくるまれた、ちいさな いのち） -->
      <ellipse cx="120" cy="184" rx="70" ry="7" fill={a(1)} opacity="0.5" stroke="none" />
      <path d="M62 170 C56 122 80 96 120 96 C160 96 184 122 178 170 C170 184 70 184 62 170 Z" fill={a(3)} />
      <circle cx="87" cy="104" r="8" fill={skin} stroke-width="2.4" />
      <circle cx="153" cy="104" r="8" fill={skin} stroke-width="2.4" />
      <ellipse cx="120" cy="96" rx="35" ry="31" fill={skin} />
      <path d="M118 66 C111 52 130 46 136 57 C140 65 130 70 126 63 C124 59 128 56 131 58" stroke-width="2.4" />
      <ellipse cx="106" cy="104" rx="5" ry="6.4" fill="var(--ink, #6a5648)" stroke="none" />
      <ellipse cx="134" cy="104" rx="5" ry="6.4" fill="var(--ink, #6a5648)" stroke="none" />
      <circle cx="108" cy="101.5" r="2.1" fill="#fff" stroke="none" />
      <circle cx="136" cy="101.5" r="2.1" fill="#fff" stroke="none" />
      <circle cx="104.2" cy="107" r="1" fill="#fff" stroke="none" />
      <circle cx="132.2" cy="107" r="1" fill="#fff" stroke="none" />
      <path d="M114 113 q3 4 6 0 q3 4 6 0" stroke-width="2" />
      <ellipse cx="96" cy="113" rx="8" ry="5.4" fill="#ffb3a8" opacity="0.7" stroke="none" />
      <ellipse cx="144" cy="113" rx="8" ry="5.4" fill="#ffb3a8" opacity="0.7" stroke="none" />
      <path d="M78 150 C100 164 140 164 162 150" stroke-width="2" stroke-dasharray="3 6" />
      <path d="M44 56 l5 -11 l5 11 l11 5 l-11 5 l-5 11 l-5 -11 l-11 -5 Z" fill={a(2)} stroke-width="2.2" />
      <path d="M190 40 l4 -9 l4 9 l9 4 l-9 4 l-4 9 l-4 -9 l-9 -4 Z" fill={a(0)} stroke-width="2.2" />
      <path d="M196 120 C190 114 191 108 196 110 C201 108 202 114 196 120 Z" fill="#f6b5ab" stroke-width="2" />
    {/if}
  </g>
</svg>

<style>
  .art {
    display: block;
    width: 100%;
    height: 100%;
  }
</style>
