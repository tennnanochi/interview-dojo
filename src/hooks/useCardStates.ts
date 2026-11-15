// カードの学習状態。起動時にIndexedDBから読み、以後はメモリ上の写しを画面が参照する
import { useSyncExternalStore } from 'react'
import { cardById, type Card } from '../data/cards'
import { loadCardStates, saveCardStates, saveGrade } from '../db/local'
import type { CardState, Grade } from '../db/types'
import { applyGrade, resetIfOutdated } from '../domain/srs'

type Snapshot = {
  ready: boolean // IndexedDBから読み終えたか
  error: string | null // 端末内の保存が使えないとき
  states: ReadonlyMap<string, CardState>
}

let snapshot: Snapshot = { ready: false, error: null, states: new Map() }
const listeners = new Set<() => void>()
let started = false

function set(next: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...next }
  listeners.forEach((l) => l())
}

async function init() {
  try {
    const now = new Date()
    const states = new Map<string, CardState>()
    const reset: CardState[] = []
    for (const st of await loadCardStates()) {
      const card = cardById.get(st.cardId)
      if (!card) continue // データから消えたカードの履歴は使わない
      const next = resetIfOutdated(st, card.version, now)
      if (next !== st) reset.push(next)
      states.set(st.cardId, next)
    }
    await saveCardStates(reset)
    set({ ready: true, states })
  } catch (e) {
    console.error(e)
    set({ ready: true, error: 'この端末では学習履歴を保存できません(プライベートブラウズでは保存されません)' })
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (!started) {
    started = true
    void init()
  }
  return () => listeners.delete(listener)
}

export function useCardStates(): Snapshot {
  return useSyncExternalStore(subscribe, () => snapshot)
}

// 採点する。画面はすぐ進め、保存は裏で行う
export function gradeCard(card: Card, grade: Grade, now = new Date()): CardState {
  const next = applyGrade(snapshot.states.get(card.id), card.id, card.version, grade, now)
  const states = new Map(snapshot.states)
  states.set(card.id, next)
  set({ states })
  saveGrade(next, {
    key: `${card.id}|${next.updatedAt}`,
    cardId: card.id,
    grade,
    reviewedAt: next.updatedAt,
    synced: false,
  }).catch((e) => {
    console.error(e)
    set({ error: '採点を端末に保存できませんでした' })
  })
  return next
}
