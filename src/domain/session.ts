// 1セットで出すカードを選ぶ。出題モード(全部/未暗記/カテゴリ)は次の回で足す
import type { Card } from '../data/cards'
import type { CardState } from '../db/types'

export const SESSION_SIZE = 20

// 復習期限が来たカード(期限の古い順)→ まだ出していないカード(データの並び順)
export function pickSession(
  cards: Card[],
  states: ReadonlyMap<string, CardState>,
  today: string,
  size = SESSION_SIZE,
): Card[] {
  const due: { card: Card; dueOn: string }[] = []
  const fresh: Card[] = []
  for (const card of cards) {
    const st = states.get(card.id)
    if (!st || st.status === 'new') fresh.push(card)
    else if (st.dueOn !== null && st.dueOn <= today) due.push({ card, dueOn: st.dueOn })
  }
  due.sort((a, b) => a.dueOn.localeCompare(b.dueOn))
  return [...due.map((d) => d.card), ...fresh].slice(0, size)
}
