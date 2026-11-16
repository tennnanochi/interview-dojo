import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ScreenHeader } from '../components/ScreenHeader'
import { Sheet } from '../components/Sheet'
import { askedLabel, caseCompanies, caseLevels, caseNo, casePatterns, caseQuestions, caseTypeNames, type CaseType } from '../data/cases'
import { loadAttempts, loadDrafts } from '../db/local'
import type { Attempt } from '../db/types'
import { latestByQuestion, scoreLabel } from '../domain/attempts'
import { useSync } from '../sync/controller'
import s from './browse.module.css'
import own from './CaseBankScreen.module.css'

const PAST = '__past__' // 会社の絞り込みで「過去問すべて」を表す値

// ケース道場のお題バンク。種類・難易度・会社で絞り込み、検索できる
export function CaseBankScreen() {
  const [query, setQuery] = useState('')
  const [type, setType] = useState<CaseType | null>(null)
  const [level, setLevel] = useState<number | null>(null)
  const [company, setCompany] = useState<string | null>(null)
  const [onlyNew, setOnlyNew] = useState(false)
  const [patternsOpen, setPatternsOpen] = useState(false)
  const [drafts, setDrafts] = useState<ReadonlySet<string>>(new Set())
  const [latest, setLatest] = useState<ReadonlyMap<string, Attempt>>(new Map())
  const { lastSyncedAt } = useSync()

  useEffect(() => {
    loadDrafts('case').then((list) => setDrafts(new Set(list.map((d) => d.questionId))), (e) => console.error(e))
  }, [])

  // 同期が終わるたびに読み直す(他の端末の記録が入るため)
  useEffect(() => {
    loadAttempts('case').then((list) => setLatest(latestByQuestion(list)), (e) => console.error(e))
  }, [lastSyncedAt])

  const list = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = caseQuestions.filter(
      (x) =>
        (!type || x.type === type) &&
        (!level || x.level === level) &&
        (!company || (company === PAST ? !!x.company : x.company === company)) &&
        (!onlyNew || !latest.has(x.id)) &&
        (!q || `${x.text} ${x.industry} ${x.company ?? ''} ${caseNo(x)}`.toLowerCase().includes(q)),
    )
    // 過去問で絞ったときは、出題が新しい順に並べる
    return company ? [...filtered].sort((a, b) => (b.askedAt ?? '').localeCompare(a.askedAt ?? '')) : filtered
  }, [query, type, level, company, onlyNew, latest])

  return (
    <div className={s.screen}>
      <ScreenHeader
        title="ケース道場"
        right={
          <button type="button" className={s.linkButton} onClick={() => setPatternsOpen(true)}>
            ケースの5つの型
          </button>
        }
      />

      <div className={s.tools}>
        <label className={s.search}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="11" cy="11" r="6" />
            <path d="M20 20l-4-4" />
          </svg>
          <span className={s.srOnly}>お題を検索</span>
          <input type="search" placeholder="お題を検索" value={query} onChange={(e) => setQuery(e.target.value)} />
        </label>

        <div className={s.chips} role="group" aria-label="種類と難易度">
          <button type="button" className={s.chip} aria-pressed={type === null} onClick={() => setType(null)}>
            すべて
          </button>
          {(Object.keys(caseTypeNames) as CaseType[]).map((t) => (
            <button key={t} type="button" className={s.chip} aria-pressed={type === t} onClick={() => setType(t)}>
              {caseTypeNames[t]}
            </button>
          ))}
          <span className={own.divider} aria-hidden="true" />
          {Object.entries(caseLevels).map(([value, name]) => (
            <button
              key={value}
              type="button"
              className={s.chip}
              aria-pressed={level === Number(value)}
              onClick={() => setLevel(level === Number(value) ? null : Number(value))}
            >
              {name}
            </button>
          ))}
        </div>

        <div className={s.chips} role="group" aria-label="会社と挑戦状況">
          <button type="button" className={s.chip} aria-pressed={onlyNew} onClick={() => setOnlyNew((v) => !v)}>
            未挑戦だけ
          </button>
          <span className={own.divider} aria-hidden="true" />
          <button type="button" className={s.chip} aria-pressed={company === PAST} onClick={() => setCompany(company === PAST ? null : PAST)}>
            過去問すべて
          </button>
          {caseCompanies.map((c) => (
            <button key={c} type="button" className={s.chip} aria-pressed={company === c} onClick={() => setCompany(company === c ? null : c)}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className={s.list}>
        <p className={s.count}>
          <span className="num">{list.length}</span>問
          {latest.size > 0 && (
            <>
              ・挑戦済み <span className="num">{latest.size}</span>問
            </>
          )}
        </p>
        {list.length === 0 ? (
          <p className={s.empty}>該当するお題がありません</p>
        ) : (
          <ul className={s.items}>
            {list.map((q) => (
              <li key={q.id}>
                <Link to={latest.has(q.id) && !drafts.has(q.id) ? `/case/${q.id}/review` : `/case/${q.id}`} className={s.item}>
                  <span className={s.no}>{caseNo(q)}</span>
                  <span className={s.itemText}>
                    <span className={s.itemTitle}>{q.text}</span>
                    <span className={s.itemMeta}>
                      {caseTypeNames[q.type]}・{caseLevels[String(q.level)]}・{q.industry}
                      {q.company && (
                        <span className={own.company}>
                          {q.company} <span className="num">{askedLabel(q)}</span>
                        </span>
                      )}
                      {drafts.has(q.id) && <span className={s.badge}>書きかけ</span>}
                      {latest.has(q.id) && <span className={`${s.badge} ${s.score} num`}>前回 {scoreLabel(latest.get(q.id)!.selfScore)}</span>}
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

      <Sheet open={patternsOpen} onClose={() => setPatternsOpen(false)} title="ケースの5つの型">
        {casePatterns.map((p, i) => (
          <section key={p.id} className={own.pattern}>
            <h3 className={own.patternName}>
              <span className="num">{i + 1}.</span> {p.name}
            </h3>
            <p className={own.patternNote}>{p.note}</p>
            <p className={own.patternCompanies}>{p.companies.join('、')}</p>
          </section>
        ))}
      </Sheet>
    </div>
  )
}
