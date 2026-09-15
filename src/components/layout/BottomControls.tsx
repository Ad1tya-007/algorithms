"use client";

import {
  ChevronFirst,
  ChevronLast,
  Pause,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
} from "lucide-react";
import { formatCount } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { metricsAt, SPEEDS, statusOf, usePlaybackStore } from "@/store/playbackStore";
import { useUiStore } from "@/store/uiStore";
import { DatasetControls } from "@/components/controls/DatasetControls";

export function BottomControls() {
  const lab = useUiStore((s) => s.lab);
  const {
    steps,
    index,
    playing,
    speed,
    requirement,
    failure,
    toggle,
    stepBack,
    stepForward,
    reset,
    finish,
    setSpeed,
  } = usePlaybackStore();

  const total = steps.length;
  const metrics = metricsAt({ steps, index });
  const ops = metrics.comparisons + metrics.swaps + metrics.writes + metrics.visits + metrics.relaxations;
  const blocked = Boolean(requirement || failure);
  const status = statusOf({ steps, index, playing, requirement, failure });

  return (
    <footer className="panel shrink-0 border-t border-line">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-3 py-2">
        <DatasetControls lab={lab} />

        <div className="mx-1 hidden h-6 w-px bg-line sm:block" />

        <div className="flex items-center gap-1">
          <ControlButton onClick={reset} title="Reset (R)" disabled={blocked || total === 0}>
            <RotateCcw className="h-3.5 w-3.5" />
          </ControlButton>
          <ControlButton onClick={stepBack} title="Step back (←)" disabled={blocked || total === 0}>
            <SkipBack className="h-3.5 w-3.5" />
          </ControlButton>
          <ControlButton
            onClick={toggle}
            title="Play / Pause (Space)"
            disabled={blocked || total === 0}
            primary
          >
            {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </ControlButton>
          <ControlButton onClick={stepForward} title="Step forward (→)" disabled={blocked || total === 0}>
            <SkipForward className="h-3.5 w-3.5" />
          </ControlButton>
          <ControlButton onClick={finish} title="Finish" disabled={blocked || total === 0}>
            <ChevronLast className="h-3.5 w-3.5" />
          </ControlButton>
        </div>

        <div className="flex items-center gap-2">
          <span className="label hidden sm:inline">Speed</span>
          <div className="flex gap-0.5">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSpeed(s)}
                className={cn(
                  "rounded px-1.5 py-0.5 font-mono text-[10px]",
                  speed === s ? "bg-active/15 text-active" : "text-ink-dim hover:text-ink",
                )}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[10px] text-ink-dim">
          <span>
            STEP {index + 1} / {formatCount(total)}
          </span>
          <span className="text-ink-faint">VISUALIZATION OPERATIONS</span>
          <span className="text-ink">{formatCount(ops)}</span>
          {status === "complete" && <ChevronFirst className="hidden h-3 w-3 text-done" />}
        </div>
      </div>
    </footer>
  );
}

function ControlButton({
  children,
  onClick,
  title,
  disabled,
  primary,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  disabled?: boolean;
  primary?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded border transition-colors disabled:opacity-30",
        primary
          ? "border-active/40 bg-active/10 text-active hover:bg-active/20"
          : "border-line text-ink-dim hover:border-line-strong hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
