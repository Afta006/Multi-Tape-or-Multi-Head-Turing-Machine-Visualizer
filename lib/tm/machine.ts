import { decodeReadSymbols, encodeReadSymbols } from "@/lib/tm/parser";
import { Tape } from "@/lib/tm/tape";
import { type MachineSpec, type Move, type Transition } from "@/lib/tm/types";

export class TuringMachine {
  private readonly spec: MachineSpec;
  readonly tapes: Tape[];
  state: string;

  constructor(spec: MachineSpec, state?: string, tapes?: Tape[]) {
    this.spec = spec;
    this.state = state ?? spec.startState;
    this.tapes = tapes ?? spec.inputs.map((input) => new Tape(spec.blank, input));
  }

  clone(): TuringMachine {
    return new TuringMachine(this.spec, this.state, this.tapes.map(t => t.clone()));
  }

  get isHalted(): boolean {
    return this.nextTransition() === null;
  }

  readAllTapes(): string[] {
    return this.tapes.map((tape) => tape.read());
  }

  step(): boolean {
    const transition = this.nextTransition();
    if (!transition) {
      return false;
    }

    this.tapes.forEach((tape, idx) => {
      const write = transition.writes[idx];
      const move = transition.moves[idx];

      if (write !== undefined) {
        tape.write(write);
      }
      applyMove(tape, move);
    });

    this.state = transition.state;
    return true;
  }

  private nextTransition(): Transition | null {
    const transitions = this.spec.table[this.state];
    if (!transitions || transitions.size === 0) {
      return null;
    }

    const symbols = this.readAllTapes();
    const exact = transitions.get(encodeReadSymbols(symbols));
    if (exact) {
      return exact;
    }

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

function applyMove(tape: Tape, move: Move): void {
  if (move === "L" || move === "l") {
    tape.headLeft();
    return;
  }
  if (move === "R" || move === "r") {
    tape.headRight();
    return;
  }
}
