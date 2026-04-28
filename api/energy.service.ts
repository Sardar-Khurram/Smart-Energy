import { useQuery } from "@tanstack/react-query";

import { ENERGY } from "@/constants/energyConstants";
import type {
  AnalyticsPeriod,
  AnalyticsSummary,
  BillPrediction,
  DashboardData,
  DeviceUsage,
  LiveDataPoint,
} from "@/types/energy";
import type { SensorStatus } from "@/types/sensor";
import { calculatePower } from "@/utils/calculations";
import { formatTime } from "@/utils/formatters";

// ─────────────────────────────────────────────────────────────────────────────
// Mock Data Generators (replace with real ESP32 API calls later)
// ─────────────────────────────────────────────────────────────────────────────

function mockDashboard(): DashboardData {
  const voltage = 220 + Math.random() * 20;
  const current = 2 + Math.random() * 1.5;
  const power = calculatePower(voltage, current);
  return {
    voltage: Math.round(voltage),
    current: Number(current.toFixed(2)),
    power,
    temperature: Number((28 + Math.random() * 8).toFixed(1)),
    todayUnits: Number((4 + Math.random() * 3).toFixed(1)),
    monthUnits: Math.round(120 + Math.random() * 40),
    estimatedBill: Math.round(2000 + Math.random() * 1500),
    status: "online",
  };
}

function mockLiveData(): LiveDataPoint {
  const voltage = 220 + Math.random() * 20;
  const current = 2 + Math.random() * 1.5;
  return {
    time: formatTime(new Date()),
    voltage: Math.round(voltage),
    current: Number(current.toFixed(2)),
    power: calculatePower(voltage, current),
    temperature: Number((28 + Math.random() * 8).toFixed(1)),
  };
}

const DAILY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const WEEKLY_LABELS = ["W1", "W2", "W3", "W4"];
const MONTHLY_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

function mockAnalytics(period: AnalyticsPeriod): AnalyticsSummary {
  const labels = period === "daily" ? DAILY_LABELS : period === "weekly" ? WEEKLY_LABELS : MONTHLY_LABELS;
  const data = labels.map((label) => ({
    label,
    units: Number((3 + Math.random() * 5).toFixed(1)),
  }));
  const units = data.map((d) => d.units);
  const highest = data.reduce((a, b) => (a.units > b.units ? a : b));
  const lowest = data.reduce((a, b) => (a.units < b.units ? a : b));
  const total = units.reduce((a, b) => a + b, 0);

  return {
    data,
    highest: { label: highest.label, units: highest.units },
    lowest: { label: lowest.label, units: lowest.units },
    average: Number((total / data.length).toFixed(1)),
    total: Number(total.toFixed(1)),
    changePercent: Number((-5 + Math.random() * 15).toFixed(1)),
  };
}

function mockBill(): BillPrediction {
  const monthUnits = Math.round(120 + Math.random() * 40);
  const predictedUnits = Math.round(monthUnits * 2);
  const predictedBill = Math.round(predictedUnits * ENERGY.RATE_PER_KWH);
  const budget = 5000;
  return {
    monthUnits,
    predictedUnits,
    predictedBill,
    budget,
    status: predictedBill > budget ? "Over Budget" : predictedBill > budget * 0.8 ? "Warning" : "Safe",
    dailyAverage: Number((monthUnits / 15).toFixed(1)),
    daysRemaining: 30 - new Date().getDate(),
    savingTips: [
      "Switch off standby appliances to save ~10%",
      "Use LED bulbs instead of incandescent ones",
      "Run heavy loads during off-peak hours (11PM-7AM)",
      "Set AC to 24°C instead of lower temperatures",
    ],
  };
}

function mockDevices(): DeviceUsage[] {
  return [
    { id: "1", device: "AC", power: 1500, icon: "air-conditioner", isOn: true },
    { id: "2", device: "Iron", power: 1000, icon: "iron", isOn: true },
    { id: "3", device: "Fridge", power: 150, icon: "fridge-outline", isOn: true },
    { id: "4", device: "Fan", power: 70, icon: "fan", isOn: true },
    { id: "5", device: "TV", power: 120, icon: "television", isOn: false },
    { id: "6", device: "Light", power: 40, icon: "lightbulb-outline", isOn: true },
    { id: "7", device: "Router", power: 12, icon: "router-wireless", isOn: true },
    { id: "8", device: "Heater", power: 2000, icon: "radiator", isOn: false },
  ];
}

function mockSensors(): SensorStatus {
  return {
    acs712: "online",
    zmpt: "online",
    temp: "online",
    wifi: "strong",
    esp32: "connected",
    lastUpdated: new Date().toISOString(),
    uptime: "3d 14h 22m",
    ip: "192.168.1.100",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// React Query Hooks
// ─────────────────────────────────────────────────────────────────────────────

export function useGetDashboardData() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: async () => mockDashboard(),
    refetchInterval: ENERGY.POLLING_INTERVAL_MS,
  });
}

export function useGetLiveData() {
  return useQuery({
    queryKey: ["live-data"],
    queryFn: async () => mockLiveData(),
    refetchInterval: ENERGY.REFRESH_INTERVAL_MS,
  });
}

export function useGetAnalytics(period: AnalyticsPeriod) {
  return useQuery({
    queryKey: ["analytics", period],
    queryFn: async () => mockAnalytics(period),
  });
}

export function useGetBillPrediction() {
  return useQuery({
    queryKey: ["bill-prediction"],
    queryFn: async () => mockBill(),
  });
}

export function useGetDevices() {
  return useQuery({
    queryKey: ["devices"],
    queryFn: async () => mockDevices(),
  });
}

export function useGetSensorStatus() {
  return useQuery({
    queryKey: ["sensor-status"],
    queryFn: async () => mockSensors(),
    refetchInterval: ENERGY.POLLING_INTERVAL_MS,
  });
}
