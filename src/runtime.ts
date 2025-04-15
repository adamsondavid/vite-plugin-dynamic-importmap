/**
 * NOTE: all functions in this file are meant to be serialized and inlined into the index.html during transformation
 */

import { Importmap, Script } from "./types";

export function getImportmapOverride(): Importmap | undefined {
  const localImportmapOverride = localStorage.getItem("importmap");
  if (localImportmapOverride) {
    console.warn("using importmap from local storage");
    return JSON.parse(localImportmapOverride);
  }
  return undefined;
}

export async function fetchImportmap(importmapUrl: string): Promise<Importmap> {
  const response = await fetch(importmapUrl);
  return await response.json();
}

export async function addImportmapToDom(importmap: Importmap) {
  const scriptNode = document.createElement("script");
  scriptNode.type = "importmap";
  scriptNode.innerHTML = JSON.stringify(importmap);
  document.head.append(scriptNode);
}

export function addScriptsToDom(scripts: Script[]) {
  for (const script of scripts) {
    const scriptNode = document.createElement("script");
    scriptNode.innerHTML = script.innerHTML;
    for (const [key, value] of Object.entries(script.attributes)) scriptNode.setAttribute(key, value);
    document[script.location || "head"].append(scriptNode);
  }
}
