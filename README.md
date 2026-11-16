# interview-dojo

コンサル転職向けの、フェルミ推定・ケース面接の学習Webアプリ(暗記帳・フェルミ道場・ケース道場)。

- 仕様: [docs/spec.md](docs/spec.md)
- 開発ルール(Claude Code向け): [CLAUDE.md](CLAUDE.md)
- 実装の依頼文: [docs/kickoff.md](docs/kickoff.md)
- 公開の手順: [docs/deploy.md](docs/deploy.md)

## フォルダ
| パス | 中身 |
|---|---|
| `data/` | 問題データ(cards.json 277件、fermi.json 186問、cases.json 258問) |
| `docs/` | 仕様書と依頼文 |
| `src/` | アプリ本体(画面、間隔反復、端末内保存、同期) |
| `supabase/schema.sql` | 学習履歴のテーブル定義(Supabaseに適用済み) |

## 問題データを直すとき
`data/` のJSONを編集してpushするだけで反映される。idは変えず、カードの数値を直したら `version` を1上げる。

## ローカルで動かす
```bash
npm install
npm run dev
```
http://localhost:5173 を開く。Supabaseの接続値は `.env.example` を `.env.local` にコピーして入れる。入れなくても端末内だけで動く(ログインと同期だけ使えない)。値を入れたら開発サーバーを起動し直す。

確認用のコマンド:
```bash
npm test
npm run build
npm run preview
```
`npm run preview` は本番と同じ形(PWA込み)で http://localhost:4173 に開く。オフライン動作はこちらで確かめる。
