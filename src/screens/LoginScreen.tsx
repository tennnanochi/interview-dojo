import { useState, type FormEvent } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { sendLoginLink, useSync } from '../sync/controller'
import s from './LoginScreen.module.css'

// ログイン。メールアドレスにログインリンク(Magic Link)を送る
export function LoginScreen() {
  const sync = useSync()
  const [email, setEmail] = useState('')
  const [phase, setPhase] = useState<'input' | 'sending' | 'sent'>('input')
  const [error, setError] = useState<string | null>(null)

  if (sync.user) return <Navigate to="/records" replace />

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setPhase('sending')
    setError(null)
    try {
      await sendLoginLink(email.trim())
      setPhase('sent')
    } catch (err) {
      console.error(err)
      setError('メールを送れませんでした。アドレスと通信状況を確認して、少し待ってからもう一度試してください。')
      setPhase('input')
    }
  }

  return (
    <div className={s.screen}>
      <header className={s.top}>
        <Link to="/" className={s.close} aria-label="ホームに戻る">
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </Link>
      </header>

      <div className={s.body}>
        <h1 className={s.title}>ログイン</h1>

        {!sync.enabled ? (
          <p className={s.lead}>
            Supabaseの接続値が設定されていません。<code>.env.local</code> に VITE_SUPABASE_URL と VITE_SUPABASE_ANON_KEY
            を入れて、開発サーバーを起動し直してください。
          </p>
        ) : phase === 'sent' ? (
          <>
            <p className={s.lead}>
              <strong>{email.trim()}</strong> にログイン用のメールを送りました。
            </p>
            <p className={s.lead}>メールのリンクを、この端末のこのブラウザで開いてください。開くとログインした状態でここに戻ります。</p>
            <button type="button" className={s.secondary} onClick={() => setPhase('input')}>
              アドレスを入れ直す
            </button>
          </>
        ) : (
          <form className={s.form} onSubmit={onSubmit}>
            <p className={s.lead}>ログインすると、学習履歴がスマホとPCで同じになります。パスワードは使いません。</p>
            <label className={s.label} htmlFor="email">
              メールアドレス
            </label>
            <input
              id="email"
              className={s.input}
              type="email"
              inputMode="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && (
              <p className={s.error} role="alert">
                {error}
              </p>
            )}
            <button type="submit" className={s.primary} disabled={phase === 'sending'}>
              {phase === 'sending' ? '送信中' : 'ログインリンクを送る'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
