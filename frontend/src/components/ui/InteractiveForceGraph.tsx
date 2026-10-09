import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Target,
  Building2,
  Users,
  CreditCard,
  AlertTriangle
} from 'lucide-react';
import { GraphNode, GraphEdge, RiskFinding } from '../../types';

interface Position {
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: string;
}

interface InteractiveForceGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  riskFindingMap?: Map<string, RiskFinding>;
}

export const InteractiveForceGraph: React.FC<InteractiveForceGraphProps> = ({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  riskFindingMap,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Viewport dimensions
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 800,
    height: 540,
  });

  // Pan & Zoom state
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Node Dragging state
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  // Hover state for tooltips
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Simulated Node Positions Map
  const [positions, setPositions] = useState<Map<string, Position>>(new Map());

  // Handle Resize
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const { clientWidth } = containerRef.current;
        setDimensions({
          width: clientWidth || 800,
          height: 540,
        });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Compute connected nodes & edges set for selected node highlighting
  const connectedNodeIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const set = new Set<string>();
    set.add(selectedNodeId);
    edges.forEach((e) => {
      if (e.source === selectedNodeId) set.add(e.target);
      if (e.target === selectedNodeId) set.add(e.source);
    });
    return set;
  }, [selectedNodeId, edges]);

  const connectedEdgeIds = useMemo(() => {
    if (!selectedNodeId) return new Set<string>();
    const set = new Set<string>();
    edges.forEach((e) => {
      if (e.source === selectedNodeId || e.target === selectedNodeId) {
        set.add(e.id);
      }
    });
    return set;
  }, [selectedNodeId, edges]);

  // Force simulation solver with position persistence
  const runForceSimulation = useCallback(
    (initialNodes: GraphNode[], currentEdges: GraphEdge[], width: number, height: number, existingPos: Map<string, Position>) => {
      if (initialNodes.length === 0) return new Map<string, Position>();

      const posMap = new Map<string, Position>();

      // Categorize nodes for deterministic lane distribution
      const beneficiaries = initialNodes.filter((n) => n.type === 'beneficiary');
      const accounts = initialNodes.filter((n) => n.type === 'payout_account');
      const disbursements = initialNodes.filter((n) => n.type === 'disbursement');

      const placeLane = (laneNodes: GraphNode[], targetX: number) => {
        const count = laneNodes.length;
        laneNodes.forEach((node, i) => {
          // If position already exists, preserve it!
          const existing = existingPos.get(node.id);
          if (existing) {
            posMap.set(node.id, { ...existing, type: node.type });
            return;
          }

          const stepY = height / (count + 1);
          let hash = 0;
          for (let charIdx = 0; charIdx < node.id.length; charIdx++) {
            hash = (hash << 5) - hash + node.id.charCodeAt(charIdx);
            hash |= 0;
          }
          const jitterX = Math.sin(hash) * 35;
          const jitterY = Math.cos(hash) * 25;

          posMap.set(node.id, {
            x: targetX + jitterX,
            y: stepY * (i + 1) + jitterY,
            vx: 0,
            vy: 0,
            type: node.type,
          });
        });
      };

      placeLane(beneficiaries, width * 0.22);
      placeLane(accounts, width * 0.50);
      placeLane(disbursements, width * 0.78);

      // Remaining nodes
      initialNodes.forEach((n) => {
        if (!posMap.has(n.id)) {
          const existing = existingPos.get(n.id);
          if (existing) {
            posMap.set(n.id, { ...existing, type: n.type });
          } else {
            posMap.set(n.id, {
              x: width * 0.5 + (Math.random() - 0.5) * 120,
              y: height * 0.5 + (Math.random() - 0.5) * 120,
              vx: 0,
              vy: 0,
              type: n.type,
            });
          }
        }
      });

      // Simulation physics parameters
      const iterations = existingPos.size > 0 ? 50 : 140; // Fewer iterations if updating existing layout
      const kRepulsion = 14000;
      const springLength = 110;
      const springK = 0.045;
      const minDistance = 58;

      for (let iter = 0; iter < iterations; iter++) {
        const posArray = Array.from(posMap.entries());

        // 1. Pairwise Repulsion & Collision Prevention
        for (let i = 0; i < posArray.length; i++) {
          const [, p1] = posArray[i];
          for (let j = i + 1; j < posArray.length; j++) {
            const [, p2] = posArray[j];
            let dx = p2.x - p1.x;
            let dy = p2.y - p1.y;
            let dist = Math.sqrt(dx * dx + dy * dy) || 1;

            if (dist < 1) {
              dx = (Math.random() - 0.5) * 2;
              dy = (Math.random() - 0.5) * 2;
              dist = 1;
            }

            const repForce = kRepulsion / (dist * dist);
            let fx = (dx / dist) * repForce;
            let fy = (dy / dist) * repForce;

            // Collision resolution push
            if (dist < minDistance) {
              const overlapForce = (minDistance - dist) * 0.4;
              fx += (dx / dist) * overlapForce;
              fy += (dy / dist) * overlapForce;
            }

            p1.vx -= fx;
            p1.vy -= fy;
            p2.vx += fx;
            p2.vy += fy;
          }
        }

        // 2. Spring Attraction along Edges
        currentEdges.forEach((edge) => {
          const p1 = posMap.get(edge.source);
          const p2 = posMap.get(edge.target);
          if (p1 && p2) {
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = (dist - springLength) * springK;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            p1.vx += fx;
            p1.vy += fy;
            p2.vx -= fx;
            p2.vy -= fy;
          }
        });

        // 3. Lane Preference Gravity & Center Attraction
        const centerX = width * 0.5;
        const centerY = height * 0.5;

        posMap.forEach((p) => {
          p.vx += (centerX - p.x) * 0.007;
          p.vy += (centerY - p.y) * 0.007;

          let targetX = centerX;
          if (p.type === 'beneficiary') targetX = width * 0.22;
          if (p.type === 'payout_account') targetX = width * 0.50;
          if (p.type === 'disbursement') targetX = width * 0.78;

          p.vx += (targetX - p.x) * 0.012;

          p.vx *= 0.78;
          p.vy *= 0.78;
          p.x += p.vx;
          p.y += p.vy;

          const margin = 45;
          p.x = Math.max(margin, Math.min(width - margin, p.x));
          p.y = Math.max(margin, Math.min(height - margin, p.y));
        });
      }

      return posMap;
    },
    []
  );

  // Recalculate layout when nodes/edges change, preserving existing coordinates
  useEffect(() => {
    if (nodes.length > 0) {
      setPositions((prevPos) => {
        const newPosMap = runForceSimulation(nodes, edges, dimensions.width, dimensions.height, prevPos);

        // Auto fit on initial load
        if (prevPos.size === 0 && newPosMap.size > 0) {
          let minX = Infinity,
            maxX = -Infinity,
            minY = Infinity,
            maxY = -Infinity;
          newPosMap.forEach((p) => {
            minX = Math.min(minX, p.x);
            maxX = Math.max(maxX, p.x);
            minY = Math.min(minY, p.y);
            maxY = Math.max(maxY, p.y);
          });

          const graphW = maxX - minX || 1;
          const graphH = maxY - minY || 1;
          const padding = 70;
          const scaleX = (dimensions.width - padding * 2) / graphW;
          const scaleY = (dimensions.height - padding * 2) / graphH;
          const initialZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.55), 1.25);
          const midX = (minX + maxX) / 2;
          const midY = (minY + maxY) / 2;

          setZoom(initialZoom);
          setPan({
            x: dimensions.width / 2 - midX * initialZoom,
            y: dimensions.height / 2 - midY * initialZoom,
          });
        }

        return newPosMap;
      });
    } else {
      setPositions(new Map());
    }
  }, [nodes, edges, dimensions, runForceSimulation]);

  // Fit graph to view controls
  const handleFitView = useCallback(() => {
    if (positions.size === 0) return;
    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;
    positions.forEach((p) => {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    });

    const graphW = maxX - minX || 1;
    const graphH = maxY - minY || 1;
    const padding = 80;
    const scaleX = (dimensions.width - padding * 2) / graphW;
    const scaleY = (dimensions.height - padding * 2) / graphH;
    const fittedZoom = Math.min(Math.max(Math.min(scaleX, scaleY), 0.45), 1.4);
    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    setZoom(fittedZoom);
    setPan({
      x: dimensions.width / 2 - midX * fittedZoom,
      y: dimensions.height / 2 - midY * fittedZoom,
    });
  }, [positions, dimensions]);

  // Reset layout
  const handleReset = useCallback(() => {
    const freshPos = runForceSimulation(nodes, edges, dimensions.width, dimensions.height, new Map());
    setPositions(freshPos);
    handleFitView();
  }, [nodes, edges, dimensions, runForceSimulation, handleFitView]);

  // Focus on selected node
  const handleFocusSelected = useCallback(() => {
    if (!selectedNodeId) return;
    const target = positions.get(selectedNodeId);
    if (!target) return;
    const targetZoom = 1.35;
    setZoom(targetZoom);
    setPan({
      x: dimensions.width / 2 - target.x * targetZoom,
      y: dimensions.height / 2 - target.y * targetZoom,
    });
  }, [selectedNodeId, positions, dimensions]);

  // Auto-focus when selectedNodeId changes via search or clicking
  useEffect(() => {
    if (selectedNodeId && positions.has(selectedNodeId)) {
      handleFocusSelected();
    }
  }, [selectedNodeId, positions, handleFocusSelected]);

  // Handle Zoom In / Out
  const handleZoomIn = () => setZoom((z) => Math.min(z * 1.25, 3.2));
  const handleZoomOut = () => setZoom((z) => Math.max(z / 1.25, 0.35));

  // Pointer-centered wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
    setZoom((prevZoom) => {
      const newZoom = Math.min(Math.max(prevZoom * zoomFactor, 0.35), 3.2);
      const scaleRatio = newZoom / prevZoom;
      setPan((prevPan) => ({
        x: mouseX - (mouseX - prevPan.x) * scaleRatio,
        y: mouseY - (mouseY - prevPan.y) * scaleRatio,
      }));
      return newZoom;
    });
  };

  // Canvas Mouse Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (draggedNodeId) return;
    setIsPanning(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNodeId) {
      const rect = svgRef.current?.getBoundingClientRect();
      if (rect) {
        const mouseX = (e.clientX - rect.left - pan.x) / zoom;
        const mouseY = (e.clientY - rect.top - pan.y) / zoom;
        setPositions((prev) => {
          const next = new Map(prev);
          const p = next.get(draggedNodeId);
          if (p) {
            next.set(draggedNodeId, { ...p, x: mouseX, y: mouseY });
          }
          return next;
        });
      }
      return;
    }

    if (isPanning) {
      setPan({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }

    // Tooltip position tracking
    if (hoveredNodeId && svgRef.current) {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setTooltipPos({
          x: e.clientX - rect.left + 15,
          y: e.clientY - rect.top - 15,
        });
      }
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    setDraggedNodeId(null);
  };

  return (
    <div ref={containerRef} className="relative w-full h-[540px] bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800/80 overflow-hidden select-none">
      {/* Dynamic Grid Background Pattern */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.06] dark:opacity-[0.12]"
        style={{
          backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
          backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
          backgroundPosition: `${pan.x}px ${pan.y}px`,
        }}
      />

      {/* Floating Interactive Controls Toolbar */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 shadow-md">
        <button
          onClick={handleZoomIn}
          title="Zoom In"
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Zoom Out"
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-slate-200 dark:bg-slate-800 my-auto" />

        <button
          onClick={handleFitView}
          title="Fit Graph to View"
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition flex items-center gap-1 text-xs font-medium"
        >
          <Maximize2 className="w-4 h-4" />
          <span className="hidden sm:inline">Fit</span>
        </button>

        <button
          onClick={handleFocusSelected}
          disabled={!selectedNodeId}
          title="Focus Selected Node"
          className={`p-1.5 rounded transition flex items-center gap-1 text-xs font-medium ${
            selectedNodeId
              ? 'hover:bg-blue-50 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-400'
              : 'text-slate-400 dark:text-slate-600 cursor-not-allowed'
          }`}
        >
          <Target className="w-4 h-4" />
          <span className="hidden sm:inline">Focus</span>
        </button>

        <button
          onClick={handleReset}
          title="Reset Layout"
          className="p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Swimlane Headers Overlay */}
      <div className="absolute top-3 left-4 z-10 pointer-events-none flex items-center gap-6 text-[11px] font-mono text-slate-600 dark:text-slate-400 bg-white/80 dark:bg-slate-900/80 backdrop-blur px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800">
        <span className="flex items-center gap-1 text-cyan-600 dark:text-cyan-400 font-semibold">
          <Users className="w-3.5 h-3.5" /> Beneficiaries
        </span>
        <span className="text-slate-300 dark:text-slate-700">|</span>
        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
          <Building2 className="w-3.5 h-3.5" /> Payout Accounts
        </span>
        <span className="text-slate-300 dark:text-slate-700">|</span>
        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
          <CreditCard className="w-3.5 h-3.5" /> Disbursements
        </span>
      </div>

      {/* Main SVG Canvas */}
      <svg
        ref={svgRef}
        className={`w-full h-full cursor-${isPanning ? 'grabbing' : 'grab'}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {/* Render Edges */}
          {edges.map((edge) => {
            const srcPos = positions.get(edge.source);
            const tgtPos = positions.get(edge.target);
            if (!srcPos || !tgtPos) return null;

            const isConnectedToSelected = connectedEdgeIds.has(edge.id);
            const isShared = edge.relation.startsWith('SHARED_');

            const isDimmed = selectedNodeId && !isConnectedToSelected;

            let strokeColor = '#94a3b8';
            if (isShared) strokeColor = '#eab308';
            if (isConnectedToSelected) strokeColor = isShared ? '#f59e0b' : '#3b82f6';

            return (
              <g key={edge.id} className="transition-all duration-300">
                <line
                  x1={srcPos.x}
                  y1={srcPos.y}
                  x2={tgtPos.x}
                  y2={tgtPos.y}
                  stroke={strokeColor}
                  strokeWidth={isConnectedToSelected ? 2.8 : isShared ? 1.8 : 1.2}
                  strokeDasharray={isShared ? '5,4' : 'none'}
                  opacity={isDimmed ? 0.12 : isConnectedToSelected ? 1 : 0.6}
                />
              </g>
            );
          })}

          {/* Render Nodes */}
          {nodes.map((node) => {
            const pos = positions.get(node.id);
            if (!pos) return null;

            const isSelected = selectedNodeId === node.id;
            const isConnected = connectedNodeIds.has(node.id);
            const isDimmed = selectedNodeId && !isConnected;

            const finding = riskFindingMap?.get(node.id);
            const isHighRiskEntity =
              finding?.riskLevel === 'HIGH' ||
              node.id === 'BEN-3003' ||
              node.id === 'BEN-3004' ||
              node.metadata?.bankAccountNumber === 'ACC-SHARED-99' ||
              node.metadata?.identityHash === 'HASH-CORP-9900';

            const isMediumRiskEntity = finding?.riskLevel === 'MEDIUM';

            let color = '#0284c7'; // beneficiary cyan
            let badgeText = 'BEN';
            if (node.type === 'payout_account') {
              color = '#059669'; // account emerald
              badgeText = 'ACC';
            }
            if (node.type === 'disbursement') {
              color = '#d97706'; // disbursement amber
              badgeText = 'DISB';
            }

            // Compact ID display logic inside/beside node
            const compactText = node.id.length > 10 ? node.id.substring(0, 8) : node.id;

            return (
              <g
                key={node.id}
                transform={`translate(${pos.x}, ${pos.y})`}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectNode(node.id);
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setDraggedNodeId(node.id);
                }}
                onMouseEnter={(e) => {
                  setHoveredNodeId(node.id);
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (rect) {
                    setTooltipPos({
                      x: e.clientX - rect.left + 15,
                      y: e.clientY - rect.top - 15,
                    });
                  }
                }}
                onMouseLeave={() => setHoveredNodeId(null)}
                className={`cursor-pointer transition-opacity duration-300 ${
                  isDimmed ? 'opacity-25' : 'opacity-100'
                }`}
              >
                {/* High Risk Pulsing Aura */}
                {isHighRiskEntity && (
                  <circle
                    r="26"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2"
                    className="animate-ping opacity-35"
                  />
                )}

                {/* Medium Risk Ring */}
                {isMediumRiskEntity && !isHighRiskEntity && (
                  <circle
                    r="24"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2"
                    className="opacity-50"
                  />
                )}

                {/* Selected Node Ring */}
                {isSelected && (
                  <circle
                    r="24"
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeDasharray="4,2"
                    className="animate-spin opacity-80"
                    style={{ animationDuration: '6s' }}
                  />
                )}

                {/* Main Node Circle */}
                <circle
                  r="17"
                  fill="currentColor"
                  stroke={isHighRiskEntity ? '#ef4444' : color}
                  strokeWidth={isSelected ? 3.5 : isHighRiskEntity ? 3 : 2}
                  className="fill-white dark:fill-slate-900 transition-transform hover:scale-110 shadow-lg"
                />

                {/* Node Badge Text */}
                <text
                  textAnchor="middle"
                  dy="4"
                  fill={isHighRiskEntity ? '#ef4444' : color}
                  fontSize="9"
                  fontWeight="bold"
                  fontFamily="monospace"
                  className="select-none pointer-events-none"
                >
                  {badgeText}
                </text>

                {/* Warning Icon for High Risk */}
                {isHighRiskEntity && (
                  <g transform="translate(11, -14)">
                    <circle r="6.5" fill="#ef4444" />
                    <text
                      textAnchor="middle"
                      dy="3.5"
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      !
                    </text>
                  </g>
                )}

                {/* Compact ID Label beside/below node (fades out at low zoom to avoid crowding) */}
                {zoom >= 0.55 && (
                  <text
                    textAnchor="middle"
                    dy="32"
                    fontSize="9.5"
                    fontWeight={isSelected ? 'bold' : 'medium'}
                    fontFamily="sans-serif"
                    className="fill-slate-800 dark:fill-slate-200 select-none pointer-events-none drop-shadow-sm"
                  >
                    {compactText}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredNodeId && (() => {
        const hNode = nodes.find((n) => n.id === hoveredNodeId);
        if (!hNode) return null;

        const isHighRisk =
          hNode.id === 'BEN-3003' ||
          hNode.id === 'BEN-3004' ||
          hNode.metadata?.bankAccountNumber === 'ACC-SHARED-99';

        return (
          <div
            className="absolute z-20 pointer-events-none bg-slate-900/95 dark:bg-slate-900/95 text-white p-3 rounded-lg border border-slate-700 shadow-xl backdrop-blur-md max-w-xs space-y-1.5 text-xs animate-in fade-in zoom-in-95 duration-150"
            style={{
              left: `${Math.min(tooltipPos.x, dimensions.width - 240)}px`,
              top: `${Math.max(10, tooltipPos.y)}px`,
            }}
          >
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
              <span className="font-mono text-[10px] uppercase text-cyan-400 font-bold">{hNode.type}</span>
              <span className="font-mono text-[10px] text-slate-400">{hNode.id}</span>
            </div>
            <div className="font-bold text-sm text-white">{hNode.label}</div>

            {isHighRisk && (
              <div className="flex items-center gap-1.5 text-[10px] text-red-400 font-semibold bg-red-950/60 px-2 py-1 rounded border border-red-800/50">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>High-Risk Syndicate Indicator</span>
              </div>
            )}

            <div className="text-[11px] text-slate-300 space-y-0.5 font-mono pt-1">
              {hNode.metadata.category && <div>Category: {hNode.metadata.category}</div>}
              {hNode.metadata.bankAccountNumber && <div>Account: {hNode.metadata.bankAccountNumber}</div>}
              {hNode.metadata.amount !== undefined && (
                <div className="text-emerald-400 font-semibold">
                  Amount: ₹{Number(hNode.metadata.amount).toLocaleString('en-IN')}
                </div>
              )}
            </div>
            <div className="text-[9px] text-slate-400 italic pt-1 border-t border-slate-800">
              Click node to open full inspection details
            </div>
          </div>
        );
      })()}
    </div>
  );
};
