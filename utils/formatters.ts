import { ENERGY } from "@/constants/energyConstants";

// ─────────────────────────────────────────────────────────────────────────────
// Display Formatting Utilities
// ─────────────────────────────────────────────────────────────────────────────

/** Format watts with auto kW conversion */
export const formatWatts = (watts: number): string => {
  if (watts >= 1000) return `${(watts / 1000).toFixed(1)}kW`;
  return `${Math.round(watts)}W`;
};

/** Format voltage */
export const formatVoltage = (volts: number): string => `${Math.round(volts)}V`;

/** Format current */
export const formatCurrent = (amps: number): string => `${amps.toFixed(2)}A`;

/** Format temperature */
export const formatTemp = (celsius: number): string => `${celsius.toFixed(1)}°C`;

/** Format energy units (kWh) */
export const formatUnits = (kwh: number): string => `${kwh.toFixed(1)} kWh`;

/** Format currency in Pakistani Rupees */
export const formatCurrency = (amount: number): string =>
  `${ENERGY.CURRENCY} ${amount.toLocaleString("en-PK")}`;

/** Format percentage */
export const formatPercent = (value: number): string => `${Math.round(value)}%`;

/** Format time for chart labels (HH:mm) */
export const formatTime = (date: Date): string =>
  date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false });

/** Format relative timestamp */
export const formatRelativeTime = (timestamp: string): string => {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

/** Format large numbers with commas */
export const formatNumber = (num: number): string => num.toLocaleString("en-PK");
