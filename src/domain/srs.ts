// 間隔反復(仕様書「復習の間隔」)
// 覚えた:1日→3日→7日→14日→30日と広げる / 忘れた:翌日に戻す / あやふや:間隔を変えない
import type { CardState, Grade } from '../db/types'
import { addDays, toDateKey } from './date'

export const INTERVALS = [1, 3, 7, 14, 30]

// 「覚えた」が streak 回続いているときの復習間隔(日)
export function intervalForStreak(streak: number): number {
  if (streak <= 0) return 1
  return INTERVALS[Math.min(streak, INTERVALS.length) - 1]
}

// この採点をしたら、次の復習は何日後か(ボタンの「次は3日後」に使う)
export function nextIntervalDays(prev: CardState | undefined, grade: Grade): number {
  const streak = prev?.streak ?? 0
  if (grade === 'good') return intervalForStreak(streak + 1)
  if (grade === 'forgot') return 1
  return intervalForStreak(streak)
}

// 採点後のカードの状態を返す
export function applyGrade(
  prev: CardState | undefined,
  cardId: string,
  cardVersion: number,
  grade: Grade,
  now: Date,
): CardState {
  const prevStreak = prev?.streak ?? 0
  const streak = grade === 'good' ? prevStreak + 1 : grade === 'forgot' ? 0 : prevStreak
  return {
    cardId,
    status: grade === 'good' ? 'known' : 'learning',
    dueOn: addDays(toDateKey(now), nextIntervalDays(prev, grade)),
    streak,
    cardVersion,
    updatedAt: now.toISOString(),
    dirty: true,
    lastGrade: grade,
  }
}

// 30日の間隔を越えて正解したら「定着」
export function isMastered(state: CardState | undefined): boolean {
  return !!state && state.status === 'known' && state.streak > INTERVALS.length
}

// カードの数値が直された(versionが上がった)ら、「覚えた」を外して今日の復習に戻す
export function resetIfOutdated(state: CardState, currentVersion: number, now: Date): CardState {
  if (state.cardVersion >= currentVersion) return state
  return {
    ...state,
    status: 'learning',
    streak: 0,
    dueOn: toDateKey(now),
    cardVersion: currentVersion,
    updatedAt: now.toISOString(),
    dirty: true,
    lastGrade: undefined,
  }
}
