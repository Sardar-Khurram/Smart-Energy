import { useQuery } from "@tanstack/react-query";

import protectedFetch from "@/api/ProtectedFetch";
import { ENERGY } from "@/constants/energyConstants";
import { API_URL } from "@/constants/variables";
import type {
  AiTip,
  AnalyticsPeriod,
  AnalyticsSummary,
  BillPrediction,
  DashboardData,
  DeviceUsage,
  LiveDataPoint,
  TipItem,
} from "@/types/energy";
import type { SensorStatus } from "@/types/sensor";
import { formatTime } from "@/utils/formatters";

// ─────────────────────────────────────────────────────────────────────────────
// Debug Helper
// ─────────────────────────────────────────────────────────────────────────────

function debugLog(fn: string, action: string, data?: any) {
  const time = new Date().toLocaleTimeString("en-US", { hour12: false });
  const prefix = `📡 [${fn}] [${time}]`;
  if (data !== undefined) {
    console.log(`${prefix} ${action}`, typeof data === "object" ? JSON.stringify(data, null, 2) : data);
  } else {
    console.log(`${prefix} ${action}`);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Device ID Resolution
// ─────────────────────────────────────────────────────────────────────────────

// Cache the device ID so we don't query /devices on every single polling interval
let cachedDeviceId: string | null = null;

export async function getDefaultDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    debugLog("getDefaultDeviceId", `Using CACHED device ID: "${cachedDeviceId}"`);
    return cachedDeviceId;
  }
  
  debugLog("getDefaultDeviceId", `Cache MISS — calling GET ${API_URL}/devices`);
  const response = await protectedFetch(`${API_URL}/devices`, { method: "GET" });
  const json = await response.json();
  
  if (!response.ok) {
    debugLog("getDefaultDeviceId", `❌ FAILED — API returned error`, json);
    throw new Error(json?.message ?? "Failed to fetch devices list.");
  }
  if (!json.data || json.data.length === 0) {
    debugLog("getDefaultDeviceId", `❌ FAILED — No devices in database. json.data =`, json.data);
    throw new Error("No devices found in the database.");
  }
  
  debugLog("getDefaultDeviceId", `✅ Received ${json.data.length} device(s)`, json.data.map((d: any) => ({ id: d.id, device_id: d.device_id, name: d.device_name })));
  
  const targetDevice = json.data.find((d: any) => d.device_id === "energy") || json.data[0];
  // Some backends expect 'device_id' (e.g. DEV001) in the URL instead of the primary key 'id'
  const newDeviceId = String(targetDevice.device_id || targetDevice.id);
  cachedDeviceId = newDeviceId;
  debugLog("getDefaultDeviceId", `✅ Cached default device ID: "${cachedDeviceId}"`);
  return newDeviceId;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Data
// ─────────────────────────────────────────────────────────────────────────────

export async function getDashboardData(): Promise<DashboardData> {
  const deviceId = await getDefaultDeviceId();
  const endpoint = `${API_URL}/devices/${deviceId}/status`;
  debugLog("getDashboardData", `Calling GET ${endpoint}`);
  
  const response = await protectedFetch(endpoint, { method: "GET" });
  const json = await response.json();

  if (!response.ok) {
    debugLog("getDashboardData", `❌ FAILED`, json);
    throw new Error(json?.message ?? "Failed to get dashboard data.");
  }

  const { device, latest_reading } = json.data;
  debugLog("getDashboardData", `✅ Device status: "${device?.status}", Latest reading:`, {
    voltage: latest_reading?.voltage,
    current: latest_reading?.current,
    power_watt: latest_reading?.power_watt,
    temperature: latest_reading?.temperature,
    recorded_at: latest_reading?.recorded_at,
  });

  let estimatedBill = 0;
  let monthUnits = 0;
  try {
    const billEndpoint = `${API_URL}/bills/${deviceId}/history?limit=1`;
    debugLog("getDashboardData", `Calling GET ${billEndpoint} (for bill estimate)`);
    const billResp = await protectedFetch(billEndpoint, { method: "GET" });
    if (billResp.ok) {
      const billJson = await billResp.json();
      const latestPrediction = billJson.data?.[0];
      if (latestPrediction) {
        const costRaw = latestPrediction.predicted_cost;
        const kwhRaw = latestPrediction.predicted_kwh;
        estimatedBill = typeof costRaw === "number" ? costRaw : parseFloat(costRaw || "0");
        monthUnits = typeof kwhRaw === "number" ? kwhRaw : parseFloat(kwhRaw || "0");
        debugLog("getDashboardData", `✅ Bill prediction received`, { estimatedBill, monthUnits });
      } else {
        debugLog("getDashboardData", `⚠️ Bill prediction history is empty`);
      }
    } else {
      debugLog("getDashboardData", `⚠️ Bill prediction endpoint returned ${billResp.status}`);
    }
  } catch (error) {
    debugLog("getDashboardData", `⚠️ Bill prediction fetch FAILED (non-critical)`, error instanceof Error ? error.message : error);
  }

  const result: DashboardData = {
    voltage: parseFloat(latest_reading?.voltage || "0"),
    current: parseFloat(latest_reading?.current || "0"),
    power: parseFloat(latest_reading?.power_watt || "0"),
    temperature: parseFloat(latest_reading?.temperature || "0"),
    todayUnits: parseFloat(latest_reading?.kwh || "0"),
    monthUnits,
    estimatedBill,
    status: device?.status === "active" ? "online" : "offline",
  };
  debugLog("getDashboardData", `✅ FINAL RESULT →`, result);
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Live Data (API Polling)
// ─────────────────────────────────────────────────────────────────────────────

export async function getLiveData(): Promise<LiveDataPoint> {
  const deviceId = await getDefaultDeviceId();
  const endpoint = `${API_URL}/sensors/${deviceId}/latest`;
  debugLog("getLiveData", `Calling GET ${endpoint}`);
  
  const response = await protectedFetch(endpoint, { method: "GET" });
  const json = await response.json();

  if (!response.ok) {
    debugLog("getLiveData", `❌ FAILED`, json);
    throw new Error(json?.message ?? "Failed to get live data.");
  }

  const reading = json.data;
  debugLog("getLiveData", `✅ Raw API response →`, reading);

  const result: LiveDataPoint = {
    time: formatTime(new Date(reading.recorded_at)),
    voltage: parseFloat(reading.voltage || "0"),
    current: parseFloat(reading.current || "0"),
    power: parseFloat(reading.power_watt || "0"),
    temperature: parseFloat(reading.temperature || "0"),
  };
  debugLog("getLiveData", `✅ Parsed result →`, result);
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────────────────────────────────────────

export async function getAnalytics(
  period: AnalyticsPeriod
): Promise<AnalyticsSummary> {
  const deviceId = await getDefaultDeviceId();
  const endpoint = `${API_URL}/sensors/${deviceId}/stats?period=${period}`;
  debugLog("getAnalytics", `Calling GET ${endpoint}`);
  
  const response = await protectedFetch(endpoint, { method: "GET" });
  const json = await response.json();

  if (!response.ok) {
    debugLog("getAnalytics", `❌ FAILED`, json);
    throw new Error(json?.message ?? "Failed to get analytics.");
  }

  const stats = json.data;
  debugLog("getAnalytics", `✅ Raw stats from API →`, stats);

  const labels =
    period === "daily"
      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
      : period === "weekly"
      ? ["W1", "W2", "W3", "W4"]
      : ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];

  const unitsPerPeriod = stats.avg_power ? (stats.avg_power * 24) / 1000 : 0;
  const data = labels.map((label) => ({
    label,
    units: unitsPerPeriod,
  }));

  const result: AnalyticsSummary = {
    data,
    highest: {
      label: labels[0],
      units: stats.max_power ? (stats.max_power * 24) / 1000 : 0,
    },
    lowest: { label: labels[0], units: 0 },
    average: unitsPerPeriod,
    total: unitsPerPeriod * labels.length,
    changePercent: 0,
  };
  debugLog("getAnalytics", `✅ Computed analytics →`, { period, unitsPerPeriod, total: result.total });
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Bill Prediction
// ─────────────────────────────────────────────────────────────────────────────

export async function getBillPrediction(): Promise<BillPrediction> {
  const deviceId = await getDefaultDeviceId();
  const endpoint = `${API_URL}/bills/${deviceId}/predict`;
  debugLog("getBillPrediction", `Calling POST ${endpoint}`);
  
  const response = await protectedFetch(endpoint, { method: "POST" });
  const json = await response.json();

  if (!response.ok) {
    debugLog("getBillPrediction", `❌ FAILED`, json);
    throw new Error(json?.message ?? "Failed to get bill prediction.");
  }

  const prediction = json.data;
  debugLog("getBillPrediction", `✅ Raw prediction →`, prediction);

  const costRaw = prediction.predicted_cost;
  const predictedBill = typeof costRaw === "number" ? costRaw : parseFloat(costRaw || "0");
  const budget = 5000;

  const kwhRaw = prediction.predicted_kwh;
  const predictedUnits = typeof kwhRaw === "number" ? kwhRaw : parseFloat(kwhRaw || "0");

  let savingTips: TipItem[] = [
    { text: prediction.summary || "No summary available", category: "energy saving" },
  ];

  try {
    // Correct endpoint: /tips/{device_id}/history (NOT /tips/{device_id})
    const tipsEndpoint = `${API_URL}/tips/${deviceId}/history?limit=5`;
    debugLog("getBillPrediction", `Calling GET ${tipsEndpoint} (for saving tips)`);
    const tipsResp = await protectedFetch(tipsEndpoint, { method: "GET" });
    if (tipsResp.ok) {
      const tipsJson = await tipsResp.json();
      if (tipsJson.data && tipsJson.data.length > 0) {
        const fetchedTips = tipsJson.data.map((t: any) => ({
          text: t.tip_text || "",
          category: t.category || "energy saving",
        }));
        savingTips = [
          { text: prediction.summary || "No summary available", category: "energy saving" },
          ...fetchedTips,
        ];
        debugLog("getBillPrediction", `✅ Got ${fetchedTips.length} tips from /tips/${deviceId}/history, combined with summary`, savingTips);
      } else {
        debugLog("getBillPrediction", `⚠️ Tips history is empty for device "${deviceId}"`);
      }
    } else {
      debugLog("getBillPrediction", `⚠️ Tips endpoint returned ${tipsResp.status}`);
    }
  } catch (error) {
    debugLog("getBillPrediction", `⚠️ Tips fetch FAILED (non-critical)`, error instanceof Error ? error.message : error);
  }

  const result: BillPrediction = {
    monthUnits: predictedUnits,
    predictedUnits,
    predictedBill,
    budget,
    status:
      predictedBill > budget
        ? "Over Budget"
        : predictedBill > budget * 0.8
        ? "Warning"
        : "Safe",
    dailyAverage: predictedUnits / 30,
    daysRemaining: 30 - new Date().getDate(),
    savingTips,
  };
  debugLog("getBillPrediction", `✅ FINAL RESULT →`, { predictedBill: result.predictedBill, status: result.status, monthUnits: result.monthUnits });
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Devices
// ─────────────────────────────────────────────────────────────────────────────

export async function getDevices(): Promise<DeviceUsage[]> {
  const endpoint = `${API_URL}/devices`;
  debugLog("getDevices", `Calling GET ${endpoint}`);

  const response = await protectedFetch(endpoint, { method: "GET" });
  const json = await response.json();

  if (!response.ok) {
    debugLog("getDevices", `❌ FAILED`, json);
    throw new Error(json?.message ?? "Failed to get devices.");
  }

  debugLog("getDevices", `✅ Received ${json.data?.length ?? 0} devices`, json.data);

  return json.data.map((device: any) => ({
    id: device.id,
    device: device.device_name,
    power: 0,
    icon: "devices", // Standard fallback icon
    isOn: device.status === "active",
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// AI Tips
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Get the latest AI tip for each device.
 * Backend endpoint: GET /tips/all
 */
export async function getAllTips(): Promise<AiTip[]> {
  const endpoint = `${API_URL}/tips/all`;
  debugLog("getAllTips", `Calling GET ${endpoint}`);

  const response = await protectedFetch(endpoint, { method: "GET" });
  const json = await response.json();

  if (!response.ok) {
    debugLog("getAllTips", `❌ FAILED`, json);
    throw new Error(json?.message ?? "Failed to get tips.");
  }

  debugLog("getAllTips", `✅ Received ${json.data?.length ?? 0} tips`, json.data);
  return json.data || [];
}

/**
 * Get tip history for a specific device.
 * Backend endpoint: GET /tips/{device_id}/history?limit=20
 */
export async function getTipsHistory(limit: number = 20): Promise<AiTip[]> {
  const deviceId = await getDefaultDeviceId();
  const endpoint = `${API_URL}/tips/${deviceId}/history?limit=${limit}`;
  debugLog("getTipsHistory", `Calling GET ${endpoint}`);

  const response = await protectedFetch(endpoint, { method: "GET" });
  const json = await response.json();

  if (!response.ok) {
    debugLog("getTipsHistory", `❌ FAILED`, json);
    throw new Error(json?.message ?? "Failed to get tips history.");
  }

  debugLog("getTipsHistory", `✅ Received ${json.data?.length ?? 0} tips for device "${deviceId}"`, json.data);
  return json.data || [];
}

/**
 * Trigger Gemini AI to generate new tips for the device.
 * Backend endpoint: POST /tips/{device_id}/generate
 */
export async function generateTips(): Promise<AiTip[]> {
  const deviceId = await getDefaultDeviceId();
  const endpoint = `${API_URL}/tips/${deviceId}/generate`;
  debugLog("generateTips", `Calling POST ${endpoint}`);

  const response = await protectedFetch(endpoint, { method: "POST" });
  const json = await response.json();

  if (!response.ok) {
    debugLog("generateTips", `❌ FAILED`, json);
    throw new Error(json?.message ?? "Failed to generate tips.");
  }

  debugLog("generateTips", `✅ Generated ${json.data?.length ?? 0} new tips`, json.data);
  return json.data || [];
}

// ─────────────────────────────────────────────────────────────────────────────
// Sensor Status
// ─────────────────────────────────────────────────────────────────────────────

export async function getSensorStatus(): Promise<SensorStatus> {
  const deviceId = await getDefaultDeviceId();
  const endpoint = `${API_URL}/devices/${deviceId}/status`;
  debugLog("getSensorStatus", `Calling GET ${endpoint}`);
  
  const response = await protectedFetch(endpoint, { method: "GET" });
  const json = await response.json();

  if (!response.ok) {
    debugLog("getSensorStatus", `❌ FAILED`, json);
    throw new Error(json?.message ?? "Failed to get sensor status.");
  }

  const { device, latest_reading } = json.data;
  
  // Use the actual device status from the database instead of timestamp math
  // This matches why the dashboard shows "Connected"
  const isOnline = device?.status === "active";
  const status = isOnline ? "online" : "offline";

  debugLog("getSensorStatus", `✅ Sensor "${deviceId}" → ${status} (last reading: ${latest_reading?.recorded_at})`);

  return {
    acs712: status,
    zmpt: status,
    temp: status,
    wifi: "strong",
    esp32: status === "online" ? "connected" : "disconnected",
    lastUpdated: latest_reading?.recorded_at || new Date().toISOString(),
    uptime: "Unknown",
    ip: "Unknown",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// React Query Hooks
// ─────────────────────────────────────────────────────────────────────────────

export function useGetDashboardData() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardData,
    refetchInterval: ENERGY.POLLING_INTERVAL_MS,
  });
}

export function useGetLiveData() {
  return useQuery({
    queryKey: ["live-data"],
    queryFn: getLiveData,
    refetchInterval: ENERGY.REFRESH_INTERVAL_MS,
  });
}

export function useGetAnalytics(period: AnalyticsPeriod) {
  return useQuery({
    queryKey: ["analytics", period],
    queryFn: () => getAnalytics(period),
  });
}

export function useGetBillPrediction() {
  return useQuery({
    queryKey: ["bill-prediction"],
    queryFn: getBillPrediction,
  });
}

export function useGetDevices() {
  return useQuery({
    queryKey: ["devices"],
    queryFn: getDevices,
  });
}

export function useGetSensorStatus() {
  return useQuery({
    queryKey: ["sensor-status"],
    queryFn: getSensorStatus,
    refetchInterval: ENERGY.POLLING_INTERVAL_MS,
  });
}

export function useGetTips() {
  return useQuery({
    queryKey: ["tips-history"],
    queryFn: () => getTipsHistory(20),
  });
}

export function useGetAllTips() {
  return useQuery({
    queryKey: ["tips-all"],
    queryFn: getAllTips,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Firebase Real-Time Hook
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useState } from "react";
import { onValue, ref } from "firebase/database";
import { database } from "@/lib/firebase";

/**
 * Hook that listens to Firebase Realtime Database for instant sensor updates.
 * This bypasses the API polling delay for a truly seamless experience.
 */
export function useFirebaseLiveData(deviceId: string = "energy") {
  const [data, setData] = useState<LiveDataPoint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const sensorRef = ref(database, deviceId);

    debugLog("🔥 useFirebaseLiveData", `Subscribing to Firebase path: "/${deviceId}"`);
    debugLog("🔥 useFirebaseLiveData", `Database URL: ${database.app.options.databaseURL}`);

    const unsubscribe = onValue(
      sensorRef,
      (snapshot) => {
        const val = snapshot.val();
        if (val) {
          debugLog("🔥 useFirebaseLiveData", `✅ Data received from Firebase →`, val);

          const reading: LiveDataPoint = {
            time: formatTime(new Date()),
            voltage: parseFloat(val.voltage || "0"),
            current: parseFloat(val.current || "0"),
            power: parseFloat(val.power || val.power_watt || "0"),
            temperature: parseFloat(val.temp || val.temperature || "0"),
          };

          debugLog("🔥 useFirebaseLiveData", `✅ Parsed to LiveDataPoint →`, reading);

          setData(reading);
          setIsLoading(false);
          setError(null);
        } else {
          debugLog("🔥 useFirebaseLiveData", `⚠️ snapshot.val() is NULL at path "/${deviceId}". Check Firebase console.`);
          setIsLoading(false);
        }
      },
      (err) => {
        debugLog("🔥 useFirebaseLiveData", `❌ Firebase listener ERROR`, {
          code: (err as any)?.code,
          message: err.message,
        });
        debugLog("🔥 useFirebaseLiveData", `❌ Possible causes:`);
        debugLog("🔥 useFirebaseLiveData", `   • Firebase rules deny read access`);
        debugLog("🔥 useFirebaseLiveData", `   • Wrong databaseURL in config`);
        debugLog("🔥 useFirebaseLiveData", `   • No internet connection`);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => {
      debugLog("🔥 useFirebaseLiveData", `Unsubscribing from "/${deviceId}"`);
      unsubscribe();
    };
  }, [deviceId]);

  return { data, isLoading, isError: !!error, error };
}
