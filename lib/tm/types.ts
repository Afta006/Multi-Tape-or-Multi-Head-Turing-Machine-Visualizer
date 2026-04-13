export type Move = "L" | "R" | "S" | "l" | "r" | "s";

export interface Transition {
  state: string;
  moves: Move[];
  writes: Array<string | undefined>;
}

export interface MachineSpec {
  name?: string;
  blank: string;
  tapes: number;
  inputs: string[];
  startState: string;
  states: string[];
  table: Record<string, Map<string, Transition>>;
}

export interface GraphNode {
  id: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  labels: string[];
}
