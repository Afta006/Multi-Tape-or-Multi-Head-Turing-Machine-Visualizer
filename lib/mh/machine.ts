import { decodeReadSymbols, encodeReadSymbols } from "@/lib/mh/parser";
import { MultiHeadTape } from "@/lib/mh/tape";
import { type MultiHeadMachineSpec, type Move, type MultiHeadTransition } from "@/lib/mh/types";

export class MultiHeadTuringMachine {
  private readonly spec: MultiHeadMachineSpec;
  readonly tape: MultiHeadTape;
  state: string;

  constructor(spec: MultiHeadMachineSpec, state?: string, tape?: MultiHeadTape) {
    this.spec = spec;
    this.state = state ?? spec.startState;
    this.tape = tape ?? new MultiHeadTape(spec.blank, spec.input, spec.heads, spec.headStartPositions);
  }

  clone(): MultiHeadTuringMachine {
    return new MultiHeadTuringMachine(this.spec, this.state, this.tape.clone());
  }

  get isHalted(): boolean {
    return this.nextTransition() === null;
  }

  readAllHeads(): string[] {
    return this.tape.readAllHeads();
  }

  step(): boolean {
    const transition = this.nextTransition();
    if (!transition) {
      return false;
    }

    // Apply writes and moves for each head
    for (let i = 0; i < this.spec.heads; i++) {
      const write = transition.writes[i];
      const move = transition.moves[i];

      if (write !== undefined) {
        this.tape.writeHead(i, write);
      }

      applyMove(this.tape, i, move);
    }

    this.state = transition.state;
    return true;
  }

  private nextTransition(): MultiHeadTransition | null {
    const transitions = this.spec.table[this.state];
    if (!transitions || transitions.size === 0) {
      return null;
    }

    const symbols = this.readAllHeads();
    const exact = transitions.get(encodeReadSymbols(symbols));
    if (exact) {
      return exact;
    }

    // Try pattern matching with wildcards
    for (const [key, transition] of transitions.entries()) {
      const pattern = decodeReadSymbols(key);
      if (matchPattern(pattern, symbols)) {
        return transition;
      }
    }

    return null;
  }
}

function matchPattern(pattern: string[], symbols: string[]): boolean {
  for (let i = 0; i < Math.max(pattern.length, symbols.length); i += 1) {
    const p = pattern[i] ?? "*";
    const s = symbols[i] ?? "";
    if (p !== "*" && p !== s) {
      return false;
    }
  }
  return true;
}

function applyMove(tape: MultiHeadTape, headIndex: number, move: Move): void {
  if (move === "L" || move === "l") {
    tape.moveHeadLeft(headIndex);
    return;
  }
  if (move === "R" || move === "r") {
    tape.moveHeadRight(headIndex);
    return;
  }
  // S or s = stay
}
