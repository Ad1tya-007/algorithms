import { create } from "zustand";
import type { LabId } from "@/lib/algorithms/core/types";
import { DEFAULT_ALGORITHM, getEntry } from "@/lib/algorithms/registry";

interface AlgorithmState {
  /** The laboratory remembers which algorithm you were last looking at. */
  byLab: Record<LabId, string>;
  select: (id: string) => LabId | null;
  reset: () => void;
}

export const useAlgorithmStore = create<AlgorithmState>((set) => ({
  byLab: { ...DEFAULT_ALGORITHM },

  select: (id) => {
    const entry = getEntry(id);
    if (!entry) return null;
    const lab = entry.definition.lab;
    set((state) => ({ byLab: { ...state.byLab, [lab]: id } }));
    return lab;
  },

  reset: () => set({ byLab: { ...DEFAULT_ALGORITHM } }),
}));
