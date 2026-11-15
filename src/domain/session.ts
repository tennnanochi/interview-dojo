// 1セットで出すカードを選ぶ(仕様書「出題モード」)
import type { Card } from '../data/cards'
import type { CardState } from '../db/types'

export const SESSION_SIZE = 20

// due:復習期限が来たもの / unlearned:未暗記だけ / all:全部
export type StudyMode = 'due' | 'unlearned' | 'all'
export const STUDY_MODES: StudyMode[] = ['due', 'unlearned', 'all']

export type StudyOptions = {
  mode: StudyMode
  group?: string // カテゴリ指定。なければ全カテゴリ
}

type States = ReadonlyMap<string, CardState>

const isFresh = (st: CardState | undefined) => !st || st.status === 'new'
const isDue = (st: CardState | undefined, today: string) =>
  !isFresh(st) && st!.dueOn !== null && st!.dueOn <= today

// 条件に合うカードを、出す順に並べて全部返す
// 並び:復習期限が来たカード(期限の古い順)→ まだ出していないカード(データの並び順)→ 期限前のカード(期限の近い順)
export function selectCards(cards: Card[], states: States, today: string, options: StudyOptions): Card[] {
  const due: { card: Card; dueOn: string }[] = []
  const fresh: Card[] = []
  const later: { card: Card; dueOn: string }[] = []

  for (const card of cards) {
    if (options.group && card.group !== options.group) continue
    const st = states.get(card.id)
    if (options.mode === 'unlearned' && st?.status === 'known') continue // 覚えたカードは期限が来ていても出さない
    if (isDue(st, today)) {
      due.push({ card, dueOn: st!.dueOn! })
    } else if (options.mode === 'due') {
      continue
    } else if (isFresh(st)) {
      fresh.push(card)
    } else if (options.mode === 'all' || st!.status !== 'known') {
      later.push({ card, dueOn: st!.dueOn ?? '' })
    }
  }

  const byDue = (a: { dueOn: string }, b: { dueOn: string }) => a.dueOn.localeCompare(b.dueOn)
  due.sort(byDue)
  later.sort(byDue)
  return [...due.map((d) => d.card), ...fresh, ...later.map((d) => d.card)]
}

export function pickSession(
  cards: Card[],
  states: States,
  today: string,
  options: StudyOptions,
  size = SESSION_SIZE,
): Card[] {
  return selectCards(cards, states, today, options).slice(0, size)
}

// 今日の復習枚数(ホームに出す)
export function countDue(cards: Card[], states: States, today: string): number {
  return cards.filter((c) => isDue(states.get(c.id), today)).length
}

// 出題画面のURL(/cards/study?mode=due&group=...)との相互変換
export function studyPath(options: StudyOptions): string {
  const q = new URLSearchParams({ mode: options.mode })
  if (options.group) q.set('group', options.group)
  return `/cards/study?${q}`
}

export function parseStudyOptions(params: URLSearchParams): StudyOptions {
  const mode = params.get('mode') as StudyMode
  return {
    mode: STUDY_MODES.includes(mode) ? mode : 'due',
    group: params.get('group') || undefined,
  }
}
