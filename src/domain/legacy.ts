// 旧暗記帳の「覚えた」の引き継ぎ(仕様書「同期の仕組み」5)
// 旧アプリのidは「区分|項目名」。cards.json の legacyId で新しいカードに対応づける
import type { Card } from '../data/cards'
import type { CardState } from '../db/types'
import { addDays, toDateKey } from './date'

// 「覚えていない」を表していそうな値か(false、0、空文字、{ known: false } など)
function isOff(value: unknown): boolean {
  if (value === null || value === undefined || value === false || value === 0 || value === '') return true
  if (typeof value === 'object' && !Array.isArray(value)) {
    const flags = Object.values(value as object).filter((v) => typeof v === 'boolean')
    return flags.length > 0 && flags.every((v) => v === false)
  }
  return false
}

// 貼り付けられた文字列から、旧アプリで「覚えた」だったidを取り出す
// 旧アプリの保存形式が分からなくても拾えるように、JSONの中のどこにあっても探す
//  - 配列や値に書かれたid("基本|日本の総人口")
//  - キーがidで、値がオフでないもの({ "基本|日本の総人口": true })
// JSONでなければ、1行に1つidが書かれた文章として読む
export function extractLegacyIds(text: string, cards: Card[]): string[] {
  const known = new Set(cards.map((c) => c.legacyId))
  const found = new Set<string>()

  function walk(node: unknown) {
    if (typeof node === 'string') {
      if (known.has(node)) found.add(node)
    } else if (Array.isArray(node)) {
      node.forEach(walk)
    } else if (node && typeof node === 'object') {
      for (const [key, value] of Object.entries(node)) {
        if (known.has(key)) {
          if (!isOff(value)) found.add(key)
        } else walk(value)
      }
    }
  }

  try {
    walk(JSON.parse(text))
  } catch {
    for (const line of text.split(/\r?\n/)) {
      const id = line.trim().replace(/^[-・*\s"']+|["',\s]+$/g, '')
      if (known.has(id)) found.add(id)
    }
  }
  return [...found]
}

export type LegacyPlan = {
  create: CardState[] // 新しく「覚えた」にするカード
  alreadyStudied: number // このアプリですでに採点済みなので、触らないカード
}

// 引き継ぐカードの状態を作る。このアプリで採点済みのカードは上書きしない
// 復習日は1〜7日後に散らす(全部が同じ日に復習期限になって溢れないように)
export function planLegacyImport(
  legacyIds: string[],
  cards: Card[],
  states: ReadonlyMap<string, CardState>,
  now: Date,
): LegacyPlan {
  const wanted = new Set(legacyIds)
  const today = toDateKey(now)
  const plan: LegacyPlan = { create: [], alreadyStudied: 0 }
  for (const card of cards) {
    if (!wanted.has(card.legacyId)) continue
    const st = states.get(card.id)
    if (st && st.status !== 'new') {
      plan.alreadyStudied++
      continue
    }
    plan.create.push({
      cardId: card.id,
      status: 'known',
      dueOn: addDays(today, 1 + (plan.create.length % 7)),
      streak: 1,
      cardVersion: card.version,
      updatedAt: now.toISOString(),
      dirty: true,
    })
  }
  return plan
}
