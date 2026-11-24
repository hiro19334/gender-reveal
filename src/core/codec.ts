import LZString from 'lz-string'
import { SCHEMA_VERSION, normalizeConfig, type RevealConfig } from './config'

// URLを見ただけで答えが分からない程度の軽い難読化（解析すれば読める。ネタバレ防止用）
const KEY = [0x5a, 0x13, 0xc7, 0x2e, 0x91, 0x6b]
const xor = (s: string) => {
  let out = ''
  for (let i = 0; i < s.length; i++) out += String.fromCharCode(s.charCodeAt(i) ^ KEY[i % KEY.length])
  return out
}

export function encodeConfig(config: RevealConfig): string {
  return LZString.compressToEncodedURIComponent(xor(JSON.stringify(config)))
}

export type DecodeResult =
  | { ok: true; config: RevealConfig }
  | { ok: false; reason: 'invalid' | 'newer' }

/** 正規の最大構成（絵本6ページ・文言最大）でも圧縮後は約2,000文字。それを超える入力は展開爆弾とみなす */
export const MAX_DATA_LENGTH = 4000

export function decodeConfig(data: string): DecodeResult {
  if (data.length > MAX_DATA_LENGTH) return { ok: false, reason: 'invalid' }
  try {
    const raw = LZString.decompressFromEncodedURIComponent(data)
    if (!raw) return { ok: false, reason: 'invalid' }
    const parsed = JSON.parse(xor(raw)) as { v?: unknown }
    if (typeof parsed.v === 'number' && parsed.v > SCHEMA_VERSION) return { ok: false, reason: 'newer' }
    return { ok: true, config: normalizeConfig(parsed) }
  } catch {
    return { ok: false, reason: 'invalid' }
  }
}
