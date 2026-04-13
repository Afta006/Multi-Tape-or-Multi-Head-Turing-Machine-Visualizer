import { parse as parseYaml } from "yaml";
import { type MachineSpec, type Move, type Transition } from "@/lib/tm/types";

const KEY_SEPARATOR = "\u0001";

type UnknownRecord = Record<string, unknown>;

export class TMSpecError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TMSpecError";
  }
}

export function encodeReadSymbols(symbols: string[]): string {
  return symbols.join(KEY_SEPARATOR);
}

export function decodeReadSymbols(key: string): string[] {
  return key.split(KEY_SEPARATOR);
}

export function parseSpec(sourceCode: string): MachineSpec {
  let root: unknown;

  try {
    root = parseYaml(sourceCode);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid YAML";
    throw new TMSpecError(message);
  }

  if (!isRecord(root)) {
    throw new TMSpecError("Machine specification must be a YAML mapping.");
  }

  const tapes = parseTapeCount(root.tapes);
  const blank = parseBlank(root.blank);
  const startState = parseStartState(root["start state"] ?? root.startState);
  const inputs = parseInputs(root.input, tapes);
  const rawTable = parseTableObject(root.table);
  const states = Object.keys(rawTable);

  if (!states.includes(startState)) {
    throw new TMSpecError("The start state must be declared in the transition table.");
  }

  const parsedTable: Record<string, Map<string, Transition>> = {};

  for (const state of states) {
    const stateTransitions = rawTable[state];
    const bucket = new Map<string, Transition>();

    if (stateTransitions == null) {
      parsedTable[state] = bucket;
      continue;
    }

    if (!isRecord(stateTransitions)) {
      throw new TMSpecError(`State '${state}' must map symbols to instructions.`);
    }

    for (const [readKey, actionValue] of Object.entries(stateTransitions)) {
      const readPatterns = expandReadKey(readKey, tapes);
      const parsed = parseInstruction(actionValue, tapes);
      const transition: Transition = {
        state: parsed.state ?? state,
        moves: parsed.moves,
        writes: parsed.writes,
      };

      if (!states.includes(transition.state)) {
        throw new TMSpecError(
          `Transition from state '${state}' points to undeclared state '${transition.state}'.`,
        );
      }

      for (const pattern of readPatterns) {
        const code = encodeReadSymbols(pattern);
        if (bucket.has(code)) {
          throw new TMSpecError(
            `Duplicate transition in state '${state}' for read pattern [${pattern.join(",")}]`,
          );
        }
        bucket.set(code, transition);
      }
    }

    parsedTable[state] = bucket;
  }

  return {
    name: asOptionalString(root.name),
    blank,
    tapes,
    inputs,
    startState,
    states,
    table: parsedTable,
  };
}

export interface CompactSpecInput {
  tapes: number;
  blank: string;
  startState: string;
  inputs: string[];
  rules: string;
}

export function parseCompactSpec(input: CompactSpecInput): MachineSpec {
  const tapes = parseTapeCount(input.tapes);
  const blank = normalizeBlankPlaceholder(input.blank);
  const startState = parseStartState(input.startState);
  const inputs = parseInputs(input.inputs, tapes);

  const stateSet = new Set<string>([startState]);
  const table: Record<string, Map<string, Transition>> = {
    [startState]: new Map<string, Transition>(),
  };

  const lines = input.rules.split(/\r?\n/);

  lines.forEach((rawLine, index) => {
    const lineNo = index + 1;
    const line = rawLine.trim();
    if (!line || line.startsWith("#") || line.startsWith("//")) {
      return;
    }

    const parsedLine = parseCompactRuleLine(line, lineNo, tapes, blank);
    stateSet.add(parsedLine.state);
    stateSet.add(parsedLine.nextState);

    if (!table[parsedLine.state]) {
      table[parsedLine.state] = new Map<string, Transition>();
    }
    if (!table[parsedLine.nextState]) {
      table[parsedLine.nextState] = new Map<string, Transition>();
    }

    const readKey = encodeReadSymbols(parsedLine.reads);
    const bucket = table[parsedLine.state];
    if (bucket.has(readKey)) {
      throw new TMSpecError(
        `Line ${lineNo}: duplicate transition for state '${parsedLine.state}' and read '${parsedLine.readRaw}'.`,
      );
    }

    bucket.set(readKey, {
      state: parsedLine.nextState,
      writes: parsedLine.writes,
      moves: parsedLine.moves,
    });
  });

  if (Object.values(table).every((stateTransitions) => stateTransitions.size === 0)) {
    throw new TMSpecError("Production rules are required.");
  }

  const states = [...stateSet];

  return {
    blank,
    tapes,
    startState,
    inputs,
    states,
    table,
  };
}

function parseTapeCount(value: unknown): number {
  if (value == null) {
    return 1;
  }
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new TMSpecError("'tapes' must be a positive integer.");
  }
  return parsed;
}

