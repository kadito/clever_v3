import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@clever/shared': resolve(__dirname, '../shared/src'),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable sourcemaps for production KV storage
    emptyOutDir: true,
    rollupOptions: {
      output: {
        // Ensure consistent hashing for KV storage
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
        manualChunks: {
          vendor: ['vue', 'vue-router', 'pinia'],
        },
      },
    },
    // Optimize for KV storage
    minify: 'esbuild',
    target: 'es2020',
    cssCodeSplit: true,
    // Ensure assets are properly hashed for caching
    assetsInlineLimit: 4096, // Inline small assets
  },
  server: {
    port: 3000,
    host: true,
    // Configure proxy to handle CORS issues with Clerk
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
  },
  // Define global constants for Clerk
  define: {
    global: 'globalThis',
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ['@clerk/vue'],
    exclude: [],
  },
});
