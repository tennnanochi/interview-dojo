// 挑戦の記録(自己採点)まわり
import type { Attempt, AttemptKind, SelfScore } from '../db/types'

export type CheckItem = { id: string; label: string }

// フェルミ推定の自己採点(5ステップの型に沿う)
export const FERMI_CHECKS: CheckItem[] = [
  { id: 'scope', label: '前提を定義した' },
  { id: 'approach', label: '2案出して、1つに絞った' },
  { id: 'breakdown', label: '3段まで分解した' },
  { id: 'segment', label: 'セグメントで分けた' },
  { id: 'calc', label: '桁と計算が合っている' },
  { id: 'verify', label: '別の式で検証した' },
]

// ケース面接の自己採点
export const CASE_CHECKS: CheckItem[] = [
  { id: 'premise', label: '前提と目標を確認した' },
  { id: 'structure', label: '現状を構造で分解した' },
  { id: 'issue', label: '課題を特定した' },
  { id: 'measures', label: '+10%と+50%の施策を出した' },
  { id: 'sideEffect', label: '単価低下などの副作用を相殺した' },
  { id: 'conclusion', label: '優先順位と結論を言い切った' },
]

// フェルミ→ケース(複合)の自己採点
export const COMBO_CHECKS: CheckItem[] = [
  { id: 'scope', label: '前提を定義した' },
  { id: 'breakdown', label: '式を分解して、桁を出した' },
  { id: 'verify', label: '別の式で検証した' },
  { id: 'issue', label: '推定した構造から課題を特定した' },
  { id: 'measures', label: '+10%と+50%の施策を出した' },
  { id: 'sideEffect', label: '単価低下などの副作用を相殺した' },
  { id: 'conclusion', label: '優先順位と結論を言い切った' },
]

export function caseChecks(type: 'fermi' | 'case' | 'combo'): CheckItem[] {
  return type === 'fermi' ? FERMI_CHECKS : type === 'case' ? CASE_CHECKS : COMBO_CHECKS
}

export const scoreLabel = (score: SelfScore) => `${score.checks.length}/${score.max}`

export function makeAttempt(
  kind: AttemptKind,
  questionId: string,
  answer: unknown,
  selfScore: SelfScore,
  durationSec: number | null,
  now: Date,
): Attempt {
  const createdAt = now.toISOString()
  return {
    key: `${kind}|${questionId}|${createdAt}`,
    kind,
    questionId,
    answer: JSON.stringify(answer),
    selfScore,
    durationSec,
    createdAt,
    synced: false,
  }
}

// 問題ごとの、いちばん新しい記録(新しい順に並んだ一覧を渡す)
export function latestByQuestion(attempts: Attempt[]): Map<string, Attempt> {
  const map = new Map<string, Attempt>()
  for (const a of attempts) if (!map.has(a.questionId)) map.set(a.questionId, a)
  return map
}

// 保存した記入内容を読む。壊れていたら null
export function parseAnswer<T>(attempt: Attempt | undefined): Partial<T> | null {
  if (!attempt) return null
  try {
    const value = JSON.parse(attempt.answer)
    return value && typeof value === 'object' ? (value as Partial<T>) : null
  } catch {
    return null
  }
}

// 経過時間(秒)。長すぎる(日をまたいで再開した)ときは記録しない
export function elapsedSec(startedAt: string, now: Date, limitSec = 2 * 60 * 60): number | null {
  const sec = Math.round((now.getTime() - Date.parse(startedAt)) / 1000)
  return Number.isFinite(sec) && sec >= 0 && sec <= limitSec ? sec : null
}

// 表示用:「3分20秒」
export function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return m > 0 ? `${m}分${s > 0 ? `${s}秒` : ''}` : `${s}秒`
}
