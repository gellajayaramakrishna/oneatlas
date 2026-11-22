"use client";

import { useState } from "react";
import { estimateCost, formatTokens } from "@/lib/format";

interface Row {
  label: string;
  inputPrice: number | null;
  outputPrice: number | null;
}

const PRESETS = [
  { label: "Chatbot (1M in / 250K out)", input: 1_000_000, output: 250_000 },
  { label: "RAG (10M in / 500K out)", input: 10_000_000, output: 500_000 },
  { label: "Agent (50M in / 5M out)", input: 50_000_000, output: 5_000_000 },
];

/** Monthly cost estimate for a workload across several price points (providers or models). */
export function CostCalculator({ rows, title = "Cost estimator" }: { rows: Row[]; title?: string }) {
  const [input, setInput] = useState(PRESETS[0].input);
  const [output, setOutput] = useState(PRESETS[0].output);
  const costs = rows.map((r) => ({ ...r, cost: estimateCost(r.inputPrice, r.outputPrice, input, output) }));
  const valid = costs.map((c) => c.cost).filter((c): c is number => c != null);
  const min = valid.length ? Math.min(...valid) : null;
  const max = valid.length ? Math.max(...valid) : null;

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-semibold">{title}</h3>
        <div className="flex flex-wrap gap-1">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              className={input === p.input && output === p.output ? "btn-primary py-1 text-xs" : "btn-secondary py-1 text-xs"}
              onClick={() => {
                setInput(p.input);
                setOutput(p.output);
              }}
            >
              {p.label.split(" (")[0]}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Slider label="Input tokens / month" value={input} onChange={setInput} />
        <Slider label="Output tokens / month" value={output} onChange={setOutput} />
      </div>
      <ul className="mt-4 divide-y divide-slate-100">
        {costs.map((c) => (
          <li key={c.label} className="flex items-center gap-3 py-2 text-sm">
            <span className="w-40 shrink-0 truncate sm:w-56">{c.label}</span>
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
              {c.cost != null && max ? <div className={c.cost === min ? "h-full bg-emerald-500" : "h-full bg-slate-400"} style={{ width: `${Math.max(2, (c.cost / max) * 100)}%` }} /> : null}
            </div>
            <span className="num w-24 text-right font-medium">{c.cost == null ? "—" : `$${c.cost < 10 ? c.cost.toFixed(2) : Math.round(c.cost).toLocaleString()}`}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Log-scale slider: 10K .. 1B tokens is far too wide for a linear range.
function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const minExp = 4;
  const maxExp = 9;
  const exp = Math.log10(Math.max(10 ** minExp, value));
  return (
    <label className="block text-sm">
      <span className="flex justify-between text-slate-600">
        {label}
        <span className="num font-medium text-ink">{formatTokens(value)}</span>
      </span>
      <input
        type="range"
        min={minExp}
        max={maxExp}
        step={0.01}
        value={exp}
        onChange={(e) => onChange(Math.round(10 ** Number(e.target.value) / 1000) * 1000)}
        className="mt-2 w-full accent-indigo-600"
      />
    </label>
  );
}
