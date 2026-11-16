// フェルミ道場の問題データ。data/fermi.json を読むだけで、書き換えない
import raw from '../../data/fermi.json'

// 試算方法(12種)の説明
export type FermiType = {
  name: string // 例:需要ベース
  formula: string // 例:対象人口 × 比率(× 頻度 × 単価)
  ref: string // 参照元(チートシートの番号など)
  useFor: string // どんな数字に使うか
  example: string
  when: string // 使いどころ
}

export type FermiApproach = { type: string; formula: string }

export type FermiQuestion = {
  id: string // fermi-001 形式。変えない・再利用しない
  title: string
  genre: string
  scope: string // 模範解答:前提・定義
  approaches: FermiApproach[] // アプローチの候補
  adopted: number // 本線にする案(approachesの番号)
  why: string // その案を選ぶ理由、不採用の理由
  breakdown: string[] // 模範解答:3段の分解
  segment: string // 模範解答:セグメント
  check: string // 模範解答:検証に使う別の式
  bookNo: number | null // 書籍の問題番号
  origin: 'book' | 'original'
}

export const fermiTypes = raw.types as Record<string, FermiType>
export const fermiQuestions = raw.questions as unknown as FermiQuestion[]
export const fermiById = new Map(fermiQuestions.map((q) => [q.id, q]))

// ジャンルの一覧。fermi.json に出てくる順
export const fermiGenres = [...new Set(fermiQuestions.map((q) => q.genre))]

// 表示用の番号(fermi-012 → 012)
export const fermiNo = (q: FermiQuestion) => q.id.replace('fermi-', '')
