// ログイン状態と同期のきっかけを管理する。画面は useSync() で状態を読む
import { useSyncExternalStore } from 'react'
import { clearAll, getMeta, setMeta } from '../db/local'
import { getStates, onLocalChange, reloadStore, whenReady } from '../hooks/useCardStates'
import { syncOnce } from './engine'
import { supabaseRemote } from './remote'
import { supabase } from './supabase'

export type SyncUser = { id: string; email: string }

export type SyncState = {
  enabled: boolean // 接続値が設定されているか
  authReady: boolean // ログイン状態を確認し終えたか
  user: SyncUser | null
  online: boolean
  syncing: boolean
  error: string | null
  lastSyncedAt: string | null
}

let state: SyncState = {
  enabled: supabase !== null,
  authReady: supabase === null,
  user: null,
  online: navigator.onLine,
  syncing: false,
  error: null,
  lastSyncedAt: null,
}
const listeners = new Set<() => void>()

function set(next: Partial<SyncState>) {
  state = { ...state, ...next }
  listeners.forEach((l) => l())
}

export function useSync(): SyncState {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}

let timer: ReturnType<typeof setTimeout> | undefined
let running = false
let again = false

// 同期を頼む。続けて頼まれたら1回にまとめる
export function requestSync(delayMs = 0) {
  clearTimeout(timer)
  timer = setTimeout(() => void run(), delayMs)
}

async function run() {
  if (!supabase || !state.user || !navigator.onLine) return
  if (running) {
    again = true
    return
  }
  running = true
  set({ syncing: true })
  try {
    const remote = supabaseRemote(supabase, state.user.id)
    await syncOnce(remote)
    // 取り込み中に採点された分や、versionが上がって復習に戻した分が残っていれば、もう1回だけ送る
    if ([...getStates().values()].some((s) => s.dirty)) await syncOnce(remote)
    set({ error: null, lastSyncedAt: new Date().toISOString() })
  } catch (e) {
    console.error(e)
    set({ error: navigator.onLine ? '同期できませんでした。しばらくしてから自動でやり直します' : null })
  } finally {
    running = false
    set({ syncing: false })
    if (again) {
      again = false
      requestSync(1000)
    }
  }
}

// ログインしたユーザーを覚える。前と違うユーザーなら、端末内の履歴を消してから取り込む
async function onUser(user: SyncUser | null) {
  if (user?.id === state.user?.id) {
    set({ authReady: true })
    return
  }
  if (user) {
    await whenReady()
    const before = await getMeta<string>('userId')
    if (before && before !== user.id) {
      await clearAll()
      await reloadStore()
    }
    await setMeta('userId', user.id)
  }
  set({ user, authReady: true, error: null, lastSyncedAt: null })
  if (user) requestSync()
}

let started = false

// アプリ起動時に1回だけ呼ぶ
export function startSync() {
  if (started || !supabase) return
  started = true

  // メールのリンクから戻ってきたときのログインも、ここで受け取る
  supabase.auth.onAuthStateChange((_event, session) => {
    const u = session?.user
    // この通知の中でSupabaseを呼ぶと固まるので、いったん外に出してから処理する
    setTimeout(() => void onUser(u ? { id: u.id, email: u.email ?? '' } : null).catch((e) => console.error(e)), 0)
  })

  // 起動時・画面を開き直したとき・オンライン復帰時・採点後に同期する
  window.addEventListener('online', () => {
    set({ online: true })
    requestSync()
  })
  window.addEventListener('offline', () => set({ online: false }))
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') requestSync()
  })
  onLocalChange(() => requestSync(3000))
}

// メールにログインリンクを送る。リンクを開くと今のアドレス(開発中は http://localhost:5173)に戻る
export async function sendLoginLink(email: string): Promise<void> {
  if (!supabase) throw new Error('Supabaseの接続値が設定されていません')
  const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: window.location.origin } })
  if (error) throw error
}

// ログアウト。端末内の履歴は残す(次に同じユーザーでログインすれば、そのまま続きから同期する)
export async function signOut(): Promise<void> {
  await supabase?.auth.signOut({ scope: 'local' }) // この端末だけログアウトする(他の端末はそのまま)
}
