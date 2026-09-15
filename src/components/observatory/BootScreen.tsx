"use client";

const LINES = [
  "Initializing runtime…",
  "Loading algorithm library…",
  "Preparing visualization engine…",
  "READY",
];

export function BootScreen() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 bg-void">
      <div className="text-center">
        <p className="label mb-2">Laboratory</p>
        <h1 className="font-mono text-xl tracking-[0.22em] text-ink">ALGORITHM OBSERVATORY</h1>
      </div>
      <div className="flex flex-col gap-2 font-mono text-xs text-ink-dim">
        {LINES.map((line, i) => (
          <p
            key={line}
            className="animate-boot-line"
            style={{ animationDelay: `${i * 180}ms` }}
          >
            {line}
          </p>
        ))}
      </div>
    </div>
  );
}
