import { describe, expect, it } from 'vitest'
import { caseChecks, elapsedSec, formatDuration, latestByQuestion, makeAttempt, parseAnswer, scoreLabel } from './attempts'

describe('挑戦の記録', () => {
  const now = new Date('2026-11-16T13:00:00.000Z')

  it('記録を作る:鍵は 種類|問題id|時刻、未送信の印つき', () => {
    const a = makeAttempt('fermi', 'fermi-001', { scope: '国内' }, { checks: ['scope', 'calc'], max: 6 }, 300, now)
    expect(a).toMatchObject({ key: 'fermi|fermi-001|2026-11-16T13:00:00.000Z', kind: 'fermi', durationSec: 300, synced: false })
    expect(parseAnswer<{ scope: string }>(a)).toEqual({ scope: '国内' })
    expect(scoreLabel(a.selfScore)).toBe('2/6')
  })

  it('問題ごとに、いちばん新しい記録を選ぶ', () => {
    const mk = (id: string, t: string) => makeAttempt('case', id, {}, { checks: [], max: 6 }, null, new Date(t))
    const list = [mk('q002', '2026-11-16T10:00:00Z'), mk('q001', '2026-11-15T10:00:00Z'), mk('q002', '2026-11-14T10:00:00Z')]
    const latest = latestByQuestion(list)
    expect(latest.size).toBe(2)
    expect(latest.get('q002')!.createdAt).toBe('2026-11-16T10:00:00.000Z')
  })

  it('壊れた記入内容は null', () => {
    expect(parseAnswer({ ...makeAttempt('case', 'q', {}, { checks: [], max: 1 }, null, now), answer: '{oops' })).toBeNull()
    expect(parseAnswer(undefined)).toBeNull()
  })

  it('チェック項目は種類ごとに変わり、idは重複しない', () => {
    for (const type of ['fermi', 'case', 'combo'] as const) {
      const ids = caseChecks(type).map((c) => c.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
    expect(caseChecks('combo').length).toBe(7)
  })

  it('経過時間:長すぎるときは記録しない', () => {
    expect(elapsedSec('2026-11-16T12:55:00.000Z', now)).toBe(300)
    expect(elapsedSec('2026-11-15T12:55:00.000Z', now)).toBeNull()
    expect(formatDuration(200)).toBe('3分20秒')
    expect(formatDuration(300)).toBe('5分')
    expect(formatDuration(45)).toBe('45秒')
  })
})
