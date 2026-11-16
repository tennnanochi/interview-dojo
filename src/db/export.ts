// 学習履歴の書き出し(JSON)。万一のときのバックアップ用
import { toDateKey } from '../domain/date'
import { loadAttempts, loadCardStates, loadDrafts, loadReviews } from './local'

export async function exportBackup(): Promise<void> {
  const [cardStates, reviews, attempts, fermiDrafts, caseDrafts] = await Promise.all([
    loadCardStates(),
    loadReviews(),
    loadAttempts(),
    loadDrafts('fermi'),
    loadDrafts('case'),
  ])
  const drafts = [...fermiDrafts, ...caseDrafts]
  const now = new Date()
  const body = JSON.stringify({ app: 'interview-dojo', formatVersion: 2, exportedAt: now.toISOString(), cardStates, reviews, attempts, drafts }, null, 2)

  // ファイルとして保存させる
  const url = URL.createObjectURL(new Blob([body], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `interview-dojo-backup-${toDateKey(now)}.json`
  document.body.append(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
