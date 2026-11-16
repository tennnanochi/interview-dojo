import { describe, expect, it } from 'vitest'
import { evaluate, formatJa, formatPlain } from './calc'

describe('電卓の計算', () => {
  it('四則演算は掛け算・割り算が先', () => {
    expect(evaluate('2+3×4')).toBe(14)
    expect(evaluate('10−4÷2')).toBe(8)
    expect(evaluate('100÷8')).toBe(12.5)
    expect(evaluate('-5+2')).toBe(-3)
  })

  it('万・億・兆と%が使える', () => {
    expect(evaluate('1.2億×60%×4×500')).toBe(144_000_000_000)
    expect(evaluate('5500万÷2.2')).toBe(25_000_000)
    expect(evaluate('1億2000万')).toBe(120_000_000)
    expect(evaluate('3兆÷1.2億')).toBe(25_000)
    expect(evaluate('2万×3万')).toBe(600_000_000)
  })

  it('端数のずれを出さない', () => {
    expect(evaluate('0.1+0.2')).toBe(0.3)
    expect(evaluate('1.1×3')).toBe(3.3)
  })

  it('打ちかけの式は、そこまでを計算する', () => {
    expect(evaluate('1.2億×')).toBe(120_000_000)
    expect(evaluate('12+')).toBe(12)
  })

  it('計算できない式は null', () => {
    expect(evaluate('')).toBeNull()
    expect(evaluate('×')).toBeNull()
    expect(evaluate('5÷0')).toBeNull()
    expect(evaluate('2××3')).toBeNull()
    expect(evaluate('abc')).toBeNull()
  })

  it('大きな数は万・億・兆で読む', () => {
    expect(formatJa(144_000_000_000)).toBe('1,440億')
    expect(formatJa(25_000_000)).toBe('2,500万')
    expect(formatJa(120_000_000)).toBe('1.2億')
    expect(formatJa(3_300_000_000_000)).toBe('3.3兆')
    expect(formatJa(9999)).toBe('9,999')
    expect(formatJa(12.5)).toBe('12.5')
    expect(formatPlain(144_000_000_000)).toBe('144,000,000,000')
  })
})
