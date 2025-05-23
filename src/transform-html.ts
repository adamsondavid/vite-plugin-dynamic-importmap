import { parseFromString } from "dom-parser";
import esbuild from "esbuild";
import { Script } from "./types";
import { addImportmapToDom, addScriptsToDom, fetchImportmap, getImportmapOverride } from "./runtime";
import { Options } from "./plugin";

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

function serializeImportmapFunction(fn: Options["importmap"]) {
  const src = fn.toString();
  if (!/^(async\s+)?((function\b)|(\(.*\)\s*=>))/.test(src))
    throw new Error(
      `Invalid "options.importmap": must refer to a function (function expression or arrow function).
      It looks like you passed a method that was defined using the shorthand syntax, which is currently not supported.
      See more details: https://github.com/adamsondavid/vite-plugin-dynamic-importmap/issues/5`,
    );
  return src;
}

export async function transformHtml(html: string, options: Required<Options>) {
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
  else if (typeof options.importmap === "function")
    importmap = `await (${serializeImportmapFunction(options.importmap)})()`;
  else importmap = JSON.stringify(options.importmap);

  const loaderScript = `
    (async () => {
      await (${addImportmapToDom.toString()})((${options.respectOverride} && (${getImportmapOverride.toString()})()) || ${importmap});
      (${addScriptsToDom.toString()})(${JSON.stringify(scripts)});
    })();
    document.currentScript.remove();`;

  const minifiedLoaderScript = await esbuild.transform(loaderScript, { minify: true });

  return html
    .replace(headRegex, head.outerHtml)
    .replace(bodyRegex, body.outerHtml.replace("</body>", `<script>${minifiedLoaderScript.code}</script>\n</body>`));
}
