import { describe, expect, it } from 'vitest'
import { caseFeedbackPrompt, fermiFeedbackPrompt } from './feedbackPrompt'

describe('Claudeに渡す講評の依頼文', () => {
  it('フェルミ:講評の型・5ステップ・お題・記入が入る', () => {
    const text = fermiFeedbackPrompt(
      '国内のコンディショナーの市場規模',
      { scope: '国内・年間', reason: '', breakdown: ['個数×単価', '', ''], calc: '1.2億×60%', result: '約1,400億円' },
      '需要ベース:人口 × 購入率 × 年間購入額',
    )
    for (const part of ['良かった点', '計算ミス', '論理ミス', '改善した骨子', '独自の視点', '①前提・定義', '⑤検証', '# お題\n国内のコンディショナーの市場規模', '国内・年間', '需要ベース:人口 × 購入率', '約1,400億円']) {
      expect(text).toContain(part)
    }
    expect(text).toContain('2段目:(未記入)')
    expect(text).not.toContain('+10%') // ケースの観点は入れない
  })

  it('複合:フェルミとケースの両方の観点と、使った時間が入る', () => {
    const text = caseFeedbackPrompt('combo', 'フェルミ→ケース', 'カフェの市場規模を推定し、勝ち筋を考えてください', { memo: '式:店舗数×売上', answer: '結論:朝の需要' }, [
      { name: 'フェルミ', sec: 300, usedSec: 200 },
      { name: '発表', sec: 300, usedSec: 300 },
    ])
    for (const part of ['①前提・定義', '+10%の手堅い案と+50%の大きい案', '結論:朝の需要', '式:店舗数×売上', 'フェルミ 3分20秒(制限5分)', '(フェルミ→ケース)']) {
      expect(text).toContain(part)
    }
  })

  it('ケース単体:フェルミの観点は入れない。未記入も明示する', () => {
    const text = caseFeedbackPrompt('case', 'ケース面接', '旅館の売上回復', {}, undefined)
    expect(text).not.toContain('①前提・定義')
    expect(text).toContain('回答の骨子\n(未記入)')
    expect(text).not.toContain('使った時間')
  })
})
