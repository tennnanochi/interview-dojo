// 書きかけの演習を端末に自動保存する。アプリを閉じても、同じ問題を開けば続きから再開できる
import { useCallback, useEffect, useRef, useState } from 'react'
import { deleteDraft, loadDraft, saveDraft, type DraftKind } from '../db/local'

type Options<T> = {
  kind: DraftKind
  questionId: string
  create: () => T // まっさらな状態
  isBlank: (data: T) => boolean // 何も記入していないか(空なら保存しない)
}

export function useDraft<T>({ kind, questionId, create, isBlank }: Options<T>) {
  const [data, setData] = useState<T | null>(null) // 読み込み中は null
  const [restored, setRestored] = useState(false) // 前回の書きかけを読み込んだか
  const latest = useRef<T | null>(null)
  const dirty = useRef(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const fns = useRef({ create, isBlank })
  fns.current = { create, isBlank }

  const flush = useCallback(() => {
    clearTimeout(timer.current)
    if (!dirty.current || latest.current === null) return
    dirty.current = false
    const value = latest.current
    const job = fns.current.isBlank(value) ? deleteDraft(kind, questionId) : saveDraft(kind, questionId, value)
    job.catch((e) => console.error(e))
  }, [kind, questionId])

  // 開いたときに、前回の書きかけがあれば読み込む
  useEffect(() => {
    let alive = true
    setData(null)
    loadDraft<T>(kind, questionId)
      .catch((e) => {
        console.error(e)
        return undefined
      })
      .then((saved) => {
        if (!alive) return
        latest.current = saved?.data ?? fns.current.create()
        setRestored(saved !== undefined)
        setData(latest.current)
      })
    return () => {
      alive = false
    }
  }, [kind, questionId])

  // 画面を離れるとき・アプリが裏に回るときに、すぐ保存する
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === 'hidden') flush()
    }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [flush])

  // 記入を反映する。保存は少し待ってまとめて行う
  const update = useCallback(
    (patch: Partial<T>) => {
      if (latest.current === null) return
      latest.current = { ...latest.current, ...patch }
      dirty.current = true
      setData(latest.current)
      clearTimeout(timer.current)
      timer.current = setTimeout(flush, 400)
    },
    [flush],
  )

  // 記入を消して最初からやり直す
  const reset = useCallback(() => {
    clearTimeout(timer.current)
    dirty.current = false
    latest.current = fns.current.create()
    setRestored(false)
    setData(latest.current)
    deleteDraft(kind, questionId).catch((e) => console.error(e))
  }, [kind, questionId])

  return { data, restored, update, reset, flush }
}
