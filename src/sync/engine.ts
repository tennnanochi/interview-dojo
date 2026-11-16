// 同期1回分の流れ(仕様書「同期の仕組み」)
import { getMeta, loadUnsyncedReviews, saveReviews, setMeta } from '../db/local'
import { mergeStates } from '../domain/merge'
import { adoptRemote, getStates, markClean, whenReady } from '../hooks/useCardStates'
import { REVIEW_PAGE, type Remote } from './remote'

const LAST_REVIEW_ID = 'lastReviewId'

export async function syncOnce(remote: Remote): Promise<void> {
  await whenReady()

  // 1. 採点ログ:未送信分を追記する
  const unsent = await loadUnsyncedReviews()
  for (let i = 0; i < unsent.length; i += 500) {
    const chunk = unsent.slice(i, i + 500)
    await remote.insertReviews(chunk)
    await saveReviews(chunk.map((r) => ({ ...r, synced: true })))
  }

  // 2. 採点ログ:他の端末の分を「前回の続き」から取り込む
  let cursor = (await getMeta<number>(LAST_REVIEW_ID)) ?? 0
  for (;;) {
    const rows = await remote.fetchReviewsAfter(cursor)
    if (rows.length === 0) break
    await saveReviews(rows.map(({ id: _id, ...review }) => review))
    cursor = rows[rows.length - 1].id
    await setMeta(LAST_REVIEW_ID, cursor)
    if (rows.length < REVIEW_PAGE) break
  }

  // 3. カードの状態:全行を取り込んで突き合わせ、端末のほうが新しい行だけ送る
  const { adopt, push, clean } = mergeStates([...getStates().values()], await remote.fetchCardStates())
  await adoptRemote(adopt)
  if (push.length > 0) await remote.upsertCardStates(push)
  await markClean([...push, ...clean])
}
