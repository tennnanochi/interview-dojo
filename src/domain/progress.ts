// 進捗の集計(記録画面)
import type { Card } from '../data/cards'
import type { CardState, Review } from '../db/types'
import { addDays, toDateKey } from './date'
import { isMastered } from './srs'

type States = ReadonlyMap<string, CardState>

export type Summary = {
  total: number
  known: number // 覚えた(定着を含む)
  mastered: number // うち定着
  learning: number // 復習中(あやふや・忘れた)
  fresh: number // 未出題
}

export function summarize(cards: Card[], states: States): Summary {
  const sum: Summary = { total: cards.length, known: 0, mastered: 0, learning: 0, fresh: 0 }
  for (const card of cards) {
    const st = states.get(card.id)
    if (!st || st.status === 'new') sum.fresh++
    else if (st.status === 'learning') sum.learning++
    else {
      sum.known++
      if (isMastered(st)) sum.mastered++
    }
  }
  return sum
}

export type GroupProgress = { group: string; total: number; known: number }

// カテゴリ別の制覇率(覚えた数 / そのカテゴリの全カード)。カテゴリはデータに出てくる順
export function progressByGroup(cards: Card[], states: States): GroupProgress[] {
  const map = new Map<string, GroupProgress>()
  for (const card of cards) {
    const g = map.get(card.group) ?? { group: card.group, total: 0, known: 0 }
    g.total++
    if (states.get(card.id)?.status === 'known') g.known++
    map.set(card.group, g)
  }
  return [...map.values()]
}

export type Activity = {
  streakDays: number // 連続学習日数
  studiedToday: boolean
  todayCount: number // 今日採点した枚数
  totalCount: number // これまでに採点した枚数
}

// 採点ログから学習の続き具合を出す。今日まだやっていなくても、昨日までの連続は切らさない
export function activity(reviews: Review[], today: string): Activity {
  const perDay = new Map<string, number>()
  for (const r of reviews) {
    const day = toDateKey(new Date(r.reviewedAt)) // 端末のローカル日付で数える
    perDay.set(day, (perDay.get(day) ?? 0) + 1)
  }
  const studiedToday = perDay.has(today)
  let streakDays = 0
  for (let day = studiedToday ? today : addDays(today, -1); perDay.has(day); day = addDays(day, -1)) streakDays++
  return { streakDays, studiedToday, todayCount: perDay.get(today) ?? 0, totalCount: reviews.length }
}
