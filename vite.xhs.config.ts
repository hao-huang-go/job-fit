import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

// rednote's mini-tool container loads the zip offline: one index.html at the root, relative paths, and
// classic (non-module) scripts only.
const classicScripts: Plugin = {
  name: "classic-scripts",
  enforce: "post",
  transformIndexHtml(html) {
    return html.replace(/<script type="module" crossorigin src=/g, "<script defer src=").replace(/ crossorigin/g, "");
  },
};

export default defineConfig({
  root: "xhs",
  base: "./",
  plugins: [react(), classicScripts],
  build: {
    outDir: "../dist-xhs",
    emptyOutDir: true,
    target: "es2017",
    cssTarget: "chrome61",
    modulePreload: false,
    cssCodeSplit: false,
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        format: "iife",
        inlineDynamicImports: true,
        entryFileNames: "assets/app.js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});
