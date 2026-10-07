import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Local dev: copy .env.example to .env and set LLM_TUNNEL_URL + GATEWAY_TOKEN.
// The dev server proxies /api/chat -> $LLM_TUNNEL_URL/v1/chat/completions
// and injects the Bearer token server-side, so the token never reaches the browser.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['icon.svg'],
        manifest: {
          name: 'LLM Chat — self-hosted Qwen3-4B',
          short_name: 'LLM Chat',
          description: 'Chat with your self-hosted Qwen3-4B model on Oracle Cloud.',
          theme_color: '#1e293b',
          background_color: '#f1f5f9',
          display: 'standalone',
          start_url: '/',
          scope: '/',
          lang: 'en',
          icons: [
            { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
            {
              src: 'icon-maskable-512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
      }),
    ],
    server: {
      proxy: {
        '/api/chat': {
          target: env.LLM_TUNNEL_URL || 'http://127.0.0.1:1',
          changeOrigin: true,
          rewrite: () => '/v1/chat/completions',
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (env.GATEWAY_TOKEN) {
                proxyReq.setHeader('Authorization', `Bearer ${env.GATEWAY_TOKEN}`);
              }
            });
          },
        },
      },
    },
  };
});
