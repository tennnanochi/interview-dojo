import type { Grade } from '../db/types'

export const GRADE_LABEL: Record<Grade, string> = {
  good: '覚えた',
  unsure: 'あやふや',
  forgot: '忘れた',
}
