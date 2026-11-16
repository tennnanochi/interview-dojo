import { describe, expect, it } from 'vitest'
import type { Card } from '../data/cards'
import type { CardState } from '../db/types'
import { extractLegacyIds, planLegacyImport } from './legacy'

const cards = ['基本|日本の総人口', '基本|世帯数', '需要率|硬式テニス', '○分圏の面積|徒歩○分圏'].map(
  (legacyId, i) => ({ id: `card-000${i + 1}`, legacyId, version: 1 }) as Card,
)

describe('旧暗記帳のデータから「覚えた」を取り出す', () => {
  it('idの配列', () => {
    expect(extractLegacyIds('["基本|日本の総人口","需要率|硬式テニス","知らないid"]', cards)).toEqual(['基本|日本の総人口', '需要率|硬式テニス'])
  })

  it('idをキーにした表(falseは覚えていない扱い)', () => {
    const text = JSON.stringify({ '基本|日本の総人口': true, '基本|世帯数': false, '需要率|硬式テニス': 1 })
    expect(extractLegacyIds(text, cards)).toEqual(['基本|日本の総人口', '需要率|硬式テニス'])
  })

  it('入れ子の奥にあっても拾う', () => {
    const text = JSON.stringify({ version: 2, data: { memorized: { '基本|世帯数': { known: true }, '基本|日本の総人口': { known: false } }, list: ['○分圏の面積|徒歩○分圏'] } })
    expect(extractLegacyIds(text, cards).sort()).toEqual(['○分圏の面積|徒歩○分圏', '基本|世帯数'])
  })

  it('JSONでなければ、1行1idの文章として読む', () => {
    expect(extractLegacyIds('基本|日本の総人口\n- 基本|世帯数\n "需要率|硬式テニス",\n関係ない行', cards)).toHaveLength(3)
  })

  it('何も一致しなければ空', () => {
    expect(extractLegacyIds('{"a":1}', cards)).toEqual([])
    expect(extractLegacyIds('', cards)).toEqual([])
  })
})

describe('引き継ぐカードの状態', () => {
  const now = new Date('2026-11-16T09:00:00')

  it('覚えたにして、復習日を1〜7日後に散らす', () => {
    const many = Array.from({ length: 9 }, (_, i) => ({ id: `c${i}`, legacyId: `x|${i}`, version: 3 }) as Card)
    const plan = planLegacyImport(many.map((c) => c.legacyId), many, new Map(), now)
    expect(plan.create).toHaveLength(9)
    expect(plan.create[0]).toMatchObject({ cardId: 'c0', status: 'known', streak: 1, cardVersion: 3, dirty: true, dueOn: '2026-11-17' })
    expect(plan.create.map((s) => s.dueOn!.slice(-2))).toEqual(['17', '18', '19', '20', '21', '22', '23', '17', '18'])
  })

  it('このアプリで採点済みのカードは上書きしない', () => {
    const studied: CardState = { cardId: 'card-0001', status: 'learning', dueOn: '2026-11-17', streak: 0, cardVersion: 1, updatedAt: '2026-11-15T00:00:00.000Z', dirty: false }
    const plan = planLegacyImport(['基本|日本の総人口', '基本|世帯数'], cards, new Map([[studied.cardId, studied]]), now)
    expect(plan.create.map((s) => s.cardId)).toEqual(['card-0002'])
    expect(plan.alreadyStudied).toBe(1)
  })
})
