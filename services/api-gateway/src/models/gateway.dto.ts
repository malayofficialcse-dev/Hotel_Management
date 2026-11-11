export interface ServiceHealthStatus {
  service: string;
  url: string;
  status: "UP" | "DOWN";
  latencyMs?: number;
}

export interface GatewayHealthReport {
  gateway: "UP";
  timestamp: string;
  services: ServiceHealthStatus[];
}

