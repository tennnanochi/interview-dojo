import type { CardState, Grade } from '../db/types'
import { nextIntervalDays } from '../domain/srs'
import { GRADE_LABEL } from './grades'
import styles from './GradeButtons.module.css'

type Props = {
  prev: CardState | undefined // 採点前の状態(「次は3日後」の計算に使う)
  onGrade: (grade: Grade) => void
}

// めくった後の3択。左から 忘れた / あやふや / 覚えた(スワイプの向きと同じ並び)
export function GradeButtons({ prev, onGrade }: Props) {
  const days = nextIntervalDays(prev, 'good')
  return (
    <div className={styles.row}>
      <button type="button" className={`${styles.btn} ${styles.forgot}`} onClick={() => onGrade('forgot')}>
        {GRADE_LABEL.forgot}
        <span className={styles.sub}>明日もう一度</span>
      </button>
      <button type="button" className={`${styles.btn} ${styles.unsure}`} onClick={() => onGrade('unsure')}>
        {GRADE_LABEL.unsure}
        <span className={styles.sub}>間隔そのまま</span>
      </button>
      <button type="button" className={`${styles.btn} ${styles.good}`} onClick={() => onGrade('good')}>
        {GRADE_LABEL.good}
        <span className={styles.sub}>{days === 1 ? '次は明日' : `次は${days}日後`}</span>
      </button>
    </div>
  )
}
