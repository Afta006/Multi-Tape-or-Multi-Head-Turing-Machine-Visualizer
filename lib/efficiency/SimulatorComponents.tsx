import React from "react";
import { MachineViewState } from "./useEfficiencyComparison";

const VIEW_RADIUS = 8;

interface TapeStackProps {
  tapes: Array<{ index: number; symbols: string[] }>;
  headPositions?: number[];
}

export function TapeStack({ tapes, headPositions }: TapeStackProps) {
  return (
    <div className="tm-tape-stack" style={{ margin: 0, padding: 0 }}>
      {tapes.map((tape) => (
        <div key={tape.index} className="tm-tape" style={{ margin: 0 }}>
          <p>Tape {tape.index + 1}</p>
          <div className="tm-cells">
            {tape.symbols.map((symbol, idx) => {
              // readRange returns symbols from position -VIEW_RADIUS to +VIEW_RADIUS
              // So array index idx corresponds to absolute position: -VIEW_RADIUS + idx
              const absolutePos = -VIEW_RADIUS + idx;
              
              let isHead = false;
              let headLabels: string[] = [];
              
              if (headPositions && headPositions.length > 0) {
                // Check which heads are at this position
                for (let h = 0; h < headPositions.length; h++) {
                  if (headPositions[h] === absolutePos) {
                    isHead = true;
                    headLabels.push(`Head ${h + 1}`);
                  }
                }
              } else {
                // For single-head/single-tape machines, the center cell (idx === VIEW_RADIUS) is the head
                isHead = idx === VIEW_RADIUS;
              }
              
              const title = headLabels.length > 0 ? headLabels.join(", ") : undefined;
              
              return (
                <span 
                  key={`${tape.index}-${idx}`} 
                  className={isHead ? "tm-cell head" : "tm-cell"}
                  title={title}
                >
                  {symbol === " " ? "_" : symbol}
                </span>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

interface SimulatorStatusProps {
  title: string;
  viewState: MachineViewState;
  isRunning: boolean;
}

export function SimulatorStatus({ title, viewState, isRunning }: SimulatorStatusProps) {
  const statusTextStyle = { fontFamily: "var(--font-mono)", fontSize: "0.85rem", color: "var(--ink-soft)" };

  return (
    <div style={{ background: "var(--card)", border: "1px solid var(--line)", borderRadius: "12px", padding: "1.25rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
        <h3 style={{ margin: 0, fontSize: "1.1rem", color: "var(--foreground)" }}>{title}</h3>
        <div style={{ display: "flex", gap: "1rem", ...statusTextStyle }}>
          <span>State: <strong>{viewState.currentState}</strong></span>
          <span>Steps: <strong style={{ color: "var(--primary)" }}>{viewState.steps}</strong></span>
          <span>Status: <strong>{viewState.isHalted ? "halted" : isRunning ? "running" : "idle"}</strong></span>
        </div>
      </div>
      <TapeStack tapes={viewState.tapes} headPositions={viewState.headPositions} />
    </div>
  );
}

interface PerformanceMultiplierProps {
  stepsMulti: number;
  stepsSingle: number;
}

export function PerformanceMultiplier({ stepsMulti, stepsSingle }: PerformanceMultiplierProps) {
  const ratio = stepsMulti > 0 && stepsSingle ? stepsSingle / stepsMulti : Infinity;
  const displayRatio = isFinite(ratio) ? ratio.toFixed(1) : "∞";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "1.5rem",
        background: "var(--cell-bg)",
        borderRadius: "8px",
        border: "1px dashed var(--node-stroke)",
        marginTop: "2rem",
      }}
    >
      <div>
        <p style={{ margin: "0 0 0.25rem 0", fontWeight: 600 }}>Performance Multiplier</p>
        <span style={{ fontSize: "0.85rem", color: "var(--ink-soft)" }}>
          Single-tape steps ÷ Multi-tape steps
        </span>
      </div>
      <div style={{ fontSize: "2.5rem", fontWeight: "bold", color: "var(--primary)", fontFamily: "var(--font-mono)" }}>
        {displayRatio}x
      </div>
    </div>
  );
}
