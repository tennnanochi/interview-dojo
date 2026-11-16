import { Link } from 'react-router-dom'
import { useCardStates } from '../hooks/useCardStates'
import { useSync } from '../sync/controller'
import styles from './SyncBadge.module.css'

// 同期の状態を一言で出す。押すとログイン画面か記録画面へ
export function SyncBadge() {
  const sync = useSync()
  const { states } = useCardStates()
  const pending = [...states.values()].filter((s) => s.dirty).length

  if (!sync.authReady) return null

  let label: string
  let tone = styles.quiet
  let to = '/records'
  if (!sync.enabled) label = '同期なし'
  else if (!sync.user) {
    label = '未ログイン'
    to = '/login'
  } else if (!sync.online) label = pending > 0 ? `オフライン・未送信${pending}件` : 'オフライン'
  else if (sync.syncing) label = '同期中'
  else if (sync.error) {
    label = '同期エラー'
    tone = styles.warn
  } else if (pending > 0) label = `未送信${pending}件`
  else {
    label = '同期済み'
    tone = styles.ok
  }

  return (
    <Link to={to} className={styles.hit} aria-label={`同期の状態:${label}`}>
      <span className={`${styles.badge} ${tone}`}>{label}</span>
    </Link>
  )
}
