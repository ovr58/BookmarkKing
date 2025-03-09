import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'public/_locales/**/*.*',
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