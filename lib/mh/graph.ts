import { decodeReadSymbols } from "@/lib/mh/parser";
import { type GraphEdge, type GraphNode, type MultiHeadMachineSpec } from "@/lib/mh/types";

export function deriveGraph(spec: MultiHeadMachineSpec): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const nodes: GraphNode[] = spec.states.map((id) => ({ id }));
  const buckets = new Map<string, GraphEdge>();

  for (const state of spec.states) {
    const transitions = spec.table[state];
    if (!transitions) continue;
    
    for (const [readKey, action] of transitions.entries()) {
      const target = action.state;
      const bucketKey = `${state}->${target}`;
      const label = makeEdgeLabel(decodeReadSymbols(readKey), action.moves, action.writes, spec.heads);

      const existing = buckets.get(bucketKey);
      if (existing) {
        existing.labels.push(label);
      } else {
        buckets.set(bucketKey, {
          from: state,
          to: target,
          labels: [label],
        });
      }
    }
  }

  return {
    nodes,
    edges: [...buckets.values()],
  };
}

function makeEdgeLabel(reads: string[], moves: string[], writes: Array<string | undefined>, heads: number): string {
  // Compact format for multi-head: reads/writes,moves
  // Show all symbols together without commas for readability
  const readPart = reads.map(visibleSpace).join("");
  const writeOut = writes.map((symbol) => (symbol === undefined ? "_" : visibleSpace(symbol)));
  const writePart = writeOut.join("");
  const movePart = moves.map(m => m.toUpperCase()).join("");

  return `${readPart}→${writePart},${movePart}`;
}

function visibleSpace(symbol: string): string {
  if (symbol === " " || symbol === "") {
    return "B";
  }
  return symbol;
}
