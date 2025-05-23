export type LogLevel = "ERR" | "INF" | "WARN" | "DBG";
export type ServiceStatus =
  | "stopped"
  | "starting"
  | "initializing"
  | "running"
  | "stopping"
  | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  raw: string;
}

export type ServiceEnv = Record<string, string>;

export interface ServiceInfo {
  name: string;
  path: string;
  status: ServiceStatus;
  url?: string;
  logs: LogEntry[];
  env: ServiceEnv;
}

export interface WebSocketEventData {
  statusUpdate: {
    status: ServiceStatus;
    url?: string;
  };
  newLog: {
    log: LogEntry;
  };
}
export type LogType = keyof WebSocketEventData;

export type WebSocketMessage = {
  [K in LogType]: {
    type: K;
    data: WebSocketEventData[K];
    serviceId: string;
  };
}[LogType];

export interface IProcessManager {
  start(): Promise<void>;
  stop(): Promise<void>;
  updateConfig(path: string, env: ServiceEnv): void;
  on(event: 'log' | 'url' | 'statusChange', callback: (data: any) => void): void;
  off(event: 'log' | 'url' | 'statusChange', callback: (data: any) => void): void;
}
