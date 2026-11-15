// 学習履歴の書き出し(JSON)。万一のときのバックアップ用
import { toDateKey } from '../domain/date'
import { loadCardStates, loadReviews } from './local'

export async function exportBackup(): Promise<void> {
  const [cardStates, reviews] = await Promise.all([loadCardStates(), loadReviews()])
  const now = new Date()
  const body = JSON.stringify({ app: 'interview-dojo', formatVersion: 1, exportedAt: now.toISOString(), cardStates, reviews }, null, 2)

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
