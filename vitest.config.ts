import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  // Agent worktrees live under .claude/; never crawl or watch them.
  server: { watch: { ignored: ['**/.claude/**', '**/www/**', '**/android/**'] } },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/.claude/**'],
    watch: false,
    setupFiles: ['tests/setup.ts']
  }
});
