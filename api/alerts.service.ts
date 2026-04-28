import { useQuery } from "@tanstack/react-query";

import { ENERGY } from "@/constants/energyConstants";
import type { AlertItem } from "@/types/energy";

// ─────────────────────────────────────────────────────────────────────────────
// Mock Alerts Generator
// ─────────────────────────────────────────────────────────────────────────────

function mockAlerts(): AlertItem[] {
  const now = new Date();

  return [
    {
      id: "1",
      type: "danger",
      msg: "High Current Detected: 8.2A",
      timestamp: new Date(now.getTime() - 5 * 60000).toISOString(),
      read: false,
    },
    {
      id: "2",
      type: "warning",
      msg: "Temperature Rising: 42°C",
      timestamp: new Date(now.getTime() - 15 * 60000).toISOString(),
      read: false,
    },
    {
      id: "3",
      type: "info",
      msg: "Voltage Stable at 230V",
      timestamp: new Date(now.getTime() - 30 * 60000).toISOString(),
      read: true,
    },
    {
      id: "4",
      type: "warning",
      msg: "Power Spike: 2.8kW detected",
      timestamp: new Date(now.getTime() - 60 * 60000).toISOString(),
      read: true,
    },
    {
      id: "5",
      type: "danger",
      msg: "Voltage Drop: 195V (Below Safe Range)",
      timestamp: new Date(now.getTime() - 120 * 60000).toISOString(),
      read: true,
    },
    {
      id: "6",
      type: "info",
      msg: "Daily Usage: 5.6 kWh — Below Average",
      timestamp: new Date(now.getTime() - 180 * 60000).toISOString(),
      read: true,
    },
    {
      id: "7",
      type: "warning",
      msg: "Excessive Usage Today: 7.2 kWh",
      timestamp: new Date(now.getTime() - 240 * 60000).toISOString(),
      read: true,
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// React Query Hooks
// ─────────────────────────────────────────────────────────────────────────────

export function useGetAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: async () => mockAlerts(),
    refetchInterval: ENERGY.ALERTS_INTERVAL_MS,
  });
}
