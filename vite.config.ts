
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');
  return {
    define: {
      // Polyfill process.env.API_KEY for the Gemini SDK to work in browser.
      // Strictly relies on the value provided in the environment.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY),
      // Prevent other process.env usage from crashing
      'process.env': {}
    },
    build: {
        outDir: 'dist',
        target: 'esnext'
    }
  }
})
