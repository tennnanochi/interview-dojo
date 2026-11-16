import { describe, expect, it } from 'vitest'
import { defaultPhases, finish, formatClock, isDone, isPaused, pause, resume, skip, startTimer, tick, viewTimer } from './caseTimer'

const MIN = 60_000
const T0 = 1_000_000

describe('区間', () => {
  it('複合はフェルミ5分→ケース5分→発表5分の15分', () => {
    const p = defaultPhases('combo')
    expect(p.map((x) => x.name)).toEqual(['フェルミ', 'ケース', '発表'])
    expect(p.reduce((a, x) => a + x.sec, 0)).toBe(15 * 60)
  })

  it('単体のお題は、考える区間と発表の2区間', () => {
    expect(defaultPhases('fermi').map((x) => x.name)).toEqual(['フェルミ', '発表'])
    expect(defaultPhases('case').map((x) => x.name)).toEqual(['ケース', '発表'])
  })
})

describe('タイマー', () => {
  const start = () => startTimer(defaultPhases('combo'), T0)

  it('残り時間と区間名を出す', () => {
    expect(viewTimer(start(), T0)).toMatchObject({ phaseName: 'フェルミ', remainingSec: 300 })
    expect(viewTimer(start(), T0 + 55_000)).toMatchObject({ phaseName: 'フェルミ', remainingSec: 245 })
    expect(formatClock(245)).toBe('4:05')
  })

  it('時間が来たら自動で次の区間に進む', () => {
    const v = viewTimer(start(), T0 + 5 * MIN + 30_000)
    expect(v).toMatchObject({ phaseName: 'ケース', remainingSec: 270 })
    expect(v.fractions).toEqual([1, 0.1, 0])
  })

  it('長く離れていても、まとめて正しい区間まで進む', () => {
    const t = tick(start(), T0 + 12 * MIN)
    expect(t.index).toBe(2)
    expect(t.used).toEqual([300, 300])
    expect(viewTimer(t, T0 + 12 * MIN)).toMatchObject({ phaseName: '発表', remainingSec: 180 })
  })

  it('全区間が終わったら止まる', () => {
    const t = tick(start(), T0 + 60 * MIN)
    expect(isDone(t)).toBe(true)
    expect(t.used).toEqual([300, 300, 300])
    expect(viewTimer(t, T0 + 60 * MIN)).toMatchObject({ phaseName: '終了', remainingSec: 0 })
  })

  it('一時停止の間は進まない', () => {
    const paused = pause(start(), T0 + 2 * MIN)
    expect(isPaused(paused)).toBe(true)
    expect(viewTimer(paused, T0 + 30 * MIN).remainingSec).toBe(180)
    const again = resume(paused, T0 + 30 * MIN)
    expect(viewTimer(again, T0 + 31 * MIN)).toMatchObject({ phaseName: 'フェルミ', remainingSec: 120 })
  })

  it('早めに次の区間へ進むと、使った時間が残る', () => {
    const t = skip(start(), T0 + 3 * MIN + 20_000)
    expect(t.used).toEqual([200])
    expect(viewTimer(t, T0 + 3 * MIN + 20_000)).toMatchObject({ phaseName: 'ケース', remainingSec: 300 })
  })

  it('終了すると、区間ごとの使用時間がそろう', () => {
    const t = finish(skip(start(), T0 + 4 * MIN), T0 + 6 * MIN)
    expect(isDone(t)).toBe(true)
    expect(t.used).toEqual([240, 120, 0])
  })
})
