import { palette, softPalette } from "./theme";

// ─────────────────────────────────────────────────────────────────────────────
// Energy App Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Core energy calculation & display constants */
export const ENERGY = {
  /** Default power factor for AC loads */
  POWER_FACTOR: 0.9,
  /** Electricity rate per kWh in Pakistani Rupees (avg residential) */
  RATE_PER_KWH: 16.69,
  /** Currency symbol */
  CURRENCY: "Rs.",
  /** Live monitoring refresh interval (ms) */
  REFRESH_INTERVAL_MS: 1000,
  /** Dashboard polling interval (ms) */
  POLLING_INTERVAL_MS: 5000,
  /** Analytics refresh interval (ms) */
  ANALYTICS_INTERVAL_MS: 30000,
  /** Alerts refresh interval (ms) */
  ALERTS_INTERVAL_MS: 10000,
};

/** Safety thresholds for alerts */
export const THRESHOLDS = {
  VOLTAGE_MIN: 200,
  VOLTAGE_MAX: 250,
  VOLTAGE_CRITICAL_MIN: 180,
  VOLTAGE_CRITICAL_MAX: 260,
  CURRENT_MAX: 10,
  CURRENT_CRITICAL: 15,
  TEMP_WARNING: 40,
  TEMP_MAX: 45,
  TEMP_CRITICAL: 50,
  POWER_MAX: 3000,
  POWER_CRITICAL: 4000,
};

/** Alert type styling configuration */
export const ALERT_STYLES = {
  warning: {
    color: palette.voltYellow,
    bgColor: softPalette.yellow,
    icon: "alert-circle-outline" as const,
    label: "Warning",
  },
  danger: {
    color: palette.criticalRed,
    bgColor: softPalette.red,
    icon: "alert-octagon" as const,
    label: "Danger",
  },
  info: {
    color: palette.blue500,
    bgColor: softPalette.blue,
    icon: "information-outline" as const,
    label: "Info",
  },
};

/** Metric card color mappings */
export const METRIC_COLORS = {
  voltage: { color: softPalette.blueIconBg, bg: softPalette.blue, icon: "flash" as const },
  current: { color: softPalette.orangeIconBg, bg: softPalette.orange, icon: "current-ac" as const },
  power: { color: softPalette.greenIconBg, bg: softPalette.green, icon: "lightning-bolt" as const },
  temperature: { color: palette.criticalRed, bg: softPalette.red, icon: "thermometer" as const },
  units: { color: palette.purple, bg: palette.blue50, icon: "meter-electric" as const },
  bill: { color: palette.voltYellowDark, bg: softPalette.yellow, icon: "cash-multiple" as const },
  currentBill: { color: softPalette.blueIconBg, bg: softPalette.blue, icon: "receipt" as const },
};

/** Device icons mapping */
export const DEVICE_ICONS: Record<string, string> = {
  Fan: "fan",
  AC: "air-conditioner",
  Heater: "radiator",
  Iron: "iron",
  Fridge: "fridge-outline",
  TV: "television",
  Washing: "washing-machine",
  Light: "lightbulb-outline",
  Computer: "desktop-tower-monitor",
  Router: "router-wireless",
  Default: "power-plug",
};
