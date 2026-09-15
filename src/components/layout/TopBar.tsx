"use client";

import { Command, FlaskConical } from "lucide-react";
import { LAB_LABELS, LAB_ORDER } from "@/lib/algorithms/registry";
import { cn } from "@/lib/utils/cn";
import { statusOf, usePlaybackStore } from "@/store/playbackStore";
import { useUiStore } from "@/store/uiStore";

const STATUS_LABEL: Record<string, string> = {
  empty: "ENGINE READY",
  ready: "READY",
  running: "RUNNING",
  paused: "PAUSED",
  complete: "COMPLETE",
  blocked: "BLOCKED",
};

const STATUS_COLOR: Record<string, string> = {
  empty: "text-ink-dim",
  ready: "text-done",
  running: "text-active",
  paused: "text-compare",
  complete: "text-done",
  blocked: "text-danger",
};

export function TopBar() {
  const lab = useUiStore((s) => s.lab);
  const setLab = useUiStore((s) => s.setLab);
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);
  const setExperimentOpen = useUiStore((s) => s.setExperimentOpen);
  const steps = usePlaybackStore((s) => s.steps);
  const index = usePlaybackStore((s) => s.index);
  const playing = usePlaybackStore((s) => s.playing);
  const requirement = usePlaybackStore((s) => s.requirement);
  const failure = usePlaybackStore((s) => s.failure);
  const status = statusOf({ steps, index, playing, requirement, failure });

  return (
    <header className="panel flex h-11 shrink-0 items-center justify-between border-b border-line px-4">
      <div className="flex items-center gap-3">
        <FlaskConical className="h-4 w-4 text-active" strokeWidth={1.5} />
        <span className="font-mono text-[11px] tracking-[0.18em] text-ink">ALGORITHM OBSERVATORY</span>
      </div>

      <div className="hidden items-center gap-1 md:flex">
        {LAB_ORDER.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => setLab(id)}
            className={cn(
              "rounded px-2.5 py-1 font-mono text-[10px] tracking-wide transition-colors",
              lab === id ? "bg-active/15 text-active" : "text-ink-dim hover:text-ink",
            )}
          >
            {LAB_LABELS[id].toUpperCase()}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setExperimentOpen(true)}
          className="hidden rounded border border-line px-2 py-1 font-mono text-[10px] text-ink-dim hover:border-line-strong hover:text-ink sm:block"
        >
          NEW EXPERIMENT
        </button>
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="flex items-center gap-1.5 rounded border border-line px-2 py-1 font-mono text-[10px] text-ink-dim hover:border-line-strong hover:text-ink"
          title="Command palette (⌘K)"
        >
          <Command className="h-3 w-3" />
          <span className="hidden sm:inline">⌘K</span>
        </button>
        <span className={cn("font-mono text-[10px] tracking-wide", STATUS_COLOR[status])}>
          ● {STATUS_LABEL[status]}
        </span>
      </div>
    </header>
  );
}
