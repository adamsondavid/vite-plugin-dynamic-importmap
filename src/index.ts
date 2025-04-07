import { Plugin } from "vite";
import { parseFromString } from "dom-parser";
import { readFile } from "node:fs/promises";
import path from "node:path";
import esbuild from "esbuild";

const headRegex = /<head[^>]*>[\s\S]*?<\/head>/i;
const bodyRegex = /<body[^>]*>[\s\S]*?<\/body>/i;
const scriptRegex = /<script[^>]*>[\s\S]*?<\/script>/gi;

function extractScripts(html: string) {
  const scripts = html.match(scriptRegex) ?? [];
  const htmlWithoutScripts = html.replace(scriptRegex, "");
  return { scripts, outerHtml: htmlWithoutScripts };
}

function parseScript(script: string, location: "head" | "body") {
  const scriptNode = parseFromString(script).getElementsByTagName("script")[0];
  return {
    location,
    innerHTML: scriptNode.innerHTML,
    attributes: Object.fromEntries(scriptNode.attributes.map((s) => [s.name, s.value])),
  };
}

async function transformIndexHtml(html: string, importmapUrl: string) {
  const _head = html.match(headRegex)?.[0] ?? "";
  const _body = html.match(bodyRegex)?.[0] ?? "";

  const head = extractScripts(_head);
  const body = extractScripts(_body);

  const scripts = [
    ...head.scripts.map((script) => parseScript(script, "head")),
    ...body.scripts.map((script) => parseScript(script, "body")),
  ];

  const loaderScript = await esbuild.transform(
    `
    (async () => {
      ${await readFile(path.join(import.meta.dirname, "../loader/index.js"), "utf8")}
      await addImportmapToDom("${importmapUrl}");
      addScriptsToDom(${JSON.stringify(scripts)});
    })();
    document.currentScript.remove();
  `,
    { minify: true },
  );

  return html
    .replace(headRegex, head.outerHtml)
    .replace(bodyRegex, body.outerHtml.replace("</body>", `<script>${loaderScript.code}</script></body>`));
}

export default function (importmapUrl: string): Plugin {
  return {
    name: "dynamic-importmap",
    transformIndexHtml: {
      order: "post",
      handler: async (html) => await transformIndexHtml(html, importmapUrl),
    },
  };
}
