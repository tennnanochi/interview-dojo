import { describe, expect, it } from 'vitest'
import type { Card } from '../data/cards'
import type { CardState } from '../db/types'
import { pickSession } from './session'

const card = (n: number) => ({ id: `card-${String(n).padStart(4, '0')}`, version: 1 }) as Card
const state = (n: number, dueOn: string, status: CardState['status'] = 'known'): [string, CardState] => [
  card(n).id,
  { cardId: card(n).id, status, dueOn, streak: 1, cardVersion: 1, updatedAt: '', dirty: false },
]

describe('出題するカードの選び方', () => {
  const cards = [1, 2, 3, 4, 5].map(card)
  const today = '2026-11-15'

  it('期限が来たカードを古い順に先に出し、続けて未出題を出す', () => {
    const states = new Map([state(4, '2026-11-15'), state(2, '2026-11-10'), state(5, '2026-11-16')])
    expect(pickSession(cards, states, today).map((c) => c.id)).toEqual(['card-0002', 'card-0004', 'card-0001', 'card-0003'])
  })

  it('1セットの枚数で打ち切る', () => {
    expect(pickSession(cards, new Map(), today, 3)).toHaveLength(3)
  })

  it('期限前のカードしかなければ空', () => {
    const states = new Map(cards.map((_, i) => state(i + 1, '2026-11-20')))
    expect(pickSession(cards, states, today)).toEqual([])
  })
})
