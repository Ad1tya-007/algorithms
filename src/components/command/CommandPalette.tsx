"use client";

import { useEffect, useMemo, useState } from "react";
import { LAB_LABELS, LAB_ORDER, registry } from "@/lib/algorithms/registry";
import { useAlgorithmStore } from "@/store/algorithmStore";
import { useDatasetStore } from "@/store/datasetStore";
import { usePlaybackStore } from "@/store/playbackStore";
import { useUiStore } from "@/store/uiStore";

const COMMANDS = [
  { id: "experiment", label: "New Experiment", group: "Lab" },
  ...LAB_ORDER.map((lab) => ({
    id: `lab-${lab}`,
    label: `${LAB_LABELS[lab]} Laboratory`,
    group: "Lab",
  })),
  { id: "generate", label: "Generate Dataset", group: "Dataset" },
  { id: "run", label: "Run", group: "Playback" },
  { id: "pause", label: "Pause", group: "Playback" },
  { id: "reset", label: "Reset", group: "Playback" },
  { id: "step-forward", label: "Step Forward", group: "Playback" },
  { id: "step-back", label: "Step Back", group: "Playback" },
  { id: "code", label: "Show Code", group: "View" },
  { id: "inspector", label: "Toggle Inspector", group: "View" },
  { id: "cinematic", label: "Toggle Cinematic Mode", group: "View" },
  ...Array.from(registry.values()).map((entry) => ({
    id: entry.definition.id,
    label: entry.definition.name,
    group: "Algorithm",
  })),
];

export function CommandPalette() {
  const open = useUiStore((s) => s.paletteOpen);
  const setPaletteOpen = useUiStore((s) => s.setPaletteOpen);
  const setLab = useUiStore((s) => s.setLab);
  const setExperimentOpen = useUiStore((s) => s.setExperimentOpen);
  const toggleCode = useUiStore((s) => s.toggleCode);
  const toggleInspector = useUiStore((s) => s.toggleInspector);
  const toggleCinematic = useUiStore((s) => s.toggleCinematic);
  const lab = useUiStore((s) => s.lab);
  const selectAlgorithm = useAlgorithmStore((s) => s.select);
  const playback = usePlaybackStore();
  const dataset = useDatasetStore();

  const [query, setQuery] = useState("");
  const [highlight, setHighlight] = useState(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMMANDS;
    return COMMANDS.filter((c) => c.label.toLowerCase().includes(q));
  }, [query]);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setHighlight(0);
    }
  }, [open]);

  useEffect(() => {
    setHighlight(0);
  }, [query]);

  const run = (id: string) => {
    switch (id) {
      case "experiment":
        setExperimentOpen(true);
        break;
      case "generate":
        if (lab === "sorting") dataset.regenerateArray();
        else if (lab === "graph") dataset.regenerateGraph();
        else if (lab === "pathfinding") dataset.regenerateGrid();
        else dataset.regenerateTree();
        break;
      case "run":
        playback.play();
        break;
      case "pause":
        playback.pause();
        break;
      case "reset":
        playback.reset();
        break;
      case "step-forward":
        playback.stepForward();
        break;
      case "step-back":
        playback.stepBack();
        break;
      case "code":
        toggleCode();
        break;
      case "inspector":
        toggleInspector();
        break;
      case "cinematic":
        toggleCinematic();
        break;
      default:
        if (id.startsWith("lab-")) {
          setLab(id.replace("lab-", "") as typeof lab);
        } else {
          const nextLab = selectAlgorithm(id);
          if (nextLab) setLab(nextLab);
        }
    }
    setPaletteOpen(false);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[15vh] backdrop-blur-sm"
      onClick={() => setPaletteOpen(false)}
    >
      <div
        className="panel w-full max-w-lg overflow-hidden rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setHighlight((h) => Math.min(filtered.length - 1, h + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setHighlight((h) => Math.max(0, h - 1));
            } else if (e.key === "Enter" && filtered[highlight]) {
              run(filtered[highlight].id);
            } else if (e.key === "Escape") {
              setPaletteOpen(false);
            }
          }}
          placeholder="Search commands…"
          className="w-full border-b border-line bg-transparent px-4 py-3 font-mono text-sm text-ink outline-none placeholder:text-ink-faint"
        />
        <ul className="max-h-72 overflow-y-auto py-1">
          {filtered.map((cmd, i) => (
            <li key={cmd.id}>
              <button
                type="button"
                onClick={() => run(cmd.id)}
                className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm ${
                  i === highlight ? "bg-active/12 text-active" : "text-ink-dim hover:bg-white/[0.03]"
                }`}
              >
                <span>{cmd.label}</span>
                <span className="font-mono text-[10px] text-ink-faint">{cmd.group}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
