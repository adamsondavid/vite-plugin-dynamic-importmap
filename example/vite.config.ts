import { defineConfig } from "vite";
import dynamicImportmap from "../src";

export default defineConfig({
  build: {
    rollupOptions: {
      external: ["cowsay"],
    },
  },
  plugins: [dynamicImportmap("/importmap.json")],
});
