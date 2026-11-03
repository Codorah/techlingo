import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

// The React app builds to build/ so it never collides with the legacy www/ app.
export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: { outDir: 'build', emptyOutDir: true, target: 'es2020' },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png'],
      manifest: {
        id: '/',
        name: 'TechLingo : l’anglais de ton métier',
        short_name: 'TechLingo',
        description: "L'anglais de ton métier, informatique, marketing, aéronautique ou événementiel : des parcours en situation, l'oral, des rappels et la préparation aux entretiens.",
        lang: 'fr',
        start_url: '/?source=pwa',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#EAF6FF',
        theme_color: '#EAF6FF',
        categories: ['education', 'productivity'],
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icons/icon-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: {
        importScripts: ['/sw-notify.js'],
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // SEO files (social preview image, robots, sitemap) are for crawlers, not for offline use.
        globIgnores: ['content/**', 'decouvrir/**', 'legal/**', 'og-image.png', 'robots.txt', 'sitemap.xml'],
        navigateFallback: '/index.html',
        // The public landing page is a separate static page, never the app shell.
        navigateFallbackDenylist: [/^\/decouvrir/, /^\/legal/, /^\/api\//,/^\/(robots\.txt|sitemap\.xml|og-image\.png)$/],
        runtimeCaching: [
          {
            // Role packs are downloaded on demand and kept for offline use; the network
            // wins when reachable so new words show up right after a deploy.
            urlPattern: ({ url }) => url.pathname.startsWith('/content/'),
            handler: 'NetworkFirst',
            options: { cacheName: 'content-packs', networkTimeoutSeconds: 4, expiration: { maxEntries: 60 } }
          }
        ]
      }
    })
  ]
});
