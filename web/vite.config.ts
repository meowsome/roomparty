import { svelte } from '@sveltejs/vite-plugin-svelte'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  root: "web",
  plugins: [svelte()],

    server: {
      proxy: {
        "/ws": {
            target: "ws://localhost:8080",
            ws: true,
        },
      },
    },
})
