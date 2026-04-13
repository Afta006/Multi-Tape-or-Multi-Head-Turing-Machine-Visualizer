"use client";

import { useMemo, useEffect, useRef } from "react";
import { MachineViewState } from "@/lib/efficiency/useEfficiencyComparison";
import { EfficiencyExample } from "@/lib/efficiency/examples";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnalysisSectionProps {
  viewST: MachineViewState;
  viewMT: MachineViewState;
  viewMH: MachineViewState;
  numTapes: number;
  numHeads: number;
  selectedExample: EfficiencyExample;
  isRunning: boolean;
}

interface StepSnapshot {
  tick: number;   // snapshot index (x-axis)
  st: number;
  mt: number;
  mh: number;
}

// ─── Colour tokens (local, consistent with your TM CSS vars) ─────────────────

const C = {
  st:  "#60a5fa",   // blue-400
  mt:  "#a78bfa",   // violet-400
  mh:  "#f472b6",   // pink-400
  grid:"#e2e8f0",
  axis:"#94a3b8",
  bg:  "var(--cell-bg, #f8fafc)",
  card:"var(--card, #ffffff)",
  line:"var(--line, #e2e8f0)",
  fg:  "var(--foreground, #0f172a)",
  soft:"var(--ink-soft, #64748b)",
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ratio(a: number, b: number) {
  if (b === 0) return "—";
  return `${(a / b).toFixed(2)}×`;
}

function pct(base: number, other: number) {
  if (base === 0) return "—";
  const g = ((base - other) / base) * 100;
  if (Math.abs(g) < 0.5) return "≈ same";
  return `${g > 0 ? "↓ " : "↑ "}${Math.abs(g).toFixed(1)}%`;
}

function Pill({ value, positive }: { value: string; positive: boolean }) {
  const neutral = value === "—" || value === "≈ same";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "0.2rem 0.55rem",
        borderRadius: "9999px",
        fontSize: "0.78rem",
        fontWeight: 700,
        fontFamily: "var(--font-mono, monospace)",
        background: neutral ? C.line : positive ? "#dcfce7" : "#fee2e2",
        color:      neutral ? C.soft  : positive ? "#15803d"  : "#b91c1c",
        border: `1px solid ${neutral ? C.line : positive ? "#bbf7d0" : "#fecaca"}`,
      }}
    >
      {value}
    </span>
  );
}

// ─── Mini stat card ───────────────────────────────────────────────────────────

function StatCard({
  label, value, sub, accent,
}: { label: string; value: string | number; sub?: string; accent: string }) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        borderRadius: 10,
        padding: "1rem 1.25rem",
        display: "flex",
        flexDirection: "column",
        gap: "0.25rem",
        borderTop: `3px solid ${accent}`,
      }}
    >
      <div style={{ fontSize: "0.75rem", color: C.soft, fontWeight: 500, letterSpacing: "0.04em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.5rem", fontWeight: 800, color: C.fg, fontFamily: "var(--font-mono, monospace)", lineHeight: 1 }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: "0.75rem", color: C.soft }}>{sub}</div>}
    </div>
  );
}

// ─── SVG Live Chart ───────────────────────────────────────────────────────────

