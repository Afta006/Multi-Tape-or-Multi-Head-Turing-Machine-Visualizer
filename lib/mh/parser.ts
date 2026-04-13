import { parse as parseYaml } from "yaml";
import { type MultiHeadMachineSpec, type Move, type MultiHeadTransition } from "@/lib/mh/types";

const KEY_SEPARATOR = "\u0001";

type UnknownRecord = Record<string, unknown>;

export class MHSpecError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "MHSpecError";
  }
}

export function encodeReadSymbols(symbols: string[]): string {
  return symbols.join(KEY_SEPARATOR);
}

export function decodeReadSymbols(key: string): string[] {
  return key.split(KEY_SEPARATOR);
}

export function parseCompactSpec(spec: {
  heads: number;
  blank: string;
  startState: string;
  input: string;
  headStartPositions?: number[];
  rules: string;
}): MultiHeadMachineSpec {
  const heads = spec.heads;
  const blank = spec.blank;
  const startState = spec.startState;
  const input = spec.input;
  const rules = spec.rules;
  const headStartPositions = spec.headStartPositions || Array(heads).fill(0);

  if (heads < 1) {
    throw new MHSpecError("Must have at least 1 head");
  }

  const table: Record<string, Map<string, MultiHeadTransition>> = {};
  const states = new Set<string>();

  states.add(startState);

  // Parse rules line by line
  const lines = rules
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));

  for (const line of lines) {
    const parts = line.split("->");
    if (parts.length !== 2) {
      throw new MHSpecError(`Invalid rule format: ${line}`);
    }

    const leftSide = parts[0]!.trim();
    const rightSide = parts[1]!.trim();

    // Parse left side: state,symbol1,symbol2,... OR state,symbolsCompact
    const leftParts = leftSide.split(",").map((s) => s.trim());
    
    let currentState: string;
    let readSymbols: string[];

    // Detect if compact format (e.g., "q0,aa") or verbose format (e.g., "q0,a,a")
    if (leftParts.length === 2 && leftParts[1]!.length === heads) {
      // Compact format: state,symbolString (where symbolString has length = heads)
      currentState = leftParts[0]!;
      readSymbols = leftParts[1]!.split("");
    } else if (leftParts.length === heads + 1) {
      // Verbose format: state,symbol1,symbol2,...
      currentState = leftParts[0]!;
      readSymbols = leftParts.slice(1);
    } else {
      throw new MHSpecError(
        `Expected ${heads + 1} parts on left side (state + ${heads} symbols), got ${leftParts.length}. ` +
        `Use compact format like "q0,aa" or verbose format like "q0,a,a"`
      );
    }

    // Parse right side: nextState,writes,moves OR nextState,write1,write2,...,move1,move2,...
    const rightParts = rightSide.split(",").map((s) => s.trim());
    
    let nextState: string;
    let writeSymbols: string[];
    let moves: Move[];

    if (rightParts.length === 3 && rightParts[1]!.length === heads && rightParts[2]!.length === heads) {
      // Compact format: state,writeString,moveString
      nextState = rightParts[0]!;
      writeSymbols = rightParts[1]!.split("");
      moves = rightParts[2]!.split("") as Move[];
    } else if (rightParts.length === 1 + heads + heads) {
      // Verbose format: state,write1,write2,...,move1,move2,...
      nextState = rightParts[0]!;
      writeSymbols = rightParts.slice(1, 1 + heads);
      moves = rightParts.slice(1 + heads) as Move[];
    } else {
      throw new MHSpecError(
        `Expected ${1 + heads + heads} parts on right side. ` +
        `Use compact format like "q1,aa,RR" or verbose format like "q1,a,a,R,R"`
      );
    }

    states.add(currentState);
    states.add(nextState);

    // Validate moves
    for (const move of moves) {
      if (!["L", "R", "S", "l", "r", "s"].includes(move)) {
        throw new MHSpecError(`Invalid move: ${move}`);
      }
    }

    const writes = writeSymbols.map((s) => (s === "_" || s === "?" ? undefined : s));

    const transition: MultiHeadTransition = {
      state: nextState,
      writes,
      moves,
    };

    if (!table[currentState]) {
      table[currentState] = new Map();
    }

    const readKey = encodeReadSymbols(readSymbols);
    if (table[currentState]!.has(readKey)) {
      throw new MHSpecError(
        `Duplicate transition in state '${currentState}' for read pattern [${readSymbols.join(",")}]`
      );
    }

    table[currentState]!.set(readKey, transition);
  }

  return {
    blank,
    heads,
    input,
    startState,
    states: Array.from(states),
    headStartPositions,
    table,
  };
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asOptionalString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  return undefined;
}
