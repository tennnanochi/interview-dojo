import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: { assetsInlineLimit: 0 }, // 小さいフォントをCSSに埋め込まない(CSSが肥大するため)
  server: { port: 5173, strictPort: true }, // Magic Linkの戻り先(localhost:5173)に合わせて固定
})
