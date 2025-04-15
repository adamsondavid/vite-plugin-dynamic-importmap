import { Importmap } from "./types";
import { Plugin } from "vite";
import { transformHtml } from "./transform-html";

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

/**
 * A Vite plugin that enables dynamic importmap loading by ensuring the importmap is fetched at runtime and gets applied before any other JavaScript runs.
 */
export function dynamicImportmap(options: Options): Plugin {
  const optionsWithDefaults = {
    ...options,
    respectOverride: options.respectOverride ?? true,
  };

  return {
    name: "dynamic-importmap",
    transformIndexHtml: {
      order: "post",
      handler: async (html) => await transformHtml(html, optionsWithDefaults),
    },
  };
}
