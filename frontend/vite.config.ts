import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const target = env.VITE_API_PROXY_TARGET || 'http://localhost:4000';
  const isAdminApp = mode === 'admin';
  const isProduction = mode === 'production';

  return {
    plugins: [react()],
    define: {
      __HUY_PERFUME_APP__: JSON.stringify(isAdminApp ? 'admin' : 'user'),
    },
    server: {
      port: isAdminApp ? 5178 : 5177,
      strictPort: true,
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
      sourcemap: !isProduction,
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            router: ['react-router-dom'],
            bootstrap: ['bootstrap'],
            axios: ['axios'],
          },
        },
      },
    },
  };
});
