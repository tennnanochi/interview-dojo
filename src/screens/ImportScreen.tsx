import { useMemo, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import { cards } from '../data/cards'
import { extractLegacyIds, planLegacyImport } from '../domain/legacy'
import { addStates, useCardStates } from '../hooks/useCardStates'
import s from './LoginScreen.module.css'
import own from './ImportScreen.module.css'

// 旧暗記帳アプリの「覚えた」を引き継ぐ。旧アプリのデータを貼り付けるか、ファイルで読み込む
export function ImportScreen() {
  const { ready, states } = useCardStates()
  const [text, setText] = useState('')
  const [done, setDone] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const plan = useMemo(
    () => planLegacyImport(extractLegacyIds(text, cards), cards, states, new Date()),
    [text, states],
  )
  const matched = plan.create.length + plan.alreadyStudied

  async function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) setText(await file.text())
  }

  async function onImport() {
    try {
      const count = plan.create.length
      await addStates(plan.create)
      setDone(count)
      setText('')
    } catch (err) {
      console.error(err)
      setError('引き継ぎに失敗しました。もう一度試してください。')
    }
  }

  return (
    <div className={s.screen}>
      <header className={s.top}>
        <Link to="/records" className={s.close} aria-label="記録に戻る">
          <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </Link>
      </header>

      <div className={s.body}>
        <h1 className={s.title}>旧暗記帳から引き継ぐ</h1>

        {done !== null ? (
          <>
            <p className={s.lead}>
              <strong>{done}枚</strong>を「覚えた」にしました。復習日は1〜7日後に分けてあります。
            </p>
            <Link to="/cards" className={`${s.primary} ${own.link}`}>
              暗記帳を見る
            </Link>
          </>
        ) : (
          <>
            <p className={s.lead}>
              旧暗記帳で「覚えた」にした項目のデータを、下に貼り付けるかファイルで選んでください。項目のid(例:基本|日本の総人口)を探して対応づけます。
            </p>
            <label className={s.label} htmlFor="legacy">
              旧暗記帳のデータ
            </label>
            <textarea
              id="legacy"
              className={own.textarea}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={'["基本|日本の総人口", "基本|世帯数"]'}
              spellCheck={false}
            />
            <label className={own.file}>
              ファイルから読み込む
              <input type="file" accept=".json,.txt,application/json,text/plain" onChange={onFile} />
            </label>

            {text.trim() !== '' && (
              <p className={s.lead} role="status">
                {matched === 0 ? (
                  '一致する項目が見つかりませんでした。貼り付けた内容を確認してください。'
                ) : (
                  <>
                    <strong>{matched}件</strong>が一致しました。
                    {plan.alreadyStudied > 0 && `うち${plan.alreadyStudied}件は、このアプリで採点済みなので変更しません。`}
                  </>
                )}
              </p>
            )}
            {error && (
              <p className={s.error} role="alert">
                {error}
              </p>
            )}
            <button type="button" className={s.primary} disabled={!ready || plan.create.length === 0} onClick={onImport}>
              {plan.create.length > 0 ? `${plan.create.length}枚を「覚えた」にする` : '引き継ぐ項目がありません'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
