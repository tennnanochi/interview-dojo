import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Calculator } from '../components/Calculator'
import { CardReference } from '../components/CardReference'
import { askedLabel, caseById, caseLevels, caseNo, caseTypeNames, type CaseQuestion } from '../data/cases'
import { emptyCaseDraft, isBlankCaseDraft, type CaseDraft, type CaseTab } from '../domain/caseDraft'
import { PHASE_MAX, PHASE_MIN, defaultPhases, finish, formatClock, isDone, isPaused, pause, resume, skip, startTimer, tick, viewTimer, type Phase, type TimerState } from '../domain/caseTimer'
import { useDraft } from '../hooks/useDraft'
import s from './exercise.module.css'
import c from './CasePracticeScreen.module.css'

const TABS: [CaseTab, string][] = [
  ['memo', 'メモ'],
  ['answer', '回答'],
  ['numbers', '数字'],
  ['calc', '電卓'],
]

// 区間が進んだときの更新内容。発表の区間に入ったら、回答タブを表示する
function entering(next: TimerState): Partial<CaseDraft> {
  const presenting = !isDone(next) && next.index === next.phases.length - 1
  return presenting ? { timer: next, tab: 'answer' } : { timer: next }
}

// ケース道場の練習画面。タイマーを見ながら、メモと回答を書く
export function CasePracticeScreen() {
  const { id } = useParams()
  const question = id ? caseById.get(id) : undefined
  if (!question) return <Navigate to="/case" replace />
  return <Practice key={question.id} question={question} />
}

