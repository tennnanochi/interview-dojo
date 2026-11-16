import { Link, Navigate, useParams } from 'react-router-dom'
import { fermiById, fermiNo } from '../data/fermi'
import s from './FermiExerciseScreen.module.css'

// 模範解答と自己採点。中身は次の回で作る(今は演習に戻る入口だけ)
export function FermiReviewScreen() {
  const { id } = useParams()
  const question = id ? fermiById.get(id) : undefined
  if (!question) return <Navigate to="/fermi" replace />

  return (
    <div className={s.screen}>
      <header className={s.top}>
        <Link to={`/fermi/${question.id}`} className={s.back} aria-label="演習に戻る">
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        <span className={s.topTitle}>模範解答</span>
      </header>
      <div className={s.body}>
        <div className={s.question}>
          <span className={s.meta}>
            No.{fermiNo(question)} ・ {question.genre}
          </span>
          <h1 className={s.title}>{question.title}</h1>
        </div>
        <p className={s.hint}>
          <span>模範解答との見比べと自己採点は、次の回で追加します。記入した内容は端末に保存されています。</span>
        </p>
      </div>
    </div>
  )
}
