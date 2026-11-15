// 暗記帳の問題データ。data/cards.json を読むだけで、書き換えない
import raw from '../../data/cards.json'

export type CardSource = 'video' | 'added' | 'confirmed'

export type Card = {
  id: string // card-0001 形式。変えない・再利用しない
  legacyId: string // 旧暗記帳のid(区分|項目名)。引き継ぎ用
  version: number // 数値を直したら1上げる
  group: string // カテゴリ(例:人口・世帯)
  section: string // 一覧の見出し(例:基本)
  item: string // 表:項目
  value: string // 裏:暗記値
  note: string // 裏:実数・メモ
  source: CardSource
  updated: boolean
}

export const cards = raw.cards as Card[]

export const cardById = new Map(cards.map((c) => [c.id, c]))

// カテゴリ(group)の一覧。cards.json に出てくる順
export const groups = [...new Set(cards.map((c) => c.group))]
