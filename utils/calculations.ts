import { ENERGY } from "@/constants/energyConstants";

// ─────────────────────────────────────────────────────────────────────────────
// Energy Calculation Utilities
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate power from voltage and current
 * Formula: P = V × I × PF
 */
export const calculatePower = (
  voltage: number,
  current: number,
  powerFactor: number = ENERGY.POWER_FACTOR
): number => {
  return Math.round(voltage * current * powerFactor);
};

/**
 * Calculate energy consumption
 * Formula: E (kWh) = P (W) × t (hours) / 1000
 */
export const calculateEnergy = (powerWatts: number, hours: number): number => {
  return Number(((powerWatts * hours) / 1000).toFixed(2));
};

/**
 * Estimate monthly bill
 * Formula: Bill = kWh × Rate
 */
export const estimateBill = (
  kWh: number,
  ratePerKWh: number = ENERGY.RATE_PER_KWH
): number => {
  return Math.round(kWh * ratePerKWh);
};

/**
 * Calculate power factor from real and apparent power
 */
export const calculatePowerFactor = (
  realPower: number,
  voltage: number,
  current: number
): number => {
  const apparentPower = voltage * current;
  if (apparentPower === 0) return 0;
  return Number((realPower / apparentPower).toFixed(2));
};

/**
 * Get percentage of value relative to max
 */
export const getPercentage = (value: number, max: number): number => {
  if (max === 0) return 0;
  return Math.min(Math.round((value / max) * 100), 100);
};
