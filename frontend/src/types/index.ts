export interface HealthStatus {
  status: 'ok' | 'degraded' | 'error';
  service: string;
  timestamp: string;
  uptime: number;
  environment: string;
}

export interface NavigationItem {
  id: string;
  name: string;
  iconName: string;
  badge?: string;
}
