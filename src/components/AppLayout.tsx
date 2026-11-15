import { Outlet } from 'react-router-dom'
import { TabBar } from './TabBar'
import styles from './AppLayout.module.css'

// 画面の枠組み:上に各画面、下に5つのタブ
export function AppLayout() {
  return (
    <div className={styles.shell}>
      <main className={styles.main}>
        <Outlet />
      </main>
      <TabBar />
    </div>
  )
}
