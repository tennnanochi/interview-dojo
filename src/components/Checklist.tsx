import type { CheckItem } from '../domain/attempts'
import styles from './Checklist.module.css'

type Props = {
  items: CheckItem[]
  checked: ReadonlySet<string>
  onToggle?: (id: string) => void // なければ見るだけ(過去の記録)
}

// 自己採点のチェックリスト
export function Checklist({ items, checked, onToggle }: Props) {
  return (
    <ul className={styles.list}>
      {items.map((item) => {
        const on = checked.has(item.id)
        return (
          <li key={item.id}>
            <button
              type="button"
              className={on ? `${styles.row} ${styles.on}` : styles.row}
              aria-pressed={on}
              disabled={!onToggle}
              onClick={() => onToggle?.(item.id)}
            >
              <span className={styles.box} aria-hidden="true">
                {on && (
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                )}
              </span>
              {item.label}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
