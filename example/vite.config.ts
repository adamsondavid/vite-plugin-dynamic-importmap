import { defineConfig } from "vite";
import dynamicImportmap from "../src";

export default defineConfig({
  build: {
    target: "esnext",
  },
  plugins: [dynamicImportmap({ importmap: "/importmap.json" })],
});
