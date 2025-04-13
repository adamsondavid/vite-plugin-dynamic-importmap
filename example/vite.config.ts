import { defineConfig } from "vite";
import dynamicImportmap from "../src";

export default defineConfig({
  plugins: [dynamicImportmap({ importmap: "/importmap.json" })],
});
