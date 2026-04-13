export type Move = "L" | "R" | "S" | "l" | "r" | "s";

export interface MultiHeadTransition {
  state: string;
  moves: Move[]; // One move per head
  writes: Array<string | undefined>; // One write per head
}

export interface MultiHeadMachineSpec {
  name?: string;
  blank: string;
  heads: number; // Number of heads
  input: string; // Single shared tape input
  startState: string;
  states: string[];
  headStartPositions: number[]; // Starting position for each head
  table: Record<string, Map<string, MultiHeadTransition>>;
}

export interface GraphNode {
  id: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  labels: string[];
}
