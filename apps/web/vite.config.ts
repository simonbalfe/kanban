import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(({ command }) => {
  const isBuilding = command === "build";

  return {
    server: {
      port: 3000,
      allowedHosts: true,
    },
    envPrefix: ["VITE_"],
    plugins: [
      isBuilding && cloudflare({ viteEnvironment: { name: "ssr" } }),
      tailwindcss(),
      tsconfigPaths(),
      tanstackStart({
        srcDirectory: "src",
        router: {
          routesDirectory: "app",
        },
      }),
      viteReact(),
    ].filter(Boolean),
  };
});
