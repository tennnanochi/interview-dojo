# interview-dojo

コンサル転職向けの、フェルミ推定・ケース面接の学習Webアプリ(暗記帳・フェルミ道場・ケース道場)。

- 仕様: [docs/spec.md](docs/spec.md)
- 開発ルール(Claude Code向け): [CLAUDE.md](CLAUDE.md)
- 実装の依頼文: [docs/kickoff.md](docs/kickoff.md)

## フォルダ
| パス | 中身 |
|---|---|
| `data/` | 問題データ(cards.json 273件、fermi.json 186問、cases.json 150問) |
| `docs/` | 仕様書と依頼文 |
| `supabase/schema.sql` | 学習履歴のテーブル定義(Supabaseに適用済み) |

## 問題データを直すとき
`data/` のJSONを編集してpushするだけで反映される。idは変えず、カードの数値を直したら `version` を1上げる。
