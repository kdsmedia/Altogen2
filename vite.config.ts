import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    define: {
      // Polyfill process.env.API_KEY for the Gemini SDK to work in browser
      // Using provided key as fallback
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || "AIzaSyDYEcHSmZ6_ZEX_SXjn1mm6DaQNVwSdPjQ"),
      // Prevent other process.env usage from crashing
      'process.env': {}
    },
    build: {
        outDir: 'dist',
        target: 'esnext'
    }
  }
})