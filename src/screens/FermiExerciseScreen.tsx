import { useState, type ReactNode } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Calculator } from '../components/Calculator'
import { CardReference } from '../components/CardReference'
import { FermiTypesSheet } from '../components/FermiTypesSheet'
import { Sheet } from '../components/Sheet'
import { fermiById, fermiNo, fermiTypes, type FermiQuestion } from '../data/fermi'
import { FERMI_STEPS, STEP_MARK, approachOptions, emptyFermiDraft, filledSteps, isBlankFermiDraft, type FermiDraft } from '../domain/fermiDraft'
import { useDraft } from '../hooks/useDraft'
import s from './exercise.module.css'

// 各段階のヒント(型の確認用)
const HINTS = [
  '「国内か世界か」「年間か」「金額か数量か」「誰の支出か」を先に決めると、後の式がぶれない',
  '捨てた案は、⑤の検算に回す。数えやすい数字から始められるほうを本線にする',
  '1段目は掛け算2〜3項にする。数えにくい項目だけを、2段目・3段目でさらに分ける',
  '数字は丸めて置く。桁を先に決めてから掛けると、計算ミスに気づきやすい',
  '②で捨てた案や、供給側(店舗数 × 1店の売上など)から同じ数字を出して、桁を比べる',
]

// フェルミ道場の演習。①前提→②方針→③モデル→④計算→⑤検証の順に記入する
export function FermiExerciseScreen() {
  const { id } = useParams()
  const question = id ? fermiById.get(id) : undefined
  if (!question) return <Navigate to="/fermi" replace />
  return <Exercise key={question.id} question={question} />
}

