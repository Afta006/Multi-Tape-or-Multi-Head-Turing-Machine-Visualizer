import { useCallback, useRef, useState, useEffect, useMemo } from "react";
import { TuringMachine } from "@/lib/tm/machine";
import { parseCompactSpec, TMSpecError } from "@/lib/tm/parser";
import { MultiHeadTuringMachine } from "@/lib/mh/machine";
import { parseCompactSpec as parseCompactSpecMH, MHSpecError } from "@/lib/mh/parser";

const VIEW_RADIUS = 8;

export interface MachineViewState {
  currentState: string;
  isHalted: boolean;
  tapes: Array<{ index: number; symbols: string[] }>;
  steps: number;
  headPositions?: number[]; // For multi-head machines
}

const initialViewState: MachineViewState = {
  currentState: "-",
  isHalted: false,
  tapes: [],
  steps: 0,
};

export const useEfficiencyComparison = (
  inputString: string,
  inputTape2: string | undefined,
  stRules: string,
  mtRules: string,
  numTapesMulti: number,
  mhRules?: string,
  numHeadsMulti?: number,
  mhHeadStartPositions?: number[]
) => {
  const [isRunning, setIsRunning] = useState(false);
  const [viewST, setViewST] = useState<MachineViewState>(initialViewState);
  const [viewMT, setViewMT] = useState<MachineViewState>(initialViewState);
  const [viewMH, setViewMH] = useState<MachineViewState>(initialViewState);

  const machineSTRef = useRef<TuringMachine | null>(null);
  const machineMTRef = useRef<TuringMachine | null>(null);
  const machineMHRef = useRef<MultiHeadTuringMachine | null>(null);
  const stepsSTRef = useRef(0);
  const stepsMTRef = useRef(0);
  const stepsMHRef = useRef(0);

  // Parsing Single Tape Specification
  const parseResultST = useMemo(() => {
    try {
      // If there's a second tape input, combine it with '#' for the single-tape machine comparison
      const singleInput = inputTape2 ? `${inputString}#${inputTape2}` : inputString;
      const spec = parseCompactSpec({
        tapes: 1,
        blank: "B",
        startState: "q0",
        inputs: [singleInput],
        rules: stRules,
      });
      return { spec, error: null };
    } catch (err) {
      const message = err instanceof TMSpecError || err instanceof Error ? err.message : "Parser error.";
      return { spec: null, error: message };
    }
  }, [inputString, inputTape2, stRules]);

  // Parsing Multi Tape Specification
  const parseResultMT = useMemo(() => {
    try {
      const inputs: string[] = [];
      
      // Always add first tape (tape 1)
      inputs.push(inputString);
      
      // Add second tape if provided (even if empty)
      if (numTapesMulti >= 2) {
        inputs.push(inputTape2 || "");
      }
      
      // Add third tape for result if using 3+ tapes
      if (numTapesMulti >= 3) {
        inputs.push("");
      }
      
      const spec = parseCompactSpec({
        tapes: numTapesMulti,
        blank: "B",
        startState: "q0",
        inputs,
        rules: mtRules,
      });
      return { spec, error: null };
    } catch (err) {
      const message = err instanceof TMSpecError || err instanceof Error ? err.message : "Parser error.";
      return { spec: null, error: message };
    }
  }, [inputString, inputTape2, mtRules, numTapesMulti]);

  // Parsing Multi Head Specification
  const parseResultMH = useMemo(() => {
    try {
      if (!mhRules) {
        return { spec: null, error: null };
      }

      // Combine inputs with '#' separator if a second input is provided
      const mhInput = inputTape2 ? `${inputString}#${inputTape2}` : inputString;

      const spec = parseCompactSpecMH({
        heads: numHeadsMulti || 1,
        blank: "B",
        startState: "q0",
        input: mhInput,
        headStartPositions: mhHeadStartPositions,
        rules: mhRules,
      });
      return { spec, error: null };
    } catch (err) {
      const message = err instanceof MHSpecError || err instanceof Error ? err.message : "Parser error.";
      return { spec: null, error: message };
    }
  }, [inputString, inputTape2, mhRules, numHeadsMulti, mhHeadStartPositions]);

  const syncViewStateST = useCallback((machine: TuringMachine | null, currentSteps: number) => {
    if (!machine) {
      setViewST(initialViewState);
      return;
    }
    setViewST({
      currentState: machine.state,
      isHalted: machine.isHalted,
      tapes: machine.tapes.map((tape, idx) => ({
        index: idx,
        symbols: tape.readRange(-VIEW_RADIUS, VIEW_RADIUS),
      })),
      steps: currentSteps,
    });
  }, []);

  const syncViewStateMT = useCallback((machine: TuringMachine | null, currentSteps: number) => {
    if (!machine) {
      setViewMT(initialViewState);
      return;
    }
    setViewMT({
      currentState: machine.state,
      isHalted: machine.isHalted,
      tapes: machine.tapes.map((tape, idx) => ({
        index: idx,
        symbols: tape.readRange(-VIEW_RADIUS, VIEW_RADIUS),
      })),
      steps: currentSteps,
    });
  }, []);

  const syncViewStateMH = useCallback((machine: MultiHeadTuringMachine | null, currentSteps: number) => {
    if (!machine) {
      setViewMH(initialViewState);
      return;
    }
    setViewMH({
      currentState: machine.state,
      isHalted: machine.isHalted,
      tapes: [
        {
          index: 0,
          symbols: machine.tape.readRange(-VIEW_RADIUS, VIEW_RADIUS),
        },
      ],
      headPositions: machine.tape.getHeadPositions(),
      steps: currentSteps,
    });
  }, []);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    stepsSTRef.current = 0;
    stepsMTRef.current = 0;
    stepsMHRef.current = 0;

    if (parseResultST.spec) {
      machineSTRef.current = new TuringMachine(parseResultST.spec);
      syncViewStateST(machineSTRef.current, stepsSTRef.current);
    } else {
      machineSTRef.current = null;
      syncViewStateST(null, 0);
    }

    if (parseResultMT.spec) {
      machineMTRef.current = new TuringMachine(parseResultMT.spec);
      syncViewStateMT(machineMTRef.current, stepsMTRef.current);
    } else {
      machineMTRef.current = null;
      syncViewStateMT(null, 0);
    }

    if (parseResultMH.spec) {
      machineMHRef.current = new MultiHeadTuringMachine(parseResultMH.spec);
      syncViewStateMH(machineMHRef.current, stepsMHRef.current);
    } else {
      machineMHRef.current = null;
      syncViewStateMH(null, 0);
    }
  }, [parseResultST.spec, parseResultMT.spec, parseResultMH.spec, syncViewStateST, syncViewStateMT, syncViewStateMH]);

  useEffect(() => {
    handleReset();
  }, [handleReset]);

  const handleStep = useCallback(() => {
    let progressed = false;

    if (machineSTRef.current && !machineSTRef.current.isHalted) {
      if (machineSTRef.current.step()) {
        stepsSTRef.current += 1;
        progressed = true;
      }
      syncViewStateST(machineSTRef.current, stepsSTRef.current);
    }

    if (machineMTRef.current && !machineMTRef.current.isHalted) {
      if (machineMTRef.current.step()) {
        stepsMTRef.current += 1;
        progressed = true;
      }
      syncViewStateMT(machineMTRef.current, stepsMTRef.current);
    }

    if (machineMHRef.current && !machineMHRef.current.isHalted) {
      if (machineMHRef.current.step()) {
        stepsMHRef.current += 1;
        progressed = true;
      }
      syncViewStateMH(machineMHRef.current, stepsMHRef.current);
    }

    return progressed;
  }, [syncViewStateST, syncViewStateMT, syncViewStateMH]);

  const getMachineClones = useCallback(() => {
    return {
      st: machineSTRef.current?.clone() || null,
      mt: machineMTRef.current?.clone() || null,
      mh: machineMHRef.current?.clone() || null,
      stSteps: stepsSTRef.current,
      mtSteps: stepsMTRef.current,
      mhSteps: stepsMHRef.current,
    };
  }, []);

  const restoreMachines = useCallback((clones: ReturnType<typeof getMachineClones>) => {
    machineSTRef.current = clones.st;
    machineMTRef.current = clones.mt;
    machineMHRef.current = clones.mh;
    stepsSTRef.current = clones.stSteps;
    stepsMTRef.current = clones.mtSteps;
    stepsMHRef.current = clones.mhSteps;

    if (machineSTRef.current) syncViewStateST(machineSTRef.current, clones.stSteps);
    if (machineMTRef.current) syncViewStateMT(machineMTRef.current, clones.mtSteps);
    if (machineMHRef.current) syncViewStateMH(machineMHRef.current, clones.mhSteps);
  }, [syncViewStateST, syncViewStateMT, syncViewStateMH]);

  return {
    viewST,
    viewMT,
    viewMH,
    isRunning,
    setIsRunning,
    handleReset,
    handleStep,
    parseResultST,
    parseResultMT,
    parseResultMH,
    getMachineClones,
    restoreMachines,
  };
};
