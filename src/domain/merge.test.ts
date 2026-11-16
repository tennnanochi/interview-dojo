import { describe, expect, it } from 'vitest'
import type { CardState } from '../db/types'
import { mergeStates } from './merge'

const st = (cardId: string, updatedAt: string, status: CardState['status'] = 'known', dirty = false): CardState => ({
  cardId,
  status,
  dueOn: '2026-11-20',
  streak: 1,
  cardVersion: 1,
  updatedAt,
  dirty,
})
const ids = (xs: CardState[]) => xs.map((x) => x.cardId)

describe('端末とDBの突き合わせ', () => {
  it('DBにしかないカードは取り込み、端末にしかないカードは送る', () => {
    const r = mergeStates([st('a', '2026-11-15T01:00:00.000Z', 'known', true)], [st('b', '2026-11-15T01:00:00.000Z')])
    expect(ids(r.adopt)).toEqual(['b'])
    expect(ids(r.push)).toEqual(['a'])
  })

  it('同じカードは updated_at が新しいほうを採用する', () => {
    const local = [st('a', '2026-11-15T01:00:00.000Z', 'known', true), st('b', '2026-11-15T03:00:00.000Z', 'learning', true)]
    const remote = [st('a', '2026-11-15T02:00:00.000Z', 'learning'), st('b', '2026-11-15T02:00:00.000Z', 'known')]
    const r = mergeStates(local, remote)
    expect(r.adopt).toEqual([remote[0]]) // a はDBの「あやふや」が勝つ
    expect(r.push).toEqual([local[1]]) // b は端末の「あやふや」が勝つ
  })

  it('圏外で先に採点した端末が後から同期しても、新しい採点は上書きしない', () => {
    // スマホ:10:00に覚えた(圏外)。PC:11:00に忘れた(同期済み)。スマホが12:00に同期
    const phone = [st('a', '2026-11-15T10:00:00.000+09:00', 'known', true)]
    const db = [st('a', '2026-11-15T11:00:00.000+09:00', 'learning')]
    const r = mergeStates(phone, db)
    expect(r.push).toEqual([])
    expect(r.adopt[0].status).toBe('learning')
  })

  it('時刻の書き方が違っても同じ瞬間なら同じとみなし、未送信の印だけ外す', () => {
    const local = [st('a', '2026-11-15T01:00:00.000Z', 'known', true), st('b', '2026-11-15T01:00:00.000Z')]
    const remote = [st('a', '2026-11-15T10:00:00+09:00'), st('b', '2026-11-15T01:00:00+00:00')]
    const r = mergeStates(local, remote)
    expect(r.adopt).toEqual([])
    expect(r.push).toEqual([])
    expect(ids(r.clean)).toEqual(['a'])
  })

  it('どちらも空なら何もしない', () => {
    expect(mergeStates([], [])).toEqual({ adopt: [], push: [], clean: [] })
  })
})
