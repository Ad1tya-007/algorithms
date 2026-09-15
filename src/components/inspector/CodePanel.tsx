"use client";

import { cn } from "@/lib/utils/cn";

interface CodePanelProps {
  definition: {
    pseudocode: string[];
  };
  codeLine: number | null;
}

export function CodePanel({ definition, codeLine }: CodePanelProps) {
  return (
    <section className="mb-5">
      <p className="label mb-2">Pseudocode</p>
      <pre className="overflow-x-auto rounded border border-line bg-void/60 p-2 font-mono text-[10px] leading-relaxed">
        {definition.pseudocode.map((line, i) => (
          <div
            key={i}
            className={cn(
              "px-1 -mx-1",
              codeLine === i && "bg-active/15 text-active",
              !line && "h-2",
            )}
          >
            {line || "\u00A0"}
          </div>
        ))}
      </pre>
    </section>
  );
}
