import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cards, groups } from '../data/cards'
import { toDateKey } from '../domain/date'
import { SESSION_SIZE, STUDY_MODES, selectCards, studyPath, type StudyMode } from '../domain/session'
import { useCardStates } from '../hooks/useCardStates'
import styles from './ModeSheet.module.css'

const MODE_LABEL: Record<StudyMode, { title: string; sub: string }> = {
  due: { title: '復習期限が来たもの', sub: '今日までに復習するカード' },
  unlearned: { title: '未暗記だけ', sub: 'まだ「覚えた」になっていないカード' },
  all: { title: '全部', sub: '覚えたカードも含めて見直す' },
}

type Props = { open: boolean; onClose: () => void }

// 出題設定:モードとカテゴリを選んで出題をはじめる(画面下から出るシート)
export function ModeSheet({ open, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null)
  const navigate = useNavigate()
  const { states } = useCardStates()
  const [mode, setMode] = useState<StudyMode>('due')
  const [group, setGroup] = useState<string | undefined>(undefined)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const today = toDateKey(new Date())
  const count = (m: StudyMode, g?: string) => selectCards(cards, states, today, { mode: m, group: g }).length
  const selected = count(mode, group)

  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      aria-label="出題設定"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose() // シートの外側(暗い部分)を押したら閉じる
      }}
    >
      <div className={styles.inner}>
        <div className={styles.head}>
          <h2 className={styles.title}>出題設定</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="閉じる">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div className={styles.scroll}>
          <div className={styles.modes} role="radiogroup" aria-label="出題モード">
            {STUDY_MODES.map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                className={mode === m ? `${styles.mode} ${styles.on}` : styles.mode}
                onClick={() => setMode(m)}
              >
                <span className={styles.modeText}>
                  <span className={styles.modeTitle}>{MODE_LABEL[m].title}</span>
                  <span className={styles.modeSub}>{MODE_LABEL[m].sub}</span>
                </span>
                <span className={`${styles.modeCount} num`}>{count(m, group)}</span>
              </button>
            ))}
          </div>

          <h3 className={styles.label}>カテゴリ</h3>
          <div className={styles.chips}>
            <button
              type="button"
              aria-pressed={group === undefined}
              className={group === undefined ? `${styles.chip} ${styles.on}` : styles.chip}
              onClick={() => setGroup(undefined)}
            >
              すべて
            </button>
            {groups.map((g) => (
              <button
                key={g}
                type="button"
                aria-pressed={group === g}
                className={group === g ? `${styles.chip} ${styles.on}` : styles.chip}
                onClick={() => setGroup(g)}
              >
                {g} <span className="num">{count(mode, g)}</span>
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          className={styles.start}
          disabled={selected === 0}
          onClick={() => navigate(studyPath({ mode, group }))}
        >
          {selected === 0 ? '該当するカードがありません' : `${Math.min(selected, SESSION_SIZE)}枚はじめる`}
        </button>
      </div>
    </dialog>
  )
}
