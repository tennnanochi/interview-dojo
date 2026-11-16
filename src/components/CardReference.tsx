import { useMemo, useState } from 'react'
import { cards } from '../data/cards'
import styles from './CardReference.module.css'

// 暗記帳の数字を検索して参照する(ケース道場の「数字」タブ、フェルミ道場の計算)
export function CardReference() {
  const [query, setQuery] = useState('')

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? cards.filter((c) => `${c.item} ${c.section} ${c.group} ${c.value} ${c.note}`.toLowerCase().includes(q)) : cards
  }, [query])

  return (
    <div className={styles.wrap}>
      <label className={styles.search}>
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="6" />
          <path d="M20 20l-4-4" />
        </svg>
        <span className={styles.srOnly}>数字を検索</span>
        <input type="search" placeholder="数字を検索(例:世帯、コンビニ)" value={query} onChange={(e) => setQuery(e.target.value)} />
      </label>
      <ul className={styles.list}>
        {list.length === 0 && <li className={styles.empty}>該当する数字がありません</li>}
        {list.map((c) => (
          <li key={c.id} className={styles.row}>
            <span className={styles.itemCol}>
              <span className={styles.item}>{c.item}</span>
              <span className={styles.sub}>
                {c.section}
                {c.note && `・${c.note}`}
              </span>
            </span>
            <span className={styles.value}>{c.value}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
