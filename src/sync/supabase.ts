// Supabaseへの接続。接続値は環境変数から読む(.env.local と Vercelの環境変数に置く)
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// 接続値がなければ null。その場合もアプリは端末内だけで動く(同期とログインだけ使えない)
export const supabase: SupabaseClient | null = url && anonKey ? createClient(url, anonKey) : null
