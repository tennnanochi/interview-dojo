// フェルミ道場の演習で記入する内容(5段階)。書きかけとして端末に保存し、後で模範解答と見比べる
import type { FermiApproach, FermiQuestion } from '../data/fermi'

export const FERMI_STEPS = [
  { short: '前提', title: '前提・定義を決める', next: '① 前提へ' },
  { short: '方針', title: 'アプローチを2つ出して、1つに絞る', next: '② 方針へ' },
  { short: 'モデル', title: '3段で分解し、セグメントを切る', next: '③ モデル化へ' },
  { short: '計算', title: '数字を置いて計算する', next: '④ 計算へ' },
  { short: '検証', title: '別の式で桁を確かめる', next: '⑤ 検証へ' },
] as const

export const STEP_MARK = ['①', '②', '③', '④', '⑤']

export type FermiDraft = {
  step: number // いま開いている段階(0〜4)
  scope: string // ①前提・定義
  approach: number | null // ②本線に選んだ案(問題データの approaches の番号)
  reason: string // ②選んだ理由
  breakdown: [string, string, string] // ③3段の分解
  segment: string // ③セグメント
  calc: string // ④計算メモ
  result: string // ④結果
  check: string // ⑤検証
  startedAt: string // はじめた時刻(所要時間の計算用)
}

export function emptyFermiDraft(now: Date): FermiDraft {
  return {
    step: 0,
    scope: '',
    approach: null,
    reason: '',
    breakdown: ['', '', ''],
    segment: '',
    calc: '',
    result: '',
    check: '',
    startedAt: now.toISOString(),
  }
}

// まだ何も記入していないか
export function isBlankFermiDraft(d: FermiDraft): boolean {
  return (
    d.approach === null &&
    [d.scope, d.reason, ...d.breakdown, d.segment, d.calc, d.result, d.check].every((t) => t.trim() === '')
  )
}

// 各段階に記入があるか(段階の印を塗るのに使う)
export function filledSteps(d: FermiDraft): boolean[] {
  const has = (...texts: string[]) => texts.some((t) => t.trim() !== '')
  return [has(d.scope), d.approach !== null, has(...d.breakdown, d.segment), has(d.calc, d.result), has(d.check)]
}

// 文字列から決まった数を作る(問題ごとに並びを固定するため)
function hash(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return h >>> 0
}

export type ApproachOption = FermiApproach & { index: number } // index は問題データでの番号

// ②の選択肢の並び。データでは本線の案がいつも先頭なので、問題ごとに決まった順に並べ替える
// (同じ問題は何度開いても同じ並び。問題が違えば本線の位置も変わる)
export function approachOptions(question: FermiQuestion): ApproachOption[] {
  return question.approaches
    .map((a, index) => ({ ...a, index, order: hash(`${question.id}:${index}`) }))
    .sort((a, b) => a.order - b.order)
    .map(({ order: _order, ...option }) => option)
}
