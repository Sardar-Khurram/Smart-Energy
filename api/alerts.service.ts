import { useQuery } from "@tanstack/react-query";

import protectedFetch from "@/api/ProtectedFetch";
import { ENERGY } from "@/constants/energyConstants";
import { API_URL } from "@/constants/variables";
import type { AlertItem } from "@/types/energy";

export async function getAlerts(): Promise<AlertItem[]> {
  console.log(`[getAlerts] Fetching all alerts/tips`);
  const response = await protectedFetch(`${API_URL}/tips/all`, {
    method: "GET",
  });

  const json = await response.json();

  if (response.ok) {
    return (json.data || []).map((tip: any, index: number) => ({
      id: tip.id?.toString() || index.toString(),
      type: tip.category === "alert"
        ? "danger"
        : tip.category === "maintenance"
          ? "warning"
          : "info",
      msg: tip.tip_text,
      timestamp: tip.generated_at,
      read: false,
    }));
  }

  throw new Error(json?.message ?? "Failed to get alerts.");
}

export function useGetAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: getAlerts,
    refetchInterval: ENERGY.ALERTS_INTERVAL_MS,
  });
}
