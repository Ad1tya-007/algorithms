"use client";

import { motion } from "framer-motion";
import { Replayer } from "@/lib/algorithms/core/replay";
import type { AlgorithmStep } from "@/lib/algorithms/core/types";
import {
  createArrayView,
  reduceArrayView,
  withFrames,
  type ArrayExtra,
  type ArrayOp,
  type ArrayView,
} from "@/lib/algorithms/sorting/model";
import { useReplay } from "@/hooks/useReplay";
import { transitionMs, usePlaybackStore } from "@/store/playbackStore";
import { useDatasetStore } from "@/store/datasetStore";
import { useUiStore } from "@/store/uiStore";
import { cn } from "@/lib/utils/cn";

export function SortingVisualizer() {
  const array = useDatasetStore((s) => s.array);
  const maxValue = useDatasetStore((s) => s.arrayConfig.maxValue);
  const steps = usePlaybackStore((s) => s.steps);
  const index = usePlaybackStore((s) => s.index);
  const speed = usePlaybackStore((s) => s.speed);
  const select = useUiStore((s) => s.select);
  const selection = useUiStore((s) => s.selection);

  const step = index >= 0 ? steps[index] : null;
  const extra = (step?.extra as ArrayExtra | undefined) ?? { frames: [], aux: null };

  const view = useReplay<ArrayView, ArrayOp>(
    steps as AlgorithmStep<ArrayOp, ArrayExtra>[],
    index,
    () => new Replayer(() => createArrayView(array), reduceArrayView),
    [array.join(",")],
  );

  const display = withFrames(view, extra);
  const max = Math.max(maxValue, ...display.values, 1);
  const duration = transitionMs(speed) / 1000;

  return (
    <div className="flex h-full flex-col items-center justify-end px-4 pb-8 pt-6">
      <div className="flex h-[min(72vh,520px)] w-full max-w-5xl items-end gap-[2px]">
        {display.values.map((value, i) => {
          const height = (value / max) * 100;
          const comparing = display.comparing.includes(i);
          const swapping = display.swapping.includes(i);
          const sorted = display.sorted[i];
          const discarded = display.discarded[i];
          const isPivot = display.pivot === i;
          const isProbe = display.probing === i;
          const isFound = display.found === i;
          const selected = selection.kind === "array" && selection.index === i;
          const inRange =
            display.range &&
            i >= display.range[0] &&
            i <= display.range[1];

          return (
            <motion.button
              key={display.ids[i]}
              type="button"
              layout
              transition={{ duration, ease: "easeInOut" }}
              onClick={() => select({ kind: "array", index: i })}
              className={cn(
                "relative min-w-0 flex-1 rounded-t-sm border border-transparent",
                selected && "ring-1 ring-active",
                !inRange && display.range && "opacity-35",
              )}
              style={{
                height: `${Math.max(4, height)}%`,
                backgroundColor: sorted
                  ? "var(--color-done)"
                  : isFound
                    ? "var(--color-done)"
                    : isPivot
                      ? "var(--color-pivot)"
                      : swapping
                        ? "var(--color-swap)"
                        : comparing || isProbe
                          ? "var(--color-compare)"
                          : discarded
                            ? "var(--color-ink-faint)"
                            : "var(--color-active)",
                opacity: discarded ? 0.25 : 1,
              }}
              title={`[${i}] ${value}`}
            />
          );
        })}
      </div>
      <p className="mt-4 font-mono text-[10px] text-ink-faint">
        Click a bar to inspect · {display.values.length} elements
      </p>
    </div>
  );
}
