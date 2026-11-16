// ケース道場のタイマー。区間(フェルミ→ケース→発表)を順に進める
// 時刻の差で数えるので、アプリが裏に回っても、閉じて開き直しても、ずれない
import type { CaseType } from '../data/cases'

export type Phase = { name: string; sec: number }

export const PHASE_MIN = 1 // 区間の長さ(分)の下限と上限
export const PHASE_MAX = 15

// お題の種類ごとの区間。初期値は各5分
export function defaultPhases(type: CaseType): Phase[] {
  const think = type === 'fermi' ? ['フェルミ'] : type === 'case' ? ['ケース'] : ['フェルミ', 'ケース']
  return [...think, '発表'].map((name) => ({ name, sec: 5 * 60 }))
}

export type TimerState = {
  phases: Phase[]
  index: number // いまの区間。全区間が終わったら phases.length
  used: number[] // 終わった区間で、実際に使った秒数
  carriedMs: number // いまの区間で、一時停止までに使った時間
  runningSince: number | null // 動いているときは開始時刻(ミリ秒)。止まっているときは null
}

export function startTimer(phases: Phase[], now: number): TimerState {
  return { phases, index: 0, used: [], carriedMs: 0, runningSince: now }
}

export const isDone = (t: TimerState) => t.index >= t.phases.length
export const isPaused = (t: TimerState) => !isDone(t) && t.runningSince === null

// いまの区間で使った時間(ミリ秒)
function elapsedMs(t: TimerState, now: number): number {
  return t.carriedMs + (t.runningSince === null ? 0 : Math.max(0, now - t.runningSince))
}

// 時間切れの区間を終わらせて、次の区間に進める(長く離れていたら、まとめて進む)
export function tick(t: TimerState, now: number): TimerState {
  let s = t
  while (!isDone(s) && s.runningSince !== null) {
    const limit = s.phases[s.index].sec * 1000
    if (elapsedMs(s, now) < limit) break
    const boundary = s.runningSince + (limit - s.carriedMs) // この区間が終わった瞬間
    const index = s.index + 1
    s = { ...s, index, used: [...s.used, s.phases[s.index].sec], carriedMs: 0, runningSince: index < s.phases.length ? boundary : null }
  }
  return s
}

export function pause(t: TimerState, now: number): TimerState {
  const s = tick(t, now)
  return isDone(s) || s.runningSince === null ? s : { ...s, carriedMs: elapsedMs(s, now), runningSince: null }
}

export function resume(t: TimerState, now: number): TimerState {
  return isDone(t) || t.runningSince !== null ? t : { ...t, runningSince: now }
}

// いまの区間を早めに切り上げて、次の区間へ
export function skip(t: TimerState, now: number): TimerState {
  const s = tick(t, now)
  if (isDone(s)) return s
  const index = s.index + 1
  return { ...s, index, used: [...s.used, Math.round(elapsedMs(s, now) / 1000)], carriedMs: 0, runningSince: index < s.phases.length ? now : null }
}

// 練習を終える。残りの区間は使わなかった(0秒)として記録する
export function finish(t: TimerState, now: number): TimerState {
  let s = tick(t, now)
  if (!isDone(s)) s = skip(s, now)
  return { ...s, index: s.phases.length, used: s.phases.map((_, i) => s.used[i] ?? 0), carriedMs: 0, runningSince: null }
}

export type TimerView = {
  phaseName: string // いまの区間名。全部終わったら「終了」
  remainingSec: number
  fractions: number[] // 区間ごとの進み具合(0〜1)
}

export function viewTimer(t: TimerState, now: number): TimerView {
  const s = tick(t, now)
  if (isDone(s)) return { phaseName: '終了', remainingSec: 0, fractions: s.phases.map(() => 1) }
  const phase = s.phases[s.index]
  const used = elapsedMs(s, now)
  return {
    phaseName: phase.name,
    remainingSec: Math.max(0, Math.ceil((phase.sec * 1000 - used) / 1000)),
    fractions: s.phases.map((p, i) => (i < s.index ? 1 : i > s.index ? 0 : Math.min(1, used / (p.sec * 1000)))),
  }
}

// 表示用:「4:05」
export function formatClock(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`
}
