"use client";

import { algorithmsByCategory, CATEGORY_LABELS } from "@/lib/algorithms/registry";
import { cn } from "@/lib/utils/cn";
import { useAlgorithmStore } from "@/store/algorithmStore";
import { useUiStore } from "@/store/uiStore";

export function Sidebar() {
  const lab = useUiStore((s) => s.lab);
  const algorithmId = useAlgorithmStore((s) => s.byLab[lab]);
  const select = useAlgorithmStore((s) => s.select);

  const groups = algorithmsByCategory().filter((group) =>
    group.items.some((item) => item.definition.lab === lab),
  );

  return (
    <aside className="panel flex w-56 shrink-0 flex-col border-r border-line md:w-60">
      <div className="border-b border-line px-3 py-2">
        <p className="label">Algorithms</p>
      </div>
      <nav className="flex-1 overflow-y-auto px-2 py-2">
        {groups.map((group) => {
          const items = group.items.filter((item) => item.definition.lab === lab);
          if (items.length === 0) return null;
          return (
            <div key={group.category} className="mb-4">
              <p className="label mb-1.5 px-1">{CATEGORY_LABELS[group.category]}</p>
              <ul className="space-y-0.5">
                {items.map(({ definition }) => (
                  <li key={definition.id}>
                    <button
                      type="button"
                      onClick={() => select(definition.id)}
                      className={cn(
                        "w-full rounded px-2 py-1.5 text-left text-[13px] transition-colors",
                        algorithmId === definition.id
                          ? "bg-active/12 text-active"
                          : "text-ink-dim hover:bg-white/[0.03] hover:text-ink",
                      )}
                    >
                      {definition.name}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
