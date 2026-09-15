"use client";

import { useEffect } from "react";
import { useAlgorithmRun } from "@/hooks/useAlgorithmRun";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { usePlaybackLoop } from "@/hooks/usePlayback";
import { useUiStore } from "@/store/uiStore";
import { BottomControls } from "@/components/layout/BottomControls";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { CommandPalette } from "@/components/command/CommandPalette";
import { Inspector } from "@/components/inspector/Inspector";
import { VisualizationCanvas } from "@/components/visualization/VisualizationCanvas";
import { BootScreen } from "@/components/observatory/BootScreen";

export function AlgorithmObservatory() {
  const booted = useUiStore((s) => s.booted);
  const setBooted = useUiStore((s) => s.setBooted);
  const showSidebar = useUiStore((s) => s.showSidebar);
  const showInspector = useUiStore((s) => s.showInspector);
  const cinematic = useUiStore((s) => s.cinematic);

  useAlgorithmRun();
  usePlaybackLoop();
  useKeyboardShortcuts();

  useEffect(() => {
    const timer = window.setTimeout(() => setBooted(true), 900);
    return () => window.clearTimeout(timer);
  }, [setBooted]);

  if (!booted) return <BootScreen />;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <TopBar />
      <div className="flex min-h-0 flex-1">
        {showSidebar && !cinematic && <Sidebar />}
        <VisualizationCanvas />
        {showInspector && !cinematic && <Inspector />}
      </div>
      <BottomControls />
      <CommandPalette />
    </div>
  );
}
