// 端末内の保存(IndexedDB)。画面はここだけを読み書きし、Supabaseとは同期処理が裏でやり取りする
import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Attempt, AttemptKind, CardState, Grade, Review } from './types'

// 書きかけの演習。端末内だけに置く(同期しない)
export type DraftKind = 'fermi' | 'case'
export type Draft<T = unknown> = {
  key: string // 種類:問題id
  kind: DraftKind
  questionId: string
  data: T
  updatedAt: string
}

interface DojoDB extends DBSchema {
  cardStates: { key: string; value: CardState }
  reviews: { key: string; value: Review; indexes: { cardId: string } }
  meta: { key: string; value: unknown }
  drafts: { key: string; value: Draft }
  attempts: { key: string; value: Attempt }
}

let dbPromise: Promise<IDBPDatabase<DojoDB>> | null = null

function db() {
  dbPromise ??= openDB<DojoDB>('interview-dojo', 3, {
    upgrade(d, oldVersion) {
      // 版1:暗記帳
      if (oldVersion < 1) {
        d.createObjectStore('cardStates', { keyPath: 'cardId' })
        d.createObjectStore('reviews', { keyPath: 'key' }).createIndex('cardId', 'cardId')
        d.createObjectStore('meta')
      }
      // 版2:フェルミ道場・ケース道場の書きかけ
      if (oldVersion < 2) d.createObjectStore('drafts', { keyPath: 'key' })
      // 版3:フェルミ道場・ケース道場の挑戦の記録
      if (oldVersion < 3) d.createObjectStore('attempts', { keyPath: 'key' })
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
  const tx = (await db()).transaction(['cardStates', 'reviews', 'meta', 'drafts', 'attempts'], 'readwrite')
  await Promise.all([
    tx.objectStore('cardStates').clear(),
    tx.objectStore('reviews').clear(),
    tx.objectStore('meta').clear(),
    tx.objectStore('drafts').clear(),
    tx.objectStore('attempts').clear(),
    tx.done,
  ])
}

// ---- 書きかけの演習 ----

const draftKey = (kind: DraftKind, questionId: string) => `${kind}:${questionId}`

export async function loadDraft<T>(kind: DraftKind, questionId: string): Promise<Draft<T> | undefined> {
  return (await db()).get('drafts', draftKey(kind, questionId)) as Promise<Draft<T> | undefined>
}

export async function saveDraft<T>(kind: DraftKind, questionId: string, data: T): Promise<void> {
  const draft: Draft = { key: draftKey(kind, questionId), kind, questionId, data, updatedAt: new Date().toISOString() }
  await (await db()).put('drafts', draft)
}

export async function deleteDraft(kind: DraftKind, questionId: string): Promise<void> {
  await (await db()).delete('drafts', draftKey(kind, questionId))
}

// その種類の書きかけを、新しい順に返す
export async function loadDrafts<T>(kind: DraftKind): Promise<Draft<T>[]> {
  const all = (await (await db()).getAll('drafts')) as Draft<T>[]
  return all.filter((d) => d.kind === kind).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
}

// ---- 挑戦の記録 ----

// 記録を書く。鍵が同じものは上書きされるので、二重にならない
export async function saveAttempts(attempts: Attempt[]): Promise<void> {
  if (attempts.length === 0) return
  const tx = (await db()).transaction('attempts', 'readwrite')
  await Promise.all([...attempts.map((a) => tx.store.put(a)), tx.done])
}

// 新しい順に返す。種類を指定しなければ全部
export async function loadAttempts(kind?: AttemptKind): Promise<Attempt[]> {
  const all = await (await db()).getAll('attempts')
  return all.filter((a) => !kind || a.kind === kind).sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function loadUnsyncedAttempts(): Promise<Attempt[]> {
  return (await loadAttempts()).filter((a) => !a.synced)
}
