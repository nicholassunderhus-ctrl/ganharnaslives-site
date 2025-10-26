import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Carrega as variáveis de ambiente do arquivo .env apropriado para o modo (development, production)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_SUPABASE_URL, // Usa a variável de ambiente carregada
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '/functions/v1'),
        },
      },
    },
  };
});
