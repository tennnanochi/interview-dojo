// 端末内(IndexedDB)に置く学習履歴の型。Supabaseの card_states / reviews と対応する

export type Grade = 'good' | 'unsure' | 'forgot' // 覚えた / あやふや / 忘れた
export type CardStatus = 'new' | 'learning' | 'known'

export type CardState = {
  cardId: string
  status: CardStatus
  dueOn: string | null // 次の復習日(YYYY-MM-DD)
  streak: number // 「覚えた」の連続数。復習間隔はここから決まる
  cardVersion: number // 採点したときのカードのversion
  updatedAt: string // 採点した時刻(ISO)。同期で新しいほうを採用するのに使う
  dirty: boolean // まだSupabaseに送っていない(端末内だけの印)
  lastGrade?: Grade // 前回の採点(端末内だけ。カードに「前回:あやふや」と出す)
}

export type Review = {
  key: string // カードid|採点時刻。同じログを二重に持たないための鍵
  cardId: string
  grade: Grade
  reviewedAt: string // ISO
  synced: boolean // Supabaseに送ったか(端末内だけの印)
}

// ---- フェルミ道場・ケース道場の挑戦の記録(Supabaseの attempts と対応する) ----

export type AttemptKind = 'fermi' | 'case'

export type SelfScore = {
  checks: string[] // チェックを付けた項目のid
  max: number // チェック項目の数
  phases?: { name: string; sec: number; usedSec: number }[] // ケース道場:区間ごとの制限時間と、実際に使った時間
}

export type Attempt = {
  key: string // 種類|問題id|保存時刻。同じ記録を二重に持たないための鍵
  kind: AttemptKind
  questionId: string
  answer: string // 記入内容(JSONの文字列)
  selfScore: SelfScore
  durationSec: number | null
  createdAt: string // ISO
  synced: boolean // Supabaseに送ったか(端末内だけの印)
}
