import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

/** Lleva la plantilla fija del cliente al script de index.html que pinta el fondo antes de React. */
function lockedTemplateInHtml(template: string): Plugin {
  return {
    name: 'vitrina-locked-template',
    transformIndexHtml: (html) => html.replace('__VITRINA_PLANTILLA__', template.replace(/[^a-z0-9_-]/gi, '')),
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  return {
    plugins: [react(), tailwindcss(), lockedTemplateInHtml(env.VITE_PLANTILLA ?? '')],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: { port: 5530, strictPort: true },
  }
})
