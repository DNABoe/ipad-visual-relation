import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig, PluginOption } from "vite";
import sparkPlugin from "@github/spark/spark-vite-plugin";
import createIconImportProxy from "@github/spark/vitePhosphorIconProxyPlugin";
import { resolve } from "path";

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname;

// Full Vite-konfiguration för RelEye-projektet
export default defineConfig({
  // 👇 Viktigt för att GitHub Pages + custom domain ska fungera korrekt
  base: "/",

  plugins: [
    react(),
    tailwindcss(),
    // Spark / Phosphor / internal plugins
    createIconImportProxy() as PluginOption,
    sparkPlugin() as PluginOption,
  ],

  resolve: {
    alias: {
      "@": resolve(projectRoot, "src"),
    },
  },

  build: {
    outDir: "dist",
    sourcemap: false,
    emptyOutDir: true,
  },

  publicDir: "public",

  server: {
    port: 5173, // för lokal utveckling
    open: true,
  },
});
