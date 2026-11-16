import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ProgressBar } from '../components/ProgressBar'
import { ScreenHeader } from '../components/ScreenHeader'
import { cards } from '../data/cards'
import { exportBackup } from '../db/export'
import { loadReviews } from '../db/local'
import type { Review } from '../db/types'
import { toDateKey } from '../domain/date'
import { activity, progressByGroup, summarize } from '../domain/progress'
import { useCardStates } from '../hooks/useCardStates'
import { requestSync, signOut, useSync } from '../sync/controller'
import s from './RecordsScreen.module.css'

const percent = (n: number, total: number) => (total > 0 ? Math.round((n / total) * 100) : 0)

// 記録:連続学習日数、覚えた数、カテゴリ別の制覇率、アカウントと同期、データの書き出し
export function RecordsScreen() {
  const { states } = useCardStates()
  const [reviews, setReviews] = useState<Review[]>([])
  const [exportState, setExportState] = useState<'idle' | 'done' | 'error'>('idle')

  const sync = useSync()
  const pending = [...states.values()].filter((st) => st.dirty).length

  // 同期が終わるたびに読み直す(他の端末の採点ログが入るため)
  useEffect(() => {
    loadReviews().then(setReviews, (e) => console.error(e))
  }, [sync.lastSyncedAt])

  const sum = summarize(cards, states)
  const act = activity(reviews, toDateKey(new Date()))
  const groups = progressByGroup(cards, states)

  async function onExport() {
    try {
      await exportBackup()
      setExportState('done')
    } catch (e) {
      console.error(e)
      setExportState('error')
    }
  }

  return (
    <>
      <ScreenHeader title="記録" />
      <div className={s.body}>
        <div className={s.tiles}>
          <section className={s.tile}>
            <h2 className={s.tileLabel}>連続学習</h2>
            <p className={s.tileValue}>
              <span className="num">{act.streakDays}</span>日
            </p>
            <p className={s.tileSub}>{act.studiedToday ? '今日は学習済み' : act.streakDays > 0 ? '今日やれば続きます' : '今日からはじめましょう'}</p>
          </section>
          <section className={s.tile}>
            <h2 className={s.tileLabel}>今日の採点</h2>
            <p className={s.tileValue}>
              <span className="num">{act.todayCount}</span>枚
            </p>
            <p className={s.tileSub}>
              これまでに <span className="num">{act.totalCount}</span>枚
            </p>
          </section>
        </div>

        <section className={s.panel}>
          <div className={s.panelHead}>
            <h2 className={s.panelTitle}>暗記帳の進み具合</h2>
            <span className={s.sub}>
              覚えた <span className="num">{sum.known} / {sum.total}</span>
            </span>
          </div>
          <ProgressBar value={sum.known} max={sum.total} label="暗記帳の進み具合" />
          <dl className={s.breakdown}>
            {[
              ['定着', sum.mastered],
              ['覚えた', sum.known - sum.mastered],
              ['復習中', sum.learning],
              ['未出題', sum.fresh],
            ].map(([label, n]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd className="num">{n}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className={s.panel}>
          <h2 className={s.panelTitle}>カテゴリ別の制覇率</h2>
          <ul className={s.groups}>
            {groups.map((g) => (
              <li key={g.group} className={s.group}>
                <div className={s.groupHead}>
                  <span>{g.group}</span>
                  <span className={s.sub}>
                    <span className="num">{g.known} / {g.total}</span>
                    <span className={`num ${s.pct}`}>{percent(g.known, g.total)}%</span>
                  </span>
                </div>
                <ProgressBar value={g.known} max={g.total} label={`${g.group}の制覇率`} />
              </li>
            ))}
          </ul>
        </section>

        <section className={s.panel}>
          <h2 className={s.panelTitle}>アカウントと同期</h2>
          {!sync.enabled ? (
            <p className={s.sub}>同期は未設定です(Supabaseの接続値がありません)。学習履歴はこの端末にだけ保存されます。</p>
          ) : !sync.user ? (
            <>
              <p className={s.sub}>ログインすると、学習履歴がスマホとPCで同じになります。今はこの端末にだけ保存されています。</p>
              <Link to="/login" className={s.secondary}>
                ログインする
              </Link>
            </>
          ) : (
            <>
              <p className={s.account}>{sync.user.email}</p>
              <p className={s.sub} role="status">
                {!sync.online
                  ? 'オフラインです。つながったら自動で同期します。'
                  : sync.syncing
                    ? '同期中です。'
                    : sync.error
                      ? sync.error
                      : sync.lastSyncedAt
                        ? `最後の同期 ${new Date(sync.lastSyncedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}`
                        : 'まだ同期していません。'}
                {pending > 0 && ` 未送信 ${pending}件。`}
              </p>
              <button type="button" className={s.secondary} onClick={() => requestSync()} disabled={sync.syncing || !sync.online}>
                今すぐ同期
              </button>
              <button type="button" className={s.plain} onClick={() => void signOut()}>
                ログアウト
              </button>
            </>
          )}
        </section>

        <section className={s.panel}>
          <h2 className={s.panelTitle}>データ</h2>
          <p className={s.sub}>学習履歴をJSONファイルに保存します(万一のときのバックアップ用)。</p>
          <button type="button" className={s.secondary} onClick={onExport}>
            学習履歴を書き出す
          </button>
          <p className={s.sub} role="status">
            {exportState === 'done' && '書き出しました。ダウンロードしたファイルを確認してください。'}
            {exportState === 'error' && '書き出せませんでした。もう一度試してください。'}
          </p>
        </section>
      </div>
    </>
  )
}
