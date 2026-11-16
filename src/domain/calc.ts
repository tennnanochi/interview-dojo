// 電卓の計算。万・億・兆と%を使った式を計算する(例:1.2億×60%×4×500)
// eval は使わず、自前で式を読む

const UNITS: Record<string, number> = { 万: 1e4, 億: 1e8, 兆: 1e12 }

type Token = { kind: 'num'; value: number } | { kind: 'op'; value: string }

// 式を数と演算子に分ける。「1億2000万」のように単位つきの数が続くときは足し合わせる
function tokenize(expr: string): Token[] | null {
  const tokens: Token[] = []
  const src = expr.replace(/[,\s]/g, '')
  let i = 0
  while (i < src.length) {
    const ch = src[i]
    if ('+-−×÷*/'.includes(ch)) {
      tokens.push({ kind: 'op', value: ch === '−' ? '-' : ch === '*' ? '×' : ch === '/' ? '÷' : ch })
      i++
      continue
    }
    let total = 0
    let parts = 0
    let lastHadUnit = true
    for (;;) {
      const m = /^(\d+\.?\d*|\.\d+)/.exec(src.slice(i))
      if (!m) break
      if (!lastHadUnit) return null // 「12 34」のように、単位なしの数が続いている
      let value = Number(m[1])
      i += m[1].length
      lastHadUnit = false
      while (i < src.length && src[i] in UNITS) {
        value *= UNITS[src[i]]
        lastHadUnit = true
        i++
      }
      total += value
      parts++
    }
    if (parts === 0) return null // 数でも演算子でもない文字
    while (src[i] === '%') {
      total /= 100
      i++
    }
    tokens.push({ kind: 'num', value: total })
  }
  return tokens
}

// 式を計算する。途中まで打った式(末尾が演算子)は、そこまでを計算する。計算できなければ null
export function evaluate(expr: string): number | null {
  const tokens = tokenize(expr)
  if (!tokens || tokens.length === 0) return null
  while (tokens.length > 0 && tokens[tokens.length - 1].kind === 'op') tokens.pop()
  if (tokens.length === 0) return null

  // 先頭の符号(-5 など)
  let pos = 0
  const readNumber = (): number | null => {
    let sign = 1
    while (tokens[pos]?.kind === 'op' && (tokens[pos].value === '-' || tokens[pos].value === '+')) {
      if (tokens[pos].value === '-') sign = -sign
      pos++
    }
    const t = tokens[pos]
    if (!t || t.kind !== 'num') return null
    pos++
    return sign * t.value
  }
  // 掛け算・割り算を先に
  const readTerm = (): number | null => {
    let value = readNumber()
    while (value !== null && tokens[pos]?.kind === 'op' && (tokens[pos].value === '×' || tokens[pos].value === '÷')) {
      const op = tokens[pos++].value
      const right = readNumber()
      if (right === null) return null
      value = op === '×' ? value * right : value / right
    }
    return value
  }
  let result = readTerm()
  while (result !== null && pos < tokens.length) {
    const op = tokens[pos++]
    if (op.kind !== 'op' || (op.value !== '+' && op.value !== '-')) return null
    const right = readTerm()
    if (right === null) return null
    result = op.value === '+' ? result + right : result - right
  }
  if (result === null || !Number.isFinite(result)) return null
  return Number(result.toPrecision(12)) // 0.1+0.2 のような端数のずれを消す
}

const trim = (n: number, digits: number) => n.toLocaleString('ja-JP', { maximumFractionDigits: digits })

// 表示用:大きな数は万・億・兆で読む(144000000000 → 1,440億)
export function formatJa(n: number): string {
  const abs = Math.abs(n)
  for (const [unit, size] of [['兆', 1e12], ['億', 1e8], ['万', 1e4]] as const) {
    if (abs >= size) {
      const v = n / size
      return `${trim(v, Math.abs(v) >= 100 ? 0 : 2)}${unit}`
    }
  }
  return trim(n, abs >= 100 ? 0 : 4)
}

// 表示用:単位を使わない書き方(1,440億 と並べて出す)
export function formatPlain(n: number): string {
  return trim(n, Math.abs(n) >= 100 ? 0 : 4)
}
