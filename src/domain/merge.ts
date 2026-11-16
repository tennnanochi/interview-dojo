// 端末とDBのカード状態の突き合わせ(仕様書「同期の仕組み」4)
// 同じカードは updated_at が新しいほうを丸ごと採用する
import type { CardState } from '../db/types'

export type MergeResult = {
  adopt: CardState[] // DBのほうが新しい → 端末に取り込む
  push: CardState[] // 端末のほうが新しい、またはDBにない → DBへ送る
  clean: CardState[] // 両方同じ → 送る必要なし(未送信の印だけ外す)
}

export function mergeStates(local: CardState[], remote: CardState[]): MergeResult {
  const result: MergeResult = { adopt: [], push: [], clean: [] }
  const localById = new Map(local.map((s) => [s.cardId, s]))
  const remoteIds = new Set<string>()

  for (const r of remote) {
    remoteIds.add(r.cardId)
    const l = localById.get(r.cardId)
    if (!l) {
      result.adopt.push(r)
      continue
    }
    const diff = Date.parse(r.updatedAt) - Date.parse(l.updatedAt)
    if (diff > 0) result.adopt.push(r)
    else if (diff < 0) result.push.push(l)
    else if (l.dirty) result.clean.push(l)
  }

  for (const l of local) if (!remoteIds.has(l.cardId)) result.push.push(l)
  return result
}
