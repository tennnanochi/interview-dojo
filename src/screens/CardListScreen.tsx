import { Link } from 'react-router-dom'
import { ScreenHeader } from '../components/ScreenHeader'
import { cards, groups } from '../data/cards'
import s from './screens.module.css'

// 暗記帳。土台の段階では、データが読めていることだけを見せる(一覧は4回目で作る)
export function CardListScreen() {
  return (
    <>
      <ScreenHeader title="暗記帳" right={<span className="num">全 {cards.length}枚</span>} />
      <div className={s.body}>
        <section className={s.panel}>
          <span className={s.panelTitle}>カテゴリ</span>
          <div className={s.tags}>
            {groups.map((g) => (
              <span key={g} className={s.tag}>
                {g} <span className="num">{cards.filter((c) => c.group === g).length}</span>
              </span>
            ))}
          </div>
          <span className={s.sub}>一覧と出題モードは、このあと順に追加します</span>
        </section>
        <Link to="/cards/study" className={s.primaryButton}>
          カードで練習
        </Link>
      </div>
    </>
  )
}
