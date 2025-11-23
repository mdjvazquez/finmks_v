import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { nodePolyfills } from "vite-plugin-node-polyfills";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [
      react(),
      tailwindcss(),
      nodePolyfills({
        globals: true,
        include: ["util", "process", "stream"],
      }),
    ],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        // En Vite 5, este alias suele ser suficiente junto con los polyfills
        ws: "./src/stubs/ws.js",
      },
    },
    // Optimizamos para evitar que Vite se confunda con dependencias comunes
    optimizeDeps: {
      include: ["@supabase/supabase-js", "@supabase/realtime-js"],
    },
  };
});
