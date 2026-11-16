import { useEffect, useRef, type ReactNode } from 'react'
import styles from './Sheet.module.css'

type Props = {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode // スクロールする中身
  footer?: ReactNode // 下に固定するボタンなど
}

// 画面下から出るシート。×・Esc・外側タップで閉じる
export function Sheet({ open, onClose, title, children, footer }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      className={styles.sheet}
      aria-label={title}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose() // シートの外側(暗い部分)を押したら閉じる
      }}
    >
      <div className={styles.inner}>
        <div className={styles.head}>
          <h2 className={styles.title}>{title}</h2>
          <button type="button" className={styles.close} onClick={onClose} aria-label="閉じる">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <div className={styles.scroll}>{children}</div>
        {footer}
      </div>
    </dialog>
  )
}
