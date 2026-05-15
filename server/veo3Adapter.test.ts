import { describe, it, expect } from "vitest";

// Test the response parsing logic inline (mirrors the adapter functions)
function extractVideoUrl(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  const dd = (d["data"] as Record<string, unknown>) ?? {};
  const dr = (d["result"] as Record<string, unknown>) ?? {};
  const dv = Array.isArray(dd["videos"]) ? (dd["videos"][0] as Record<string, unknown>) : null;
  const dout = Array.isArray(dd["output"]) ? dd["output"][0] : null;
  const ddd = (dd["data"] as Record<string, unknown>) ?? {};

  const candidates = [
    d["videoUrl"], d["url"], d["video_url"],
    dd["videoUrl"], dd["video_url"], dd["url"],
    dd["resultUrl"], dd["result_url"],
    dd["downloadUrl"], dd["download_url"],
    ddd["url"], ddd["video_url"], ddd["videoUrl"], ddd["download_url"],
    dv?.["url"], dout,
    dr["videoUrl"], dr["url"],
    Array.isArray(d["data"]) ? (d["data"][0] as Record<string, unknown>)?.["url"] : undefined,
    Array.isArray(d["data"]) ? (d["data"][0] as Record<string, unknown>)?.["video_url"] : undefined,
  ];
  for (const c of candidates) {
    if (c && typeof c === "string") return c;
  }
  return null;
}

function normalizeStatus(raw: string): string {
  const s = raw.toLowerCase();
  if (["pending", "queued", "not_start"].includes(s)) return "queued";
  if (s === "submitted") return "submitted";
  if (["processing", "running", "generating", "in_progress", "active"].includes(s)) return "processing";
  if (["success", "completed", "finished", "succeeded"].includes(s)) return "completed";
  if (["fail", "failed", "error", "failure"].includes(s)) return "failed";
  if (["cancelled", "canceled"].includes(s)) return "cancelled";
  return "processing";
}

describe("veo3Adapter response parsing", () => {
  describe("extractVideoUrl", () => {
    it("handles direct url field", () => {
      expect(extractVideoUrl({ url: "https://example.com/video.mp4" })).toBe("https://example.com/video.mp4");
    });

    it("handles data.url (OpenAI-style)", () => {
      expect(extractVideoUrl({ data: { url: "https://example.com/video.mp4" } })).toBe("https://example.com/video.mp4");
    });

    it("handles bltcy.ai nested data.data.url format", () => {
      const response = {
        code: "success",
        data: {
          task_id: "abc123",
          status: "SUCCESS",
          data: {
            id: "abc123",
            status: "completed",
            url: "https://cdn.example.com/video.mp4",
          },
        },
      };
      expect(extractVideoUrl(response)).toBe("https://cdn.example.com/video.mp4");
    });

    it("handles data.video_url", () => {
      expect(extractVideoUrl({ data: { video_url: "https://example.com/video.mp4" } })).toBe("https://example.com/video.mp4");
    });

    it("returns null when no URL found", () => {
      expect(extractVideoUrl({ data: { status: "queued" } })).toBeNull();
      expect(extractVideoUrl({})).toBeNull();
      expect(extractVideoUrl(null)).toBeNull();
    });
  });

  describe("normalizeStatus", () => {
    it("maps queued variants", () => {
      expect(normalizeStatus("queued")).toBe("queued");
      expect(normalizeStatus("pending")).toBe("queued");
      expect(normalizeStatus("NOT_START")).toBe("queued");
    });

    it("maps processing variants", () => {
      expect(normalizeStatus("processing")).toBe("processing");
      expect(normalizeStatus("running")).toBe("processing");
      expect(normalizeStatus("generating")).toBe("processing");
      expect(normalizeStatus("in_progress")).toBe("processing");
    });

    it("maps completed variants", () => {
      expect(normalizeStatus("completed")).toBe("completed");
      expect(normalizeStatus("success")).toBe("completed");
      expect(normalizeStatus("SUCCESS")).toBe("completed");
      expect(normalizeStatus("finished")).toBe("completed");
      expect(normalizeStatus("succeeded")).toBe("completed");
    });

    it("maps failed variants", () => {
      expect(normalizeStatus("failed")).toBe("failed");
      expect(normalizeStatus("fail")).toBe("failed");
      expect(normalizeStatus("error")).toBe("failed");
    });
  });

  describe("status extraction from bltcy.ai response", () => {
    it("extracts inner status from nested data.data.status", () => {
      const response = {
        code: "success",
        data: {
          task_id: "abc123",
          status: "NOT_START",  // outer status
          data: {
            id: "abc123",
            status: "queued",   // inner status (preferred)
            progress: 0,
          },
        },
      };
      const d = response as Record<string, unknown>;
      const outerData = (d["data"] as Record<string, unknown>) ?? {};
      const innerData = (outerData["data"] as Record<string, unknown>) ?? {};
      const rawStatus = String(
        innerData["status"] ?? outerData["status"] ?? d["status"] ?? "processing"
      );
      expect(normalizeStatus(rawStatus)).toBe("queued");
    });

    it("extracts completed status and video URL together", () => {
      const completedResponse = {
        code: "success",
        data: {
          task_id: "abc123",
          status: "SUCCESS",
          data: {
            id: "abc123",
            status: "completed",
            url: "https://cdn.example.com/final.mp4",
            progress: 100,
          },
        },
      };
      const d = completedResponse as Record<string, unknown>;
      const outerData = (d["data"] as Record<string, unknown>) ?? {};
      const innerData = (outerData["data"] as Record<string, unknown>) ?? {};
      const rawStatus = String(innerData["status"] ?? outerData["status"] ?? "processing");
      
      expect(normalizeStatus(rawStatus)).toBe("completed");
      expect(extractVideoUrl(completedResponse)).toBe("https://cdn.example.com/final.mp4");
    });
  });
});
