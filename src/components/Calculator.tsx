import { useState } from 'react'
import { evaluate, formatJa, formatPlain } from '../domain/calc'
import styles from './Calculator.module.css'

const KEYS = [
  ['C', '⌫', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '−'],
  ['1', '2', '3', '+'],
  ['0', '.', '万', '億'],
]

const LABEL: Record<string, string> = { C: 'すべて消す', '⌫': '1文字消す', '÷': '割る', '×': '掛ける', '−': '引く', '+': '足す', '.': '小数点' }
const OPS = '÷×−+'

// 電卓。万・億と%が使え、打っている途中の式もその場で計算して出す
export function Calculator() {
  const [expr, setExpr] = useState('')
  const value = evaluate(expr)

  function press(key: string) {
    if (key === 'C') setExpr('')
    else if (key === '⌫') setExpr((e) => e.slice(0, -1))
    else if (key === '=') {
      // 結果を次の計算の出発点にする
      if (value !== null) setExpr(String(value))
    } else if (OPS.includes(key)) {
      // 演算子を続けて押したら、後から押したほうに入れ替える
      setExpr((e) => (e === '' ? (key === '−' ? key : e) : OPS.includes(e[e.length - 1]) ? e.slice(0, -1) + key : e + key))
    } else setExpr((e) => e + key)
  }

  return (
    <div className={styles.calc}>
      <div className={styles.display} aria-live="polite">
        <span className={styles.expr}>{expr || '0'}</span>
        <span className={styles.result}>{value === null ? (expr ? '計算できません' : '') : `= ${formatJa(value)}`}</span>
        {value !== null && formatJa(value) !== formatPlain(value) && <span className={styles.plain}>{formatPlain(value)}</span>}
      </div>
      <div className={styles.keys}>
        {KEYS.flat().map((key) => (
          <button
            key={key}
            type="button"
            className={OPS.includes(key) || key === '%' ? `${styles.key} ${styles.op}` : key === 'C' || key === '⌫' ? `${styles.key} ${styles.clear}` : styles.key}
            aria-label={LABEL[key]}
            onClick={() => press(key)}
          >
            {key}
          </button>
        ))}
        <button type="button" className={`${styles.key} ${styles.equal}`} aria-label="計算結果を式に入れる" onClick={() => press('=')}>
          =
        </button>
      </div>
    </div>
  )
}
