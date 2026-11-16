import { Link, Navigate, useParams } from 'react-router-dom'
import { fermiById, fermiNo } from '../data/fermi'
import s from './FermiExerciseScreen.module.css'

// フェルミ道場の演習。5段階の記入欄は次の回で作る(今は問題の表示まで)
export function FermiExerciseScreen() {
  const { id } = useParams()
  const question = id ? fermiById.get(id) : undefined
  if (!question) return <Navigate to="/fermi" replace />

  return (
    <div className={s.screen}>
      <header className={s.top}>
        <Link to="/fermi" className={s.back} aria-label="問題一覧に戻る">
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        <span className={s.topTitle}>フェルミ道場</span>
      </header>
      <div className={s.body}>
        <div className={s.question}>
          <span className={s.meta}>
            No.{fermiNo(question)} ・ {question.genre}
          </span>
          <h1 className={s.title}>{question.title}</h1>
        </div>
        <p className={s.note}>5段階の演習(前提→方針→モデル→計算→検証)は、次の回で追加します。</p>
      </div>
    </div>
  )
}
