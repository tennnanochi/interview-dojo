import { fermiTypes } from '../data/fermi'
import { Sheet } from './Sheet'
import styles from './FermiTypesSheet.module.css'

type Props = { open: boolean; onClose: () => void }

// 試算方法12種の早見表
export function FermiTypesSheet({ open, onClose }: Props) {
  return (
    <Sheet open={open} onClose={onClose} title="試算方法の早見表">
      {Object.entries(fermiTypes).map(([key, t]) => (
        <section key={key} className={styles.type}>
          <h3 className={styles.name}>{t.name}</h3>
          <p className={styles.formula}>{t.formula}</p>
          <dl className={styles.rows}>
            <div>
              <dt>使いどころ</dt>
              <dd>{t.when}</dd>
            </div>
            <div>
              <dt>向いている数字</dt>
              <dd>{t.useFor}</dd>
            </div>
            <div>
              <dt>例</dt>
              <dd>{t.example}</dd>
            </div>
          </dl>
          <p className={styles.ref}>{t.ref}</p>
        </section>
      ))}
    </Sheet>
  )
}