function parseBlank(value: unknown): string {
  if (value == null) {
    throw new TMSpecError("Missing required field: blank.");
  }
  const blank = String(value);
  if ([...blank].length !== 1) {
    throw new TMSpecError("'blank' must be exactly one character.");
  }
  return blank;
}

function parseStartState(value: unknown): string {
  if (value == null) {
    throw new TMSpecError("Missing required field: start state.");
  }
  return String(value);
}

function parseInputs(value: unknown, tapes: number): string[] {
  if (value == null) {
    return Array.from({ length: tapes }, () => "");
  }

  if (Array.isArray(value)) {
    const list = value.map((item) => (item == null ? "" : String(item)));
    while (list.length < tapes) {
      list.push("");
    }
    return list.slice(0, tapes);
  }

  const list = [String(value)];
  while (list.length < tapes) {
    list.push("");
  }
  return list;
}

function parseTableObject(value: unknown): UnknownRecord {
  if (!isRecord(value)) {
    throw new TMSpecError("Missing or invalid transition table.");
  }
  return value;
}

function parseInstruction(
  value: unknown,
  tapes: number,
): { state?: string; moves: Move[]; writes: Array<string | undefined> } {
  if (typeof value === "string") {
    const dir = parseDirection(value);
    if (!dir) {
      throw new TMSpecError(
        `Unrecognized string instruction '${value}'. Use L, R, S, or object form.`,
      );
    }
    return {
      moves: Array.from({ length: tapes }, () => dir),
      writes: Array.from({ length: tapes }, () => undefined),
    };
  }

  if (!isRecord(value)) {
    throw new TMSpecError("Instruction must be a string or mapping.");
  }

  if (Array.isArray(value.move)) {
    return parseExplicitMultiTapeInstruction(value, tapes);
  }

  return parseShorthandInstruction(value, tapes);
}

function parseExplicitMultiTapeInstruction(
  obj: UnknownRecord,
  tapes: number,
): { state?: string; moves: Move[]; writes: Array<string | undefined> } {
  if (!Array.isArray(obj.move)) {
    throw new TMSpecError("Multi-tape instruction requires 'move' to be an array.");
  }

  const moves = obj.move.map((entry) => {
    const parsed = parseDirection(String(entry ?? "S"));
    if (!parsed) {
      throw new TMSpecError("Moves must use L, R, or S.");
    }
    return parsed;
  });

  while (moves.length < tapes) {
    moves.push("S");
  }

  let writes: Array<string | undefined> = Array.from({ length: tapes }, () => undefined);
  if ("write" in obj) {
    if (!Array.isArray(obj.write)) {
      throw new TMSpecError("Multi-tape write must be an array.");
    }
    writes = obj.write.map((item) => {
      if (item == null) {
        return undefined;
      }
      return parseWriteSymbol(item);
    });
    while (writes.length < tapes) {
      writes.push(undefined);
    }
  }

  return {
    state: asOptionalString(obj.state),
    moves: moves.slice(0, tapes),
    writes: writes.slice(0, tapes),
  };
}

function parseShorthandInstruction(
  obj: UnknownRecord,
  tapes: number,
): { state?: string; moves: Move[]; writes: Array<string | undefined> } {
  const directionFields: Move[] = ["L", "R", "S"].filter((key) => key in obj) as Move[];
  if (directionFields.length > 1) {
    throw new TMSpecError("Instruction contains conflicting movement keys.");
  }

  const moveFromKey = directionFields[0];
  const moveFromProp = "move" in obj ? parseDirection(String(obj.move)) : undefined;
  const move = moveFromProp ?? moveFromKey;

  if (!move) {
    throw new TMSpecError("Instruction must define one movement direction.");
  }

  const writes: Array<string | undefined> = Array.from({ length: tapes }, () => undefined);
  if ("write" in obj) {
    if (Array.isArray(obj.write)) {
      obj.write.slice(0, tapes).forEach((entry, idx) => {
        if (entry == null) {
          writes[idx] = undefined;
          return;
        }
        writes[idx] = parseWriteSymbol(entry);
      });
    } else {
      writes[0] = parseWriteSymbol(obj.write);
    }
  }

  const state =
    asOptionalString(obj.state) ??
    (moveFromKey ? asOptionalString(obj[moveFromKey]) : undefined);

  return {
    state,
    moves: Array.from({ length: tapes }, () => move),
    writes,
  };
}

function parseWriteSymbol(value: unknown): string {
  const symbol = String(value);
  if ([...symbol].length !== 1) {
    throw new TMSpecError(`Write symbol '${symbol}' must be exactly one character.`);
  }
  return symbol;
}

function parseDirection(value: string): Move | undefined {
  if (value === "L" || value === "R" || value === "S") {
    return value;
  }
  return undefined;
}

