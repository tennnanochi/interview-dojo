# interview-dojo 開発ルール

コンサル転職向けのフェルミ推定・ケース面接の学習Webアプリ。仕様は `docs/spec.md`、見た目は仕様書にある画面モックのリンクを参照。

## 進め方
- 返答と、コード内のコメント・UIの文言は日本語。
- **1回の依頼で1機能**。作る前に計画(変更するファイルと手順)を見せ、承認を待ってから書く。
- 機能ができたら、ローカルで動かす手順と、確認してほしい操作を短く書く。
- 大きな方針変更(ライブラリの追加、データ構造の変更)は、理由を添えて先に相談する。

## 技術
- Vite + React + TypeScript、PWA。ホスティングはVercel、ログインと履歴はSupabase。
- 端末内の保存はIndexedDB。オフラインでも暗記帳が動き、つながったら同期する(仕様書「同期の仕組み」)。
- Supabaseの接続値は環境変数 `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` から読む。値は `.env.local`(gitに入れない)とVercelの環境変数に置く。
- **service_role key やAPIキーは、絶対にリポジトリやフロントエンドのコードに入れない。**

## データ
- 問題データは `data/` のJSON(cards.json / fermi.json / cases.json)。アプリはこれを読むだけで、書き換えない。
- **idは変えない、再利用しない**。カードの数値を直したら `version` を1上げる(上がったカードは復習に戻す)。
- DBのテーブル定義は `supabase/schema.sql`。Supabaseには適用済み。変更が必要なら、新しいSQLファイル(`supabase/migrations/`)を作って相談する。

## デザイン
- アクセント #1f5f4a、背景 #eef1ee、文字 #18221d、補助文字 #5d6b64、罫線 #d3dbd6。
- フォントは Zen Kaku Gothic New(本文)と JetBrains Mono(数字)。
- タップ領域は44px以上。主なボタンは画面の下半分に置く。絵文字は使わない。
