// 「Claudeに講評を頼む」で使う文章(仕様書「AI講評の扱い」段階2)
// 講評用の指示文+お題+回答をまとめてコピーし、Claudeのチャットに貼ってもらう。APIは使わない
import type { SelfScore } from '../db/types'
import { formatDuration } from './attempts'
import type { FermiDraft } from './fermiDraft'

const or = (text: string | undefined) => (text && text.trim() !== '' ? text.trim() : '(未記入)')

// 講評の型(固定)
const FORMAT = `# 講評の型
次の順で、具体的に書いてください。
1. 良かった点(2〜3点)
2. 計算ミス(数字・桁・単位の誤り。なければ「なし」)
3. 論理ミス(前提の抜け、分解の漏れや重複、飛躍)
4. 改善した骨子(同じ持ち時間で話せる形に書き直す)
5. 独自の視点(ほかの候補者と差がつく切り口を1つ)
最後に、次に練習すべきことを1つ挙げてください。`

const FERMI_VIEW = `フェルミ推定は、次の5ステップに沿って見てください。
①前提・定義 → ②アプローチ(2案出して1つに絞る) → ③モデル化(3段の分解とセグメント) → ④計算 → ⑤検証(別の式で桁を確かめる)`

const CASE_VIEW = `ケースは、次の点を見てください。
前提と目標の確認 / 現状の構造的な分解 / 課題の特定 / 施策は+10%の手堅い案と+50%の大きい案の両方があるか / 単価低下などの副作用を相殺しているか / 優先順位をつけて結論を言い切っているか`

function build(role: string, views: string[], question: string, answer: string): string {
  return [
    `あなたは戦略コンサルティングファームの面接官です。${role}に対する私の回答を、本番の面接と同じ基準で講評してください。`,
    FORMAT,
    `# 見るポイント\n${views.join('\n\n')}`,
    `# お題\n${question}`,
    `# 私の回答\n${answer}`,
  ].join('\n\n')
}

// フェルミ道場:5段階の記入を並べる
export function fermiFeedbackPrompt(title: string, mine: Partial<FermiDraft>, chosenApproach: string | undefined): string {
  const answer = [
    `①前提・定義\n${or(mine.scope)}`,
    `②アプローチ\n選んだ案:${or(chosenApproach)}\n理由:${or(mine.reason)}`,
    `③モデル化\n1段目:${or(mine.breakdown?.[0])}\n2段目:${or(mine.breakdown?.[1])}\n3段目:${or(mine.breakdown?.[2])}\nセグメント:${or(mine.segment)}`,
    `④計算\n${or(mine.calc)}\n結果:${or(mine.result)}`,
    `⑤検証\n${or(mine.check)}`,
  ].join('\n\n')
  return build('次のフェルミ推定のお題', [FERMI_VIEW], title, answer)
}

// ケース道場:回答・メモ・使った時間を並べる
export function caseFeedbackPrompt(
  type: 'fermi' | 'case' | 'combo',
  typeName: string,
  text: string,
  written: { memo?: string; answer?: string },
  phases: SelfScore['phases'],
): string {
  const views = type === 'fermi' ? [FERMI_VIEW] : type === 'case' ? [CASE_VIEW] : [FERMI_VIEW, CASE_VIEW]
  const times = phases?.length ? phases.map((p) => `${p.name} ${formatDuration(p.usedSec)}(制限${formatDuration(p.sec)})`).join(' / ') : undefined
  const answer = [`回答の骨子\n${or(written.answer)}`, `メモ\n${or(written.memo)}`, ...(times ? [`使った時間\n${times}`] : [])].join('\n\n')
  return build(`次のお題(${typeName})`, views, text, answer)
}
