import { describe, expect, it } from 'vitest'
import { fermiQuestions } from '../data/fermi'
import { approachOptions, emptyFermiDraft, filledSteps, isBlankFermiDraft } from './fermiDraft'

describe('アプローチの選択肢の並び', () => {
  it('同じ問題は何度呼んでも同じ並びで、全部の案を1回ずつ含む', () => {
    for (const q of fermiQuestions) {
      const a = approachOptions(q)
      expect(a).toEqual(approachOptions(q))
      expect(a.map((o) => o.index).sort()).toEqual(q.approaches.map((_, i) => i))
    }
  })

  it('本線の案が、いつも同じ位置に来ない', () => {
    const firstIsAdopted = fermiQuestions.filter((q) => approachOptions(q)[0].index === q.adopted).length
    const rate = firstIsAdopted / fermiQuestions.length
    expect(rate).toBeGreaterThan(0.35)
    expect(rate).toBeLessThan(0.65)
  })
})

describe('書きかけ', () => {
  const now = new Date('2026-11-16T12:52:00')

  it('何も書いていなければ空とみなす', () => {
    const d = emptyFermiDraft(now)
    expect(isBlankFermiDraft(d)).toBe(true)
    expect(isBlankFermiDraft({ ...d, step: 3 })).toBe(true) // 段階を進めただけ
    expect(isBlankFermiDraft({ ...d, scope: '  ' })).toBe(true)
    expect(isBlankFermiDraft({ ...d, approach: 1 })).toBe(false)
    expect(isBlankFermiDraft({ ...d, breakdown: ['', '人口×率', ''] })).toBe(false)
  })

  it('記入のある段階が分かる', () => {
    const d = { ...emptyFermiDraft(now), scope: '国内・年間', approach: 0, segment: '年代', result: '約100億円' }
    expect(filledSteps(d)).toEqual([true, true, true, true, false])
  })
})
