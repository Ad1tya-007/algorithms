import { StepRecorder } from "../core/recorder";
import type { ArrayAlgorithm, ArrayExtra, ArrayFrame, ArrayOp } from "./model";

const pseudocode = [
  "function mergeSort(a, lo, hi) {",
  "  if (lo >= hi) return;",
  "  const mid = (lo + hi) >> 1;",
  "  mergeSort(a, lo, mid);",
  "  mergeSort(a, mid + 1, hi);",
  "  merge(a, lo, mid, hi);",
  "}",
  "",
  "function merge(a, lo, mid, hi) {",
  "  const buf = a.slice(lo, hi + 1);",
  "  let i = lo, j = mid + 1, k = lo;",
  "  while (i <= mid && j <= hi) {",
  "    a[k++] = buf[i] <= buf[j] ? buf[i++] : buf[j++];",
  "  }",
  "  while (i <= mid) a[k++] = buf[i++];",
  "  while (j <= hi) a[k++] = buf[j++];",
  "}",
];

export const mergeSort: ArrayAlgorithm = {
  id: "merge-sort",
  name: "Merge Sort",
  category: "sorting",
  lab: "sorting",
  complexity: {
    best: "O(n log n)",
    average: "O(n log n)",
    worst: "O(n log n)",
    space: "O(n)",
  },
  growth: "n log n",
  description:
    "Splits the array in half until runs are trivially sorted, then merges neighbouring runs back together in order.",
  howItWorks:
    "The recursion depth is log n and every level touches all n elements, which pins the running time to n log n for every input — best, average and worst alike. The price is an auxiliary buffer: merging cannot be done in place without giving up that guarantee.",
  pseudocode,

  generate({ values }) {
    const rec = new StepRecorder<ArrayOp, ArrayExtra>();
    const a = [...values];
    const n = a.length;
    const stack: ArrayFrame[] = [];

    const extra = (aux: ArrayExtra["aux"] = null): ArrayExtra => ({
      frames: [...stack],
      aux,
    });

    const merge = (lo: number, mid: number, hi: number) => {
      const buf = a.slice(lo, hi + 1);
      const remaining: (number | null)[] = [...buf];
      let i = lo;
      let j = mid + 1;
      let k = lo;

      const aux = () => ({
        label: `merge buffer ${lo}…${hi}`,
        start: lo,
        values: [...remaining],
      });

      rec.record({
        op: { type: "range", start: lo, end: hi },
        phase: "MERGING",
        explanation: `Merge the sorted runs ${lo}…${mid} and ${mid + 1}…${hi} into one ordered run.`,
        fields: [
          { label: "Merging", value: `${lo}…${mid} + ${mid + 1}…${hi}`, tone: "accent" },
          { label: "Left Run", value: `${mid - lo + 1} elements` },
          { label: "Right Run", value: `${hi - mid} elements` },
          { label: "Depth", value: `${stack.length}` },
        ],
        extra: extra(aux()),
        codeLine: 9,
      });

      while (i <= mid && j <= hi) {
        const left = buf[i - lo];
        const right = buf[j - lo];
        const takeLeft = left <= right;

        rec.record({
          op: { type: "compare", indices: [i, j] },
          phase: "COMPARING",
          explanation: `Compare heads of the runs: ${left} and ${right} — take ${
            takeLeft ? `${left} from the left run` : `${right} from the right run`
          }.`,
          fields: [
            { label: "Left Head", value: `buf[${i - lo}] = ${left}`, tone: takeLeft ? "good" : "muted" },
            { label: "Right Head", value: `buf[${j - lo}] = ${right}`, tone: takeLeft ? "muted" : "good" },
            { label: "Decision", value: `${left} ${takeLeft ? "≤" : ">"} ${right}`, tone: "active" },
            { label: "Write Position", value: `a[${k}]` },
          ],
          extra: extra(aux()),
          codeLine: 12,
          count: "comparisons",
        });

        const value = takeLeft ? left : right;
        if (takeLeft) {
          remaining[i - lo] = null;
          i += 1;
        } else {
          remaining[j - lo] = null;
          j += 1;
        }
        a[k] = value;

        rec.record({
          op: { type: "overwrite", index: k, value },
          phase: "WRITING",
          explanation: `Write ${value} into a[${k}] from the ${takeLeft ? "left" : "right"} run.`,
          fields: [
            { label: "Wrote", value: `${value} → a[${k}]`, tone: "warn" },
            { label: "Left Pointer", value: i <= mid ? `${i}` : "exhausted" },
            { label: "Right Pointer", value: j <= hi ? `${j}` : "exhausted" },
          ],
          extra: extra(aux()),
          codeLine: 12,
          count: "writes",
        });
        k += 1;
      }

      while (i <= mid) {
        const value = buf[i - lo];
        remaining[i - lo] = null;
        a[k] = value;
        rec.record({
          op: { type: "overwrite", index: k, value },
          phase: "WRITING",
          explanation: `The right run is exhausted, so copy the remainder of the left run: ${value} → a[${k}].`,
          fields: [
            { label: "Draining", value: "left run", tone: "accent" },
            { label: "Wrote", value: `${value} → a[${k}]`, tone: "warn" },
          ],
          extra: extra(aux()),
          codeLine: 14,
          count: "writes",
        });
        i += 1;
        k += 1;
      }

      while (j <= hi) {
        const value = buf[j - lo];
        remaining[j - lo] = null;
        a[k] = value;
        rec.record({
          op: { type: "overwrite", index: k, value },
          phase: "WRITING",
          explanation: `The left run is exhausted, so copy the remainder of the right run: ${value} → a[${k}].`,
          fields: [
            { label: "Draining", value: "right run", tone: "accent" },
            { label: "Wrote", value: `${value} → a[${k}]`, tone: "warn" },
          ],
          extra: extra(aux()),
          codeLine: 15,
          count: "writes",
        });
        j += 1;
        k += 1;
      }
    };

    const sort = (lo: number, hi: number, depth: number) => {
      if (lo >= hi) return;
      const mid = (lo + hi) >> 1;

      stack.push({ start: lo, end: hi, depth, label: `${lo}…${hi}` });
      rec.record({
        op: { type: "range", start: lo, end: hi },
        phase: "SCANNING",
        explanation: `Divide ${lo}…${hi} at index ${mid} and sort each half independently.`,
        fields: [
          { label: "Range", value: `${lo} → ${hi}`, tone: "accent" },
          { label: "Split At", value: `${mid}`, tone: "active" },
          { label: "Depth", value: `${depth}` },
          { label: "Open Frames", value: `${stack.length}` },
        ],
        extra: extra(),
        codeLine: 2,
      });

      sort(lo, mid, depth + 1);
      sort(mid + 1, hi, depth + 1);
      merge(lo, mid, hi);
      stack.pop();

      rec.record({
        op: { type: "range", start: lo, end: hi },
        phase: depth === 0 ? "COMPLETE" : "MERGING",
        explanation: `Range ${lo}…${hi} is now a single sorted run.`,
        fields: [
          { label: "Sorted Run", value: `${lo} → ${hi}`, tone: "good" },
          { label: "Depth", value: `${depth}` },
        ],
        extra: extra(),
        codeLine: 5,
      });
    };

    sort(0, n - 1, 0);

    for (let i = 0; i < n; i++) {
      rec.record({
        op: { type: "mark-sorted", index: i },
        phase: i === n - 1 ? "COMPLETE" : "SORTED",
        explanation:
          i === n - 1
            ? `Sorted. Every level of the recursion merged ${n} elements in order.`
            : `a[${i}] = ${a[i]} is in its final position.`,
        fields: [{ label: "Status", value: "sorted", tone: "good" }],
        extra: extra(),
        codeLine: 6,
      });
    }

    if (n === 0) {
      rec.record({
        op: { type: "idle" },
        phase: "COMPLETE",
        explanation: "The array is empty — nothing to sort.",
        extra: extra(),
        codeLine: 1,
      });
    }

    return rec.done();
  },
};
