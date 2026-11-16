import { useEffect, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { Checklist } from '../components/Checklist'
import { fermiById, fermiNo, fermiTypes, type FermiQuestion } from '../data/fermi'
import { deleteDraft, loadAttempts, loadDraft, saveAttempts } from '../db/local'
import type { Attempt } from '../db/types'
import { FERMI_CHECKS, elapsedSec, formatDuration, makeAttempt, parseAnswer, scoreLabel } from '../domain/attempts'
import { formatDateKey, toDateKey } from '../domain/date'
import { STEP_MARK, isBlankFermiDraft, type FermiDraft } from '../domain/fermiDraft'
import { requestSync } from '../sync/controller'
import s from './exercise.module.css'
import r from './review.module.css'

type Loaded = { draft: FermiDraft | null; last: Attempt | undefined }

// 模範解答。自分の記入と段階ごとに見比べ、チェック項目で自己採点して保存する
export function FermiReviewScreen() {
  const { id } = useParams()
  const question = id ? fermiById.get(id) : undefined
  if (!question) return <Navigate to="/fermi" replace />
  return <Review key={question.id} question={question} />
}

function Review({ question }: { question: FermiQuestion }) {
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [checked, setChecked] = useState<ReadonlySet<string>>(new Set())
  const [saved, setSaved] = useState<Attempt | null>(null)
  const [error, setError] = useState<string | null>(null)

  // 書きかけ(いま解いた分)があればそれを、なければ前回の記録を見せる
  useEffect(() => {
    Promise.all([loadDraft<FermiDraft>('fermi', question.id), loadAttempts('fermi')])
      .then(([draft, attempts]) => {
        const data = draft && !isBlankFermiDraft(draft.data) ? draft.data : null
        setLoaded({ draft: data, last: attempts.find((a) => a.questionId === question.id) })
      })
      .catch((e) => {
        console.error(e)
        setLoaded({ draft: null, last: undefined })
      })
  }, [question.id])

  if (!loaded) return <div className={s.screen} />

  const record = saved ?? (loaded.draft ? null : loaded.last) // 保存済みの記録を見ているとき
  const mine: Partial<FermiDraft> | null = loaded.draft ?? parseAnswer<FermiDraft>(record ?? undefined)
  const marks = record ? new Set(record.selfScore.checks) : checked
  const adopted = question.approaches[question.adopted]
  const chosen = mine?.approach != null ? question.approaches[mine.approach] : undefined
  const approachName = (a: { type: string; formula: string }) => `${fermiTypes[a.type]?.name ?? a.type}:${a.formula}`

  async function save() {
    if (!loaded?.draft) return
    const { step: _step, startedAt, ...answer } = loaded.draft
    const now = new Date()
    const attempt = makeAttempt('fermi', question.id, answer, { checks: [...checked], max: FERMI_CHECKS.length }, elapsedSec(startedAt, now), now)
    try {
      await saveAttempts([attempt])
      await deleteDraft('fermi', question.id)
      setSaved(attempt)
      setLoaded({ draft: null, last: attempt })
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
        <Link to={loaded.draft ? `/fermi/${question.id}` : '/fermi'} className={s.back} aria-label={loaded.draft ? '演習に戻る' : '問題一覧に戻る'}>
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

        {record && (
          <p className={r.record} role="status">
            {saved ? '保存しました。' : '前回の記録:'}
            <span className="num">{formatDateKey(toDateKey(new Date(record.createdAt)))}</span>・自己採点 <strong className="num">{scoreLabel(record.selfScore)}</strong>
            {record.durationSec !== null && `・${formatDuration(record.durationSec)}`}
          </p>
        )}
        {!mine && <p className={r.record}>まだ解いていません。先に自分で考えてから見ると、身につきます。</p>}

        <Step title={`${STEP_MARK[0]} 前提・定義`}>
          <Mine show={!!mine} text={mine?.scope} />
          <Model>{question.scope}</Model>
        </Step>

        <Step title={`${STEP_MARK[1]} アプローチ`}>
          {mine && (
            <Mine
              show
              text={chosen ? approachName(chosen) : undefined}
              note={chosen ? (chosen === adopted ? '模範解答と同じ案' : '模範解答とは別の案') : undefined}
              good={chosen === adopted}
              extra={mine.reason}
            />
          )}
          <Model label="本線にする案">{approachName(adopted)}</Model>
          <Model label="ほかの案(検算に回す)">
            {question.approaches
              .filter((a) => a !== adopted)
              .map((a) => approachName(a))
              .join('\n')}
          </Model>
          <Model label="選ぶ理由">{question.why}</Model>
        </Step>

        <Step title={`${STEP_MARK[2]} モデル化`}>
          {(['1段目', '2段目', '3段目'] as const).map((label, i) => (
            <div key={label} className={r.pair}>
              <Mine show={!!mine} label={`自分の${label}`} text={mine?.breakdown?.[i]} />
              <Model label={`模範解答の${label}`}>{question.breakdown[i]}</Model>
            </div>
          ))}
          <div className={r.pair}>
            <Mine show={!!mine} label="自分のセグメント" text={mine?.segment} />
            <Model label="模範解答のセグメント">{question.segment}</Model>
          </div>
        </Step>

        <Step title={`${STEP_MARK[3]} 計算`}>
          <Mine show={!!mine} label="自分の計算メモ" text={mine?.calc} mono />
          <Mine show={!!mine} label="自分の結果" text={mine?.result} mono />
          <p className={r.plain}>数値の模範解答はありません。⑤の式で出した数字と、桁が合うかで確かめます。</p>
        </Step>

        <Step title={`${STEP_MARK[4]} 検証`}>
          <Mine show={!!mine} text={mine?.check} />
          <Model label="検証に使う式">{question.check}</Model>
        </Step>

        {(loaded.draft || record) && (
          <section className={s.card}>
            <h2 className={s.cardTitle}>
              自己採点 <span className="num">{marks.size}/{FERMI_CHECKS.length}</span>
            </h2>
            <Checklist items={FERMI_CHECKS} checked={marks} onToggle={loaded.draft ? toggle : undefined} />
          </section>
        )}
        {error && (
          <p className={r.error} role="alert">
            {error}
          </p>
        )}
      </div>

      <div className={s.actions}>
        {loaded.draft ? (
          <>
            <Link to={`/fermi/${question.id}`} className={s.secondary}>
              演習に戻る
            </Link>
            <button type="button" className={s.primary} onClick={save}>
              自己採点を保存
            </button>
          </>
        ) : (
          <>
            <Link to="/fermi" className={s.secondary}>
              問題一覧へ
            </Link>
            <Link to={`/fermi/${question.id}`} className={s.primary}>
              {mine ? 'もう一度解く' : '解いてみる'}
            </Link>
          </>
        )}
      </div>
    </div>
  )
}

function Step({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className={s.card}>
      <h2 className={s.cardTitle}>{title}</h2>
      {children}
    </section>
  )
}

type MineProps = { show: boolean; label?: string; text?: string; note?: string; good?: boolean; extra?: string; mono?: boolean }

// 自分の記入
function Mine({ show, label = '自分の記入', text, note, good, extra, mono }: MineProps) {
  if (!show) return null
  const blank = !text || text.trim() === ''
  return (
    <div className={r.block}>
      <span className={r.label}>
        {label}
        {note && <span className={good ? `${r.note} ${r.good}` : r.note}>{note}</span>}
      </span>
      <p className={blank ? `${r.text} ${r.blank}` : mono ? `${r.text} ${r.mono}` : r.text}>{blank ? '(未記入)' : text}</p>
      {extra && extra.trim() !== '' && <p className={r.text}>{extra}</p>}
    </div>
  )
}

// 模範解答
function Model({ label = '模範解答', children }: { label?: string; children: string }) {
  return (
    <div className={`${r.block} ${r.model}`}>
      <span className={r.label}>{label}</span>
      <p className={r.text}>{children}</p>
    </div>
  )
}
