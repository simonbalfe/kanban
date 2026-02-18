import { describe, it, expect } from "vitest";

import { getAvatarUrl } from "./helpers";

describe("getAvatarUrl", () => {
  it("returns empty string for null input", () => {
    expect(getAvatarUrl(null)).toBe("");
  });

  it("returns empty string for empty string input", () => {
    expect(getAvatarUrl("")).toBe("");
  });

  it("returns URL unchanged if already absolute http", () => {
    expect(getAvatarUrl("http://example.com/avatar.jpg")).toBe(
      "http://example.com/avatar.jpg",
    );
  });

  it("returns URL unchanged if already absolute https", () => {
    expect(getAvatarUrl("https://example.com/avatar.jpg")).toBe(
      "https://example.com/avatar.jpg",
    );
  });

  it("returns empty string for non-URL strings", () => {
    expect(getAvatarUrl("user123/avatar.jpg")).toBe("");
  });
});
