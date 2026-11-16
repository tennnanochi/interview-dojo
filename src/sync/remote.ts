// Supabaseのテーブル(card_states / reviews)とのやり取り。列名は supabase/schema.sql に合わせる
import type { SupabaseClient } from '@supabase/supabase-js'
import type { CardState, CardStatus, Grade, Review } from '../db/types'

export const REVIEW_PAGE = 1000

export type RemoteReview = Review & { id: number }

export type Remote = {
  fetchCardStates(): Promise<CardState[]>
  upsertCardStates(states: CardState[]): Promise<void>
  insertReviews(reviews: Review[]): Promise<void>
  fetchReviewsAfter(lastId: number): Promise<RemoteReview[]> // idの小さい順に最大 REVIEW_PAGE 件
}

type StateRow = {
  card_id: string
  status: CardStatus
  due_on: string | null
  streak: number
  card_version: number
  updated_at: string
}
type ReviewRow = { id: number; card_id: string; grade: Grade; reviewed_at: string }

// 時刻は端末と同じ書き方(ISO・ミリ秒)にそろえる
const iso = (t: string) => new Date(t).toISOString()

export function supabaseRemote(client: SupabaseClient, userId: string): Remote {
  return {
    async fetchCardStates() {
      const { data, error } = await client
        .from('card_states')
        .select('card_id,status,due_on,streak,card_version,updated_at')
        .eq('user_id', userId)
      if (error) throw error
      return (data as StateRow[]).map((r) => ({
        cardId: r.card_id,
        status: r.status,
        dueOn: r.due_on,
        streak: r.streak,
        cardVersion: r.card_version,
        updatedAt: iso(r.updated_at),
        dirty: false,
      }))
    },

    async upsertCardStates(states) {
      const rows = states.map((s) => ({
        user_id: userId,
        card_id: s.cardId,
        status: s.status,
        due_on: s.dueOn,
        streak: s.streak,
        card_version: s.cardVersion,
        updated_at: s.updatedAt,
      }))
      const { error } = await client.from('card_states').upsert(rows, { onConflict: 'user_id,card_id' })
      if (error) throw error
    },

    async insertReviews(reviews) {
      const rows = reviews.map((r) => ({
        user_id: userId,
        card_id: r.cardId,
        grade: r.grade,
        reviewed_at: r.reviewedAt,
      }))
      const { error } = await client.from('reviews').insert(rows)
      if (error) throw error
    },

    async fetchReviewsAfter(lastId) {
      const { data, error } = await client
        .from('reviews')
        .select('id,card_id,grade,reviewed_at')
        .eq('user_id', userId)
        .gt('id', lastId)
        .order('id', { ascending: true })
        .limit(REVIEW_PAGE)
      if (error) throw error
      return (data as ReviewRow[]).map((r) => {
        const reviewedAt = iso(r.reviewed_at)
        return { id: r.id, key: `${r.card_id}|${reviewedAt}`, cardId: r.card_id, grade: r.grade, reviewedAt, synced: true }
      })
    },
  }
}
