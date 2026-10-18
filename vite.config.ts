import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import pkg from './package.json' with { type: 'json' }

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  define: {
    // 构建期注入 APP 版本号（package.json），设置页「关于」展示 + 更新流程使用
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
})