function parseCompactRuleLine(
  line: string,
  lineNo: number,
  tapes: number,
  blank: string,
): {
  state: string;
  nextState: string;
  readRaw: string;
  reads: string[];
  writes: string[];
  moves: Move[];
} {
  const arrowParts = line.split("->");
  if (arrowParts.length !== 2) {
    throw new TMSpecError(`Line ${lineNo}: expected exactly one '->'.`);
  }

  const lhs = arrowParts[0].trim();
  const rhs = arrowParts[1].trim();
  if (!lhs || !rhs) {
    throw new TMSpecError(`Line ${lineNo}: incomplete production rule.`);
  }

  const lhsTokens = lhs
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  if (lhsTokens.length !== 2) {
    throw new TMSpecError(
      `Line ${lineNo}: left side must be '<state>,<read>'.`,
    );
  }

  const [state, readRaw] = lhsTokens;
  const reads = parseSymbolSequence(readRaw, tapes, blank, true, lineNo, "read symbols");

  const rhsTokens = rhs
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  if (rhsTokens.length !== 2 && rhsTokens.length !== 3) {
    throw new TMSpecError(
      `Line ${lineNo}: right side must be '<next state>,<write>,<moves>'.`,
    );
  }

  if (rhsTokens.length !== 3) {
    throw new TMSpecError(
      `Line ${lineNo}: right side must be '<next state>,<write>,<moves>'.`,
    );
  }

  const [nextState, writeRaw, moveRaw] = rhsTokens;

  const writes = parseSymbolSequence(writeRaw, tapes, blank, false, lineNo, "write symbols");
  const moves = parseMoves(moveRaw, tapes, lineNo);

  return {
    state,
    nextState,
    readRaw,
    reads,
    writes,
    moves,
  };
}

function parseSymbolSequence(
  raw: string,
  tapes: number,
  blank: string,
  allowWildcard: boolean,
  lineNo: number,
  label: string,
): string[] {
  const symbols = [...raw];
  if (symbols.length !== tapes) {
    throw new TMSpecError(
      `Line ${lineNo}: ${label} '${raw}' must have exactly ${tapes} character(s).`,
    );
  }

  return symbols.map((symbol) => {
    if (symbol === "_") {
      return blank;
    }
    if (allowWildcard && symbol === "*") {
      return "*";
    }
    return symbol;
  });
}

function parseMoves(raw: string, tapes: number, lineNo: number): Move[] {
  const symbols = [...raw];
  if (symbols.length !== tapes) {
    throw new TMSpecError(
      `Line ${lineNo}: moves '${raw}' must have exactly ${tapes} character(s).`,
    );
  }

  return symbols.map((symbol) => {
    const upper = symbol.toUpperCase();
    const parsed = parseDirection(upper);
    if (!parsed) {
      throw new TMSpecError(
        `Line ${lineNo}: move '${symbol}' is invalid. Use L, R, or S.`,
      );
    }
    return parsed;
  });
}

function normalizeBlankPlaceholder(blank: string): string {
  const parsedBlank = parseBlank(blank);
  if (parsedBlank === "_") {
    return " ";
  }
  return parsedBlank;
}

function expandReadKey(readKey: string, tapes: number): string[][] {
  if (tapes === 1) {
    return splitSingleTapeSymbols(readKey).map((symbol) => [symbol]);
  }

  if (readKey.trim().startsWith("[")) {
    const matches = readKey.match(/\[[^\]]*\]/g);
    if (!matches || matches.length === 0) {
      throw new TMSpecError(`Invalid multi-tape read pattern '${readKey}'.`);
    }
    return matches.map((match) => parseBracketSymbols(match.slice(1, -1), tapes));
  }

  return splitSingleTapeSymbols(readKey).map((symbol) => {
    const out = [symbol];
    while (out.length < tapes) {
      out.push("*");
    }
    return out;
  });
}

function splitSingleTapeSymbols(input: string): string[] {
  const raw = input.split(",");
  const out: string[] = [];
  for (const item of raw) {
    if (item === "" && out[out.length - 1] === "") {
      out[out.length - 1] = ",";
    } else {
      out.push(item);
    }
  }
  return out.map((symbol) => {
    if (symbol.length !== 1) {
      throw new TMSpecError(`Read symbol '${symbol}' must be exactly one character.`);
    }
    return symbol;
  });
}

function parseBracketSymbols(input: string, tapes: number): string[] {
  const out: string[] = [];
  let i = 0;

  while (i < input.length && out.length < tapes) {
    if (input[i] === ",") {
      i += 1;
      continue;
    }
    out.push(input[i]);
    i += 1;
  }

  if (out.length > tapes) {
    throw new TMSpecError("Read pattern references more tapes than declared.");
  }

  const normalized: string[] = [];
  for (const symbol of out) {
    if (symbol.length !== 1) {
      throw new TMSpecError(`Read symbol '${symbol}' must be exactly one character.`);
    }
    normalized.push(symbol);
  }

  while (normalized.length < tapes) {
    normalized.push("*");
  }

  return normalized;
}

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asOptionalString(value: unknown): string | undefined {
  return value == null ? undefined : String(value);
}
