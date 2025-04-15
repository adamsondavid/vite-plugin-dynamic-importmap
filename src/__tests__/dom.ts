import { vi } from "vitest";

export function useDOM(html: string) {
  const script = html
    .match(/<script[^>]*>[\s\S]*?<\/script>/i)![0]
    .replace("<script>", "")
    .replace("</script>", "")
    .replace("\n", "");

  const localStorage: Record<string, string> = {};

  const window: any = {
    fetch: vi.fn(() => ({ json: async () => ({}) })),
    document: {
      createElement: () => {
        const obj: Record<string, string> = {};
        Object.defineProperty(obj, "setAttribute", { get: () => (key: string, value: string) => (obj[key] = value) });
        return obj;
      },
      currentScript: {
        remove: () => {},
      },
      head: {
        append: vi.fn(),
      },
      body: {
        append: vi.fn(),
      },
    },
    localStorage: {
      getItem: (key: string) => localStorage[key],
      setItem: (key: string, value: string) => (localStorage[key] = value),
    },
  };

  const AsyncFunction = async function () {}.constructor;
  return { window, run: () => AsyncFunction(...Object.keys(window), "await " + script)(...Object.values(window)) };
}
