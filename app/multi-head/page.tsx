"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "@/components/buttons/button";
import SingleInput from "@/components/Inputs/SingleInput/singleInput";
import TextArea from "@/components/Inputs/TextArea/textarea";
import Checkbox from "@/components/check-boxes/check-boxes";
import { multiHeadExamples } from "@/lib/mh/examples";
import { MultiHeadTuringMachine } from "@/lib/mh/machine";
import { parseCompactSpec, MHSpecError } from "@/lib/mh/parser";
import SelectMenu from "@/components/select-menus/select-menu";
import { deriveGraph } from "@/lib/mh/graph";

const VIEW_RADIUS = 8;
const GRAPH_ZOOM_MIN = 0.6;
const GRAPH_ZOOM_MAX = 2.4;
const GRAPH_ZOOM_STEP = 0.2;

const STORAGE_KEYS = {
  selectedExampleId: "mh.builder.selectedExampleId",
  heads: "mh.builder.heads",
  blank: "mh.builder.blank",
  startState: "mh.builder.startState",
  input: "mh.builder.input",
  headPositions: "mh.builder.headPositions",
  rules: "mh.builder.rules",
  stepDelayMs: "mh.stepDelayMs",
  nodePositions: "mh.graph.nodePositions",
} as const;

const DEFAULT_RULES = `# state,h1_read,h2_read -> next_state,h1_write,h2_write,h1_move,h2_move`;

interface MachineViewState {
  currentState: string;
  isHalted: boolean;
  tapeContent: string;
  headPositions: number[];
  displayTape: Array<{ index: number; symbols: string[] }>;
}

interface PositionedNode {
  id: string;
  x: number;
  y: number;
}

interface PositionedEdge {
  from: string;
  to: string;
  labels: string[];
  shape: "loop" | "arc" | "straight";
  path: string;
  labelX: number;
  labelY: number;
}

