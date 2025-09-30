import { reactRouter } from "@react-router/dev/vite";
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import vitePluginString from "vite-plugin-string";

export default defineConfig({
  plugins: [
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    vitePluginString({
      include: ["**/*.sql"],
    }),
  ],
  optimizeDeps: {
    exclude: ["virtual:react-router/server-build", "cloudflare:email"], 
        
  },
  build: {
    minify: "terser",
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
      },
    },
    rollupOptions: {
      external: ["cloudflare:email"],
      output: {
        manualChunks: (id) => {
          // Split large dependencies into separate chunks
          if (id.includes('node_modules')) {
            if (id.includes('react-markdown')) {
              return 'markdown';
            }
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            if (id.includes('@radix-ui')) {
              return 'radix';
            }
          }
        },
      },
    }
  }
});