function Practice({ question }: { question: CaseQuestion }) {
  const navigate = useNavigate()
  const { data, update, reset, flush } = useDraft<CaseDraft>({ kind: 'case', questionId: question.id, create: emptyCaseDraft, isBlank: isBlankCaseDraft })
  const [phases, setPhases] = useState<Phase[]>(() => defaultPhases(question.type)) // はじめる前の時間設定
  const [now, setNow] = useState(() => Date.now())

  const timer = data?.timer ?? null
  const running = timer !== null && timer.runningSince !== null

  // 動いている間は、1秒に数回、表示を更新する
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [running])

  // 区間が切り替わったら、保存して知らせる(発表の区間に入ったら回答を表示)
  const ticked = timer ? tick(timer, now) : null
  useEffect(() => {
    if (!timer || !ticked || ticked.index === timer.index) return
    update(entering(ticked))
    navigator.vibrate?.(isDone(ticked) ? [200, 100, 200] : 200)
  }, [timer, ticked, update])

  if (!data) return <div className={s.screen} />

  const tags = (
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
  )

  const back = (
    <Link to="/case" className={s.back} aria-label="お題バンクに戻る">
      <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M15 5l-7 7 7 7" />
      </svg>
    </Link>
  )

  // ---- はじめる前:時間を決める ----
  if (!timer) {
    const total = phases.reduce((a, p) => a + p.sec, 0) / 60
    const change = (i: number, diff: number) =>
      setPhases((list) => list.map((p, j) => (j === i ? { ...p, sec: Math.min(PHASE_MAX, Math.max(PHASE_MIN, p.sec / 60 + diff)) * 60 } : p)))
    return (
      <div className={s.screen}>
        <header className={s.top}>
          {back}
          <span className={s.topTitle}>ケース道場</span>
        </header>
        <div className={s.body}>
          <section className={s.card}>
            {tags}
            <span className={s.meta}>No.{caseNo(question)}</span>
            <h1 className={c.questionText}>{question.text}</h1>
          </section>
          <section className={s.card}>
            <h2 className={s.cardTitle}>
              時間配分 <span className="num">合計{total}分</span>
            </h2>
            {phases.map((p, i) => (
              <div key={p.name} className={c.phaseRow}>
                <span className={c.phaseName}>{p.name}</span>
                <button type="button" className={c.stepper} onClick={() => change(i, -1)} disabled={p.sec / 60 <= PHASE_MIN} aria-label={`${p.name}を1分減らす`}>
                  −
                </button>
                <span className={`${c.phaseMin} num`}>{p.sec / 60}分</span>
                <button type="button" className={c.stepper} onClick={() => change(i, 1)} disabled={p.sec / 60 >= PHASE_MAX} aria-label={`${p.name}を1分増やす`}>
                  +
                </button>
              </div>
            ))}
            <p className={c.plain}>時間が来ると自動で次の区間に進みます。発表は声に出して話します。</p>
          </section>
        </div>
        <div className={`${s.actions} ${c.single}`}>
          <button type="button" className={s.primary} onClick={() => update({ timer: startTimer(phases, Date.now()) })}>
            はじめる
          </button>
        </div>
      </div>
    )
  }

  // ---- 練習中 ----
  const view = viewTimer(timer, now)
  const done = isDone(ticked!)
  const paused = isPaused(ticked!)
  const lastPhase = !done && ticked!.index === ticked!.phases.length - 1

  function onFinish() {
    update({ timer: finish(timer!, Date.now()) })
    flush()
    navigate(`/case/${question.id}/review`)
  }

  return (
    <div className={s.screen}>
      <header className={s.top}>
        {back}
        <span className={`${s.topTitle} ${c.grow}`}>ケース道場</span>
        {!done && (
          <button
            type="button"
            className={c.pause}
            onClick={() => update({ timer: paused ? resume(timer, Date.now()) : pause(timer, Date.now()) })}
            aria-label={paused ? 'タイマーを再開' : 'タイマーを一時停止'}
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              {paused ? <path d="M8 5v14l11-7z" /> : <path d="M7 5h4v14H7zM13 5h4v14h-4z" />}
            </svg>
          </button>
        )}
        <div className={c.clock} role="timer" aria-label={`${view.phaseName} 残り${formatClock(view.remainingSec)}`}>
          <span className={c.phaseNow}>{paused ? '一時停止中' : view.phaseName}</span>
          <span className={done || view.remainingSec <= 30 ? `${c.time} ${c.late}` : c.time}>{formatClock(view.remainingSec)}</span>
        </div>
      </header>

      <div className={c.bars} aria-hidden="true">
        {ticked!.phases.map((p, i) => (
          <div key={p.name} className={c.bar} style={{ flexGrow: p.sec }}>
            <div className={c.barTrack}>
              <div className={c.barFill} style={{ width: `${view.fractions[i] * 100}%` }} />
            </div>
            <span className={i === ticked!.index ? `${c.barLabel} ${c.barNow}` : c.barLabel}>{p.name}</span>
          </div>
        ))}
      </div>

      <div className={c.work}>
        <section className={c.questionCard}>
          {tags}
          <h1 className={c.questionText}>{question.text}</h1>
        </section>

        <div className={c.tabs} role="tablist">
          {TABS.map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={data.tab === key} className={data.tab === key ? `${c.tab} ${c.tabOn}` : c.tab} onClick={() => update({ tab: key })}>
              {label}
            </button>
          ))}
        </div>

        {data.tab === 'memo' && (
          <label className={c.pane}>
            <span className={c.srOnly}>メモ</span>
            <textarea className={c.paper} value={data.memo} onChange={(e) => update({ memo: e.target.value })} placeholder={'前提:\n式:\n数字:'} />
          </label>
        )}
        {data.tab === 'answer' && (
          <label className={c.pane}>
            <span className={c.srOnly}>回答</span>
            <textarea
              className={lastPhase || done ? `${c.answer} ${c.big}` : c.answer}
              value={data.answer}
              onChange={(e) => update({ answer: e.target.value })}
              placeholder={'結論:\n根拠:\n施策(+10% / +50%):'}
            />
          </label>
        )}
        {data.tab === 'numbers' && (
          <div className={c.pane}>
            <CardReference />
          </div>
        )}
        {data.tab === 'calc' && (
          <div className={`${c.pane} ${c.scroll}`}>
            <Calculator />
          </div>
        )}
      </div>

      <div className={s.actions}>
        {done || lastPhase ? (
          <button type="button" className={s.secondary} onClick={reset}>
            やり直す
          </button>
        ) : (
          <button type="button" className={s.secondary} onClick={() => update(entering(skip(timer, Date.now())))}>
            次の区間へ
          </button>
        )}
        <button type="button" className={s.primary} onClick={onFinish}>
          終了して自己採点
        </button>
      </div>
    </div>
  )
}
