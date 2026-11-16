# 公開の手順(Vercel)

GitHubにpushすると、Vercelが自動でビルドして公開する。最初の1回だけ、次の設定をする。

## 1. 本番に出すブランチを用意する

Vercelは既定で `main` ブランチを本番として公開する。開発ブランチの内容を `main` に取り込んでおく(プルリクエストを作ってマージ)。

## 2. Vercelにリポジトリを読み込む

1. https://vercel.com にGitHubアカウントでログインする。
2. 「Add New… > Project」で `interview-dojo` を選ぶ(非公開リポジトリなので、VercelのGitHub連携でこのリポジトリへのアクセスを許可する)。
3. Framework Preset は「Vite」が自動で選ばれる。Build Command(`npm run build`)と Output Directory(`dist`)はそのまま。
4. 「Environment Variables」に次の2つを入れる。値は `.env.local` と同じ。

| 名前 | 値 |
|---|---|
| `VITE_SUPABASE_URL` | Supabase の Project Settings > API の Project URL |
| `VITE_SUPABASE_ANON_KEY` | 同じ画面の anon public key |

5. 「Deploy」を押す。終わると `https://〜.vercel.app` のURLが発行される。

**service_role key は入れない。** 入れるのは上の2つだけ。

環境変数を後から変えたときは、Deployments から「Redeploy」する(ビルド時に埋め込まれるため)。

## 3. Supabaseに公開URLを登録する

Supabase の Authentication > URL Configuration で次を設定する。これをしないと、メールのログインリンクが公開URLに戻れない。

- **Site URL**: 発行された公開URL(例 `https://interview-dojo.vercel.app`)
- **Redirect URLs**: 公開URLと、開発用の `http://localhost:5173` の両方

## 4. 公開後の確認(MVP1の完了条件)

1. スマホで公開URLを開き、ブラウザのメニューから「ホーム画面に追加」する。
2. ホーム右上の「未ログイン」からログインする(メールのリンクは、同じブラウザで開く)。
3. 数枚「覚えた」にして、バッジが「同期済み」になるのを待つ。
4. PCで公開URLを開いてログインし、**スマホで覚えたカードがPCでも覚えたになっている**ことを確かめる。
5. スマホを機内モードにしてアプリを開き、採点できることを確かめる。機内モードを切ると「同期済み」に戻る。

## 困ったとき

| 症状 | 見るところ |
|---|---|
| バッジが「同期なし」 | Vercelの環境変数が入っているか。入れた後に Redeploy したか |
| ログインリンクを開くと別のページに行く | Supabase の Redirect URLs に公開URLがあるか |
| メールが届かない | 迷惑メール。Supabase標準のメールは1時間あたりの送信数に上限がある |
| 「同期エラー」が続く | Supabaseのプロジェクトが停止していないか(無料枠は一定期間使わないと一時停止する) |
| 更新したのに古い画面のまま | アプリを一度閉じて開き直す(新しい版は次に開いたときに入れ替わる) |
