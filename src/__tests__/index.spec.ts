import { describe, expect, it } from "vitest";
import { add } from "../index";

describe("index.ts", () => {
  it("adds two numbers", () => {
    expect(add(1, 2)).toBe(3);
  });
});
