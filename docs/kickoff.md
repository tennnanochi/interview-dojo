# Fableへの依頼文(コピーして使う)

準備は完了済み: 仕様書(docs/spec.md)、開発ルール(CLAUDE.md)、問題データ(data/)、Supabaseのテーブルとログイン設定、接続値(.env.example の形式)。

## 1回目: 計画だけ出してもらう

```
このリポジトリの CLAUDE.md と docs/spec.md を読んで、MVP1(暗記帳)を作る計画を立ててください。
- 構成: Vite + React + TypeScript のPWA。公開はVercel、同期はSupabase(テーブルは supabase/schema.sql で作成済み)
- ログインはメールのMagic Link
- 問題データは data/cards.json を使う
- 出してほしいもの: フォルダ構成、画面とコンポーネントの一覧、同期の設計(IndexedDBとSupabaseの役割分担)、作業の順番
まだコードは書かず、計画を見せて私の承認を待ってください。
```

## 2回目以降: 1機能ずつ

1. `計画通りに、ログインなしでカード出題と自己採点が動くところまで作ってください。履歴は端末内(IndexedDB)に保存でOKです。`
2. `一覧画面(数値を隠す切り替え)と、ホームの「今日の復習枚数」を作ってください。`
3. `Magic Linkでのログインと、card_states・reviews の同期を足してください。接続値は環境変数から読んでください。`
4. `PWAとしてホーム画面に追加できるようにして、オフラインでも暗記帳が動くようにしてください。`

各回のあと、プレビューで動きを確認してから次に進む。エラーが出たら、表示された文章をそのまま貼って「これを直して」と頼む。

## 公開(MVP1のあと)

Vercelでリポジトリを読み込み、環境変数に `VITE_SUPABASE_URL` と `VITE_SUPABASE_ANON_KEY` を入れて公開する。発行されたURLを、Supabaseの Authentication > URL Configuration の Site URL と Redirect URLs に登録する。
