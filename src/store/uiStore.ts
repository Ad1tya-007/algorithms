import { create } from 'zustand';
import type { LabId } from '@/lib/algorithms/core/types';

export type SelectionTarget =
  | { kind: 'none' }
  | { kind: 'array'; index: number }
  | { kind: 'node'; id: string }
  | { kind: 'edge'; id: string }
  | { kind: 'cell'; index: number }
  | { kind: 'tree-node'; id: number };

export type GridTool = 'wall' | 'erase' | 'start' | 'end' | 'terrain';

interface UiState {
  lab: LabId;
  booted: boolean;
  showSidebar: boolean;
  showInspector: boolean;
  showCode: boolean;
  cinematic: boolean;
  paletteOpen: boolean;
  experimentOpen: boolean;
  selection: SelectionTarget;
  gridTool: GridTool;
  /** Transient message shown in the canvas — requirements and failures. */
  notice: string | null;

  setLab: (lab: LabId) => void;
  setBooted: (booted: boolean) => void;
  toggleSidebar: () => void;
  toggleInspector: () => void;
  toggleCode: () => void;
  toggleCinematic: () => void;
  setPaletteOpen: (open: boolean) => void;
  setExperimentOpen: (open: boolean) => void;
  select: (selection: SelectionTarget) => void;
  clearSelection: () => void;
  setGridTool: (tool: GridTool) => void;
  setNotice: (notice: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  lab: 'sorting',
  booted: false,
  showSidebar: true,
  showInspector: true,
  showCode: false,
  cinematic: false,
  paletteOpen: false,
  experimentOpen: false,
  selection: { kind: 'none' },
  gridTool: 'wall',
  notice: null,

  setLab: (lab) => set({ lab, selection: { kind: 'none' }, notice: null }),
  setBooted: (booted) => set({ booted }),
  toggleSidebar: () => set((s) => ({ showSidebar: !s.showSidebar })),
  toggleInspector: () => set((s) => ({ showInspector: !s.showInspector })),
  toggleCode: () => set((s) => ({ showCode: !s.showCode })),
  toggleCinematic: () =>
    set((s) => {
      const cinematic = !s.cinematic;
      return {
        cinematic,
        showSidebar: !cinematic,
        showInspector: !cinematic,
        showCode: cinematic ? false : s.showCode,
      };
    }),
  setPaletteOpen: (paletteOpen) => set({ paletteOpen }),
  setExperimentOpen: (experimentOpen) => set({ experimentOpen }),
  select: (selection) => set({ selection }),
  clearSelection: () => set({ selection: { kind: 'none' } }),
  setGridTool: (gridTool) => set({ gridTool }),
  setNotice: (notice) => set({ notice }),
}));
