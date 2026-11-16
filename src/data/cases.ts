// ケース道場のお題データ。data/cases.json を読むだけで、書き換えない
import raw from '../../data/cases.json'

export type CaseType = 'fermi' | 'case' | 'combo'

export type CaseQuestion = {
  id: string // q001 形式。変えない・再利用しない
  type: CaseType
  level: number // 1:初級 2:本番 3:難関
  industry: string
  text: string
  company?: string // 会社別の過去問だけ
  askedAt?: string // 出題年月(YYYY-MM)
}

export type CasePattern = { id: string; name: string; companies: string[]; note: string }

export const caseQuestions = raw.questions as CaseQuestion[]
export const caseById = new Map(caseQuestions.map((q) => [q.id, q]))
export const caseLevels = raw.levels as Record<string, string>
export const caseTypeNames = raw.typeNames as Record<CaseType, string>
export const casePatterns = raw.patterns as CasePattern[]

// 過去問のある会社。お題データに出てくる順
export const caseCompanies = [...new Set(caseQuestions.flatMap((q) => (q.company ? [q.company] : [])))]

// 表示用の番号(q012 → 012)
export const caseNo = (q: CaseQuestion) => q.id.replace('q', '')

// 表示用の出題年月(2026-04 → 26/04)
export const askedLabel = (q: CaseQuestion) => (q.askedAt ? `${q.askedAt.slice(2, 4)}/${q.askedAt.slice(5, 7)}` : '')
