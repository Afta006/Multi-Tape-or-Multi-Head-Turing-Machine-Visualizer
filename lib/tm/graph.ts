import { decodeReadSymbols } from "@/lib/tm/parser";
import { type GraphEdge, type GraphNode, type MachineSpec } from "@/lib/tm/types";

export function deriveGraph(spec: MachineSpec): {
  nodes: GraphNode[];
  edges: GraphEdge[];
} {
  const nodes: GraphNode[] = spec.states.map((id) => ({ id }));
  const buckets = new Map<string, GraphEdge>();

  for (const state of spec.states) {
    const transitions = spec.table[state];
    for (const [readKey, action] of transitions.entries()) {
      const target = action.state;
      const bucketKey = `${state}->${target}`;
      const label = makeEdgeLabel(decodeReadSymbols(readKey), action.moves, action.writes);

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

function makeEdgeLabel(reads: string[], moves: string[], writes: Array<string | undefined>): string {
  const readPart = reads.length === 1 ? visibleSpace(reads[0]) : `${reads.map(visibleSpace).join("")}`;

  const writeOut = writes.map((symbol) => (symbol === undefined ? "B" : visibleSpace(symbol)));
  const writePart = writes.length === 1 ? writeOut[0] : `${writeOut.join("")}`;
  const movePart = moves.length === 1 ? moves[0] : `${moves.join("")}`;

  return `${readPart}→${writePart},${movePart}`;
}

function visibleSpace(symbol: string): string {
  if (symbol === " ") {
    return "B";
  }
  return symbol;
}
