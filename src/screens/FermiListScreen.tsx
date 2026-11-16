import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FermiTypesSheet } from '../components/FermiTypesSheet'
import { ScreenHeader } from '../components/ScreenHeader'
import { loadDrafts } from '../db/local'
import { fermiGenres, fermiNo, fermiQuestions, type FermiQuestion } from '../data/fermi'
import s from './browse.module.css'

type Origin = 'all' | 'book' | 'original'

const sourceLabel = (q: FermiQuestion) => (q.origin === 'book' ? `書籍 No.${q.bookNo}` : 'オリジナル')

// フェルミ道場の問題一覧。ジャンルと出典で絞り込み、検索できる
export function FermiListScreen() {
  const [query, setQuery] = useState('')
  const [genre, setGenre] = useState<string | null>(null)
  const [origin, setOrigin] = useState<Origin>('all')
  const [typesOpen, setTypesOpen] = useState(false)
  const [drafts, setDrafts] = useState<ReadonlySet<string>>(new Set()) // 書きかけがある問題

  useEffect(() => {
    loadDrafts('fermi').then((list) => setDrafts(new Set(list.map((d) => d.questionId))), (e) => console.error(e))
  }, [])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    return fermiQuestions.filter(
      (x) =>
        (!genre || x.genre === genre) &&
        (origin === 'all' || x.origin === origin) &&
        (!q || `${x.title} ${x.genre} ${fermiNo(x)}`.toLowerCase().includes(q)),
    )
  }, [query, genre, origin])

  return (
    <div className={s.screen}>
      <ScreenHeader
        title="フェルミ道場"
        right={
          <button type="button" className={s.linkButton} onClick={() => setTypesOpen(true)}>
            試算方法の早見表
          </button>
        }
      />

      <div className={s.tools}>
        <label className={s.search}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="6" />
            <path d="M20 20l-4-4" />
          </svg>
          <span className={s.srOnly}>問題を検索</span>
          <input type="search" placeholder="問題を検索" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>

        <div className={s.chips} role="group" aria-label="ジャンル">
          <button type="button" className={s.chip} aria-pressed={genre === null} onClick={() => setGenre(null)}>
            すべて
          </button>
          {fermiGenres.map((g) => (
            <button key={g} type="button" className={s.chip} aria-pressed={genre === g} onClick={() => setGenre(g)}>
              {g}
            </button>
          ))}
        </div>

        <div className={s.chips} role="group" aria-label="出典">
          {(
            [
              ['all', '出典すべて'],
              ['book', '書籍'],
              ['original', 'オリジナル'],
            ] as [Origin, string][]
          ).map(([value, label]) => (
            <button key={value} type="button" className={s.chip} aria-pressed={origin === value} onClick={() => setOrigin(value)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={s.list}>
        <p className={s.count}>
          <span className="num">{list.length}</span>問
        </p>
        {list.length === 0 ? (
          <p className={s.empty}>該当する問題がありません</p>
        ) : (
          <ul className={s.items}>
            {list.map((q) => (
              <li key={q.id}>
                <Link to={`/fermi/${q.id}`} className={s.item}>
                  <span className={s.no}>{fermiNo(q)}</span>
                  <span className={s.itemText}>
                    <span className={s.itemTitle}>{q.title}</span>
                    <span className={s.itemMeta}>
                      {q.genre}・{sourceLabel(q)}
                      {drafts.has(q.id) && <span className={s.badge}>書きかけ</span>}
                    </span>
                  </span>
                  <svg className={s.chevron} aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <FermiTypesSheet open={typesOpen} onClose={() => setTypesOpen(false)} />
    </div>
  )
}
