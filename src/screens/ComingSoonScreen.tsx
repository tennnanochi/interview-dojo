import { ScreenHeader } from '../components/ScreenHeader'
import s from './screens.module.css'

type Props = { title: string; lead: string }

// MVP2で作る画面の置き場所
export function ComingSoonScreen({ title, lead }: Props) {
  return (
    <>
      <ScreenHeader title={title} />
      <div className={s.body}>
        <section className={s.panel}>
          <span className={s.panelTitle}>準備中</span>
          <span className={s.sub}>{lead}。暗記帳(MVP1)のあとに追加します</span>
        </section>
      </div>
    </>
  )
}
