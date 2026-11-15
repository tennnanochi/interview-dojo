import type { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import styles from './TabBar.module.css'

type Tab = { to: string; label: string; icon: ReactNode }

const tabs: Tab[] = [
  {
    to: '/',
    label: 'ホーム',
    icon: (
      <>
        <path d="M3 11l9-7 9 7" />
        <path d="M5 10v10h14V10" />
      </>
    ),
  },
  {
    to: '/cards',
    label: '暗記帳',
    icon: (
      <>
        <rect x="4" y="5" width="16" height="14" rx="2" />
        <path d="M8 10h8M8 14h5" />
      </>
    ),
  },
  {
    to: '/fermi',
    label: 'フェルミ',
    icon: (
      <>
        <path d="M5 19V5M5 19h14" />
        <path d="M9 15l3-4 3 2 4-6" />
      </>
    ),
  },
  {
    to: '/case',
    label: 'ケース',
    icon: <path d="M4 6h16v10H9l-5 4z" />,
  },
  {
    to: '/records',
    label: '記録',
    icon: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v4l3 2" />
      </>
    ),
  },
]

export function TabBar() {
  return (
    <nav className={styles.bar} aria-label="メインメニュー">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.to === '/'}
          className={({ isActive }) => (isActive ? `${styles.tab} ${styles.active}` : styles.tab)}
        >
          <svg
            aria-hidden="true"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {tab.icon}
          </svg>
          <span>{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
