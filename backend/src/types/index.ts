export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  timestamp: string;
  uptime: number;
  environment: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: unknown;
  };
}

export interface AdjacencyListGraph {
  nodes: Map<string, { id: string; label: string; type: string }>;
  edges: Map<string, Array<{ target: string; weight: number; relation: string }>>;
}
