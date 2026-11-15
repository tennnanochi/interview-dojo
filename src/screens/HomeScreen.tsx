import { Link } from 'react-router-dom'
import { ScreenHeader } from '../components/ScreenHeader'
import { cards } from '../data/cards'
import s from './screens.module.css'

// ホーム。「今日の復習」の枚数と開始ボタンは、出題機能ができてから入れる
export function HomeScreen() {
  return (
    <>
      <ScreenHeader eyebrow="おかえりなさい" title="面接トレーニング" />
      <div className={s.body}>
        <section className={s.hero}>
          <span className={s.heroLabel}>暗記帳のカード</span>
          <div className={s.heroNumber}>
            <strong>{cards.length}</strong>
            <span>枚</span>
          </div>
          <span className={s.heroLabel}>出題と「今日の復習」はこのあと追加します</span>
        </section>

        <span className={s.sectionLabel}>練習メニュー</span>

        <Link to="/cards" className={`${s.panel} ${s.link}`}>
          <div className={s.panelHead}>
            <span className={s.panelTitle}>暗記帳</span>
            <span className={`${s.sub} num`}>{cards.length}枚</span>
          </div>
          <span className={s.sub}>人口・面積・市場規模・アンカーの数字</span>
        </Link>

        <Link to="/fermi" className={`${s.panel} ${s.link}`}>
          <div className={s.panelHead}>
            <span className={s.panelTitle}>フェルミ道場</span>
            <span className={s.sub}>準備中</span>
          </div>
          <span className={s.sub}>5ステップの型で1問ずつ解く</span>
        </Link>

        <Link to="/case" className={`${s.panel} ${s.link}`}>
          <div className={s.panelHead}>
            <span className={s.panelTitle}>ケース道場</span>
            <span className={s.sub}>準備中</span>
          </div>
          <span className={s.sub}>タイマーとメモで本番形式の練習</span>
        </Link>
      </div>
    </>
  )
}
