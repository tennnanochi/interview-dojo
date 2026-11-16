import { describe, expect, it } from 'vitest'
import type { Card } from '../data/cards'
import type { CardState } from '../db/types'
import { countDue, parseStudyOptions, pickSession, selectCards, studyPath } from './session'

const id = (n: number) => `card-${String(n).padStart(4, '0')}`
const card = (n: number, group = 'A') => ({ id: id(n), version: 1, group }) as Card
const state = (n: number, dueOn: string, status: CardState['status'] = 'known'): [string, CardState] => [
  id(n),
  { cardId: id(n), status, dueOn, streak: 1, cardVersion: 1, updatedAt: '', dirty: false },
]
const ids = (cs: Card[]) => cs.map((c) => Number(c.id.slice(-4)))

describe('出題するカードの選び方', () => {
  const today = '2026-11-15'
  // 1:期限切れの覚えた 2:期限切れのあやふや(より古い) 3:未出題 4:期限前の覚えた 5:期限前のあやふや 6:未出題(別カテゴリ)
  const cards = [card(1), card(2), card(3), card(4), card(5), card(6, 'B')]
  const states = new Map([
    state(1, '2026-11-15'),
    state(2, '2026-11-10', 'learning'),
    state(4, '2026-11-30'),
    state(5, '2026-11-16', 'learning'),
  ])

  it('復習期限:期限が来たカードだけを、期限の古い順に出す', () => {
    expect(ids(selectCards(cards, states, today, { mode: 'due' }))).toEqual([2, 1])
  })

  it('未暗記だけ:期限が来た未暗記 → 未出題 → 期限前の未暗記。覚えたカードは期限が来ていても出さない', () => {
    expect(ids(selectCards(cards, states, today, { mode: 'unlearned' }))).toEqual([2, 3, 6, 5])
  })

  it('全部:期限前のカードも、期限の近い順で最後に出す', () => {
    expect(ids(selectCards(cards, states, today, { mode: 'all' }))).toEqual([2, 1, 3, 6, 5, 4])
  })

  it('カテゴリ指定はどのモードとも組み合わせられる', () => {
    expect(ids(selectCards(cards, states, today, { mode: 'all', group: 'B' }))).toEqual([6])
    expect(selectCards(cards, states, today, { mode: 'due', group: 'B' })).toEqual([])
  })

  it('1セットの枚数で打ち切る', () => {
    expect(pickSession(cards, states, today, { mode: 'all' }, 3)).toHaveLength(3)
  })

  it('今日の復習枚数は、期限が来たカードの数', () => {
    expect(countDue(cards, states, today)).toBe(2)
    expect(countDue(cards, new Map(), today)).toBe(0)
  })
})

describe('出題画面のURL', () => {
  it('モードとカテゴリを往復できる', () => {
    const path = studyPath({ mode: 'unlearned', group: '市場規模(確認済)' })
    expect(parseStudyOptions(new URLSearchParams(path.split('?')[1]))).toEqual({
      mode: 'unlearned',
      group: '市場規模(確認済)',
    })
  })

  it('指定がない・おかしいときは復習期限にする', () => {
    expect(parseStudyOptions(new URLSearchParams('mode=xxx'))).toEqual({ mode: 'due', group: undefined })
  })
})
