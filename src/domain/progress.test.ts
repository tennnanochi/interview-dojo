import { describe, expect, it } from 'vitest'
import type { Card } from '../data/cards'
import type { CardState, Review } from '../db/types'
import { activity, progressByGroup, summarize } from './progress'

const card = (id: string, group: string) => ({ id, group, version: 1 }) as Card
const st = (cardId: string, status: CardState['status'], streak = 1): [string, CardState] => [
  cardId,
  { cardId, status, dueOn: '2026-12-01', streak, cardVersion: 1, updatedAt: '', dirty: false },
]
const review = (localTime: string): Review => {
  const reviewedAt = new Date(localTime).toISOString()
  return { key: `c|${reviewedAt}`, cardId: 'c', grade: 'good', reviewedAt, synced: false }
}

describe('進捗', () => {
  const cards = [card('a', 'A'), card('b', 'A'), card('c', 'A'), card('d', 'B'), card('e', 'B')]
  const states = new Map([st('a', 'known', 6), st('b', 'known', 2), st('c', 'learning'), st('d', 'new')])

  it('覚えた・定着・復習中・未出題に分ける', () => {
    expect(summarize(cards, states)).toEqual({ total: 5, known: 2, mastered: 1, learning: 1, fresh: 2 })
  })

  it('カテゴリ別に覚えた数を出す', () => {
    expect(progressByGroup(cards, states)).toEqual([
      { group: 'A', total: 3, known: 2 },
      { group: 'B', total: 2, known: 0 },
    ])
  })
})

describe('連続学習日数', () => {
  const today = '2026-11-15'

  it('今日まで続いている日数を数える', () => {
    const reviews = [review('2026-11-13T08:00'), review('2026-11-14T23:50'), review('2026-11-15T00:10'), review('2026-11-15T09:00')]
    expect(activity(reviews, today)).toEqual({ streakDays: 3, studiedToday: true, todayCount: 2, totalCount: 4 })
  })

  it('今日まだやっていなくても、昨日までの連続は残す', () => {
    const reviews = [review('2026-11-13T08:00'), review('2026-11-14T08:00')]
    expect(activity(reviews, today)).toMatchObject({ streakDays: 2, studiedToday: false, todayCount: 0 })
  })

  it('1日空いたら切れる', () => {
    expect(activity([review('2026-11-12T08:00'), review('2026-11-13T08:00')], today).streakDays).toBe(0)
    expect(activity([review('2026-11-12T08:00'), review('2026-11-15T08:00')], today).streakDays).toBe(1)
  })

  it('履歴がなければ0日', () => {
    expect(activity([], today)).toEqual({ streakDays: 0, studiedToday: false, todayCount: 0, totalCount: 0 })
  })
})
