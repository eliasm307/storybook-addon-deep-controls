import vue from "@vitejs/plugin-vue";
import {type PluginOption, defineConfig} from "vite";

// https://vitejs.dev/config/
export default defineConfig(({command}) => {
  const isServe = command === "serve";

  // NOTE: vue plugin must be after storybook plugins
  const plugins: PluginOption[] = [vue()];

  return {
    build: {
      emptyOutDir: true,
      outDir: "dist",
      rollupOptions: {
        cache: false,
        external: ["vue"],
      },
      sourcemap: isServe,
      target: ["es2022"],
    },
    clearScreen: false,
    plugins,
  };
});
