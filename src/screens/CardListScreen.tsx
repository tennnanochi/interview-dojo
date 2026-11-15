import { useMemo, useState } from 'react'
import { ModeSheet } from '../components/ModeSheet'
import { ScreenHeader } from '../components/ScreenHeader'
import { cards, type Card } from '../data/cards'
import type { CardState } from '../db/types'
import { isMastered } from '../domain/srs'
import { useCardStates } from '../hooks/useCardStates'
import s from './CardListScreen.module.css'

// 一覧での見せ方:未出題 / 復習中(あやふや・忘れた)/ 覚えた / 定着
type Mark = 'new' | 'learning' | 'known' | 'mastered'

const MARK_LABEL: Record<Mark, string> = {
  new: '未出題',
  learning: '復習中',
  known: '覚えた',
  mastered: '定着',
}

function markOf(state: CardState | undefined): Mark {
  if (!state || state.status === 'new') return 'new'
  if (state.status === 'learning') return 'learning'
  return isMastered(state) ? 'mastered' : 'known'
}

type Section = { key: string; section: string; group: string; cards: Card[] }

// データの並び順のまま、セクションごとにまとめる
function toSections(list: Card[]): Section[] {
  const sections: Section[] = []
  for (const card of list) {
    const key = `${card.group}|${card.section}`
    const last = sections[sections.length - 1]
    if (last?.key === key) last.cards.push(card)
    else sections.push({ key, section: card.section, group: card.group, cards: [card] })
  }
  return sections
}

// 暗記帳の一覧。表形式で見返す。数値を隠して、行ごとにタップで確かめられる
export function CardListScreen() {
  const { states } = useCardStates()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [onlyUnlearned, setOnlyUnlearned] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [revealed, setRevealed] = useState<ReadonlySet<string>>(new Set()) // 隠している間に、個別に開いた行

  const known = cards.filter((c) => states.get(c.id)?.status === 'known').length

  const sections = useMemo(() => {
    const q = query.trim().toLowerCase()
    return toSections(
      cards.filter((c) => {
        if (onlyUnlearned && states.get(c.id)?.status === 'known') return false
        // 検索は項目・セクション・カテゴリが対象(数値は隠している答えなので対象にしない)
        return !q || `${c.item} ${c.section} ${c.group}`.toLowerCase().includes(q)
      }),
    )
  }, [query, onlyUnlearned, states])

  function toggleHidden() {
    setHidden((h) => !h)
    setRevealed(new Set())
  }

  function toggleRow(id: string) {
    setRevealed((prev) => {
      const next = new Set(prev)
      if (!next.delete(id)) next.add(id)
      return next
    })
  }

  return (
    <div className={s.screen}>
      <ScreenHeader
        title="暗記帳"
        right={
          <>
            覚えた <span className="num">{known} / {cards.length}</span>
          </>
        }
      />

      <div className={s.tools}>
        <label className={s.search}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="6" />
            <path d="M20 20l-4-4" />
          </svg>
          <span className={s.srOnly}>項目を検索</span>
          <input type="search" placeholder="項目を検索" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>
        <div className={s.chips}>
          <button type="button" aria-pressed={!onlyUnlearned} className={s.chip} onClick={() => setOnlyUnlearned(false)}>
            すべて
          </button>
          <button type="button" aria-pressed={onlyUnlearned} className={s.chip} onClick={() => setOnlyUnlearned(true)}>
            未暗記だけ
          </button>
          <button type="button" aria-pressed={hidden} className={`${s.chip} ${s.toggle}`} onClick={toggleHidden}>
            数値を隠す
          </button>
        </div>
      </div>

      <div className={s.list}>
        {sections.length === 0 && <p className={s.empty}>該当するカードがありません</p>}

        {sections.map((sec) => (
          <section key={sec.key} className={s.section}>
            <div className={s.sectionHead}>
              <h2 className={s.sectionTitle}>{sec.section}</h2>
              <span className={s.sectionGroup}>{sec.group}</span>
            </div>
            {sec.cards.map((card) => {
              const mark = markOf(states.get(card.id))
              const masked = hidden && !revealed.has(card.id)
              return (
                <div key={card.id} className={s.row}>
                  <span className={`${s.mark} ${s[mark]}`} role="img" aria-label={MARK_LABEL[mark]}>
                    {(mark === 'known' || mark === 'mastered') && (
                      <svg aria-hidden="true" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12.5l4.5 4.5L19 7.5" />
                      </svg>
                    )}
                  </span>
                  <span className={s.itemCol}>
                    <span className={mark === 'known' || mark === 'mastered' ? `${s.item} ${s.done}` : s.item}>{card.item}</span>
                    {!masked && card.note && <span className={s.note}>{card.note}</span>}
                  </span>
                  {hidden ? (
                    <button
                      type="button"
                      className={s.valueButton}
                      onClick={() => toggleRow(card.id)}
                      aria-label={masked ? `${card.item}の数値を表示` : `${card.item}の数値を隠す`}
                    >
                      {masked ? <span className={s.mask} /> : <span className={s.value}>{card.value}</span>}
                    </button>
                  ) : (
                    <span className={s.value}>{card.value}</span>
                  )}
                </div>
              )
            })}
          </section>
        ))}

        {sections.length > 0 && (
          <ul className={s.legend} aria-label="印の意味">
            {(['new', 'learning', 'known', 'mastered'] as Mark[]).map((m) => (
              <li key={m}>
                <span className={`${s.mark} ${s[m]}`} aria-hidden="true" />
                {MARK_LABEL[m]}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={s.footer}>
        <button type="button" className={s.primary} onClick={() => setSheetOpen(true)}>
          カードで練習
        </button>
      </div>
      <ModeSheet open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  )
}