function Exercise({ question }: { question: FermiQuestion }) {
  const navigate = useNavigate()
  const { data, restored, update, reset, flush } = useDraft<FermiDraft>({
    kind: 'fermi',
    questionId: question.id,
    create: () => emptyFermiDraft(new Date()),
    isBlank: isBlankFermiDraft,
  })
  const [typesOpen, setTypesOpen] = useState(false)
  const [tool, setTool] = useState<'numbers' | 'calc' | null>(null) // ④で開く道具
  const [confirmReset, setConfirmReset] = useState(false)

  if (!data) return <div className={s.screen} />

  const step = data.step
  const filled = filledSteps(data)
  const isLast = step === FERMI_STEPS.length - 1

  function go(next: number) {
    update({ step: next })
    document.getElementById('fermi-body')?.scrollTo(0, 0)
  }

  function finish() {
    flush()
    navigate(`/fermi/${question.id}/review`)
  }

  return (
    <div className={s.screen}>
      <header className={s.top}>
        <Link to="/fermi" className={s.back} aria-label="問題一覧に戻る">
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 5l-7 7 7 7" />
          </svg>
        </Link>
        <span className={s.topTitle}>フェルミ道場</span>
      </header>

      <div className={s.body} id="fermi-body">
        <div className={s.question}>
          <span className={s.meta}>
            No.{fermiNo(question)} ・ {question.genre}
          </span>
          <h1 className={s.title}>{question.title}</h1>
        </div>

        {restored && !isBlankFermiDraft(data) && (
          <p className={s.restored}>
            書きかけを再開しました。
            {confirmReset ? (
              <>
                記入を消しますか?
                <button type="button" className={s.textButton} onClick={() => (reset(), setConfirmReset(false))}>
                  消してやり直す
                </button>
                <button type="button" className={s.textButton} onClick={() => setConfirmReset(false)}>
                  やめる
                </button>
              </>
            ) : (
              <button type="button" className={s.textButton} onClick={() => setConfirmReset(true)}>
                最初からやり直す
              </button>
            )}
          </p>
        )}

        <nav className={s.steps} aria-label="段階">
          {FERMI_STEPS.map((st, i) => (
            <button
              key={st.short}
              type="button"
              className={i === step ? `${s.step} ${s.current}` : filled[i] ? `${s.step} ${s.done}` : s.step}
              aria-current={i === step ? 'step' : undefined}
              onClick={() => go(i)}
            >
              {STEP_MARK[i]}
              {st.short}
            </button>
          ))}
        </nav>

        <section className={s.card}>
          <h2 className={s.cardTitle}>
            {STEP_MARK[step]} {FERMI_STEPS[step].title}
          </h2>

          {step === 0 && (
            <Field label="前提・定義" sub="何を、どの範囲で数えるかを書く">
              <textarea
                className={s.textarea}
                rows={5}
                value={data.scope}
                onChange={(e) => update({ scope: e.target.value })}
                placeholder="例:国内・年間・小売の売上高。家庭用を対象にする"
              />
            </Field>
          )}

          {step === 1 && (
            <>
              <p className={s.cardSub}>本線にする案を選んでください</p>
              <div className={s.options} role="radiogroup" aria-label="アプローチ">
                {approachOptions(question).map((o) => (
                  <button
                    key={o.index}
                    type="button"
                    role="radio"
                    aria-checked={data.approach === o.index}
                    className={data.approach === o.index ? `${s.option} ${s.on}` : s.option}
                    onClick={() => update({ approach: o.index })}
                  >
                    <span className={s.optionTitle}>{fermiTypes[o.type]?.name ?? o.type}</span>
                    <span className={s.optionSub}>{o.formula}</span>
                  </button>
                ))}
              </div>
              <Field label="選んだ理由(任意)">
                <textarea className={s.textarea} rows={3} value={data.reason} onChange={(e) => update({ reason: e.target.value })} />
              </Field>
              <button type="button" className={s.textButton} onClick={() => setTypesOpen(true)}>
                試算方法の早見表を見る
              </button>
            </>
          )}

          {step === 2 && (
            <>
              {(['1段目:全体の式', '2段目:各項目を分解', '3段目:さらに分解'] as const).map((label, i) => (
                <Field key={label} label={label}>
                  <textarea
                    className={s.textarea}
                    rows={2}
                    value={data.breakdown[i]}
                    onChange={(e) => {
                      const breakdown = [...data.breakdown] as FermiDraft['breakdown']
                      breakdown[i] = e.target.value
                      update({ breakdown })
                    }}
                    placeholder={i === 0 ? '例:販売個数 × 単価' : undefined}
                  />
                </Field>
              ))}
              <Field label="セグメント" sub="どの軸で分けると、数字の差が出るか">
                <textarea className={s.textarea} rows={2} value={data.segment} onChange={(e) => update({ segment: e.target.value })} placeholder="例:性別 × 年代" />
              </Field>
            </>
          )}

          {step === 3 && (
            <>
              <Field label="計算メモ">
                <textarea
                  className={`${s.textarea} ${s.mono}`}
                  rows={7}
                  value={data.calc}
                  onChange={(e) => update({ calc: e.target.value })}
                  placeholder={'例:\n1.2億人 × 60% = 7,200万人\n7,200万人 × 年4個 × 500円 = 1,440億円'}
                />
              </Field>
              <div className={s.tools}>
                <button type="button" className={s.textButton} onClick={() => setTool('numbers')}>
                  暗記帳の数字を見る
                </button>
                <button type="button" className={s.textButton} onClick={() => setTool('calc')}>
                  電卓を開く
                </button>
              </div>
              <Field label="結果">
                <input className={`${s.input} ${s.mono}`} type="text" value={data.result} onChange={(e) => update({ result: e.target.value })} placeholder="例:約1,400億円" />
              </Field>
            </>
          )}

          {step === 4 && (
            <Field label="検証" sub="別の式で出した数字と、桁が合うかを書く">
              <textarea className={s.textarea} rows={5} value={data.check} onChange={(e) => update({ check: e.target.value })} placeholder="例:ドラッグストア2万店 × 1店あたり年700万円 = 1,400億円。桁は合う" />
            </Field>
          )}
        </section>

        <p className={s.hint}>
          <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 8h0" />
          </svg>
          <span>{HINTS[step]}</span>
        </p>
      </div>

      <div className={s.actions}>
        <button type="button" className={s.secondary} onClick={() => go(step - 1)} disabled={step === 0}>
          前の段階
        </button>
        {isLast ? (
          <button type="button" className={s.primary} onClick={finish}>
            模範解答を見る
          </button>
        ) : (
          <button type="button" className={s.primary} onClick={() => go(step + 1)}>
            {FERMI_STEPS[step + 1].next}
          </button>
        )}
      </div>

      <FermiTypesSheet open={typesOpen} onClose={() => setTypesOpen(false)} />
      <Sheet open={tool === 'numbers'} onClose={() => setTool(null)} title="暗記帳の数字">
        <CardReference />
      </Sheet>
      <Sheet open={tool === 'calc'} onClose={() => setTool(null)} title="電卓">
        <Calculator />
      </Sheet>
    </div>
  )
}

function Field({ label, sub, children }: { label: string; sub?: string; children: ReactNode }) {
  return (
    <label className={s.field}>
      <span className={s.fieldLabel}>{label}</span>
      {sub && <span className={s.fieldSub}>{sub}</span>}
      {children}
    </label>
  )
}
