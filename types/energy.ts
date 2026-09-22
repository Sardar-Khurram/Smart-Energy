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
  currentBill?: number;
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

/** Backend stats payload from /sensors/{device_id}/stats */
export interface SensorStats {
  period: AnalyticsPeriod;
  count: number;
  avg_power: number;
  max_power: number;
  avg_voltage: number;
  avg_current: number;
  max_current: number;
  min_current: number;
  avg_temperature: number;
}

/** Analytics data for a single period unit (day/week/month) */
export interface AnalyticsDay {
  label: string;
  units: number;
}

/** Single metric graph dataset */
export interface MetricGraphData {
  title: string;
  unit: string;
  average: number;
  data: AnalyticsDay[];
  color: string;
  icon: string;
  total?: number;
}

export interface AnalyticsAverages {
  avg_kwh?: number;
  avg_voltage?: number;
  avg_current?: number;
  avg_temperature?: number;
  total_kwh?: number;
}

/** Analytics summary containing 4 metric graphs (Energy, Voltage, Current, Temperature) */
export interface AnalyticsSummary {
  period: AnalyticsPeriod;
  energy: MetricGraphData;
  voltage: MetricGraphData;
  current: MetricGraphData;
  temperature: MetricGraphData;
  stats?: SensorStats;
  averages?: AnalyticsAverages;
}

export interface TipItem {
  text: string;
  category: "alert" | "maintenance" | "energy saving" | string;
}

/** Tariff slab tier for progressive pricing */
export interface TariffSlab {
  min_kwh: number;
  max_kwh: number | null;
  rate: number;
}

/** Server-managed billing tariff configuration from GET /bills/{device_id}/config */
export interface BillingTariffConfig {
  device_id: string;
  rate_per_kwh: number;
  currency: string;
  currency_symbol: string;
  billing_cycle_start_day: number;
  tariff_type: "flat" | "slab" | string;
  slabs: TariffSlab[] | null;
  last_updated?: string;
}

/** Deterministic MTD Billing + End of Cycle forecast from GET /bills/{device_id}/mtd */
export interface MtdBillingData {
  device_id: string;
  billing_period_start: string;
  billing_period_end: string;
  current_date: string;
  elapsed_days: number;
  total_days: number;
  remaining_days: number;
  mtd_units: number;
  avg_daily_units: number;
  mtd_bill: number;
  predicted_units: number;
  predicted_bill: number;
  remaining_estimated_bill: number;
  currency: string;
  currency_symbol: string;
  rate_per_kwh: number;
  tariff_type: "flat" | "slab" | string;
  mtd_bill_note?: string;
  predicted_bill_note?: string;
}

/** Bill prediction data (combines deterministic MTD forecast with user budget and AI tips) */
export interface BillPrediction {
  monthUnits: number; // MTD units consumed so far
  predictedUnits: number; // Projected end-of-cycle units
  predictedBill: number; // Projected end-of-cycle bill
  mtdBill: number; // Actual accrued bill till today
  budget: number; // User's monthly budget target
  status: "Safe" | "Warning" | "Over Budget";
  dailyAverage: number;
  daysRemaining: number;
  elapsedDays?: number;
  totalDays?: number;
  billingPeriodStart?: string;
  billingPeriodEnd?: string;
  remainingEstimatedBill?: number;
  currencySymbol?: string;
  ratePerKwh?: number;
  tariffType?: string;
  mtdBillNote?: string;
  predictedBillNote?: string;
  savingTips: TipItem[];
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

/** AI-generated energy saving tip from backend */
export interface AiTip {
  id: string;
  device_id: string;
  tip_text: string;
  category: string;
  generated_at: string;
}
