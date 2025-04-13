import { Plugin } from "vite";
import { parseFromString } from "dom-parser";
import esbuild from "esbuild";
import { Importmap, Script } from "./types";
import { addImportmapToDom, addScriptsToDom, fetchImportmap, getImportmapOverride } from "./runtime";

const headRegex = /<head[^>]*>[\s\S]*?<\/head>/i;
const bodyRegex = /<body[^>]*>[\s\S]*?<\/body>/i;
const scriptRegex = /<script[^>]*>[\s\S]*?<\/script>/gi;

function extractScripts(html: string) {
  const scripts = html.match(scriptRegex) ?? [];
  const htmlWithoutScripts = html.replace(scriptRegex, "");
  return { scripts, outerHtml: htmlWithoutScripts };
}

function parseScript(script: string): Script {
  const scriptNode = parseFromString(script).getElementsByTagName("script")[0];
  return {
    innerHTML: scriptNode.innerHTML,
    attributes: Object.fromEntries(scriptNode.attributes.map((s) => [s.name, s.value])),
  };
}

async function transformIndexHtml(html: string, options: Options) {
  const _head = html.match(headRegex)?.[0] ?? "";
  const _body = html.match(bodyRegex)?.[0] ?? "";

  const head = extractScripts(_head);
  const body = extractScripts(_body);

  const scripts = [
    ...head.scripts.map((script) => parseScript(script)),
    ...body.scripts.map((script) => ({ ...parseScript(script), location: "body" })),
  ];

  let importmap;
  if (typeof options.importmap === "string") importmap = `await (${fetchImportmap.toString()})("${options.importmap}")`;
  else if (typeof options.importmap === "function") importmap = `await (${options.importmap.toString()})()`;
  else importmap = JSON.stringify(options.importmap);

  const loaderScript = `
    (async () => {
      await (${addImportmapToDom.toString()})((${options.respectOverride} && (${getImportmapOverride.toString()})()) || ${importmap});
      (${addScriptsToDom.toString()})(${JSON.stringify(scripts)});
    })();
    document.currentScript.remove();
  `;

  const minifiedLoaderScript = await esbuild.transform(loaderScript, { minify: true });

  return html
    .replace(headRegex, head.outerHtml)
    .replace(bodyRegex, body.outerHtml.replace("</body>", `<script>${minifiedLoaderScript.code}</script></body>`));
}

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
export default function (options: Options): Plugin {
  options.respectOverride ??= true;

  return {
    name: "dynamic-importmap",
    transformIndexHtml: {
      order: "post",
      handler: async (html) => await transformIndexHtml(html, options),
    },
  };
}
