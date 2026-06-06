import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [
    viteTsConfigPaths({ projects: ["./tsconfig.json"] }),
    tanstackStart({
      server: { entry: "server" },
    }),
    viteReact(),
    tailwindcss(),
    nitro({
      routeRules: {
        "/assets/**": {
          headers: { "cache-control": "public, max-age=31536000, immutable" },
        },
        "/_build/**": {
          headers: { "cache-control": "public, max-age=31536000, immutable" },
        },
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/motion") || id.includes("node_modules/framer-motion")) return "motion";
          if (id.includes("node_modules/@stripe")) return "stripe";
          if (id.includes("node_modules/@radix-ui")) return "radix";
          if (id.includes("node_modules/react-dom") || id.includes("node_modules/react/")) return "react";
        },
      },
    },
  },
  environments: {
    ssr: { build: { rollupOptions: { input: "./src/server.ts" } } },
  },
});
