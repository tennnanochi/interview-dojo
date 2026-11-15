import { ScreenHeader } from '../components/ScreenHeader'
import s from './screens.module.css'

// 記録。進捗・連続日数・設定は5回目で作る
export function RecordsScreen() {
  return (
    <>
      <ScreenHeader title="記録" />
      <div className={s.body}>
        <section className={s.panel}>
          <span className={s.panelTitle}>準備中</span>
          <span className={s.sub}>覚えた数、カテゴリ別の制覇率、連続学習日数をここに出します</span>
        </section>
      </div>
    </>
  )
}