export default function MultiHeadSimulator() {
  const [selectedExampleId, setSelectedExampleId] = useState(multiHeadExamples[0]?.id ?? "");
  const [headsInput, setHeadsInput] = useState(String(multiHeadExamples[0]?.heads ?? 2));
  const [startState, setStartState] = useState(multiHeadExamples[0]?.startState ?? "q0");
  const [blankSymbol, setBlankSymbol] = useState(multiHeadExamples[0]?.blank ?? "_");
  const [tapeInput, setTapeInput] = useState(multiHeadExamples[0]?.input ?? "");
  const [headPositions, setHeadPositions] = useState<number[]>(Array(multiHeadExamples[0]?.heads ?? 2).fill(0));
  const [rulesSource, setRulesSource] = useState(multiHeadExamples[0]?.rules ?? DEFAULT_RULES);
  const [isRunning, setIsRunning] = useState(false);
  const [stepDelayMs, setStepDelayMs] = useState(180);
  const [graphZoom, setGraphZoom] = useState(1);
  const [activeEdgeKey, setActiveEdgeKey] = useState<string | null>(null);
  const [storageReady, setStorageReady] = useState(false);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const edgeFlashTimeoutRef = useRef<number | null>(null);
  const [isGraphFullscreen, setIsGraphFullscreen] = useState(false);
  const [customNodePositions, setCustomNodePositions] = useState<Record<string, { x: number; y: number }>>({});
  const [layoutSeed, setLayoutSeed] = useState(0);
  const [showAllLabels, setShowAllLabels] = useState(false);
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number } | null>(null);
  const graphPanelRef = useRef<HTMLDivElement | null>(null);
  const graphViewportRef = useRef<HTMLDivElement | null>(null);
  const [viewState, setViewState] = useState<MachineViewState>({
    currentState: "-",
    isHalted: false,
    tapeContent: "",
    headPositions: [],
    displayTape: [],
  });

  const machineRef = useRef<MultiHeadTuringMachine | null>(null);
  const historyRef = useRef<MultiHeadTuringMachine[]>([]);
  const [canGoBack, setCanGoBack] = useState(false);

  const resolvedHeadCount = useMemo(() => {
    const parsed = Number.parseInt(headsInput, 10);
    if (!Number.isInteger(parsed) || parsed < 1) {
      return 1;
    }
    return parsed;
  }, [headsInput]);

  const normalizedHeadPositions = useMemo(() => {
    const normalized = [...headPositions];
    while (normalized.length < resolvedHeadCount) {
      normalized.push(0);
    }
    return normalized.slice(0, resolvedHeadCount);
  }, [headPositions, resolvedHeadCount]);

  const syncViewState = useCallback((machine: MultiHeadTuringMachine | null) => {
    if (!machine) {
      setViewState({
        currentState: "-",
        isHalted: false,
        tapeContent: "",
        headPositions: [],
        displayTape: [{ index: 0, symbols: Array(17).fill("_") }],
      });
      return;
    }

    const { tape: tapeContent, headPositions } = machine.tape.getTapeWithHeads();

    // Window around all head positions
    const WINDOW_SIZE = 17;
    const PADDING = 4;
    
    let centerMin = 0;
    let centerMax = 0;
    if (headPositions.length > 0) {
      centerMin = Math.min(...headPositions);
      centerMax = Math.max(...headPositions);
    }
    
    // Calculate window: center around heads with padding
    const windowWidth = Math.max(WINDOW_SIZE, centerMax - centerMin + 2 * PADDING);
    const windowCenter = (centerMin + centerMax) / 2;
    const startIdx = Math.floor(windowCenter - windowWidth / 2);
    const endIdx = startIdx + windowWidth - 1;
    
    // Build symbols array
    const symbols: string[] = [];
    for (let i = startIdx; i <= endIdx; i++) {
      if (i < 0 || i >= tapeContent.length) {
        symbols.push(blankSymbol);
      } else {
        symbols.push(tapeContent[i] || blankSymbol);
      }
    }
    
    // Adjust head positions to match the windowed view
    const adjustedHeadPositions = headPositions.map(pos => pos - startIdx);

    setViewState({
      currentState: machine.state,
      isHalted: machine.isHalted,
      tapeContent,
      headPositions: adjustedHeadPositions,
      displayTape: [{ index: 0, symbols }],
    });
  }, [blankSymbol]);

  const parseResult = useMemo(() => {
    try {
      const spec = parseCompactSpec({
        heads: resolvedHeadCount,
        blank: blankSymbol,
        startState,
        input: tapeInput,
        headStartPositions: normalizedHeadPositions,
        rules: rulesSource,
      });
      return { spec, error: null as string | null };
    } catch (error) {
      const message = error instanceof MHSpecError || error instanceof Error ? error.message : "Unexpected parser error.";
      return { spec: null, error: message };
    }
  }, [resolvedHeadCount, blankSymbol, startState, tapeInput, normalizedHeadPositions, rulesSource]);

  const graph = useMemo(() => {
    if (!parseResult.spec) {
      return { nodes: [], edges: [] };
    }
    return deriveGraph(parseResult.spec);
  }, [parseResult.spec]);

  const baseSimulatedNodes = useMemo(() => {
    const width = 600;
    const height = 540;

    if (graph.nodes.length === 0) return new Map<string, { x: number; y: number }>();

    const startStateId = parseResult.spec?.startState;

    // Build adjacency list (skip self-loops for BFS)
    const adj = new Map<string, Set<string>>();
    for (const node of graph.nodes) adj.set(node.id, new Set());
    for (const edge of graph.edges) {
      if (edge.from !== edge.to) adj.get(edge.from)?.add(edge.to);
    }

    // BFS from start state to assign layers
    const layer = new Map<string, number>();
    const queue: string[] = [];

    const root = startStateId ?? graph.nodes[0]?.id;
    if (root) {
      layer.set(root, 0);
      queue.push(root);
    }

    while (queue.length > 0) {
      const cur = queue.shift()!;
      for (const neighbor of adj.get(cur) ?? []) {
        if (!layer.has(neighbor)) {
          layer.set(neighbor, layer.get(cur)! + 1);
          queue.push(neighbor);
        }
      }
    }

    // Unreachable nodes go to layer 0
    for (const node of graph.nodes) {
      if (!layer.has(node.id)) layer.set(node.id, 0);
    }

    // Group nodes by layer
    const byLayer = new Map<number, string[]>();
    for (const [id, l] of layer) {
      if (!byLayer.has(l)) byLayer.set(l, []);
      byLayer.get(l)!.push(id);
    }

    // Sort layers by index, sort nodes within layer alphabetically for stability
    for (const nodes of byLayer.values()) nodes.sort();

    const maxLayer = Math.max(...byLayer.keys());
    const numLayers = maxLayer + 1;
    const xPad = 80;
    const yPad = 80;
    const xStep = (width - xPad * 2) / Math.max(1, numLayers - 1);

    const posMap = new Map<string, { x: number; y: number }>();

    for (const [l, nodes] of byLayer) {
      const x = numLayers === 1 ? width / 2 : xPad + l * xStep;
      const yStep = (height - yPad * 2) / Math.max(1, nodes.length - 1);
      nodes.forEach((id, i) => {
        const y = nodes.length === 1 ? height / 2 : yPad + i * yStep;
        posMap.set(id, { x, y });
      });
    }

    return posMap;
  }, [graph, layoutSeed, parseResult.spec?.startState]);

  const graphLayout = useMemo(() => {
    let width = 760;
    let height = 540;
    const nodeRadius = 32;

    if (graph.nodes.length === 0) {
      return {
        width,
        height,
        nodeRadius,
        nodes: [] as PositionedNode[],
        edges: [] as PositionedEdge[],
        minX: 0,
        minY: 0,
      };
    }

    const cx = width / 2;
    const cy = height / 2;

    const nodes = graph.nodes.map((n) => {
      const custom = customNodePositions[n.id];
      const base = baseSimulatedNodes.get(n.id) || { x: cx, y: cy };
      return {
        id: n.id,
        x: custom ? custom.x : base.x,
        y: custom ? custom.y : base.y,
      };
    });

    const staticWidth = 1000;
    const staticHeight = 700;
    const staticMinX = (760 - staticWidth) / 2;
    const staticMinY = (540 - staticHeight) / 2;

    width = staticWidth;
    height = staticHeight;
    let minX = staticMinX;
    let minY = staticMinY;

    const offsetNodes = nodes;
    const byId = new Map(offsetNodes.map((node) => [node.id, node]));
    const byIndex = new Map(offsetNodes.map((node, index) => [node.id, index]));

    const edgeCount = new Map<string, number>();
    const edgeIndex = new Map<string, number>();
    
    for (let i = 0; i < graph.edges.length; i++) {
      const edge = graph.edges[i];
      const sourceIndex = byIndex.get(edge.from);
      const targetIndex = byIndex.get(edge.to);
      if (sourceIndex === undefined || targetIndex === undefined) continue;
      const key = `${sourceIndex},${targetIndex}`;
      const idx = edgeCount.get(key) ?? 0;
      edgeIndex.set(`${i}`, idx);
      edgeCount.set(key, idx + 1);
    }

    const hasEdge = (sourceIndex: number, targetIndex: number): boolean => {
      return (edgeCount.get(`${sourceIndex},${targetIndex}`) ?? 0) > 0;
    };

    const add = (a: [number, number], b: [number, number]): [number, number] => [a[0] + b[0], a[1] + b[1]];
    const sub = (a: [number, number], b: [number, number]): [number, number] => [a[0] - b[0], a[1] - b[1]];
    const mul = (a: [number, number], scalar: number): [number, number] => [a[0] * scalar, a[1] * scalar];
    const norm = (a: [number, number]): number => Math.hypot(a[0], a[1]);
    const unit = (a: [number, number]): [number, number] => {
      const n = Math.max(1, norm(a));
      return [a[0] / n, a[1] / n];
    };

    const edges: PositionedEdge[] = graph.edges
      .map((edge, edgeIdx) => {
        const source = byId.get(edge.from);
        const target = byId.get(edge.to);
        if (!source || !target) return null;

        const sourceIndex = byIndex.get(edge.from);
        const targetIndex = byIndex.get(edge.to);
        if (sourceIndex === undefined || targetIndex === undefined) return null;

        if (edge.from === edge.to) {
          const loopPeakY = source.y - nodeRadius - 44;
          const path = `M ${source.x - 9} ${source.y - nodeRadius + 1} C ${source.x - 30} ${loopPeakY}, ${source.x + 30} ${loopPeakY}, ${source.x + 9} ${source.y - nodeRadius + 1}`;
          return {
            from: edge.from,
            to: edge.to,
            labels: edge.labels,
            shape: "loop",
            path,
            labelX: source.x,
            labelY: loopPeakY - 12,
          };
        }

        const reverseExists = hasEdge(targetIndex, sourceIndex);
        const p1: [number, number] = [source.x, source.y];
        const p2: [number, number] = [target.x, target.y];
        const delta = sub(p2, p1);
        const u = unit(delta);
        const start = add(p1, mul(u, nodeRadius));
        const end = sub(p2, mul(u, nodeRadius));

        if (!reverseExists) {
          return {
            from: edge.from,
            to: edge.to,
            labels: edge.labels,
            shape: "straight",
            path: `M ${start[0]} ${start[1]} L ${end[0]} ${end[1]}`,
            labelX: (start[0] + end[0]) / 2,
            labelY: (start[1] + end[1]) / 2 - 10,
          };
        }

        const normal: [number, number] = [-u[1], u[0]];
        const bendDirection = sourceIndex < targetIndex ? 1 : -1;
        const totalEdgesInDirection = edgeCount.get(`${sourceIndex},${targetIndex}`) ?? 1;
        const currentEdgeIdx = edgeIndex.get(`${edgeIdx}`) ?? 0;
        
        // Offset each edge within the pair to spread them out
        const bendOffset = -60 + (currentEdgeIdx * (120 / Math.max(1, totalEdgesInDirection - 1)));
        const bend = Math.min(120, 0.5 * norm(delta)) + bendOffset;
        
        const mid = mul(add(start, end), 0.5);
        const control = add(mid, mul(normal, bend * bendDirection));
        const labelPos = add(control, mul(normal, 8 * bendDirection));

        return {
          from: edge.from,
          to: edge.to,
          labels: edge.labels,
          shape: "straight",
          path: `M ${start[0]} ${start[1]} L ${end[0]} ${end[1]}`,
          labelX: (start[0] + end[0]) / 2,
          labelY: (start[1] + end[1]) / 2 - 10,
        };
      })
      .filter((edge): edge is PositionedEdge => edge !== null);

    return { width, height, nodeRadius, nodes: offsetNodes, edges, minX, minY };
  }, [graph, customNodePositions, baseSimulatedNodes]);

  useEffect(() => {
    if (!parseResult.spec) {
      machineRef.current = null;
      historyRef.current = [];
      setCanGoBack(false);
      queueMicrotask(() => syncViewState(null));
      return;
    }

    machineRef.current = new MultiHeadTuringMachine(parseResult.spec);
    historyRef.current = [];
    setCanGoBack(false);
    queueMicrotask(() => syncViewState(machineRef.current));
  }, [parseResult.spec, syncViewState]);

  const flashEdge = useCallback((edgeKey: string) => {
    setActiveEdgeKey(edgeKey);
    if (edgeFlashTimeoutRef.current != null) {
      window.clearTimeout(edgeFlashTimeoutRef.current);
    }
    edgeFlashTimeoutRef.current = window.setTimeout(() => {
      setActiveEdgeKey(null);
      edgeFlashTimeoutRef.current = null;
    }, 260);
  }, []);

  const handleStep = useCallback((recordHistory: boolean = true) => {
    const machine = machineRef.current;
    if (!machine || isRunning || machine.isHalted) {
      return;
    }

    if (recordHistory) {
      historyRef.current.push(machine.clone());
      setCanGoBack(true);
    }

    const prevState = machine.state;
    const ok = machine.step();
    if (ok) {
      flashEdge(`${prevState}-${machine.state}`);
    }
    syncViewState(machine);
  }, [flashEdge, isRunning, syncViewState]);

  const handleStepBack = useCallback(() => {
    if (historyRef.current.length === 0 || isRunning) return;

    const prevMachine = historyRef.current.pop();
    if (prevMachine) {
      machineRef.current = prevMachine;
      syncViewState(prevMachine);
      setCanGoBack(historyRef.current.length > 0);
      setActiveEdgeKey(null);
    }
  }, [isRunning, syncViewState]);

  useEffect(() => {
    if (!isRunning) return;

    const timer = window.setInterval(() => {
      const machine = machineRef.current;
      if (!machine || machine.isHalted) {
        setIsRunning(false);
        return;
      }

      historyRef.current.push(machine.clone());
      setCanGoBack(true);

      const prevState = machine.state;
      const ok = machine.step();
      if (ok) {
        flashEdge(`${prevState}-${machine.state}`);
      }
      syncViewState(machine);
      if (!ok) {
        setIsRunning(false);
      }
    }, stepDelayMs);

    return () => {
      window.clearInterval(timer);
    };
  }, [isRunning, stepDelayMs, syncViewState, flashEdge]);

  useEffect(() => {
    return () => {
      if (edgeFlashTimeoutRef.current != null) {
        window.clearTimeout(edgeFlashTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      queueMicrotask(() => setStorageReady(true));
      return;
    }

    const savedExampleId = window.localStorage.getItem(STORAGE_KEYS.selectedExampleId);
    const savedHeads = window.localStorage.getItem(STORAGE_KEYS.heads);
    const savedStart = window.localStorage.getItem(STORAGE_KEYS.startState);
    const savedBlank = window.localStorage.getItem(STORAGE_KEYS.blank);
    const savedInput = window.localStorage.getItem(STORAGE_KEYS.input);
    const savedHeadPositions = window.localStorage.getItem(STORAGE_KEYS.headPositions);
    const savedRules = window.localStorage.getItem(STORAGE_KEYS.rules);
    const savedStepDelay = window.localStorage.getItem(STORAGE_KEYS.stepDelayMs);

    queueMicrotask(() => {
      if (savedExampleId != null) setSelectedExampleId(savedExampleId);
      if (savedHeads != null) setHeadsInput(savedHeads);
      if (savedStart != null) setStartState(savedStart);
      if (savedBlank != null) setBlankSymbol(savedBlank);
      if (savedInput != null) setTapeInput(savedInput);
      if (savedHeadPositions != null) {
        try {
          const parsed = JSON.parse(savedHeadPositions);
          if (Array.isArray(parsed)) {
            setHeadPositions(parsed);
          }
        } catch {
          // ignore parse errors
        }
      }
      if (savedRules != null) setRulesSource(savedRules);
      if (savedStepDelay != null) {
        const parsedDelay = Number(savedStepDelay);
        if (Number.isFinite(parsedDelay)) {
          const clamped = Math.max(40, Math.min(600, parsedDelay));
          setStepDelayMs(clamped);
        }
      }

      setStorageReady(true);
    });
  }, []);

  useEffect(() => {
    if (!storageReady || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.selectedExampleId, selectedExampleId);
  }, [selectedExampleId, storageReady]);

  useEffect(() => {
    if (!storageReady || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.heads, headsInput);
  }, [headsInput, storageReady]);

  useEffect(() => {
    if (!storageReady || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.startState, startState);
  }, [startState, storageReady]);

  useEffect(() => {
    if (!storageReady || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.blank, blankSymbol);
  }, [blankSymbol, storageReady]);

  useEffect(() => {
    if (!storageReady || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.input, tapeInput);
  }, [tapeInput, storageReady]);

  useEffect(() => {
    if (!storageReady || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.headPositions, JSON.stringify(headPositions));
  }, [headPositions, storageReady]);

  useEffect(() => {
    if (!storageReady || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.rules, rulesSource);
  }, [rulesSource, storageReady]);

  useEffect(() => {
    if (!storageReady || typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEYS.stepDelayMs, String(stepDelayMs));
  }, [stepDelayMs, storageReady]);

  useEffect(() => {
    if (!storageReady || typeof window === "undefined") return;
    const savedPositions = window.localStorage.getItem(STORAGE_KEYS.nodePositions);
    if (savedPositions) {
      try {
        const parsed = JSON.parse(savedPositions);
        if (typeof parsed === "object" && parsed !== null) {
          setCustomNodePositions(parsed);
        }
      } catch {}
    }
  }, [storageReady]);

  useEffect(() => {
    if (!storageReady || typeof window === "undefined" || Object.keys(customNodePositions).length === 0) return;
    window.localStorage.setItem(STORAGE_KEYS.nodePositions, JSON.stringify(customNodePositions));
  }, [customNodePositions, storageReady]);

  const handleResetNodePositions = () => {
    setCustomNodePositions({});
    setLayoutSeed((s) => s + 1);
  };

  const handleToggleFullscreen = async () => {
    const panel = graphPanelRef.current;
    if (!panel) return;
    if (document.fullscreenElement === panel) {
      await document.exitFullscreen();
      return;
    }
    await panel.requestFullscreen();
  };

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsGraphFullscreen(document.fullscreenElement === graphPanelRef.current);
    };
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullscreenChange);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key === 'f') {
        event.preventDefault();
        handleToggleFullscreen();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleNodeMouseDown = (nodeId: string, event: React.MouseEvent<SVGCircleElement>) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    
    if (!svgRef.current) return;
    
    const screenCTM = svgRef.current.getScreenCTM();
    if (!screenCTM) return;
    
    const pt = svgRef.current.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const svgP = pt.matrixTransform(screenCTM.inverse());
    if (!svgP) return;
    
    const layoutNode = graphLayout.nodes.find((n) => n.id === nodeId);
    const nodePos = customNodePositions[nodeId] ?? (layoutNode ? { x: layoutNode.x, y: layoutNode.y } : { x: 0, y: 0 });
    
    dragOffsetRef.current = {
      x: svgP.x - nodePos.x,
      y: svgP.y - nodePos.y,
    };
    setDraggedNodeId(nodeId);
  };

  const handleNodeMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    if (!draggedNodeId || !dragOffsetRef.current || !svgRef.current) return;

    const screenCTM = svgRef.current.getScreenCTM();
    if (!screenCTM) return;

    const pt = svgRef.current.createSVGPoint();
    pt.x = event.clientX;
    pt.y = event.clientY;
    const svgP = pt.matrixTransform(screenCTM.inverse());
    if (!svgP) return;

    const offset = dragOffsetRef.current;
    setCustomNodePositions((prev) => ({
      ...prev,
      [draggedNodeId]: {
        x: svgP.x - offset.x,
        y: svgP.y - offset.y,
      },
    }));
  };

  const handleNodeMouseUp = () => {
    setDraggedNodeId(null);
    dragOffsetRef.current = null;
  };

  const handleReset = useCallback(() => {
    if (!parseResult.spec) return;
    historyRef.current = [];
    setCanGoBack(false);
    setIsRunning(false);
    setActiveEdgeKey(null);
    machineRef.current = new MultiHeadTuringMachine(parseResult.spec);
    syncViewState(machineRef.current);
  }, [parseResult.spec, syncViewState]);

  const handleToggleRun = useCallback(() => {
    setIsRunning((value) => !value);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: WindowEventMap["keydown"]) => {
      if (event.code !== "Space" && event.code !== "ArrowRight" && event.code !== "ArrowLeft") {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)
      ) {
        return;
      }

      event.preventDefault();
      if (event.code === "ArrowLeft") {
        handleStepBack();
      } else {
        handleStep(true);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleStep, handleStepBack]);

  const handleSelectExample = (exampleId: string) => {
    setSelectedExampleId(exampleId);
    const example = multiHeadExamples.find((item) => item.id === exampleId);
    if (!example) return;

    setIsRunning(false);
    setActiveEdgeKey(null);
    setHeadsInput(String(example.heads));
    setStartState(example.startState);
    setBlankSymbol(example.blank);
    setTapeInput(example.input);
    setHeadPositions(example.headStartPositions || Array(example.heads).fill(0));
    setRulesSource(example.rules);
  };

  const handleRulesKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== "Tab") return;

    event.preventDefault();
    const textarea = event.currentTarget;
    const { selectionStart, selectionEnd, value } = textarea;
    const indentUnit = "\t";

    const hasSelection = selectionEnd > selectionStart;
    const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;

    if (event.shiftKey) {
      if (!hasSelection) {
        if (value.slice(lineStart, lineStart + indentUnit.length) === indentUnit) {
          const updated = value.slice(0, lineStart) + value.slice(lineStart + indentUnit.length);
          setRulesSource(updated);
          queueMicrotask(() => {
            textarea.selectionStart = Math.max(selectionStart - indentUnit.length, lineStart);
            textarea.selectionEnd = Math.max(selectionEnd - indentUnit.length, lineStart);
          });
        }
        return;
      }

      const block = value.slice(lineStart, selectionEnd);
      const lines = block.split("\n");
      let removed = 0;
      const outdented = lines.map((line) => {
        if (line.startsWith(indentUnit)) {
          removed += indentUnit.length;
          return line.slice(indentUnit.length);
        }
        return line;
      });

      const replaced = outdented.join("\n");
      const updated = value.slice(0, lineStart) + replaced + value.slice(selectionEnd);
      setRulesSource(updated);
      queueMicrotask(() => {
        const firstLineRemoved = lines[0].startsWith(indentUnit) ? indentUnit.length : 0;
        textarea.selectionStart = Math.max(selectionStart - firstLineRemoved, lineStart);
        textarea.selectionEnd = selectionEnd - removed;
      });
      return;
    }

    if (!hasSelection) {
      const updated = value.slice(0, selectionStart) + indentUnit + value.slice(selectionEnd);
      setRulesSource(updated);
      queueMicrotask(() => {
        const next = selectionStart + indentUnit.length;
        textarea.selectionStart = next;
        textarea.selectionEnd = next;
      });
      return;
    }

    const block = value.slice(lineStart, selectionEnd);
    const lines = block.split("\n");
    const indented = lines.map((line) => `${indentUnit}${line}`).join("\n");
    const updated = value.slice(0, lineStart) + indented + value.slice(selectionEnd);
    setRulesSource(updated);
    queueMicrotask(() => {
      textarea.selectionStart = selectionStart + indentUnit.length;
      textarea.selectionEnd = selectionEnd + indentUnit.length * lines.length;
    });
  };

  return (
    <main className="tm-shell">
      <section className="tm-layout">
        <article className="tm-card tm-sim-card">
          <div className="tm-toolbar">
            <div className="tm-toolbar-actions">
              <Button 
                text="Reset" 
                variant="Outline" 
                width={96} 
                onClick={handleReset} 
                disabled={!parseResult.spec} 
              />
              <Button
                variant="Outline"
                width={140}
                text="Reset Graph"
                onClick={handleResetNodePositions}
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
            <div>
              <Checkbox
                label="All Labels"
                checked={showAllLabels}
                onChange={(checked) => setShowAllLabels(checked)}
              />
            </div>
          </div>


          <div className="tm-graph-panel">
            <div
              ref={graphPanelRef}
              className={isGraphFullscreen ? "tm-graph-shell is-fullscreen" : "tm-graph-shell"}
            >
              <div
                ref={graphViewportRef}
                className="tm-graph-viewport"
              >
                <div
                  className="tm-graph-canvas"
                  style={{
                    width: `${graphLayout.width}px`,
                    height: `${graphLayout.height}px`,
                    transform: `scale(${graphZoom})`,
                  }}
                >
                  <svg
                    ref={svgRef}
                    className="tm-graph"
                    viewBox={`${graphLayout.minX ?? 0} ${graphLayout.minY ?? 0} ${graphLayout.width} ${graphLayout.height}`}
                    role="img"
                    aria-label="State diagram"
                    onMouseMove={handleNodeMouseMove}
                    onMouseUp={handleNodeMouseUp}
                    onMouseLeave={handleNodeMouseUp}
                    style={{ cursor: draggedNodeId ? "grabbing" : "grab" }}
                  >
                    <defs>
                      <marker
                        id="mh-arrowhead"
                        markerWidth="14"
                        markerHeight="14"
                        refX="13"
                        refY="4"
                        orient="auto"
                        markerUnits="strokeWidth"
                      >
                        <path d="M0,0 L14,4 L0,8 z" style={{fill: "var(--edge-stroke)"}} />
                      </marker>
                      <marker
                        id="mh-arrowhead-active"
                        markerWidth="14"
                        markerHeight="14"
                        refX="13"
                        refY="4"
                        orient="auto"
                        markerUnits="strokeWidth"
                      >
                        <path d="M0,0 L14,4 L0,8 z" style={{fill: "var(--node-stroke)"}} />
                      </marker>
                    </defs>

                    {graphLayout.nodes.map((node) => (
                      <g key={node.id}>
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={graphLayout.nodeRadius}
                          className={
                            node.id === viewState.currentState ? "tm-graph-node active" : "tm-graph-node"
                          }
                          onMouseDown={(event) => handleNodeMouseDown(node.id, event)}
                          style={{ cursor: draggedNodeId === node.id ? "grabbing" : "grab" }}
                        />
                        <text x={node.x} y={node.y + 4} className="tm-graph-node-label">
                          {node.id}
                        </text>
                      </g>
                    ))}

                    {graphLayout.edges.map((edge) => {
                      const edgeKey = `${edge.from}-${edge.to}`;
                      const isActive = activeEdgeKey === edgeKey;

                      return (
                        <g key={edgeKey}>
                          <path
                            d={edge.path}
                            className={
                              isActive
                                ? `tm-graph-edge ${edge.shape} active`
                                : `tm-graph-edge ${edge.shape}`
                            }
                            markerEnd={isActive ? "url(#mh-arrowhead-active)" : "url(#mh-arrowhead)"}
                          />
                          {(edge.from === viewState.currentState || showAllLabels) && (
                            <text x={edge.labelX} y={edge.labelY} className="tm-graph-edge-label" textAnchor="middle" dominantBaseline="middle">
                              {edge.labels.join(" | ")}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              <div className="tm-tape-stack">
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <div>
                    <span>Current state: <strong>{viewState.currentState}</strong></span>
                    <span>Status: <strong>{viewState.isHalted ? "halted" : isRunning ? "running" : "paused"}</strong></span>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <Button
                      text="Back"
                      variant="Outline"
                      width={96}
                      onClick={handleStepBack}
                      disabled={!canGoBack || isRunning}
                    />
                    <Button
                      text="Step"
                      variant="Outline"
                      width={96}
                      onClick={() => handleStep(true)}
                      disabled={!parseResult.spec || isRunning || viewState.isHalted}
                    />
                    <Button
                      text={isRunning ? "Pause" : "Run"}
                      variant="Primary"
                      width={96}
                      onClick={handleToggleRun}
                      disabled={!parseResult.spec || viewState.isHalted}
                    />
                  </div>
                </div>

                {viewState.displayTape.map((tape) => (
                  <div key={tape.index} className="tm-tape">
                    <p>Tape</p>
                    <div className="tm-cells">
                      {tape.symbols.map((symbol, idx) => {
                        const isHead = viewState.headPositions.includes(idx);
                        const headIndices = viewState.headPositions
                          .map((pos, headIdx) => (pos === idx ? headIdx : -1))
                      .filter((i) => i !== -1);

                    return (
                      <span
                        key={idx}
                        className={isHead ? "tm-cell head" : "tm-cell"}
                        title={isHead ? `Head ${headIndices.map(h => h + 1).join(", ")}` : ""}
                      >
                        {symbol === " " ? "_" : symbol}
                      </span>
                    );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </article>

        <article className="tm-card tm-editor-card tm-builder-card">
          <div className="tm-card-head">
            <h2>Multi-Head Machine</h2>
            <div className="tm-example-selector">
              <SelectMenu
                options={[
                  { value: "__new__", label: "+ New Machine Code" },
                  ...multiHeadExamples.map((example) => ({
                    value: example.id,
                    label: example.title,
                  })),
                ]}
                defaultValue={selectedExampleId}
                onChange={(value) => value === "__new__" ? handleSelectExample("") : handleSelectExample(value)}
                placeholder="Select example"
              />
            </div>
          </div>

          <div className="tm-form-grid">
            <label>
              Heads
              <SingleInput
                holder="Number of heads"
                type="number"
                value={headsInput}
                onChange={(event) => setHeadsInput(event.target.value)}
              />
            </label>

            <label>
              Start State
              <SingleInput holder="start" value={startState} onChange={(event) => setStartState(event.target.value)} />
            </label>

            <label>
              Blank Symbol
              <SingleInput holder="_" value={blankSymbol} onChange={(event) => setBlankSymbol(event.target.value)} />
            </label>
          </div>

          <div className="tm-tape-inputs">
            {Array.from({ length: resolvedHeadCount }, (_, index) => (
              <label key={index}>
                Head {index + 1} Position
                <SingleInput
                  holder="-1 for last"
                  type="number"
                  value={normalizedHeadPositions[index] ?? 0}
                  onChange={(event) => {
                    const next = [...normalizedHeadPositions];
                    next[index] = Number.parseInt(event.target.value, 10) || 0;
                    setHeadPositions(next);
                  }}
                />
              </label>
            ))}
          </div>

          <label>
            Tape Input
            <SingleInput holder="" value={tapeInput} onChange={(event) => setTapeInput(event.target.value)} />
          </label>

          <label className="tm-rules-label">
            Production Rules
            <p className="tm-rule-note">Compact format: state,symbols → next,writes,moves</p>
            <TextArea
              holder=""
              height={10}
              value={rulesSource}
              onChange={(event) => setRulesSource(event.target.value)}
              onKeyDown={handleRulesKeyDown}
              wrap={true}
            />
          </label>

          {parseResult.error && <p className="tm-error">{parseResult.error}</p>}
        </article>
      </section>
    </main>
  );
}
