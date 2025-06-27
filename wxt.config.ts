import tailwind from '@tailwindcss/vite';
import path from 'path';
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],

  manifest: {
    cross_origin_isolated: true,
    permissions: ['microphone'],
    host_permissions: [
      'https://huggingface.co/*',
      'https://cdn.jsdelivr.net/*',
    ],
    action: { default_popup: 'popup.html' },
    content_security_policy: {
      extension_pages:
        "script-src 'self' 'wasm-unsafe-eval'; object-src 'self';",
    },
  },
  vite: () => ({
    optimizeDeps: {
      exclude: ['@xenova/transformers'],
    },
    plugins: [tailwind()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './'),
      },
    },
  }),
});
