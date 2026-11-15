import { describe, expect, it } from 'vitest'
import type { CardState, Grade } from '../db/types'
import { applyGrade, isMastered, nextIntervalDays, resetIfOutdated } from './srs'

const at = (s: string) => new Date(`${s}T09:00:00`)

function run(grades: Grade[], start = '2026-11-15'): CardState {
  let st: CardState | undefined
  for (const g of grades) st = applyGrade(st, 'card-0001', 1, g, at(start))
  return st!
}

describe('間隔反復', () => {
  it('覚えたが続くと 1→3→7→14→30日 と広がる', () => {
    const days = [1, 2, 3, 4, 5].map((n) => run(Array(n).fill('good')).dueOn)
    expect(days).toEqual(['2026-11-16', '2026-11-18', '2026-11-22', '2026-11-29', '2026-12-15'])
  })

  it('30日を越えても間隔は30日のまま', () => {
    expect(run(Array(7).fill('good')).dueOn).toBe('2026-12-15')
  })

  it('忘れたは翌日に戻し、連続数を0にする', () => {
    const st = run(['good', 'good', 'good', 'forgot'])
    expect(st).toMatchObject({ status: 'learning', streak: 0, dueOn: '2026-11-16' })
  })

  it('あやふやは間隔を変えない(連続数もそのまま)', () => {
    const st = run(['good', 'good', 'good', 'unsure'])
    expect(st).toMatchObject({ status: 'learning', streak: 3, dueOn: '2026-11-22' })
    expect(nextIntervalDays(st, 'good')).toBe(14)
  })

  it('はじめてのカードのあやふやは翌日', () => {
    expect(run(['unsure'])).toMatchObject({ status: 'learning', streak: 0, dueOn: '2026-11-16' })
  })

  it('覚えたは known、未送信の印がつく', () => {
    expect(run(['good'])).toMatchObject({ status: 'known', dirty: true, lastGrade: 'good' })
  })

  it('30日間隔のあとに正解したら定着', () => {
    expect(isMastered(run(Array(5).fill('good')))).toBe(false)
    expect(isMastered(run(Array(6).fill('good')))).toBe(true)
    expect(isMastered(run([...Array(6).fill('good'), 'unsure']))).toBe(false)
  })

  it('月末をまたいでも日付がずれない', () => {
    expect(run(['good'], '2026-12-31').dueOn).toBe('2027-01-01')
  })
})

describe('versionが上がったカード', () => {
  it('覚えたを外して今日の復習に戻す', () => {
    const st = resetIfOutdated(run(Array(4).fill('good')), 2, at('2026-11-20'))
    expect(st).toMatchObject({ status: 'learning', streak: 0, dueOn: '2026-11-20', cardVersion: 2, dirty: true })
  })

  it('versionが同じなら何もしない', () => {
    const before = run(['good'])
    expect(resetIfOutdated(before, 1, at('2026-11-20'))).toBe(before)
  })
})
