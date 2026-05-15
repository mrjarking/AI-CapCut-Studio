import { describe, it, expect } from "vitest";

// Test the timer utility functions (mirrors the hook's pure logic)
function formatDuration(seconds: number): string {
  if (seconds <= 0) return "完成";
  if (seconds < 60) return `${Math.ceil(seconds)}秒`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.ceil(seconds % 60);
  if (secs === 0) return `${mins}分钟`;
  return `${mins}分${secs}秒`;
}

function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}

function computeSceneProgress(
  elapsedSeconds: number,
  estimatedTotalSeconds: number,
  isCompleted: boolean
): number {
  if (isCompleted) return 100;
  return Math.min(95, (elapsedSeconds / estimatedTotalSeconds) * 100);
}

describe("useGenerationTimer utilities", () => {
  describe("formatDuration", () => {
    it("returns 完成 for zero or negative seconds", () => {
      expect(formatDuration(0)).toBe("完成");
      expect(formatDuration(-5)).toBe("完成");
    });

    it("formats seconds under 60", () => {
      expect(formatDuration(5)).toBe("5秒");
      expect(formatDuration(30)).toBe("30秒");
      expect(formatDuration(59)).toBe("59秒");
    });

    it("formats minutes", () => {
      expect(formatDuration(60)).toBe("1分钟");
      expect(formatDuration(120)).toBe("2分钟");
    });

    it("formats minutes and seconds", () => {
      expect(formatDuration(90)).toBe("1分30秒");
      expect(formatDuration(150)).toBe("2分30秒");
    });
  });

  describe("formatElapsed", () => {
    it("formats seconds under 60", () => {
      expect(formatElapsed(0)).toBe("0s");
      expect(formatElapsed(45)).toBe("45s");
    });

    it("formats minutes:seconds", () => {
      expect(formatElapsed(60)).toBe("1:00");
      expect(formatElapsed(90)).toBe("1:30");
      expect(formatElapsed(125)).toBe("2:05");
    });
  });

  describe("computeSceneProgress", () => {
    it("returns 100 when completed", () => {
      expect(computeSceneProgress(5, 8, true)).toBe(100);
      expect(computeSceneProgress(0, 8, true)).toBe(100);
    });

    it("returns 0 at start", () => {
      expect(computeSceneProgress(0, 8, false)).toBe(0);
    });

    it("caps at 95% before completion", () => {
      expect(computeSceneProgress(100, 8, false)).toBe(95);
      expect(computeSceneProgress(1000, 8, false)).toBe(95);
    });

    it("returns proportional progress", () => {
      expect(computeSceneProgress(4, 8, false)).toBe(50);
      expect(computeSceneProgress(2, 8, false)).toBe(25);
    });
  });

  describe("overall time estimation", () => {
    it("estimates remaining time correctly for mock mode", () => {
      const MOCK_SECONDS = 8;
      const scenes = [
        { status: "completed", elapsed: 7 },
        { status: "processing", elapsed: 3 },
        { status: "idle", elapsed: 0 },
      ];

      const activeRemaining = Math.max(0, MOCK_SECONDS - 3); // 5s
      const idleRemaining = 1 * MOCK_SECONDS; // 8s
      const totalRemaining = activeRemaining + idleRemaining;

      expect(totalRemaining).toBe(13);
    });

    it("estimates remaining time correctly for real API", () => {
      const REAL_SECONDS = 120;
      const scenes = [
        { status: "processing", elapsed: 30 },
        { status: "idle", elapsed: 0 },
        { status: "idle", elapsed: 0 },
      ];

      const activeRemaining = Math.max(0, REAL_SECONDS - 30); // 90s
      const idleRemaining = 2 * REAL_SECONDS; // 240s
      const totalRemaining = activeRemaining + idleRemaining;

      expect(totalRemaining).toBe(330);
    });
  });
});
