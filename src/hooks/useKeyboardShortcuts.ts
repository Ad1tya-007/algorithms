"use client";

import { useEffect } from "react";

import { useDatasetStore } from "@/store/datasetStore";
import { usePlaybackStore } from "@/store/playbackStore";
import { useUiStore } from "@/store/uiStore";

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return (
    tag === "INPUT" ||
    tag === "TEXTAREA" ||
    tag === "SELECT" ||
    target.isContentEditable
  );
}

export function useKeyboardShortcuts(): void {
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const ui = useUiStore.getState();
      const playback = usePlaybackStore.getState();
      const dataset = useDatasetStore.getState();
      const meta = event.metaKey || event.ctrlKey;

      // The command palette owns the keyboard while it is open.
      if (meta && event.key.toLowerCase() === "k") {
        event.preventDefault();
        ui.setPaletteOpen(!ui.paletteOpen);
        return;
      }

      if (ui.paletteOpen) return;

      if (meta && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) dataset.redo();
        else dataset.undo();
        return;
      }

      if (isTypingTarget(event.target)) {
        if (event.key === "Escape") (event.target as HTMLElement).blur();
        return;
      }

      switch (event.key) {
        case " ":
          event.preventDefault();
          playback.toggle();
          break;

        case "ArrowRight":
          event.preventDefault();
          playback.stepForward();
          break;

        case "ArrowLeft":
          event.preventDefault();
          playback.stepBack();
          break;

        case "Escape":
          if (ui.experimentOpen) ui.setExperimentOpen(false);
          else ui.clearSelection();
          break;

        case "Delete":
        case "Backspace": {
          const selection = ui.selection;
          if (selection.kind === "node") {
            event.preventDefault();
            dataset.removeNode(selection.id);
            ui.clearSelection();
          } else if (selection.kind === "edge") {
            event.preventDefault();
            dataset.removeEdge(selection.id);
            ui.clearSelection();
          } else if (selection.kind === "cell") {
            event.preventDefault();
            dataset.pushHistory();
            dataset.paintCell(selection.index, "erase");
          }
          break;
        }

        default:
          break;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) return;

      switch (event.key.toLowerCase()) {
        case "r":
          playback.reset();
          break;

        case "g":
          if (ui.lab === "sorting") dataset.regenerateArray();
          else if (ui.lab === "graph") dataset.regenerateGraph();
          else if (ui.lab === "pathfinding") dataset.regenerateGrid();
          else dataset.regenerateTree();
          break;

        default:
          break;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
}
