/**
 * Graph Analysis Service
 * Adjacency-list based graph engine for circular flow detection, cycle detection, and connection indexing.
 */

export interface GraphNode {
  id: string;
  label: string;
  type: string; // e.g. 'account' | 'beneficiary' | 'shell_company'
}

export interface GraphEdge {
  target: string;
  amount: number;
  relation: string;
  timestamp?: string;
}

export class AdjacencyListGraph {
  private nodes: Map<string, GraphNode> = new Map();
  private edges: Map<string, GraphEdge[]> = new Map();

  addNode(node: GraphNode): void {
    this.nodes.set(node.id, node);
    if (!this.edges.has(node.id)) {
      this.edges.set(node.id, []);
    }
  }

  addEdge(sourceId: string, edge: GraphEdge): void {
    if (!this.edges.has(sourceId)) {
      this.edges.set(sourceId, []);
    }
    this.edges.get(sourceId)!.push(edge);
  }

  getNeighbors(nodeId: string): GraphEdge[] {
    return this.edges.get(nodeId) || [];
  }

  getNode(nodeId: string): GraphNode | undefined {
    return this.nodes.get(nodeId);
  }

  clear(): void {
    this.nodes.clear();
    this.edges.clear();
  }
}

export class GraphAnalysisService {
  private graph: AdjacencyListGraph = new AdjacencyListGraph();

  getGraph(): AdjacencyListGraph {
    return this.graph;
  }
}

export const graphAnalysisService = new GraphAnalysisService();
