import {adorableCSS} from "adorable-css/vite"
import {resolve} from "path"
import {defineConfig} from "vite"
import {svelte} from "@sveltejs/vite-plugin-svelte"

// https://vitejs.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      src: resolve('src')
    }
  },
  plugins: [adorableCSS(), svelte()]
})
