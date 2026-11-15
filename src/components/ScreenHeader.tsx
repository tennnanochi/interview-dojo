import type { ReactNode } from 'react'
import styles from './ScreenHeader.module.css'

type Props = {
  title: string
  eyebrow?: string // タイトルの上の小さな一言
  right?: ReactNode // 右側に置く補足(覚えた数、同期バッジなど)
}

export function ScreenHeader({ title, eyebrow, right }: Props) {
  return (
    <header className={styles.header}>
      <div className={styles.titles}>
        {eyebrow && <span className={styles.eyebrow}>{eyebrow}</span>}
        <h1 className={styles.title}>{title}</h1>
      </div>
      {right && <div className={styles.right}>{right}</div>}
    </header>
  )
}
