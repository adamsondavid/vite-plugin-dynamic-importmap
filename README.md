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
   - Dynamically loads the importmap from a given url or via custom resolver function.
   - Re-inserts the original scripts after the importmap has been added to the DOM.

This guarantees the importmap is applied before any JavaScript module runs - just like the spec intends.

## ✨ Installation

```sh
npm install -D vite-plugin-dynamic-importmap
```

## 🛠️ Usage

```typescript
// vite.config.ts
import dynamicImportmap from "vite-plugin-dynamic-importmap";

export default {
  plugins: [dynamicImportmap({ importmap: "/importmap.json" })],
};
```

> 💡 Recommendation: store your importmap in `public/importmap.json` so Vite will automatically copy it to the build output directory.
> As the importmap is resolved dynamically at runtime, it is important that the importmap file will be available on your webserver.

### Options

```typescript
export type Options = {
  /**
   * Configure how the importmap should be resolved during runtime.
   *
   * You can provide one of the following types:
   *
   * - `string`: A URL pointing to the importmap. The importmap will be fetched from that URL at runtime.
   * - `function`: A function that returns an {@link Importmap} or Promise<{@link Importmap}>.
   * This function will be serialized and inlined to be called during runtime.
   * Keep this function small and self-contained, as the outside scope will not be available after serialization.
   * - `Importmap`: A static importmap that is already known at buildtime.
   */
  importmap: string | (() => Importmap | Promise<Importmap>) | Importmap;
  /**
   * Enables the possibility to apply an importmap override at runtime.
   *
   * When this option is enabled, `localStorage.getItem("importmap")` is checked to see whether an importmap override is present.
   * If an importmap is found in `localStorage`, it will take precedence over dynamically loading the importmap.
   * This allows for dynamic overrides of the importmap on client side and can easily be integrated into your development / debugging setup.
   *
   * Set to `false` to always dynamically load the importmap, regardless of any override in `localStorage`.
   *
   * **default**: `true`
   */
  respectOverride?: boolean;
};
```

### Advanced Example: Loading the importmap from antoher webserver

```typescript
// vite.config.ts
import dynamicImportmap from "vite-plugin-dynamic-importmap";

export default {
  plugins: [dynamicImportmap({ importmap: "https://config-server.com/importmap" })],
};
```

### Advanced Example: Using a callback function to retrieve the importmap

There are several usecases why you might need to fetch the importmap in a custom callback function yourself.

Maybe...

- you need to adjust headers like authentication or CORS to retrieve the importmap.
- you want to introduce more layers of indirection before fetching the importmap.
- the importmap you want to load is embedded in a file that does not follow the importmap standard and needs extra processing.
- you do not agree with our override mechanism and want to implement your own.

Here is just one simple example that implements some of the above-mentioned ideas:

```typescript
// vite.config.ts
import dynamicImportmap from "vite-plugin-dynamic-importmap";

export default {
  plugins: [
    dynamicImportmap({
      importmap: async () => {
        const override = localStorage.getItem("my-own-importmap-override");
        if (override) return override;
        const config = await fetch("/config.json").then((r) => r.json());
        return fetch(config.importmapUrl).then((r) => r.json());
      },
      respectOverride: false,
    }),
  ],
};
```

## 💬 Why not just inline the importmap?

Inlining is ideal for static importmaps, but there are scenarios where you may need to update importmaps without rebuilding the entire app.
This is particularly beneficial in microfrontend architectures.
In such setups, a root configuration is typically built once and deployed across multiple environments (e.g., dev, staging, production).
Naturally, the imports for each microfrontend will vary depending on the environment.
With dynamic importmaps, you can easily swap the importmap via file mount, allowing you to reuse the same build without any modifications.

## 🙏 Credits

Created with ❤️ by [@adamsondavid](https://github.com/adamsondavid).
PRs, issues, and stars are always welcome ⭐

## 📄 License

[MIT](LICENSE)
