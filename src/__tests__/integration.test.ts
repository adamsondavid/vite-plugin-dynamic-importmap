import { afterEach, describe, expect, it, Mock, vi } from "vitest";
import { transformHtml } from "../transform-html";
import esbuild from "esbuild";
import { useDOM } from "./dom";

describe("vite-plugin-dynamic-import", () => {
  vi.mock("esbuild", async (importOriginal) => {
    const esbuild = await importOriginal<typeof import("esbuild")>();
    return {
      default: {
        transform: vi.fn(esbuild.transform),
      },
    };
  });
  const esbuildTransform = esbuild.transform as Mock;

  afterEach(() => {
    vi.resetAllMocks();
  });

  const html = `
    <!doctype html>
    <html lang="en">
      <head>
        <title>My Vite App</title>
        <script type="module" src="/head-script.js"></script>
        <script type="module">my inline head script</script>
      </head>
      <body>
        <div id="app"></div>
        <script type="module" src="/body-script.js"></script>
        <script type="module">my inline body script</script>
      </body>
    </html>`;

  it("removes all existing scripts and inserts new loader script", async () => {
    esbuildTransform.mockResolvedValue({ code: "loader-script" });

    const result = await transformHtml(html, { importmap: {}, respectOverride: false });

    expect(result.replace(/\s+/g, " ").trim()).toBe(
      `
        <!doctype html>
        <html lang="en">
          <head>
            <title>My Vite App</title>
          </head>
          <body>
            <div id="app"></div>
            <script>loader-script</script>
          </body>
        </html>`
        .replace(/\s+/g, " ")
        .trim(),
    );
  });

  it("loads scripts", async () => {
    const { window, run } = useDOM(await transformHtml(html, { importmap: {}, respectOverride: false }));

    await run();

    expect(window.document.head.append).toHaveBeenCalledWith({ innerHTML: "", src: "/head-script.js", type: "module" });
    expect(window.document.head.append).toHaveBeenCalledWith({ innerHTML: "my inline head script", type: "module" });

    expect(window.document.body.append).toHaveBeenCalledWith({ innerHTML: "", src: "/body-script.js", type: "module" });
    expect(window.document.body.append).toHaveBeenCalledWith({ innerHTML: "my inline body script", type: "module" });
  });

  it("loads correct importmap (url importmap, does not respect override)", async () => {
    const { window, run } = useDOM(await transformHtml(html, { importmap: "/importmap.json", respectOverride: false }));
    window.fetch.mockResolvedValue({ json: async () => ({ imports: { vue: "/vue.min.mjs" } }) });
    window.localStorage.setItem("importmap", JSON.stringify({ imports: { react: "/react.min.mjs" } }));

    await run();

    expect(window.document.head.append).toHaveBeenCalledWith({
      innerHTML: '{"imports":{"vue":"/vue.min.mjs"}}',
      type: "importmap",
    });
  });

  it("loads correct importmap (url importmap, respects override)", async () => {
    const { window, run } = useDOM(await transformHtml(html, { importmap: "/importmap.json", respectOverride: true }));
    window.fetch.mockResolvedValue({ json: async () => ({ imports: { vue: "/vue.min.mjs" } }) });
    window.localStorage.setItem("importmap", JSON.stringify({ imports: { react: "/react.min.mjs" } }));

    await run();

    expect(window.document.head.append).toHaveBeenCalledWith({
      innerHTML: '{"imports":{"react":"/react.min.mjs"}}',
      type: "importmap",
    });
  });

  it("loads correct importmap (url importmap, respects override but local storage is empty)", async () => {
    const { window, run } = useDOM(await transformHtml(html, { importmap: "/importmap.json", respectOverride: true }));
    window.fetch.mockResolvedValue({ json: async () => ({ imports: { vue: "/vue.min.mjs" } }) });

    await run();

    expect(window.document.head.append).toHaveBeenCalledWith({
      innerHTML: '{"imports":{"vue":"/vue.min.mjs"}}',
      type: "importmap",
    });
  });

  it("loads correct importmap (static importmap, does not respect override)", async () => {
    const { window, run } = useDOM(
      await transformHtml(html, { importmap: { imports: { vue: "/vue.min.mjs" } }, respectOverride: false }),
    );
    window.localStorage.setItem("importmap", JSON.stringify({ imports: { react: "/react.min.mjs" } }));

    await run();

    expect(window.document.head.append).toHaveBeenCalledWith({
      innerHTML: '{"imports":{"vue":"/vue.min.mjs"}}',
      type: "importmap",
    });
  });

  it("loads correct importmap (static importmap, respects override)", async () => {
    const { window, run } = useDOM(
      await transformHtml(html, { importmap: { imports: { vue: "/vue.min.mjs" } }, respectOverride: true }),
    );
    window.localStorage.setItem("importmap", JSON.stringify({ imports: { react: "/react.min.mjs" } }));

    await run();

    expect(window.document.head.append).toHaveBeenCalledWith({
      innerHTML: '{"imports":{"react":"/react.min.mjs"}}',
      type: "importmap",
    });
  });

  it("loads correct importmap (static importmap, respects override but local storage is empty)", async () => {
    const { window, run } = useDOM(
      await transformHtml(html, { importmap: { imports: { vue: "/vue.min.mjs" } }, respectOverride: true }),
    );

    await run();

    expect(window.document.head.append).toHaveBeenCalledWith({
      innerHTML: '{"imports":{"vue":"/vue.min.mjs"}}',
      type: "importmap",
    });
  });

  it("loads correct importmap (callback importmap, does not respect override)", async () => {
    const { window, run } = useDOM(
      await transformHtml(html, {
        importmap: async () => ({ imports: { vue: "/vue.min.mjs" } }),
        respectOverride: false,
      }),
    );
    window.localStorage.setItem("importmap", JSON.stringify({ imports: { react: "/react.min.mjs" } }));

    await run();

    expect(window.document.head.append).toHaveBeenCalledWith({
      innerHTML: '{"imports":{"vue":"/vue.min.mjs"}}',
      type: "importmap",
    });
  });

  it("loads correct importmap (callback importmap, respects override)", async () => {
    const { window, run } = useDOM(
      await transformHtml(html, {
        importmap: async () => ({ imports: { vue: "/vue.min.mjs" } }),
        respectOverride: true,
      }),
    );
    window.localStorage.setItem("importmap", JSON.stringify({ imports: { react: "/react.min.mjs" } }));

    await run();

    expect(window.document.head.append).toHaveBeenCalledWith({
      innerHTML: '{"imports":{"react":"/react.min.mjs"}}',
      type: "importmap",
    });
  });

  it("loads correct importmap (callback importmap, respects override but local storage is empty)", async () => {
    const { window, run } = useDOM(
      await transformHtml(html, {
        importmap: async () => ({ imports: { vue: "/vue.min.mjs" } }),
        respectOverride: true,
      }),
    );

    await run();

    expect(window.document.head.append).toHaveBeenCalledWith({
      innerHTML: '{"imports":{"vue":"/vue.min.mjs"}}',
      type: "importmap",
    });
  });

  it.each([
    { importmap() {} }.importmap,
    { async importmap() {} }.importmap,
    { functionA() {} }.functionA,
    { async functionA() {} }.functionA,
  ])("throws an error when importmap resolver callback is a method shorthand", async (importmap: any) => {
    await expect(transformHtml(html, { importmap, respectOverride: true })).rejects.toThrow(
      /options\.importmap.*must refer to.*function expression or arrow function.*\n.*method.*shorthand syntax.*not supported/,
    );
  });

  it.each([
    () => {},
    async () => {},
    () => "hi :)",
    async () => "hey :D",
    function () {},
    async function () {},

    // these two are the only method shorthands we expect to work, as by coincidence they serialize to the same string as a regular function would do due to the property name
    { function() {} }.function,
    { async function() {} }.function,
  ])("accepts importmap resolver callback format", async (importmap: any) => {
    await transformHtml(html, { importmap, respectOverride: true });
  });
});
