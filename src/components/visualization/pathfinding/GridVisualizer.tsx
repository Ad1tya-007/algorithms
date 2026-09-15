"use client";

import { useRef } from "react";
import { Replayer } from "@/lib/algorithms/core/replay";
import type { AlgorithmStep } from "@/lib/algorithms/core/types";
import {
  CELL_CLOSED,
  CELL_OPEN,
  CELL_PATH,
  createGridView,
  reduceGridView,
  type GridOp,
  type GridView,
} from "@/lib/algorithms/pathfinding/model";
import { useReplay } from "@/hooks/useReplay";
import { useDatasetStore } from "@/store/datasetStore";
import { usePlaybackStore } from "@/store/playbackStore";
import { useUiStore } from "@/store/uiStore";
import { cn } from "@/lib/utils/cn";

export function GridVisualizer() {
  const grid = useDatasetStore((s) => s.grid);
  const paintCell = useDatasetStore((s) => s.paintCell);
  const pushHistory = useDatasetStore((s) => s.pushHistory);
  const gridTool = useUiStore((s) => s.gridTool);
  const select = useUiStore((s) => s.select);
  const selection = useUiStore((s) => s.selection);

  const steps = usePlaybackStore((s) => s.steps);
  const index = usePlaybackStore((s) => s.index);
  const cells = grid.cols * grid.rows;

  const view = useReplay<GridView, GridOp>(
    steps as AlgorithmStep<GridOp, unknown>[],
    index,
    () => new Replayer(() => createGridView(cells), reduceGridView),
    [grid.cols, grid.rows, grid.walls.join(","), grid.costs.join(",")],
  );

  const painting = useRef(false);

  const paint = (index: number) => {
    paintCell(index, gridTool);
  };

  return (
    <div className="flex h-full items-center justify-center overflow-auto p-4">
      <div
        className="grid gap-px rounded border border-line bg-line p-px"
        style={{
          gridTemplateColumns: `repeat(${grid.cols}, minmax(0, 1fr))`,
          width: "min(100%, 900px)",
        }}
        onMouseLeave={() => {
          painting.current = false;
        }}
      >
        {Array.from({ length: cells }, (_, i) => {
          const wall = grid.walls[i] === 1;
          const isStart = i === grid.start;
          const isGoal = i === grid.goal;
          const state = view.state[i];
          const cost = grid.costs[i];
          const selected = selection.kind === "cell" && selection.index === i;
          const isCurrent = view.current === i;

          let bg = "var(--color-surface)";
          if (wall) bg = "var(--color-wall)";
          else if (state === CELL_PATH) bg = "var(--color-path)";
          else if (isCurrent) bg = "var(--color-active)";
          else if (state === CELL_OPEN) bg = "color-mix(in srgb, var(--color-open) 35%, var(--color-surface))";
          else if (state === CELL_CLOSED) bg = "color-mix(in srgb, var(--color-closed) 30%, var(--color-surface))";
          else if (cost > 1) bg = `color-mix(in srgb, var(--color-compare) ${Math.min(40, cost * 8)}%, var(--color-surface))`;

          return (
            <button
              key={i}
              type="button"
              className={cn(
                "aspect-square min-h-[6px] min-w-[6px] transition-colors",
                selected && "ring-1 ring-active ring-inset",
              )}
              style={{ backgroundColor: bg }}
              onMouseDown={() => {
                pushHistory();
                painting.current = true;
                paint(i);
                select({ kind: "cell", index: i });
              }}
              onMouseEnter={() => {
                if (painting.current) paint(i);
              }}
              onMouseUp={() => {
                painting.current = false;
              }}
              title={
                isStart
                  ? "Start"
                  : isGoal
                    ? "End"
                    : wall
                      ? "Wall"
                      : cost > 1
                        ? `Cost ×${cost}`
                        : "Empty"
              }
            >
              {(isStart || isGoal) && (
                <span className="flex h-full items-center justify-center font-mono text-[8px] text-ink">
                  {isStart ? "S" : "E"}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
