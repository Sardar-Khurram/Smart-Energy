// ─────────────────────────────────────────────────────────────────────────────
// Energy Data Types
// ─────────────────────────────────────────────────────────────────────────────

/** Raw sensor reading from ESP32 */
export interface SensorReading {
  voltage: number;
  current: number;
  power: number;
  temperature: number;
}

/** Full dashboard data payload */
export interface DashboardData extends SensorReading {
  todayUnits: number;
  monthUnits: number;
  estimatedBill: number;
  status: "online" | "offline";
}

/** Single data point for live monitoring graphs */
export interface LiveDataPoint {
  time: string;
  power: number;
  voltage: number;
  current: number;
  temperature: number;
}

/** Analytics data for a single period unit (day/week/month) */
export interface AnalyticsDay {
  label: string;
  units: number;
}

/** Analytics summary */
export interface AnalyticsSummary {
  data: AnalyticsDay[];
  highest: { label: string; units: number };
  lowest: { label: string; units: number };
  average: number;
  total: number;
  changePercent: number;
}

/** Bill prediction data */
export interface BillPrediction {
  monthUnits: number;
  predictedUnits: number;
  predictedBill: number;
  budget: number;
  status: "Safe" | "Warning" | "Over Budget";
  dailyAverage: number;
  daysRemaining: number;
  savingTips: string[];
}

/** Alert notification */
export interface AlertItem {
  id: string;
  type: "warning" | "danger" | "info";
  msg: string;
  timestamp: string;
  read: boolean;
}

/** Device energy usage */
export interface DeviceUsage {
  id: string;
  device: string;
  power: number;
  icon: string;
  isOn: boolean;
}

/** Analytics period type */
export type AnalyticsPeriod = "daily" | "weekly" | "monthly";
