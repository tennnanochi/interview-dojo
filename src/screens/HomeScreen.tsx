import { Link } from 'react-router-dom'
import { SyncBadge } from '../components/SyncBadge'
import { ScreenHeader } from '../components/ScreenHeader'
import { cards } from '../data/cards'
import { ProgressBar } from '../components/ProgressBar'
import { toDateKey } from '../domain/date'
import { countDue, studyPath } from '../domain/session'
import { useCardStates } from '../hooks/useCardStates'
import s from './screens.module.css'

// ホーム。今日の復習枚数と、練習メニューへの入口
export function HomeScreen() {
  const { ready, states } = useCardStates()
  const due = countDue(cards, states, toDateKey(new Date()))
  const known = [...states.values()].filter((st) => st.status === 'known').length

  return (
    <>
      <ScreenHeader eyebrow="おかえりなさい" title="面接トレーニング" right={<SyncBadge />} />
      <div className={s.body}>
        <section className={s.hero}>
          <span className={s.heroLabel}>今日の復習</span>
          <div className={s.heroNumber}>
            <strong>{ready ? due : '-'}</strong>
            <span>枚</span>
          </div>
          {due > 0 ? (
            <>
              <span className={s.heroLabel}>復習期限が来たカード(「忘れた」は翌日に入ります)</span>
              <Link to={studyPath({ mode: 'due' })} className={s.heroButton}>
                復習をはじめる
              </Link>
            </>
          ) : known < cards.length ? (
            <>
              <span className={s.heroLabel}>今日の復習はありません。新しいカードを進めましょう</span>
              <Link to={studyPath({ mode: 'unlearned' })} className={s.heroButton}>
                未暗記を練習する
              </Link>
            </>
          ) : (
            <span className={s.heroLabel}>今日の復習はありません。全部覚えています</span>
          )}
        </section>

        <span className={s.sectionLabel}>練習メニュー</span>

        <Link to="/cards" className={`${s.panel} ${s.link}`}>
          <div className={s.panelHead}>
            <span className={s.panelTitle}>暗記帳</span>
            <span className={s.sub}>
              覚えた <span className="num">{known} / {cards.length}</span>
            </span>
          </div>
          <ProgressBar value={known} max={cards.length} label="暗記帳の進み具合" />
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
