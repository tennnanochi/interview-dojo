import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FlashCard } from '../components/FlashCard'
import { GradeButtons } from '../components/GradeButtons'
import { ProgressBar } from '../components/ProgressBar'
import { cards, type Card } from '../data/cards'
import type { CardState, Grade } from '../db/types'
import { formatDateKey, toDateKey } from '../domain/date'
import { parseStudyOptions, pickSession, type StudyMode } from '../domain/session'
import { gradeCard, useCardStates } from '../hooks/useCardStates'
import s from './StudyScreen.module.css'

type Result = { card: Card; grade: Grade; state: CardState }

// 出すカードがないときの説明(モードごと)
const EMPTY_TEXT: Record<StudyMode, string> = {
  due: '復習期限が来たカードはありません。新しいカードは、暗記帳の「未暗記だけ」から練習できます。',
  unlearned: '未暗記のカードはありません。',
  all: '該当するカードがありません。',
}

// カード出題。1セット分のカードをめくって3段階で採点し、最後に結果を出す
export function StudyScreen() {
  const { ready, states, error } = useCardStates()
  const [params] = useSearchParams()
  const options = parseStudyOptions(params)
  const pick = () => pickSession(cards, states, toDateKey(new Date()), options)
  const [queue, setQueue] = useState<Card[] | null>(null)
  const [index, setIndex] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [results, setResults] = useState<Result[]>([])

  // 履歴を読み終えたら、1セット分のカードを決める(途中で入れ替えない)
  useEffect(() => {
    if (ready && queue === null) setQueue(pick())
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, queue])

  const card = queue?.[index]

  function grade(g: Grade) {
    if (!card || !flipped) return
    const state = gradeCard(card, g)
    setResults((r) => [...r, { card, grade: g, state }])
    setIndex((i) => i + 1)
    setFlipped(false)
  }

  function restart() {
    setQueue(null)
    setIndex(0)
    setFlipped(false)
    setResults([])
  }

  // PC用のキー操作:スペースでめくる、←忘れた ↑あやふや →覚えた
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!card) return
      if (e.key === ' ') {
        if (e.target instanceof HTMLButtonElement) return // ボタンにフォーカス中はボタン自身が反応する
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (e.key === 'ArrowLeft') grade('forgot')
      else if (e.key === 'ArrowUp') grade('unsure')
      else if (e.key === 'ArrowRight') grade('good')
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (queue === null) return <div className={s.screen} />

  const total = queue.length

  return (
    <div className={s.screen}>
      <header className={s.top}>
        <Link to="/" className={s.close} aria-label="ホームに戻る">
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </Link>
        <ProgressBar value={Math.min(index, total)} max={total} label="このセットの進み具合" />
        <span className={`${s.count} num`}>
          {Math.min(index + 1, total)} / {total}
        </span>
      </header>

      {error && <p className={s.error}>{error}</p>}

      {card ? (
        <div className={s.body}>
          <FlashCard
            key={card.id}
            card={card}
            prev={states.get(card.id)}
            flipped={flipped}
            onFlip={() => setFlipped((f) => !f)}
            onSwipe={grade}
          />
          <p className={s.prompt}>{flipped ? '思い出せましたか?' : '答えを思い浮かべてから、めくる'}</p>
          <div className={s.actions}>
            {flipped ? (
              <GradeButtons prev={states.get(card.id)} onGrade={grade} />
            ) : (
              <button type="button" className={s.primary} onClick={() => setFlipped(true)}>
                答えを見る
              </button>
            )}
          </div>
        </div>
      ) : (
        <SessionResult results={results} hasMore={pick().length > 0} emptyText={EMPTY_TEXT[options.mode]} onRestart={restart} />
      )}
    </div>
  )
}

type ResultProps = { results: Result[]; hasMore: boolean; emptyText: string; onRestart: () => void }

function SessionResult({ results, hasMore, emptyText, onRestart }: ResultProps) {
  const count = (g: Grade) => results.filter((r) => r.grade === g).length

  // このセットのカードのうち、いちばん早い復習日とその枚数
  const dues = results.map((r) => r.state.dueOn).filter((d): d is string => d !== null).sort()
  const nextDue = dues[0]
  const nextCount = dues.filter((d) => d === nextDue).length

  return (
    <div className={s.body}>
      <section className={s.result}>
        {results.length === 0 ? (
          <>
            <h1 className={s.resultTitle}>今日やるカードはありません</h1>
            <p className={s.resultSub}>{emptyText}</p>
          </>
        ) : (
          <>
            <h1 className={s.resultTitle}>おつかれさまでした</h1>
            <p className={s.resultSub}>{results.length}枚を採点しました</p>
            <dl className={s.tally}>
              <div className={s.tallyItem}>
                <dt>覚えた</dt>
                <dd className={`num ${s.good}`}>{count('good')}</dd>
              </div>
              <div className={s.tallyItem}>
                <dt>あやふや</dt>
                <dd className="num">{count('unsure')}</dd>
              </div>
              <div className={s.tallyItem}>
                <dt>忘れた</dt>
                <dd className={`num ${s.forgot}`}>{count('forgot')}</dd>
              </div>
            </dl>
            {nextDue && (
              <p className={s.next}>
                次の復習は <strong className="num">{formatDateKey(nextDue)}</strong>({nextCount}枚)
              </p>
            )}
          </>
        )}
      </section>
      <div className={s.actions}>
        {hasMore && (
          <button type="button" className={s.primary} onClick={onRestart}>
            もう1セット
          </button>
        )}
        <Link to="/" className={hasMore ? s.secondary : s.primary}>
          ホームへ
        </Link>
      </div>
    </div>
  )
}
