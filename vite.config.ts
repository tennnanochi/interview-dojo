import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    // PWA:ホーム画面に追加でき、2回目以降は端末のキャッシュから開く(圏外でも暗記帳が動く)
    VitePWA({
      registerType: 'autoUpdate', // 新しい版を公開したら、次に開いたときに自動で入れ替える
      includeAssets: ['favicon.svg'],
      manifest: {
        name: '面接トレーニング',
        short_name: '面接トレ',
        description: 'フェルミ推定・ケース面接の学習アプリ',
        lang: 'ja',
        start_url: '/',
        display: 'standalone',
        background_color: '#eef1ee',
        theme_color: '#eef1ee',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // 画面・問題データ(JSに含まれる)・フォントを端末に保存する。フォントは woff2 だけで足りる
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        navigateFallback: '/index.html', // どの画面のアドレスで開いても、圏外で表示できる
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  build: { assetsInlineLimit: 0 }, // 小さいフォントをCSSに埋め込まない(CSSが肥大するため)
  server: { port: 5173, strictPort: true }, // Magic Linkの戻り先(localhost:5173)に合わせて固定
})
