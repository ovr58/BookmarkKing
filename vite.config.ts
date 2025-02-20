import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        {
          src: 'public/_locales/*.*',
          dest: '_locales',
        },
        {
          src: 'public/assets/*.*',
          dest: 'assets',
        },
        {
          src: 'public/content/*.*',
          dest: 'content',
        },
        {
          src: 'public/*.*',
          dest: '.',
        }
      ],
    }),
  ],
  build: {
    outDir: 'build',
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
});