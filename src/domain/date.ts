// 日付は端末のローカル日付(日本時間)を YYYY-MM-DD の文字列で扱う。文字列のまま大小比較できる

export function toDateKey(d: Date): string {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

export function addDays(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  return toDateKey(new Date(y, m - 1, d + days))
}

// 表示用:「11/16(月)」
export function formatDateKey(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number)
  const week = '日月火水木金土'[new Date(y, m - 1, d).getDay()]
  return `${m}/${d}(${week})`
}
