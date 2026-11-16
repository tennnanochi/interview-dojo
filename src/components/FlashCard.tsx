import { useRef, useState, type PointerEvent } from 'react'
import type { Card } from '../data/cards'
import type { CardState, Grade } from '../db/types'
import { GRADE_LABEL } from './grades'
import styles from './FlashCard.module.css'

type Props = {
  card: Card
  prev: CardState | undefined
  flipped: boolean
  onFlip: () => void
  onSwipe: (grade: Grade) => void
}

const TAP_LIMIT = 10 // これ未満の動きはタップ扱い
const SWIPE_LIMIT = 80 // これ以上動かして離すと採点

// 動かした向きから採点を決める:右=覚えた、左=忘れた、上=あやふや
function gradeFor(dx: number, dy: number): Grade | null {
  if (Math.abs(dx) >= Math.abs(dy)) {
    if (dx >= SWIPE_LIMIT) return 'good'
    if (dx <= -SWIPE_LIMIT) return 'forgot'
  } else if (dy <= -SWIPE_LIMIT) return 'unsure'
  return null
}

// 1枚のカード。タップでめくり、めくった後はスワイプでも採点できる
export function FlashCard({ card, prev, flipped, onFlip, onSwipe }: Props) {
  const start = useRef<{ x: number; y: number } | null>(null)
  const dragged = useRef(false)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  function onPointerDown(e: PointerEvent<HTMLButtonElement>) {
    start.current = { x: e.clientX, y: e.clientY }
    dragged.current = false
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  function onPointerMove(e: PointerEvent<HTMLButtonElement>) {
    if (!start.current) return
    const x = e.clientX - start.current.x
    const y = e.clientY - start.current.y
    if (Math.hypot(x, y) >= TAP_LIMIT) dragged.current = true
    if (flipped && dragged.current) setOffset({ x, y: Math.min(y, 0) })
  }

  function onPointerUp() {
    if (!start.current) return
    start.current = null
    const grade = flipped ? gradeFor(offset.x, offset.y) : null
    setOffset({ x: 0, y: 0 })
    if (grade) onSwipe(grade)
  }

  function onClick() {
    // 動かした後に離したときはめくらない
    if (dragged.current) {
      dragged.current = false
      return
    }
    onFlip()
  }

  const pending = flipped ? gradeFor(offset.x, offset.y) : null
  const moving = offset.x !== 0 || offset.y !== 0

  return (
    <button
      type="button"
      className={styles.card}
      style={{
        transform: `translate(${offset.x}px, ${offset.y}px) rotate(${offset.x / 30}deg)`,
        transition: moving ? 'none' : undefined,
      }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onClick={onClick}
      aria-label={flipped ? `${card.item}の答え。タップで表に戻す` : `${card.item}。タップで答えを見る`}
    >
      <span className={styles.tags}>
        <span className={styles.group}>{card.group}</span>
        {prev?.lastGrade && <span className={styles.last}>前回:{GRADE_LABEL[prev.lastGrade]}</span>}
        {pending && <span className={`${styles.pending} ${styles[pending]}`}>{GRADE_LABEL[pending]}</span>}
      </span>

      <span className={styles.center}>
        <span className={styles.section}>{card.section}</span>
        <span className={styles.item}>{card.item}</span>
        {flipped && (
          <>
            <span className={styles.rule} />
            <span className={styles.value}>{card.value}</span>
            {card.note && <span className={styles.note}>{card.note}</span>}
          </>
        )}
      </span>

      <span className={styles.hint}>{flipped ? 'タップで表に戻す' : 'タップで答えを見る'}</span>
    </button>
  )
}
