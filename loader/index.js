async function fetchImportmap(importmapUrl) {
  const localImportmap = localStorage.getItem("importmap");
  if (localImportmap) {
    console.warn("using importmap from local storage");
    return localImportmap;
  }
  const response = await fetch(importmapUrl);
  return await response.text();
}

async function addImportmapToDom(importmapUrl) {
  const scriptNode = document.createElement("script");
  scriptNode.type = "importmap";
  scriptNode.innerHTML = await fetchImportmap(importmapUrl);
  document.head.append(scriptNode);
}

function addScriptsToDom(scripts) {
  for (const script of scripts) {
    const scriptNode = document.createElement("script");
    scriptNode.innerHTML = script.innerHTML;
    for (const [key, value] of Object.entries(script.attributes)) scriptNode.setAttribute(key, value);
    document[script.location].append(scriptNode);
  }
}
