"use client";

import { useCallback, useEffect, useState, useRef, useMemo } from "react";
import Button from "@/components/buttons/button";
import SingleInput from "@/components/Inputs/SingleInput/singleInput";
import TextArea from "@/components/Inputs/TextArea/textarea";
import { EFFICIENCY_EXAMPLES, EfficiencyExample } from "@/lib/efficiency/examples";
import { useEfficiencyComparison } from "@/lib/efficiency/useEfficiencyComparison";
import { TapeStack, SimulatorStatus, PerformanceMultiplier } from "@/lib/efficiency/SimulatorComponents";
import AnalysisSection from "@/components/efficiency/AnalysisSection";

export default function EfficiencyPage() {
  const [mounted, setMounted] = useState(false);
  const [selectedExample, setSelectedExample] = useState<EfficiencyExample>(EFFICIENCY_EXAMPLES[0]);
  const [selectedTab, setSelectedTab] = useState<"st" | "mt" | "mh">("st");
  const [inputString, setInputString] = useState(EFFICIENCY_EXAMPLES[0].input);
  const [inputTape2, setInputTape2] = useState(EFFICIENCY_EXAMPLES[0].inputTape2 || "");
  const [stRules, setStRules] = useState(EFFICIENCY_EXAMPLES[0].singleTapeRules);
  const [mtRules, setMtRules] = useState(EFFICIENCY_EXAMPLES[0].multiTapeRules);
  const [numTapes, setNumTapes] = useState(EFFICIENCY_EXAMPLES[0].tapes || 1);
  const [mhRules, setMhRules] = useState(EFFICIENCY_EXAMPLES[0].multiHeadRules || "");
  const [numHeads, setNumHeads] = useState(EFFICIENCY_EXAMPLES[0].heads || 2);
  const [headPositions, setHeadPositions] = useState<number[]>(EFFICIENCY_EXAMPLES[0].headStartPositions || [0, -1]);
  const [stepDelayMs, setStepDelayMs] = useState(120);
  const [currentStepCount, setCurrentStepCount] = useState(0);
  const historyRef = useRef<any[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { viewST, viewMT, viewMH, isRunning, setIsRunning, handleReset, handleStep, parseResultST, parseResultMT, parseResultMH, getMachineClones, restoreMachines } =
    useEfficiencyComparison(
      inputString,
      inputTape2,
      stRules,
      mtRules,
      numTapes,
      mhRules,
      numHeads,
      headPositions
    );

  const loadExample = useCallback((exampleId: string) => {
    const example = EFFICIENCY_EXAMPLES.find(e => e.id === exampleId);
    if (example) {
      setSelectedExample(example);
      setInputString(example.input);
      setInputTape2(example.inputTape2 || "");
      setStRules(example.singleTapeRules);
      setMtRules(example.multiTapeRules);
      setNumTapes(example.tapes || 1);
      setMhRules(example.multiHeadRules || "");
      setNumHeads(example.heads || 2);
      setHeadPositions(example.headStartPositions || [0, -1]);
    }
  }, []);

  // Automatically reset whenever the user selects a new example
  useEffect(() => {
    handleReset();
    setCurrentStepCount(0);
    historyRef.current = [];
  }, [selectedExample.id, handleReset]);

  // Handle step back
  const handleStepBack = useCallback(() => {
    if (historyRef.current.length > 0 && currentStepCount > 0) {
      const previousState = historyRef.current.pop();
      if (previousState) {
        restoreMachines(previousState);
        setCurrentStepCount(currentStepCount - 1);
      }
    }
  }, [currentStepCount, restoreMachines]);

  // Wrapper to save history before stepping
  const handleStepWithHistory = useCallback(() => {
    // Save current state before stepping
    const clone = getMachineClones();
    historyRef.current.push(clone);
    
    // Now step forward
    const advanced = handleStep();
    setCurrentStepCount(c => c + 1);
    return advanced;
  }, [handleStep, getMachineClones]);

  // Sync step count with actual view state
  useEffect(() => {
    setCurrentStepCount(viewST.steps);
  }, [viewST.steps]);

  // Keyword shortcuts for arrow keys
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") {
        event.preventDefault();
        if (!isRunning && !(viewST.isHalted && viewMT.isHalted && viewMH.isHalted)) {
          handleStepWithHistory();
        }
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (!isRunning) {
          handleStepBack();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isRunning, viewST.isHalted, viewMT.isHalted, viewMH.isHalted, handleStepWithHistory, handleStepBack]);

  // Execution Interval
  useEffect(() => {
    if (!isRunning) return;

    const timer = window.setInterval(() => {
      const advanced = handleStepWithHistory();
      if (!advanced) {
        setIsRunning(false);
      }
    }, stepDelayMs);

    return () => window.clearInterval(timer);
  }, [isRunning, stepDelayMs, handleStepWithHistory]);

  if (!mounted) {
    return <main className="tm-shell">Loading...</main>;
  }

  return (
    <main className="tm-shell" style={{ 
      marginTop: "10px",
    }}>
      <section>
        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          {EFFICIENCY_EXAMPLES.map((example) => (
            <button
              key={example.id}
              onClick={() => loadExample(example.id)}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                border: selectedExample.id === example.id ? "2px solid var(--color-selection-text)" : "1px solid var(--line)",
                background: selectedExample.id === example.id ? "var(--color-selection-bg)" : "var(--card)",
                color: selectedExample.id === example.id ? "var(--color-selection-text)" : "var(--foreground)",
                cursor: "pointer",
                fontWeight: selectedExample.id === example.id ? 600 : 400,
                fontSize: "0.9rem",
                transition: "all 0.2s",
              }}
            >
              {example.name}
            </button>
          ))}
        </div>

        <div style={{ marginTop: "1.5rem", padding: "1rem", background: "var(--cell-bg)", borderRadius: "8px", border: "1px solid var(--line)" }}>
          <p style={{ margin: "0 0 0.75rem 0", fontWeight: 600, fontSize: "0.95rem" }}>
            {selectedExample.description}
          </p>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--ink-soft)", lineHeight: "1.5" }}>
            <strong>Efficiency comparison:</strong> {selectedExample.explanation}
          </p>
        </div>
      </section>

      <section className="tm-layout">
        <article className="tm-card tm-sim-card">
          <div className="tm-toolbar">
            <div className="tm-toolbar-actions">
              <Button
                text="Reset"
                variant="Outline"
                width={96}
                onClick={handleReset}
                disabled={!parseResultST.spec && !parseResultMT.spec && !parseResultMH.spec}
              />
              <Button
                text="Back"
                variant="Outline"
                width={96}
                onClick={handleStepBack}
                disabled={((!parseResultST.spec && !parseResultMT.spec && !parseResultMH.spec) || currentStepCount === 0)}
              />
              <Button
                text="Step"
                variant="Outline"
                width={96}
                onClick={handleStepWithHistory}
                disabled={(!parseResultST.spec && !parseResultMT.spec && !parseResultMH.spec) || isRunning || (viewST.isHalted && viewMT.isHalted && viewMH.isHalted)}
              />
              <Button
                text={isRunning ? "Pause" : "Run"}
                variant="Primary"
                width={96}
                onClick={() => setIsRunning(!isRunning)}
                disabled={(!parseResultST.spec && !parseResultMT.spec && !parseResultMH.spec) || (viewST.isHalted && viewMT.isHalted && viewMH.isHalted)}
              />
            </div>
            <label>
              Delay
              <input
                type="range"
                min={40}
                max={600}
                step={20}
                value={stepDelayMs}
                onChange={(event) => setStepDelayMs(Number(event.target.value))}
              />
            </label>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem", padding: "0.5rem 0" }}>
            {/* Single-Tape Implementation */}
            <SimulatorStatus title="Single-Tape Implementation" viewState={viewST} isRunning={isRunning} />

            {/* Multi-Tape Implementation */}
            <SimulatorStatus
              title={`Multi-Tape Implementation (${numTapes} Tape${numTapes > 1 ? "s" : ""})`}
              viewState={viewMT}
              isRunning={isRunning}
            />

            {/* Multi-Head Implementation */}
            {selectedExample.multiHeadRules && (
              <SimulatorStatus
                title={`Multi-Head Implementation (${numHeads} Head${numHeads > 1 ? "s" : ""})`}
                viewState={viewMH}
                isRunning={isRunning}
              />
            )}
          </div>
        </article>

        <article className="tm-card tm-editor-card tm-builder-card" style={{ gap: 0, display: "flex", flexDirection: "column" }}>
          <div className="tm-card-head" style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ margin: 0 }}>Configuration</h2>
          </div>

          {/* Tab Buttons */}
          <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem" }}>
            <button
              onClick={() => setSelectedTab("st")}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                border: selectedTab === "st" ? "2px solid var(--color-selection-text)" : "1px solid var(--line)",
                background: selectedTab === "st" ? "var(--color-selection-bg)" : "var(--card)",
                color: selectedTab === "st" ? "var(--color-selection-text)" : "var(--foreground)",
                cursor: "pointer",
                fontWeight: selectedTab === "st" ? 600 : 400,
                fontSize: "0.9rem",
                transition: "all 0.2s",
              }}
            >
              Single-Tape
            </button>
            <button
              onClick={() => setSelectedTab("mt")}
              style={{
                padding: "0.5rem 1rem",
                borderRadius: "6px",
                border: selectedTab === "mt" ? "2px solid var(--color-selection-text)" : "1px solid var(--line)",
                background: selectedTab === "mt" ? "var(--color-selection-bg)" : "var(--card)",
                color: selectedTab === "mt" ? "var(--color-selection-text)" : "var(--foreground)",
                cursor: "pointer",
                fontWeight: selectedTab === "mt" ? 600 : 400,
                fontSize: "0.9rem",
                transition: "all 0.2s",
              }}
            >
              Multi-Tape
            </button>
            {selectedExample.multiHeadRules && (
              <button
                onClick={() => setSelectedTab("mh")}
                style={{
                  padding: "0.5rem 1rem",
                  borderRadius: "6px",
                  border: selectedTab === "mh" ? "2px solid var(--color-selection-text)" : "1px solid var(--line)",
                  background: selectedTab === "mh" ? "var(--color-selection-bg)" : "var(--card)",
                  color: selectedTab === "mh" ? "var(--color-selection-text)" : "var(--foreground)",
                  cursor: "pointer",
                  fontWeight: selectedTab === "mh" ? 600 : 400,
                  fontSize: "0.9rem",
                  transition: "all 0.2s",
                }}
              >
                Multi-Head
              </button>
            )}
          </div>

          {selectedTab === "st" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div className="" style={{
                display:"flex",
              }}>
                <label>
                  <span style={{marginLeft:0}}>Input String</span>
                  <SingleInput
                    holder="e.g., 10101"
                    value={inputString}
                    onChange={(event) => setInputString(event.target.value)}
                  />
                </label>
              </div>
              <label className="tm-rules-label">
                <span style={{ fontWeight: 600 }}>Rules</span>
                <TextArea holder="" height={16} value={stRules} onChange={(event) => setStRules(event.target.value)} wrap={true} />
                {parseResultST.error && <p className="tm-error" style={{ marginTop: "0.5rem" }}>{parseResultST.error}</p>}
              </label>
            </div>
          )}

          {/* Multi-Tape Tab */}
          {selectedTab === "mt" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ background: "var(--cell-bg)", borderRadius: "6px" }}>
                <label>
                  <span>Number of Tapes : </span>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={numTapes}
                    onChange={(event) => setNumTapes(Math.max(1, Number(event.target.value)))}
                    style={{
                      width: "60px",
                      padding: "0.4rem",
                      borderRadius: "4px",
                      border: "1px solid var(--line)",
                      background: "var(--card)",
                      color: "var(--foreground)",
                      fontFamily: "var(--font-mono)",
                    }}
                  />
                </label>
              </div>

              <div className="tm-form-grid">
                <label>
                  Tape 1 Input
                  <SingleInput
                    holder="e.g., 10101"
                    value={inputString}
                    onChange={(event) => setInputString(event.target.value)}
                  />
                </label>
                {numTapes >= 2 && (
                  <label>
                    Tape 2 Input
                    <SingleInput
                      holder="e.g., 0110"
                      value={inputTape2}
                      onChange={(event) => setInputTape2(event.target.value)}
                    />
                  </label>
                )}
              </div>

              <label className="tm-rules-label">
                <span style={{ fontWeight: 600 }}>Rules</span>
                <TextArea holder="" height={14} value={mtRules} onChange={(event) => setMtRules(event.target.value)} wrap={true} />
                {parseResultMT.error && <p className="tm-error" style={{ marginTop: "0.5rem" }}>{parseResultMT.error}</p>}
              </label>
            </div>
          )}

          {/* Multi-Head Tab */}
          {selectedTab === "mh" && selectedExample.multiHeadRules && (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div style={{}}>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ }}>
                    <span>Number of Heads : </span>
                    <input
                      type="number"
                      min="1"
                      max="5"
                      value={numHeads}
                      onChange={(event) => {
                        const newNumHeads = Math.max(1, Number(event.target.value));
                        setNumHeads(newNumHeads);
                        // Adjust positions array length if needed
                        if (newNumHeads < headPositions.length) {
                          setHeadPositions(headPositions.slice(0, newNumHeads));
                        } else if (newNumHeads > headPositions.length) {
                          setHeadPositions([...headPositions, ...Array(newNumHeads - headPositions.length).fill(0)]);
                        }
                      }}
                      style={{
                        width: "60px",
                        padding: "0.4rem",
                        borderRadius: "4px",
                        border: "1px solid var(--line)",
                        background: "var(--card)",
                        color: "var(--foreground)",
                        fontFamily: "var(--font-mono)",
                      }}
                    />
                  </label>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {headPositions.map((pos, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span >Head {idx + 1} Position : </span>
                      <input
                        type="number"
                        value={pos}
                        onChange={(event) => {
                          const newPositions = [...headPositions];
                          newPositions[idx] = Number(event.target.value);
                          setHeadPositions(newPositions);
                        }}
                        style={{
                          width: "70px",
                          padding: "0.4rem",
                          borderRadius: "4px",
                          border: "1px solid var(--line)",
                          background: "var(--card)",
                          color: "var(--foreground)",
                          fontFamily: "var(--font-mono)",
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="tm-form-grid">
                <label>
                  Input String
                  <SingleInput
                    holder="e.g., 1011#0110"
                    value={inputString}
                    onChange={(event) => setInputString(event.target.value)}
                  />
                </label>
              </div>

              <label className="tm-rules-label">
                <span style={{ fontWeight: 600 }}>Rules</span>
                <TextArea holder="" height={16} value={mhRules} onChange={(event) => setMhRules(event.target.value)} wrap={true} />
                {parseResultMH.error && <p className="tm-error" style={{ marginTop: "0.5rem" }}>{parseResultMH.error}</p>}
              </label>
            </div>
          )}
        </article>
      </section>

      <section>

          <AnalysisSection
            viewST={viewST}
            viewMT={viewMT}
            viewMH={viewMH}
            numTapes={numTapes}
            numHeads={numHeads}
            selectedExample={selectedExample}
            isRunning={isRunning}
          />
      </section>
    </main>
  );
}
