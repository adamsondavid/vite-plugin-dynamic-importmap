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

export async function transformIndexHtml(html: string, options: Required<Options>) {
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
