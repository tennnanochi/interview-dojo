// 端末内の保存(IndexedDB)。画面はここだけを読み書きし、Supabaseとは同期処理が裏でやり取りする
import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { CardState, Review } from './types'

interface DojoDB extends DBSchema {
  cardStates: { key: string; value: CardState }
  reviews: { key: string; value: Review; indexes: { cardId: string } }
  meta: { key: string; value: unknown }
}

let dbPromise: Promise<IDBPDatabase<DojoDB>> | null = null

function db() {
  dbPromise ??= openDB<DojoDB>('interview-dojo', 1, {
    upgrade(d) {
      d.createObjectStore('cardStates', { keyPath: 'cardId' })
      d.createObjectStore('reviews', { keyPath: 'key' }).createIndex('cardId', 'cardId')
      d.createObjectStore('meta')
    },
  })
  return dbPromise
}

export async function loadCardStates(): Promise<CardState[]> {
  return (await db()).getAll('cardStates')
}

export async function saveCardStates(states: CardState[]): Promise<void> {
  if (states.length === 0) return
  const tx = (await db()).transaction('cardStates', 'readwrite')
  await Promise.all([...states.map((s) => tx.store.put(s)), tx.done])
}

// 採点1回分。カードの状態と採点ログを、まとめて書く(片方だけ残らないように)
export async function saveGrade(state: CardState, review: Review): Promise<void> {
  const tx = (await db()).transaction(['cardStates', 'reviews'], 'readwrite')
  await Promise.all([tx.objectStore('cardStates').put(state), tx.objectStore('reviews').put(review), tx.done])
}

export async function loadReviews(): Promise<Review[]> {
  return (await db()).getAll('reviews')
}
