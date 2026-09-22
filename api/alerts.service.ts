import { useQuery } from "@tanstack/react-query";

import protectedFetch from "@/api/ProtectedFetch";
import { ENERGY } from "@/constants/energyConstants";
import { API_URL } from "@/constants/variables";
import type { AlertItem } from "@/types/energy";

export async function getAlerts(): Promise<AlertItem[]> {
  try {
    const response = await protectedFetch(`${API_URL}/tips/all`, {
      method: "GET",
    });

    if (response.ok) {
      const json = await response.json();
      if (Array.isArray(json?.data) && json.data.length > 0) {
        return json.data.map((tip: any, index: number) => {
          const cat = (tip.category || "").toLowerCase();
          const type = cat.includes("alert") || cat.includes("danger")
            ? ("danger" as const)
            : cat.includes("maintenance") || cat.includes("warning")
              ? ("warning" as const)
              : ("info" as const);

          return {
            id: tip.id?.toString() || index.toString(),
            type,
            msg: tip.tip_text,
            timestamp: tip.generated_at || new Date().toISOString(),
            read: false,
          };
        });
      }
    }
  } catch (error) {
    console.warn("getAlerts API error, using safe fallback", error);
  }

  // Return empty array when server has no alerts or is unreachable
  return [];
}

export function useGetAlerts() {
  return useQuery({
    queryKey: ["alerts"],
    queryFn: getAlerts,
    refetchInterval: ENERGY.ALERTS_INTERVAL_MS,
  });
}
