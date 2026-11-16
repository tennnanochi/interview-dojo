import { useState } from 'react'
import styles from './FeedbackRequest.module.css'

type Props = { build: () => string } // コピーする文章を作る

// 「Claudeに講評を頼む」。指示文・お題・回答をまとめてコピーし、Claudeのチャットに貼ってもらう
export function FeedbackRequest({ build }: Props) {
  const [state, setState] = useState<'idle' | 'copied' | 'manual'>('idle')
  const [text, setText] = useState('')

  async function onCopy() {
    const prompt = build()
    setText(prompt)
    try {
      await navigator.clipboard.writeText(prompt)
      setState('copied')
    } catch {
      setState('manual') // コピーが許可されない環境では、文章を見せて手で選んでもらう
    }
  }

  return (
    <section className={styles.card}>
      <h2 className={styles.title}>Claudeに講評を頼む</h2>
      <p className={styles.sub}>講評の指示文・お題・回答をまとめてコピーします。Claudeのチャットに貼り付けて送ってください。</p>
      <button type="button" className={styles.button} onClick={onCopy}>
        {state === 'copied' ? 'もう一度コピーする' : '依頼文をコピーする'}
      </button>
      {state === 'copied' && (
        <p className={styles.sub} role="status">
          コピーしました。
          <a href="https://claude.ai/new" target="_blank" rel="noopener noreferrer">
            Claudeを開く
          </a>
        </p>
      )}
      {state === 'manual' && (
        <>
          <p className={styles.sub} role="status">
            自動でコピーできませんでした。下の文章を選んでコピーしてください。
          </p>
          <textarea className={styles.text} readOnly value={text} rows={8} onFocus={(e) => e.target.select()} aria-label="講評の依頼文" />
        </>
      )}
    </section>
  )
}
