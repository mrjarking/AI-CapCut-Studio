import { useState, useEffect, useRef, useCallback } from "react";
import type { Scene } from "@/types";

export interface SceneTimerInfo {
  sceneId: string;
  startedAt: number | null;      // timestamp when status became active
  elapsedSeconds: number;        // how many seconds have passed
  estimatedTotalSeconds: number; // estimated total generation time
  estimatedRemainingSeconds: number; // estimated seconds left
  progress: number;              // 0-100 smooth progress
}

export interface GenerationTimerState {
  sceneTimers: Record<string, SceneTimerInfo>;
  overallStartedAt: number | null;
  overallElapsedSeconds: number;
  overallEstimatedTotalSeconds: number;
  overallEstimatedRemainingSeconds: number;
  overallProgress: number; // 0-100 based on completed + in-progress
}

// Typical generation times by mode (seconds)
const MOCK_ESTIMATED_SECONDS = 8;
const REAL_API_ESTIMATED_SECONDS = 120; // 2 minutes typical

function getEstimatedSeconds(isMock: boolean): number {
  return isMock ? MOCK_ESTIMATED_SECONDS : REAL_API_ESTIMATED_SECONDS;
}

export function useGenerationTimer(
  scenes: Scene[],
  polling: boolean,
  isMock: boolean
): GenerationTimerState {
  const [tick, setTick] = useState(0);
  const startTimesRef = useRef<Record<string, number>>({});
  const overallStartRef = useRef<number | null>(null);

  // Tick every second while polling
  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, [polling]);

  // Track when each scene becomes active
  useEffect(() => {
    const now = Date.now();
    for (const scene of scenes) {
      const isActive = ["submitted", "processing", "queued"].includes(scene.status);
      if (isActive && !startTimesRef.current[scene.id]) {
        startTimesRef.current[scene.id] = now;
      }
      // Clear timer when completed or failed
      if (["completed", "failed", "cancelled"].includes(scene.status)) {
        // Keep the start time for history but don't track as active
      }
    }

    // Track overall start
    const hasAnyActive = scenes.some((s) =>
      ["submitted", "processing", "queued"].includes(s.status)
    );
    if (hasAnyActive && !overallStartRef.current) {
      overallStartRef.current = now;
    }
    if (!hasAnyActive && !polling) {
      overallStartRef.current = null;
    }
  }, [scenes, polling]);

  // Compute timer state
  const now = Date.now();
  const estimatedPerScene = getEstimatedSeconds(isMock);

  const sceneTimers: Record<string, SceneTimerInfo> = {};

  for (const scene of scenes) {
    const isActive = ["submitted", "processing", "queued"].includes(scene.status);
    const isCompleted = scene.status === "completed";
    const startedAt = startTimesRef.current[scene.id] ?? null;

    let elapsedSeconds = 0;
    let estimatedRemainingSeconds = estimatedPerScene;
    let progress = 0;

    if (isCompleted) {
      elapsedSeconds = startedAt ? Math.round((now - startedAt) / 1000) : estimatedPerScene;
      estimatedRemainingSeconds = 0;
      progress = 100;
    } else if (isActive && startedAt) {
      elapsedSeconds = Math.round((now - startedAt) / 1000);
      // Smooth progress: use elapsed/estimated, cap at 95% until actually done
      const rawProgress = Math.min(95, (elapsedSeconds / estimatedPerScene) * 100);
      progress = rawProgress;
      estimatedRemainingSeconds = Math.max(0, estimatedPerScene - elapsedSeconds);
    } else if (scene.status === "idle" || scene.status === "pending") {
      progress = 0;
      estimatedRemainingSeconds = estimatedPerScene;
    }

    sceneTimers[scene.id] = {
      sceneId: scene.id,
      startedAt,
      elapsedSeconds,
      estimatedTotalSeconds: estimatedPerScene,
      estimatedRemainingSeconds,
      progress,
    };
  }

  // Overall stats
  const completedCount = scenes.filter((s) => s.status === "completed").length;
  const activeCount = scenes.filter((s) =>
    ["submitted", "processing", "queued"].includes(s.status)
  ).length;
  const totalCount = scenes.length;

  const overallStartedAt = overallStartRef.current;
  const overallElapsedSeconds = overallStartedAt
    ? Math.round((now - overallStartedAt) / 1000)
    : 0;

  // Estimate: remaining scenes × estimated time per scene
  // (active scenes are partially done, idle scenes are full time)
  const idleCount = scenes.filter((s) => s.status === "idle").length;
  const activeRemainingSeconds = scenes
    .filter((s) => ["submitted", "processing", "queued"].includes(s.status))
    .reduce((sum, s) => {
      const info = sceneTimers[s.id];
      return sum + (info?.estimatedRemainingSeconds ?? estimatedPerScene);
    }, 0);
  const idleRemainingSeconds = idleCount * estimatedPerScene;
  const overallEstimatedRemainingSeconds = Math.max(
    0,
    activeRemainingSeconds + idleRemainingSeconds
  );

  // Total estimated = elapsed + remaining
  const overallEstimatedTotalSeconds =
    overallElapsedSeconds + overallEstimatedRemainingSeconds;

  // Overall progress: completed + partial progress of active scenes
  const activeProgress = scenes
    .filter((s) => ["submitted", "processing", "queued"].includes(s.status))
    .reduce((sum, s) => sum + (sceneTimers[s.id]?.progress ?? 0) / 100, 0);

  const overallProgress =
    totalCount > 0
      ? Math.min(
          99,
          ((completedCount + activeProgress) / totalCount) * 100
        )
      : 0;

  return {
    sceneTimers,
    overallStartedAt,
    overallElapsedSeconds,
    overallEstimatedTotalSeconds,
    overallEstimatedRemainingSeconds,
    overallProgress: completedCount === totalCount && totalCount > 0 ? 100 : overallProgress,
  };
}

// Format seconds to human-readable string
export function formatDuration(seconds: number): string {
  if (seconds <= 0) return "完成";
  if (seconds < 60) return `${Math.ceil(seconds)}秒`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.ceil(seconds % 60);
  if (secs === 0) return `${mins}分钟`;
  return `${mins}分${secs}秒`;
}

export function formatElapsed(seconds: number): string {
  if (seconds < 60) return `${seconds}秒`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${String(secs).padStart(2, "0")}`;
}
