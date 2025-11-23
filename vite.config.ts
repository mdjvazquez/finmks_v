import path from "path";
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
      // ⚠️ ESTA ES LA SOLUCIÓN DEFINITIVA ⚠️
      // Esto le dice a Vite: "Al buscar librerías (como supabase),
      // usa primero el archivo indicado en el campo 'browser' del package.json".
      // Esto evita que entre a la carpeta 'module' rota que causaba tu error.
      mainFields: ["browser", "module", "main"],
    },
  };
});
