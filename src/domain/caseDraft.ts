// ケース道場の練習で記入する内容。書きかけとして端末に保存する
import type { TimerState } from './caseTimer'

export type CaseTab = 'memo' | 'answer' | 'numbers' | 'calc'

export type CaseDraft = {
  memo: string // メモ用紙
  answer: string // 回答の骨子
  timer: TimerState | null // はじめる前は null
  tab: CaseTab
}

export const emptyCaseDraft = (): CaseDraft => ({ memo: '', answer: '', timer: null, tab: 'memo' })

// まだはじめていない(保存しなくてよい)か
export const isBlankCaseDraft = (d: CaseDraft) => d.timer === null && d.memo.trim() === '' && d.answer.trim() === ''
