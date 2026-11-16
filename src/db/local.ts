// 端末内の保存(IndexedDB)。画面はここだけを読み書きし、Supabaseとは同期処理が裏でやり取りする
import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { CardState, Grade, Review } from './types'

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
  const writes = [tx.objectStore('cardStates').put(state), tx.objectStore('reviews').put(review)]
  tx.commit() // すぐ確定させる(採点直後にアプリを閉じても残りやすくする)
  await Promise.all([...writes, tx.done])
}

export async function loadReviews(): Promise<Review[]> {
  return (await db()).getAll('reviews')
}

export async function loadUnsyncedReviews(): Promise<Review[]> {
  return (await loadReviews()).filter((r) => !r.synced)
}

// 採点ログを書く。鍵(カードid|採点時刻)が同じものは上書きされるので、二重にならない
export async function saveReviews(reviews: Review[]): Promise<void> {
  if (reviews.length === 0) return
  const tx = (await db()).transaction('reviews', 'readwrite')
  await Promise.all([...reviews.map((r) => tx.store.put(r)), tx.done])
}

// カードごとの、いちばん新しい採点(他の端末から取り込んだカードに「前回:」を出すため)
export async function latestGrades(cardIds: string[]): Promise<Map<string, Grade>> {
  const index = (await db()).transaction('reviews').store.index('cardId')
  const result = new Map<string, Grade>()
  for (const cardId of cardIds) {
    const list = await index.getAll(cardId)
    const latest = list.reduce<Review | undefined>((a, b) => (!a || b.reviewedAt > a.reviewedAt ? b : a), undefined)
    if (latest) result.set(cardId, latest.grade)
  }
  return result
}

// 端末ごとの覚え書き(ログイン中のuser_id、取り込み済みのreviewsの位置)
export async function getMeta<T>(key: string): Promise<T | undefined> {
  return (await db()).get('meta', key) as Promise<T | undefined>
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  await (await db()).put('meta', value, key)
}

// 端末内の学習履歴をすべて消す(別のユーザーでログインしたとき)
export async function clearAll(): Promise<void> {
  const tx = (await db()).transaction(['cardStates', 'reviews', 'meta'], 'readwrite')
  await Promise.all([tx.objectStore('cardStates').clear(), tx.objectStore('reviews').clear(), tx.objectStore('meta').clear(), tx.done])
}
