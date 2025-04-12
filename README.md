# vite-plugin-dynamic-importmap

[![npm](https://img.shields.io/npm/v/vite-plugin-dynamic-importmap.svg)](https://www.npmjs.com/package/vite-plugin-dynamic-importmap)

✨ A Vite plugin that enables dynamic importmap loading by ensuring the importmap is fetched at runtime and gets applied before any other JavaScript runs.

## 🚀 Motivation

When using [Importmaps](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap), it's critical that the map is present in the DOM before any module scripts are executed.

> An import map is used to resolve module specifiers in static and dynamic imports, and therefore must be declared and processed before any `<script>` elements that import modules using specifiers declared in the map.  
> — [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/script/type/importmap)

This becomes a problem when the importmap is not inline, but instead served as a remote file (e.g., fetched from an application server or is hosted statically).

Vite by default injects all module scripts directly into the HTML, which means they might load before your importmap is available.

That's where `vite-plugin-dynamic-importmap` comes in! ✅

## 🧩 What this plugin does

1. Removes all script entries from your `index.html` during build.
2. Injects a new script that:
   - Dynamically loads the importmap from a given URL.
   - Re-inserts the original scripts after the importmap has been processed.

This guarantees the importmap is applied before any JavaScript module runs — just like the spec intends. 🧠

## ✨ Installation

```sh
npm install -D vite-plugin-dynamic-importmap
```

## 🛠️ Usage

In your `vite.config.ts`:

```typescript
import { defineConfig } from "vite";
import dynamicImportmap from "vite-plugin-dynamic-importmap";

export default defineConfig({
  plugins: [dynamicImportmap("/importmap.json")],
});
```

> 💡 `./importmap.json` is not resolved or transformed by Vite.
> Just place it in the `public/` folder (or put it on any server).

## 💬 Why not just inline the importmap?

Inlining works great for static importmaps.
But sometimes you might want to update importmaps without rebuilding the app, e.g. when deploying the same microfrontend root-config to different environments.

## 🙏 Credits

Created with ❤️ by [@adamsondavid](https://github.com/adamsondavid).
PRs, issues, and stars are always welcome ⭐

## 📄 License

[MIT](LICENSE)
