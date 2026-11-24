// 効果音はすべて Web Audio で合成する（素材ファイル・ライセンス不要）
let ctx: AudioContext | null = null
let master: GainNode | null = null
/** 効果音の出口。stopAll で丸ごと切り離して、鳴っている音をすべて止める */
let bus: GainNode | null = null
let enabled = true

export function setSoundEnabled(on: boolean) {
  enabled = on
}

/** 最初のタップ（ユーザー操作）の中で呼ぶ。iOS などの自動再生制限のため */
export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    ctx = new AC()
    master = ctx.createGain()
    master.gain.value = 0.8
    master.connect(ctx.destination)
    newBus()
  }
  if (ctx.state === 'suspended') void ctx.resume()
}

function newBus() {
  if (!ctx || !master) return
  bus = ctx.createGain()
  bus.connect(master)
}

/** 鳴っている効果音（ドラムロール・ファンファーレなど）をすべて止める */
export function stopAll() {
  if (!bus) return
  bus.disconnect()
  newBus()
}

let noiseBuf: AudioBuffer | null = null
function noise(): AudioBuffer {
  if (!noiseBuf && ctx) {
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const d = noiseBuf.getChannelData(0)
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
  }
  return noiseBuf!
}

function tone(freq: number, t: number, dur: number, type: OscillatorType, vol: number, endFreq?: number) {
  if (!ctx || !bus) return
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, t)
  if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + dur)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.exponentialRampToValueAtTime(vol, t + 0.01)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  o.connect(g).connect(bus)
  o.start(t)
  o.stop(t + dur + 0.05)
}

function hit(t: number, vol: number, freq: number, dur: number) {
  if (!ctx || !bus) return
  const src = ctx.createBufferSource()
  src.buffer = noise()
  const f = ctx.createBiquadFilter()
  f.type = 'bandpass'
  f.frequency.value = freq
  const g = ctx.createGain()
  g.gain.setValueAtTime(vol, t)
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
  src.connect(f).connect(g).connect(bus)
  src.start(t)
  src.stop(t + dur + 0.02)
}

/** ポンッ（風船が割れる） */
export function pop() {
  if (!enabled || !ctx) return
  const t = ctx.currentTime
  hit(t, 0.9, 1800, 0.12)
  tone(520, t, 0.12, 'sine', 0.5, 120)
}

/** カリカリ（スクラッチを削る） */
export function scratch() {
  if (!enabled || !ctx) return
  const t = ctx.currentTime
  hit(t, 0.22, 3200 + Math.random() * 1500, 0.07)
}

/** ちいさな合図 */
export function tick() {
  if (!enabled || !ctx) return
  tone(880, ctx.currentTime, 0.08, 'triangle', 0.25)
}

/** ドラムロール。だんだん速く、大きくなり、最後に低い音で締める */
export function drumroll(seconds: number) {
  if (!enabled || !ctx || seconds <= 0) return
  let t = ctx.currentTime + 0.02
  const end = t + seconds
  let i = 0
  while (t < end) {
    const progress = 1 - (end - t) / seconds
    hit(t, 0.18 + progress * 0.5, 220 + (i % 2) * 90, 0.07)
    t += 0.13 - progress * 0.085
    i++
  }
  tone(70, end - 0.02, 0.35, 'sine', 0.6, 40)
}

/** ファンファーレ（発表） */
export function fanfare() {
  if (!enabled || !ctx) return
  const t = ctx.currentTime
  const notes: [number, number][] = [
    [523.25, 0],
    [659.25, 0.12],
    [783.99, 0.24],
    [1046.5, 0.36],
  ]
  for (const [f, d] of notes) {
    tone(f, t + d, 0.5, 'triangle', 0.35)
    tone(f * 2, t + d, 0.4, 'sine', 0.12)
  }
  tone(1046.5, t + 0.6, 1.1, 'triangle', 0.3)
  tone(659.25, t + 0.6, 1.1, 'triangle', 0.2)
  tone(783.99, t + 0.6, 1.1, 'triangle', 0.2)
  hit(t + 0.36, 0.5, 5000, 0.5)
}
