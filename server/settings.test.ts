import { describe, it, expect, beforeEach } from "vitest";
import { maskToken } from "./services/settingsService.js";

describe("settingsService", () => {
  describe("maskToken", () => {
    it("should mask a valid token", () => {
      const token = "sk-abcdefghijklmnopxyz9";
      const masked = maskToken(token);
      expect(masked).toContain("***");
      expect(masked).toMatch(/^sk-abc\*\*\*/);
      expect(masked).toMatch(/xyz9$/);
    });

    it("should return *** for short tokens", () => {
      expect(maskToken("abc")).toBe("***");
      expect(maskToken("")).toBe("***");
    });

    it("should handle exactly 8 character tokens", () => {
      const token = "12345678";
      const masked = maskToken(token);
      expect(masked).toContain("***");
    });
  });
});

describe("mock data", () => {
  it("should have 4 artists", async () => {
    const { MOCK_ARTISTS } = await import("./services/mockDataService.js");
    expect(MOCK_ARTISTS).toHaveLength(4);
    expect(MOCK_ARTISTS.map((a) => a.id)).toEqual(["2z", "minh", "nghich", "vtv"]);
  });

  it("should have 8 templates", async () => {
    const { MOCK_TEMPLATES } = await import("./services/mockDataService.js");
    expect(MOCK_TEMPLATES).toHaveLength(8);
  });

  it("should have assets", async () => {
    const { MOCK_ASSETS } = await import("./services/mockDataService.js");
    expect(MOCK_ASSETS.length).toBeGreaterThan(0);
    expect(MOCK_ASSETS.every((a) => a.id && a.name && a.type)).toBe(true);
  });
});
