// カードの学習状態。起動時にIndexedDBから読み、以後はメモリ上の写しを画面が参照する
import { useSyncExternalStore } from 'react'
import { cardById, type Card } from '../data/cards'
import { latestGrades, loadCardStates, saveCardStates, saveGrade } from '../db/local'
import type { CardState, Grade } from '../db/types'
import { applyGrade, resetIfOutdated } from '../domain/srs'

type Snapshot = {
  ready: boolean // IndexedDBから読み終えたか
  error: string | null // 端末内の保存が使えないとき
  states: ReadonlyMap<string, CardState>
}

let snapshot: Snapshot = { ready: false, error: null, states: new Map() }
const listeners = new Set<() => void>()
let started: Promise<void> | null = null
const changeListeners = new Set<() => void>()

function set(next: Partial<Snapshot>) {
  snapshot = { ...snapshot, ...next }
  listeners.forEach((l) => l())
}

async function init() {
  try {
    set({ ready: false })
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
  void whenReady()
  return () => listeners.delete(listener)
}

// IndexedDBから読み終えるのを待つ(同期処理が使う)
export function whenReady(): Promise<void> {
  started ??= init()
  return started
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
  changeListeners.forEach((l) => l())
  return next
}

// ---- ここから下は同期処理が使う ----

export function getStates(): ReadonlyMap<string, CardState> {
  return snapshot.states
}

// 採点されたら呼ばれる(同期のきっかけにする)
export function onLocalChange(listener: () => void): () => void {
  changeListeners.add(listener)
  return () => changeListeners.delete(listener)
}

const isNewer = (a: CardState, b: CardState | undefined) => !b || Date.parse(a.updatedAt) > Date.parse(b.updatedAt)

// DBのほうが新しかったカードを端末に取り込む
export async function adoptRemote(remote: CardState[]): Promise<void> {
  const fresh = remote.filter((r) => cardById.has(r.cardId) && isNewer(r, snapshot.states.get(r.cardId)))
  if (fresh.length === 0) return
  const grades = await latestGrades(fresh.map((r) => r.cardId))
  const now = new Date()
  const states = new Map(snapshot.states)
  const accepted: CardState[] = []
  for (const r of fresh) {
    if (!isNewer(r, states.get(r.cardId))) continue // 取り込みの準備中に、この端末で採点された
    const next = resetIfOutdated({ ...r, dirty: false, lastGrade: grades.get(r.cardId) }, cardById.get(r.cardId)!.version, now)
    states.set(r.cardId, next)
    accepted.push(next)
  }
  set({ states })
  await saveCardStates(accepted)
}

// DBと同じ内容になったカードから、未送信の印を外す(送った後にまた採点されていたら外さない)
export async function markClean(sent: CardState[]): Promise<void> {
  const states = new Map(snapshot.states)
  const cleaned: CardState[] = []
  for (const s of sent) {
    const cur = states.get(s.cardId)
    if (!cur || !cur.dirty || cur.updatedAt !== s.updatedAt) continue
    const next = { ...cur, dirty: false }
    states.set(s.cardId, next)
    cleaned.push(next)
  }
  if (cleaned.length === 0) return
  set({ states })
  await saveCardStates(cleaned)
}

// 端末内の履歴を消した後に、読み直す
export function reloadStore(): Promise<void> {
  set({ states: new Map() })
  started = init()
  return started
}
