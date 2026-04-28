// ─────────────────────────────────────────────────────────────────────────────
// Sensor & Hardware Types
// ─────────────────────────────────────────────────────────────────────────────

export type ConnectionStatus = "online" | "offline";
export type WifiStrength = "strong" | "weak" | "disconnected";

/** Individual sensor status */
export interface SensorInfo {
  id: string;
  name: string;
  model: string;
  status: ConnectionStatus;
  lastReading: string;
  description: string;
}

/** Full sensor status payload */
export interface SensorStatus {
  acs712: ConnectionStatus;
  zmpt: ConnectionStatus;
  temp: ConnectionStatus;
  wifi: WifiStrength;
  esp32: "connected" | "disconnected";
  lastUpdated: string;
  uptime: string;
  ip: string;
}

/** ESP32 configuration */
export interface ESP32Config {
  ip: string;
  port: number;
  connected: boolean;
}