function LiveChart({ history, hasMH }: { history: StepSnapshot[]; hasMH: boolean }) {
  const W = 520, H = 220;
  const PAD = { top: 16, right: 20, bottom: 36, left: 48 };
  const iW = W - PAD.left - PAD.right;
  const iH = H - PAD.top - PAD.bottom;

  const maxSteps = useMemo(() => {
    let m = 1;
    for (const s of history) m = Math.max(m, s.st, s.mt, hasMH ? s.mh : 0);
    return m;
  }, [history, hasMH]);

  const maxTick = Math.max(history.length - 1, 1);

  function toX(tick: number) {
    return PAD.left + (tick / maxTick) * iW;
  }
  function toY(steps: number) {
    return PAD.top + iH - (steps / maxSteps) * iH;
  }

  function polyline(key: "st" | "mt" | "mh") {
    if (history.length < 2) return null;
    const pts = history.map((s, i) => `${toX(i)},${toY(s[key])}`).join(" ");
    return pts;
  }

  // Y grid lines (4 lines)
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    y: PAD.top + iH * (1 - f),
    label: Math.round(f * maxSteps),
  }));

  const stPts = polyline("st");
  const mtPts = polyline("mt");
  const mhPts = hasMH ? polyline("mh") : null;

  const lastST = history.at(-1)?.st ?? 0;
  const lastMT = history.at(-1)?.mt ?? 0;
  const lastMH = history.at(-1)?.mh ?? 0;

  return (
    <div style={{ width: "100%", overflowX: "auto" }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ display: "block", fontFamily: "var(--font-mono, monospace)" }}
        aria-label="Live step count chart"
      >
        {/* Grid */}
        {yTicks.map(({ y, label }) => (
          <g key={y}>
            <line x1={PAD.left} y1={y} x2={PAD.left + iW} y2={y} stroke={C.grid} strokeWidth={1} strokeDasharray="3 3" />
            <text x={PAD.left - 6} y={y + 4} fontSize={10} fill={C.axis} textAnchor="end">{label}</text>
          </g>
        ))}

        {/* Axes */}
        <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + iH} stroke={C.axis} strokeWidth={1.5} />
        <line x1={PAD.left} y1={PAD.top + iH} x2={PAD.left + iW} y2={PAD.top + iH} stroke={C.axis} strokeWidth={1.5} />

        {/* Axis labels */}
        <text x={PAD.left + iW / 2} y={H - 2} fontSize={10} fill={C.soft} textAnchor="middle">
          Execution steps (over time)
        </text>
        <text
          x={10} y={PAD.top + iH / 2}
          fontSize={10} fill={C.soft} textAnchor="middle"
          transform={`rotate(-90, 10, ${PAD.top + iH / 2})`}
        >
          Steps
        </text>

        {/* Lines */}
        {stPts && (
          <polyline points={stPts} fill="none" stroke={C.st} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        )}
        {mtPts && (
          <polyline points={mtPts} fill="none" stroke={C.mt} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        )}
        {mhPts && (
          <polyline points={mhPts} fill="none" stroke={C.mh} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" strokeDasharray="5 3" />
        )}

        {/* End-of-line dots + labels */}
        {history.length > 0 && (
          <>
            <circle cx={toX(history.length - 1)} cy={toY(lastST)} r={4} fill={C.st} />
            <circle cx={toX(history.length - 1)} cy={toY(lastMT)} r={4} fill={C.mt} />
            {hasMH && <circle cx={toX(history.length - 1)} cy={toY(lastMH)} r={4} fill={C.mh} />}
          </>
        )}

        {/* Legend */}
        {[
          { color: C.st, label: "Single-Tape", dash: false },
          { color: C.mt, label: "Multi-Tape",  dash: false },
          ...(hasMH ? [{ color: C.mh, label: "Multi-Head", dash: true }] : []),
        ].map(({ color, label, dash }, i) => (
          <g key={label} transform={`translate(${PAD.left + i * 120}, ${PAD.top})`}>
            <line x1={0} y1={6} x2={18} y2={6} stroke={color} strokeWidth={2} strokeDasharray={dash ? "5 3" : undefined} />
            <text x={22} y={10} fontSize={10} fill={C.fg}>{label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─── Bar comparison (shown when at least one machine has halted) ──────────────

function BarComparison({ stSteps, mtSteps, mhSteps, hasMH }: {
  stSteps: number; mtSteps: number; mhSteps: number; hasMH: boolean;
}) {
  const max = Math.max(stSteps, mtSteps, hasMH ? mhSteps : 0, 1);
  const bars = [
    { label: "Single-Tape", steps: stSteps, color: C.st },
    { label: "Multi-Tape",  steps: mtSteps, color: C.mt },
    ...(hasMH ? [{ label: "Multi-Head", steps: mhSteps, color: C.mh }] : []),
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
      {bars.map(({ label, steps, color }) => (
        <div key={label} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: 90, fontSize: "0.8rem", color: C.soft, flexShrink: 0 }}>{label}</div>
          <div style={{ flex: 1, background: C.bg, borderRadius: 4, height: 22, overflow: "hidden", border: `1px solid ${C.line}` }}>
            <div
              style={{
                width: `${(steps / max) * 100}%`,
                height: "100%",
                background: color,
                borderRadius: 4,
                transition: "width 0.5s cubic-bezier(.4,0,.2,1)",
                minWidth: steps > 0 ? 4 : 0,
              }}
            />
          </div>
          <div style={{ width: 52, fontSize: "0.8rem", fontWeight: 700, fontFamily: "var(--font-mono, monospace)", color: C.fg, flexShrink: 0, textAlign: "right" }}>
            {steps} <span style={{ fontWeight: 400, color: C.soft, fontSize: "0.7rem" }}>steps</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Insight list ─────────────────────────────────────────────────────────────

function Insights({ stSteps, mtSteps, mhSteps, hasMH, example }: {
  stSteps: number; mtSteps: number; mhSteps: number; hasMH: boolean;
  example: EfficiencyExample;
}) {
  const items: { text: string; positive: boolean }[] = [];

  if (stSteps > 0 && mtSteps > 0) {
    const g = ((stSteps - mtSteps) / stSteps) * 100;
    if (g > 0.5)
      items.push({ text: `Multi-Tape finished in ${mtSteps} steps vs ${stSteps} for Single-Tape — a ${g.toFixed(1)}% reduction.`, positive: true });
    else if (g < -0.5)
      items.push({ text: `Multi-Tape used ${Math.abs(g).toFixed(1)}% more steps than Single-Tape for this input size — overhead of extra tapes dominates at small n.`, positive: false });
    else
      items.push({ text: `Multi-Tape and Single-Tape took nearly identical steps for this input. Try longer inputs to see the difference.`, positive: false });
  }

  if (hasMH && stSteps > 0 && mhSteps > 0) {
    const g = ((stSteps - mhSteps) / stSteps) * 100;
    if (g > 0.5)
      items.push({ text: `Multi-Head finished in ${mhSteps} steps vs ${stSteps} — ${g.toFixed(1)}% faster by reducing redundant head travel.`, positive: true });
    else if (g < -0.5)
      items.push({ text: `Multi-Head used more steps than Single-Tape here — coordination overhead outweighs scan savings at small n.`, positive: false });
  }

  if (hasMH && mtSteps > 0 && mhSteps > 0) {
    if (mtSteps < mhSteps)
      items.push({ text: `Multi-Tape beats Multi-Head (${mtSteps} vs ${mhSteps} steps) — separate tapes allow true parallel writes, not just parallel reads.`, positive: true });
    else if (mhSteps < mtSteps)
      items.push({ text: `Multi-Head beats Multi-Tape (${mhSteps} vs ${mtSteps} steps) — converging heads eliminate redundant traversals.`, positive: true });
  }

  const min = Math.min(stSteps, mtSteps, hasMH ? mhSteps : Infinity);
  const winner = min === stSteps ? "Single-Tape" : min === mtSteps ? "Multi-Tape" : "Multi-Head";
  items.push({ text: `For "${example.name}" on this input, ${winner} used the fewest steps.`, positive: winner !== "Single-Tape" });

  return (
    <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
      {items.map((it, i) => (
        <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem", fontSize: "0.875rem", lineHeight: 1.6, color: C.fg }}>
          <span style={{ flexShrink: 0, marginTop: "0.2rem", color: it.positive ? "#16a34a" : "#dc2626", fontSize: "1rem" }}>
            {it.positive ? "✓" : "○"}
          </span>
          {it.text}
        </li>
      ))}
    </ul>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export default function AnalysisSection({
  viewST, viewMT, viewMH,
  numTapes, numHeads,
  selectedExample,
  isRunning,
}: AnalysisSectionProps) {
  const hasMH = Boolean(selectedExample.multiHeadRules);
  const stSteps = viewST.steps;
  const mtSteps = viewMT.steps;
  const mhSteps = viewMH.steps;
  const anyRunning = stSteps > 0 || mtSteps > 0 || mhSteps > 0;

  // Track step history for the live chart
  const historyRef = useRef<StepSnapshot[]>([]);
  const lastSTRef  = useRef(-1);

  useEffect(() => {
    // Record a snapshot each time step count changes
    if (stSteps !== lastSTRef.current) {
      lastSTRef.current = stSteps;
      historyRef.current = [
        ...historyRef.current,
        { tick: historyRef.current.length, st: stSteps, mt: mtSteps, mh: mhSteps },
      ];
    }
  }, [stSteps, mtSteps, mhSteps]);

  // Reset history when example changes (steps reset to 0)
  useEffect(() => {
    historyRef.current = [];
    lastSTRef.current = -1;
  }, [selectedExample.id]);

  const history = historyRef.current;

  const anyHalted = viewST.isHalted || viewMT.isHalted || viewMH.isHalted;

  if (!anyRunning) return null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "1.25rem",
        marginTop: "1.5rem",
        padding: "1.5rem",
        background: C.card,
        border: `1px solid ${C.line}`,
        borderRadius: 12,
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.5rem" }}>
        <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: C.fg, letterSpacing: "-0.01em" }}>
          Performance Analysis
        </h3>
        {isRunning && (
          <span style={{ fontSize: "0.75rem", color: C.soft, display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{
              display: "inline-block", width: 8, height: 8, borderRadius: "50%",
              background: "#22c55e", animation: "pulse 1.2s infinite",
            }} />
            live
          </span>
        )}
      </div>

      {/* Stat cards */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${hasMH ? 3 : 2}, 1fr)`,
        gap: "0.75rem",
      }}>
        <StatCard label="Single-Tape steps" value={stSteps} sub="O(n²) rescans" accent={C.st} />
        <StatCard label={`Multi-Tape (${numTapes}t) steps`} value={mtSteps} sub="O(n) parallel" accent={C.mt} />
        {hasMH && <StatCard label={`Multi-Head (${numHeads}h) steps`} value={mhSteps} sub="O(n) converge" accent={C.mh} />}
      </div>

      {/* Comparison table */}
      {anyHalted && (
        <div style={{
          background: C.bg,
          border: `1px solid ${C.line}`,
          borderRadius: 8,
          padding: "1rem",
          overflowX: "auto",
        }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
            <thead>
              <tr>
                {["Comparison", "Step ratio", "Reduction"].map(h => (
                  <th key={h} style={{ padding: "0.4rem 0.75rem", textAlign: "left", fontWeight: 600, color: C.soft, borderBottom: `1px solid ${C.line}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ padding: "0.5rem 0.75rem", color: C.fg }}>
                  <span style={{ color: C.mt }}>■</span> Multi-Tape vs <span style={{ color: C.st }}>■</span> Single-Tape
                </td>
                <td style={{ padding: "0.5rem 0.75rem" }}>
                  <Pill value={ratio(stSteps, mtSteps)} positive={mtSteps < stSteps} />
                </td>
                <td style={{ padding: "0.5rem 0.75rem" }}>
                  <Pill value={pct(stSteps, mtSteps)} positive={mtSteps < stSteps} />
                </td>
              </tr>
              {hasMH && (
                <>
                  <tr>
                    <td style={{ padding: "0.5rem 0.75rem", color: C.fg }}>
                      <span style={{ color: C.mh }}>■</span> Multi-Head vs <span style={{ color: C.st }}>■</span> Single-Tape
                    </td>
                    <td style={{ padding: "0.5rem 0.75rem" }}>
                      <Pill value={ratio(stSteps, mhSteps)} positive={mhSteps < stSteps} />
                    </td>
                    <td style={{ padding: "0.5rem 0.75rem" }}>
                      <Pill value={pct(stSteps, mhSteps)} positive={mhSteps < stSteps} />
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "0.5rem 0.75rem", color: C.fg }}>
                      <span style={{ color: C.mh }}>■</span> Multi-Head vs <span style={{ color: C.mt }}>■</span> Multi-Tape
                    </td>
                    <td style={{ padding: "0.5rem 0.75rem" }}>
                      <Pill value={ratio(mtSteps, mhSteps)} positive={mhSteps < mtSteps} />
                    </td>
                    <td style={{ padding: "0.5rem 0.75rem" }}>
                      <Pill value={pct(mtSteps, mhSteps)} positive={mhSteps < mtSteps} />
                    </td>
                  </tr>
                </>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Live chart */}
      <div style={{
        background: C.bg,
        border: `1px solid ${C.line}`,
        borderRadius: 8,
        padding: "1rem",
      }}>
        <div style={{ fontSize: "0.8rem", fontWeight: 600, color: C.soft, marginBottom: "0.75rem", letterSpacing: "0.04em", textTransform: "uppercase" }}>
          Step accumulation — live
        </div>
        {history.length >= 2
          ? <LiveChart history={history} hasMH={hasMH} />
          : <div style={{ fontSize: "0.85rem", color: C.soft, padding: "1rem 0" }}>Step more to populate the chart…</div>
        }
      </div>

      {/* Bar comparison (only when halted) */}
      {anyHalted && (
        <div style={{
          background: C.bg,
          border: `1px solid ${C.line}`,
          borderRadius: 8,
          padding: "1rem",
        }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 600, color: C.soft, marginBottom: "0.75rem", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Final step counts
          </div>
          <BarComparison stSteps={stSteps} mtSteps={mtSteps} mhSteps={mhSteps} hasMH={hasMH} />
        </div>
      )}

      {/* Insights */}
      {anyHalted && (
        <div style={{
          background: C.bg,
          border: `1px solid ${C.line}`,
          borderRadius: 8,
          padding: "1rem",
        }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 600, color: C.soft, marginBottom: "0.75rem", letterSpacing: "0.04em", textTransform: "uppercase" }}>
            Key insights
          </div>
          <Insights stSteps={stSteps} mtSteps={mtSteps} mhSteps={mhSteps} hasMH={hasMH} example={selectedExample} />
        </div>
      )}

      {/* pulse keyframe via a tiny style tag */}
      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}