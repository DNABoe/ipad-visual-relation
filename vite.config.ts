import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, PluginOption } from "vite";
import { resolve } from 'path'

let sparkPlugin: any = null
let createIconImportProxy: any = null

try {
  sparkPlugin = (await import("@github/spark/spark-vite-plugin")).default
  createIconImportProxy = (await import("@github/spark/vitePhosphorIconProxyPlugin")).default
  console.log('✓ Spark plugins loaded')
} catch (error) {
  console.log('Running in standalone mode - Spark plugins not available')
}

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      fastRefresh: true,
      babel: {
        plugins: []
      }
    }),
    tailwindcss(),
    createIconImportProxy ? createIconImportProxy() as PluginOption : null,
    sparkPlugin ? sparkPlugin() as PluginOption : null,
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src')
    }
  },
  optimizeDeps: {
    exclude: ['@github/spark']
  }
});
