import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Checklist } from '../components/Checklist'
import { FeedbackRequest } from '../components/FeedbackRequest'
import { askedLabel, caseById, caseLevels, caseNo, caseTypeNames, type CaseQuestion } from '../data/cases'
import { deleteDraft, loadAttempts, loadDraft, saveAttempts } from '../db/local'
import type { Attempt, SelfScore } from '../db/types'
import { caseChecks, formatDuration, makeAttempt, parseAnswer, scoreLabel } from '../domain/attempts'
import type { CaseDraft } from '../domain/caseDraft'
import { finish } from '../domain/caseTimer'
import { formatDateKey, toDateKey } from '../domain/date'
import { caseFeedbackPrompt } from '../domain/feedbackPrompt'
import { requestSync } from '../sync/controller'
import s from './exercise.module.css'
import r from './review.module.css'
import c from './CasePracticeScreen.module.css'

type Written = { memo: string; answer: string }
type Loaded = { written: Written | null; phases: SelfScore['phases']; last: Attempt | undefined }

// ケース道場の振り返り。回答を見ながら、チェックリストで自己採点して保存する
export function CaseReviewScreen() {
  const { id } = useParams()
  const question = id ? caseById.get(id) : undefined
  if (!question) return <Navigate to="/case" replace />
  return <Review key={question.id} question={question} />
}

function Review({ question }: { question: CaseQuestion }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set())
  const [saved, setSaved] = useState<Attempt | null>(null)
  const [error, setError] = useState<string | null>(null)
  const items = caseChecks(question.type)

  // いま練習した分(書きかけ)があればそれを、なければ前回の記録を見せる
  useEffect(() => {
    Promise.all([loadDraft<CaseDraft>('case', question.id), loadAttempts('case')])
      .then(([draft, attempts]) => {
        const last = attempts.find((a) => a.questionId === question.id)
        if (!draft?.data.timer) return setLoaded({ written: null, phases: undefined, last })
        const timer = finish(draft.data.timer, Date.now())
        setLoaded({
          written: { memo: draft.data.memo, answer: draft.data.answer },
          phases: timer.phases.map((p, i) => ({ name: p.name, sec: p.sec, usedSec: timer.used[i] ?? 0 })),
          last,
        })
      })
      .catch((e) => {
        console.error(e)
        setLoaded({ written: null, phases: undefined, last: undefined })
      })
  }, [question.id])

  if (!loaded) return <div className={s.screen} />

  const practicing = loaded.written !== null // いま練習した分を採点しているか
  const record = saved ?? (practicing ? null : loaded.last)
  const written: Partial<Written> | null = loaded.written ?? parseAnswer<Written>(record ?? undefined)
  const phases = practicing ? loaded.phases : record?.selfScore.phases
  const marks = record ? new Set(record.selfScore.checks) : checked

  async function save() {
    if (!loaded?.written) return
    const total = (loaded.phases ?? []).reduce((a, p) => a + p.usedSec, 0)
    const attempt = makeAttempt('case', question.id, loaded.written, { checks: [...checked], max: items.length, phases: loaded.phases }, total, new Date())
    try {
      await saveAttempts([attempt])
      await deleteDraft('case', question.id)
      setSaved(attempt)
      setLoaded({ written: null, phases: undefined, last: attempt })
      requestSync(1000)
    } catch (e) {
      console.error(e)
      setError('保存できませんでした。もう一度試してください。')
    }
  }

  function toggle(id: string) {
    setChecked((prev) => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      return next
    })
  }

  return (
    <div className={s.screen}>
      <header className={s.top}>
        <Link to="/case" className={s.back} aria-label="お題バンクに戻る">
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        <span className={s.topTitle}>振り返り</span>
      </header>

      <div className={s.body}>
        <section className={s.card}>
          <div className={c.tags}>
            <span className={c.tagMain}>{caseTypeNames[question.type]}</span>
            <span className={c.tag}>{caseLevels[String(question.level)]}</span>
            <span className={c.tag}>{question.industry}</span>
            {question.company && (
              <span className={c.tag}>
                {question.company} <span className="num">{askedLabel(question)}</span>
              </span>
            )}
          </div>
          <span className={s.meta}>No.{caseNo(question)}</span>
          <h1 className={c.questionText}>{question.text}</h1>
        </section>

        {record && (
          <p className={r.record} role="status">
            {saved ? '保存しました。' : '前回の記録:'}
            <span className="num">{formatDateKey(toDateKey(new Date(record.createdAt)))}</span>・自己採点 <strong className="num">{scoreLabel(record.selfScore)}</strong>
          </p>
        )}
        {!written && <p className={r.record}>まだ練習していません。</p>}

        {phases && phases.length > 0 && (
          <section className={s.card}>
            <h2 className={s.cardTitle}>使った時間</h2>
            <dl className={r.times}>
              {phases.map((p) => (
                <div key={p.name}>
                  <dt>{p.name}</dt>
                  <dd className="num">
                    {formatDuration(p.usedSec)} <span>/ {formatDuration(p.sec)}</span>
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {written && (
          <>
            <section className={s.card}>
              <h2 className={s.cardTitle}>回答</h2>
              <p className={written.answer?.trim() ? r.text : `${r.text} ${r.blank}`}>{written.answer?.trim() ? written.answer : '(未記入)'}</p>
            </section>
            <section className={s.card}>
              <h2 className={s.cardTitle}>メモ</h2>
              <p className={written.memo?.trim() ? `${r.text} ${r.mono}` : `${r.text} ${r.blank}`}>{written.memo?.trim() ? written.memo : '(未記入)'}</p>
            </section>
            <section className={s.card}>
              <h2 className={s.cardTitle}>
                自己採点 <span className="num">{marks.size}/{items.length}</span>
              </h2>
              <Checklist items={items} checked={marks} onToggle={practicing ? toggle : undefined} />
            </section>
            <FeedbackRequest build={() => caseFeedbackPrompt(question.type, caseTypeNames[question.type], question.text, written, phases)} />
          </>
        )}
        {error && (
          <p className={r.error} role="alert">
            {error}
          </p>
        )}
      </div>

      <div className={s.actions}>
        {practicing ? (
          <>
            <Link to={`/case/${question.id}`} className={s.secondary}>
              練習に戻る
            </Link>
            <button type="button" className={s.primary} onClick={save}>
              自己採点を保存
            </button>
          </>
        ) : (
          <>
            <Link to="/case" className={s.secondary}>
              お題バンクへ
            </Link>
            <Link to={`/case/${question.id}`} className={s.primary}>
              {written ? 'もう一度練習する' : '練習する'}
            </Link>
          </>
        )}
      </div>
    </div>
  )
}
