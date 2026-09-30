import { useQuery } from "@tanstack/react-query";

import protectedFetch from "@/api/ProtectedFetch";
import { ENERGY } from "@/constants/energyConstants";
import { API_URL } from "@/constants/variables";
import type {
  AiTip,
  AnalyticsAverages,
  AnalyticsDay,
  AnalyticsPeriod,
  AnalyticsSummary,
  BillingTariffConfig,
  BillPrediction,
  DashboardData,
  LiveDataPoint,
  MetricGraphData,
  MtdBillingData,
  SensorStats,
  TipItem,
} from "@/types/energy";
import type { SensorStatus } from "@/types/sensor";
import { useSettingsStore } from "@/store/useSettingsStore";
import { formatTime } from "@/utils/formatters";

// ─────────────────────────────────────────────────────────────────────────────
// Debug Helper
// ─────────────────────────────────────────────────────────────────────────────

function debugLog(_fn: string, _action: string, _data?: any) {
  // Silent - logging disabled across non-analytics endpoints
}

// ─────────────────────────────────────────────────────────────────────────────
// Device ID Resolution
// ─────────────────────────────────────────────────────────────────────────────

// Cache the device ID so we don't query /devices on every single polling interval
let cachedDeviceId: string | null = null;

export async function getDefaultDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  try {
    const response = await protectedFetch(`${API_URL}/devices`, {
      method: "GET",
    });
    if (response.ok) {
      const json = await response.json();
      if (Array.isArray(json.data) && json.data.length > 0) {
        const targetDevice =
          json.data.find((d: any) => d.device_id === "energy") || json.data[0];
        const newDeviceId = String(targetDevice.device_id || targetDevice.id);
        cachedDeviceId = newDeviceId;
        return newDeviceId;
      }
    }
  } catch (error) {
    debugLog("getDefaultDeviceId", "⚠️ Devices list fetch error, using default 'energy'", error);
  }

  // Safe fallback to 'energy' if server is offline or returns error
  cachedDeviceId = "energy";
  return "energy";
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard Data
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Online/offline comes from the backend's freshness check on the latest reading
 * (`is_online` / `connection_status`). `device.status` is only the device record's
 * active/inactive flag and says nothing about connectivity.
 */
function resolveIsOnline(data: any): boolean {
  if (typeof data?.is_online === "boolean") return data.is_online;
  return data?.connection_status === "online";
}

function localDateString(d: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Units consumed today. `sensor_readings.kwh` is a cumulative register, so the
 * per-day figure must come from the backend's delta-based daily series.
 */
async function fetchTodayUnits(
  deviceId: string,
  today: string,
): Promise<number> {
  const response = await protectedFetch(
    `${API_URL}/sensors/${deviceId}/stats?period=daily`,
    { method: "GET" },
  );
  if (!response.ok) return 0;
  const json = await response.json();
  const series = json?.data?.series;
  if (!Array.isArray(series)) return 0;
  const entry = series.find((item: any) => item.date === today);
  const kwh = entry ? parseFloat(entry.kwh ?? "0") : 0;
  return Number.isFinite(kwh) ? kwh : 0;
}

export async function getDashboardData(): Promise<DashboardData> {
  const deviceId = await getDefaultDeviceId();
  let latest_reading: any = null;
  let isOnline = false;

  try {
    const endpoint = `${API_URL}/devices/${deviceId}/status`;
    debugLog("getDashboardData", `Calling GET ${endpoint}`);
    const response = await protectedFetch(endpoint, { method: "GET" });
    if (response.ok) {
      const json = await response.json();
      if (json && json.data) {
        latest_reading = json.data.latest_reading;
        isOnline = resolveIsOnline(json.data);
      }
    }
  } catch (err) {
    debugLog("getDashboardData", "⚠️ /devices/status error, using fallback", err);
  }

  let estimatedBill = 0;
  let currentBill = 0;
  let monthUnits = 0;
  let serverToday: string | undefined;
  try {
    const mtd = await getMtdBilling(deviceId);
    if (mtd) {
      monthUnits = mtd.mtd_units;
      estimatedBill = mtd.predicted_bill;
      currentBill = mtd.mtd_bill;
      serverToday = mtd.current_date || undefined;
    }
  } catch (error) {
    debugLog(
      "getDashboardData",
      `⚠️ Bill info fetch FAILED (non-critical)`,
      error instanceof Error ? error.message : error,
    );
  }

  let todayUnits = 0;
  try {
    todayUnits = await fetchTodayUnits(
      deviceId,
      serverToday ?? localDateString(),
    );
  } catch (error) {
    debugLog(
      "getDashboardData",
      `⚠️ Today's units fetch FAILED (non-critical)`,
      error instanceof Error ? error.message : error,
    );
  }

  const result: DashboardData = {
    voltage: parseFloat(latest_reading?.voltage || "0"),
    current: parseFloat(latest_reading?.current || "0"),
    power: parseFloat(latest_reading?.power_watt || "0"),
    temperature: parseFloat(latest_reading?.temperature || "0"),
    todayUnits: parseFloat(todayUnits.toFixed(2)),
    monthUnits,
    estimatedBill,
    currentBill,
    status: isOnline ? "online" : "offline",
  };
  debugLog("getDashboardData", `✅ FINAL RESULT →`, result);
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Live Data (API Polling)
// ─────────────────────────────────────────────────────────────────────────────

export async function getLiveData(): Promise<LiveDataPoint> {
  const deviceId = await getDefaultDeviceId();
  try {
    const endpoint = `${API_URL}/sensors/${deviceId}/latest`;
    debugLog("getLiveData", `Calling GET ${endpoint}`);
    const response = await protectedFetch(endpoint, { method: "GET" });
    if (response.ok) {
      const json = await response.json();
      if (json && json.data) {
        const reading = json.data;
        return {
          time: formatTime(new Date(reading.recorded_at || Date.now())),
          voltage: parseFloat(reading.voltage || "0"),
          current: parseFloat(reading.current || "0"),
          power: parseFloat(reading.power_watt || "0"),
          temperature: parseFloat(reading.temperature || "0"),
        };
      }
    }
  } catch (err) {
    debugLog("getLiveData", "⚠️ getLiveData failed, using fallback", err);
  }

  return {
    time: formatTime(new Date()),
    voltage: 0,
    current: 0,
    power: 0,
    temperature: 0,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────────────────────────────────────────

export async function getAnalytics(
  period: AnalyticsPeriod,
): Promise<AnalyticsSummary> {
  const deviceId = await getDefaultDeviceId();
  const endpoint = `${API_URL}/sensors/${deviceId}/stats?period=${period}`;
  console.log(`📊 [Analytics] Calling GET ${endpoint}`);

  let raw: any = {};
  try {
    const response = await protectedFetch(endpoint, { method: "GET" });
    if (response.ok) {
      const json = await response.json();
      raw = json.data || {};
    } else {
      console.log(`⚠️ [Analytics] Backend returned ${response.status}, using baseline dataset`);
    }
  } catch (err) {
    console.log(`⚠️ [Analytics] Fetch failed:`, err);
  }
  console.log(`📊 [Analytics] Raw stats from API:`, raw);

  const stats: SensorStats = {
    period: (raw.period as AnalyticsPeriod) || period,
    count: parseInt(raw.count || "0", 10),
    avg_power: parseFloat(parseFloat(raw.avg_power || "0").toFixed(2)),
    max_power: parseFloat(parseFloat(raw.max_power || "0").toFixed(2)),
    avg_voltage: parseFloat(parseFloat(raw.avg_voltage || "0").toFixed(2)),
    avg_current: parseFloat(parseFloat(raw.avg_current || "0").toFixed(2)),
    max_current: parseFloat(parseFloat(raw.max_current || "0").toFixed(2)),
    min_current: parseFloat(parseFloat(raw.min_current || "0").toFixed(2)),
    avg_temperature: parseFloat(
      parseFloat(raw.avg_temperature || "0").toFixed(2),
    ),
  };

  // 1. If backend already provides the real time-series array (ideal target):
  if (Array.isArray(raw.series) && raw.series.length > 0) {
    // The backend already returns a complete, ordered series for every period:
    // daily = Mon..Sun, weekly = Week 1..N (N depends on the month, 4 or 5),
    // monthly = Jan..Dec. Empty intervals arrive as 0, so render it as-is.
    const buildFromSeries = (
      title: string,
      unit: string,
      key: string,
      color: string,
      icon: string,
    ): MetricGraphData => {
      const data: AnalyticsDay[] = raw.series.map((item: any) => ({
        label: item.label || item.day || item.date || "",
        units: parseFloat(parseFloat(item[key] ?? 0).toFixed(2)),
      }));

      const nonZero = data.filter((d) => d.units > 0);
      const total = parseFloat(
        data.reduce((acc, d) => acc + d.units, 0).toFixed(2),
      );
      const average =
        nonZero.length > 0
          ? parseFloat((total / nonZero.length).toFixed(2))
          : 0;
      return { title, unit, average, total, data, color, icon };
    };

    const serverAverages: AnalyticsAverages | undefined = raw.averages
      ? {
          avg_kwh:
            typeof raw.averages.avg_kwh === "number"
              ? raw.averages.avg_kwh
              : parseFloat(raw.averages.avg_kwh || "0"),
          avg_voltage:
            typeof raw.averages.avg_voltage === "number"
              ? raw.averages.avg_voltage
              : parseFloat(raw.averages.avg_voltage || "0"),
          avg_current:
            typeof raw.averages.avg_current === "number"
              ? raw.averages.avg_current
              : parseFloat(raw.averages.avg_current || "0"),
          avg_temperature:
            typeof raw.averages.avg_temperature === "number"
              ? raw.averages.avg_temperature
              : parseFloat(raw.averages.avg_temperature || "0"),
          total_kwh:
            typeof raw.averages.total_kwh === "number"
              ? raw.averages.total_kwh
              : parseFloat(raw.averages.total_kwh || "0"),
        }
      : undefined;

    const energy = buildFromSeries(
      "Energy Consumption",
      "kWh",
      "kwh",
      "#10B981",
      "lightning-bolt",
    );
    if (serverAverages?.avg_kwh !== undefined) {
      energy.average = parseFloat(serverAverages.avg_kwh.toFixed(2));
    }
    if (serverAverages?.total_kwh !== undefined) {
      energy.total = parseFloat(serverAverages.total_kwh.toFixed(2));
    }

    const voltage = buildFromSeries(
      "Voltage",
      "V",
      "voltage",
      "#3B82F6",
      "flash",
    );
    if (serverAverages?.avg_voltage !== undefined) {
      voltage.average = parseFloat(serverAverages.avg_voltage.toFixed(2));
    }

    const current = buildFromSeries(
      "Current",
      "A",
      "current",
      "#F59E0B",
      "current-ac",
    );
    if (serverAverages?.avg_current !== undefined) {
      current.average = parseFloat(serverAverages.avg_current.toFixed(2));
    }

    const temperature = buildFromSeries(
      "Temperature",
      "°C",
      "temperature",
      "#EF4444",
      "thermometer",
    );
    if (serverAverages?.avg_temperature !== undefined) {
      temperature.average = parseFloat(serverAverages.avg_temperature.toFixed(2));
    }

    const result: AnalyticsSummary = {
      period,
      energy,
      voltage,
      current,
      temperature,
      stats,
      averages: serverAverages,
    };
    console.log(`📊 [Analytics] Used backend series & averages →`, result);
    return result;
  }

  // Backend has not returned a `series` array — no historical time-series is available.
  // We intentionally return empty (zero-filled) buckets so the UI does NOT invent
  // misleading values by painting a single live snapshot onto one bar.
  // See docs/BACKEND_ANALYTICS_SPEC.md for the required backend response format.
  const buildEmptyBuckets = (): AnalyticsDay[] => {
    if (period === "daily") {
      return ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((label) => ({
        label,
        units: 0,
      }));
    }
    if (period === "weekly") {
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      return Array.from({ length: Math.ceil(daysInMonth / 7) }, (_, i) => ({
        label: `Week ${i + 1}`,
        units: 0,
      }));
    }
    return [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
    ].map((label) => ({ label, units: 0 }));
  };

  const buildEmptyMetric = (
    title: string,
    unit: string,
    color: string,
    icon: string,
    hasTotal = false,
  ): MetricGraphData => ({
    title,
    unit,
    color,
    icon,
    average: 0,
    ...(hasTotal ? { total: 0 } : {}),
    data: buildEmptyBuckets(),
  });

  const result: AnalyticsSummary = {
    period,
    energy: buildEmptyMetric("Energy Consumption", "kWh", "#10B981", "lightning-bolt", true),
    voltage: buildEmptyMetric("Voltage", "V", "#3B82F6", "flash"),
    current: buildEmptyMetric("Current", "A", "#F59E0B", "current-ac"),
    temperature: buildEmptyMetric("Temperature", "°C", "#EF4444", "thermometer"),
    stats,
  };

  console.log(`📊 [Analytics] Backend series missing — returning empty buckets. See docs/BACKEND_ANALYTICS_SPEC.md`);
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Billing Tariff Configuration
// ─────────────────────────────────────────────────────────────────────────────

export async function getBillingConfig(
  deviceIdParam?: string,
): Promise<BillingTariffConfig> {
  const deviceId = deviceIdParam || (await getDefaultDeviceId());
  const storeState = useSettingsStore.getState();

  try {
    const endpoint = `${API_URL}/bills/${deviceId}/config`;
    debugLog("getBillingConfig", `Calling GET ${endpoint}`);
    const response = await protectedFetch(endpoint, { method: "GET" });
    if (response.ok) {
      const json = await response.json();
      if (json && json.data) {
        const data = json.data;
        const rate =
          typeof data.rate_per_kwh === "number"
            ? data.rate_per_kwh
            : parseFloat(data.rate_per_kwh || "0");
        const cycleDay =
          typeof data.billing_cycle_start_day === "number"
            ? data.billing_cycle_start_day
            : parseInt(data.billing_cycle_start_day || "1", 10);

        useSettingsStore.getState().setTariffConfig({
          ratePerKwh: rate > 0 ? rate : undefined,
          tariffType: data.tariff_type || "flat",
          currencySymbol: data.currency_symbol || "Rs.",
          billingCycleStartDay: cycleDay > 0 ? cycleDay : 1,
        });

        return {
          device_id: data.device_id || deviceId,
          rate_per_kwh: rate > 0 ? rate : storeState.ratePerKwh,
          currency: data.currency || "PKR",
          currency_symbol: data.currency_symbol || "Rs.",
          billing_cycle_start_day: cycleDay,
          tariff_type: data.tariff_type || "flat",
          slabs: Array.isArray(data.slabs) ? data.slabs : null,
          last_updated: data.last_updated,
        };
      }
    }
  } catch (err) {
    debugLog("getBillingConfig", "⚠️ Failed to get billing config, using store fallback", err);
  }

  return {
    device_id: deviceId,
    rate_per_kwh: storeState.ratePerKwh,
    currency: "PKR",
    currency_symbol: storeState.currencySymbol || "Rs.",
    billing_cycle_start_day: storeState.billingCycleStartDay || 1,
    tariff_type: storeState.tariffType || "flat",
    slabs: null,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic Month-to-Date (MTD) Billing
// ─────────────────────────────────────────────────────────────────────────────

export async function getMtdBilling(
  deviceIdParam?: string,
): Promise<MtdBillingData | null> {
  const deviceId = deviceIdParam || (await getDefaultDeviceId());
  const storeState = useSettingsStore.getState();

  try {
    const endpoint = `${API_URL}/bills/${deviceId}/mtd`;
    debugLog("getMtdBilling", `Calling GET ${endpoint}`);
    const response = await protectedFetch(endpoint, { method: "GET" });
    if (response.ok) {
      const json = await response.json();
      if (json && json.data) {
        const d = json.data;
        const parseNum = (v: any) =>
          typeof v === "number" ? v : parseFloat(v || "0");

        const rate = parseNum(d.rate_per_kwh);
        if (rate > 0) {
          useSettingsStore.getState().setTariffConfig({
            ratePerKwh: rate,
            tariffType: d.tariff_type || "flat",
            currencySymbol: d.currency_symbol || "Rs.",
          });
        }

        return {
          device_id: d.device_id || deviceId,
          billing_period_start: d.billing_period_start || "",
          billing_period_end: d.billing_period_end || "",
          current_date: d.current_date || "",
          elapsed_days: parseNum(d.elapsed_days),
          total_days: parseNum(d.total_days),
          remaining_days: parseNum(d.remaining_days),
          mtd_units: parseNum(d.mtd_units),
          avg_daily_units: parseNum(d.avg_daily_units),
          mtd_bill: parseNum(d.mtd_bill),
          predicted_units: parseNum(d.predicted_units),
          predicted_bill: parseNum(d.predicted_bill),
          remaining_estimated_bill: parseNum(d.remaining_estimated_bill),
          currency: d.currency || "PKR",
          currency_symbol: d.currency_symbol || "Rs.",
          rate_per_kwh: rate > 0 ? rate : storeState.ratePerKwh,
          tariff_type: d.tariff_type || "flat",
          mtd_bill_note: d.mtd_bill_note,
          predicted_bill_note: d.predicted_bill_note,
        };
      }
    }
  } catch (err) {
    debugLog("getMtdBilling", "⚠️ MTD request failed, returning null (no fabrication)", err);
  }

  // Return null when offline — do NOT fabricate billing period dates or cycle info.
  // The UI will show "Awaiting billing cycle sync" instead of guessed values.
  return null;
}

// ─────────────────────────────────────────────────────────────────────────────
// Bill Prediction
// ─────────────────────────────────────────────────────────────────────────────

export async function getBillPrediction(): Promise<BillPrediction> {
  const deviceId = await getDefaultDeviceId();

  // 1. Deterministic MTD billing + end-of-cycle forecast (single source of truth)
  let mtdData: MtdBillingData | null = null;
  try {
    mtdData = await getMtdBilling(deviceId);
  } catch (err) {
    debugLog("getBillPrediction", "⚠️ MTD billing fetch failed", err);
  }

  // 2. Saving tips from /tips/{device_id}/history
  let savingTips: TipItem[] = [];
  try {
    const tipsEndpoint = `${API_URL}/tips/${deviceId}/history?limit=5`;
    debugLog("getBillPrediction", `Calling GET ${tipsEndpoint}`);
    const tipsResp = await protectedFetch(tipsEndpoint, { method: "GET" });
    if (tipsResp.ok) {
      const tipsJson = await tipsResp.json();
      if (Array.isArray(tipsJson.data) && tipsJson.data.length > 0) {
        savingTips = tipsJson.data.map((t: any) => ({
          text: t.tip_text || "",
          category: t.category || "energy saving",
        }));
      }
    }
  } catch (error) {
    debugLog(
      "getBillPrediction",
      `⚠️ Tips fetch FAILED (non-critical)`,
      error instanceof Error ? error.message : error,
    );
  }
  // If no tips came from the server, leave the array empty.
  // The UI has a proper empty state ("No Saving Tips Available") for this case.

  // Monthly budget is user-controlled on frontend (stored in MMKV)
  const clientBudget = useSettingsStore.getState().monthlyBudget;
  const budget = clientBudget > 0 ? clientBudget : 5000;

  const predictedBill = mtdData?.predicted_bill ?? 0;
  const predictedUnits = mtdData?.predicted_units ?? 0;
  const mtdBill = mtdData?.mtd_bill ?? 0;
  const monthUnits = mtdData?.mtd_units ?? 0;
  const dailyAverage = mtdData?.avg_daily_units ?? 0;
  const daysRemaining = mtdData?.remaining_days ?? 0;

  const result: BillPrediction = {
    monthUnits: parseFloat(monthUnits.toFixed(2)),
    predictedUnits: parseFloat(predictedUnits.toFixed(2)),
    predictedBill: parseFloat(predictedBill.toFixed(2)),
    mtdBill: parseFloat(mtdBill.toFixed(2)),
    budget,
    status:
      predictedBill > budget
        ? "Over Budget"
        : predictedBill > budget * 0.8
          ? "Warning"
          : "Safe",
    dailyAverage: parseFloat(dailyAverage.toFixed(2)),
    daysRemaining,
    elapsedDays: mtdData?.elapsed_days,
    totalDays: mtdData?.total_days,
    billingPeriodStart: mtdData?.billing_period_start,
    billingPeriodEnd: mtdData?.billing_period_end,
    remainingEstimatedBill:
      mtdData?.remaining_estimated_bill !== undefined
        ? parseFloat(mtdData.remaining_estimated_bill.toFixed(2))
        : undefined,
    currencySymbol: mtdData?.currency_symbol || "Rs.",
    ratePerKwh: mtdData?.rate_per_kwh,
    tariffType: mtdData?.tariff_type,
    mtdBillNote: mtdData?.mtd_bill_note,
    predictedBillNote: mtdData?.predicted_bill_note,
    savingTips,
  };

  debugLog("getBillPrediction", `✅ FINAL RESULT →`, result);
  return result;
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

  debugLog(
    "getAllTips",
    `✅ Received ${json.data?.length ?? 0} tips`,
    json.data,
  );
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

  debugLog(
    "getTipsHistory",
    `✅ Received ${json.data?.length ?? 0} tips for device "${deviceId}"`,
    json.data,
  );
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

  const syncSecret = process.env.EXPO_PUBLIC_SYNC_SECRET;
  const response = await protectedFetch(endpoint, {
    method: "POST",
    headers: syncSecret ? { "X-Sync-Secret": syncSecret } : undefined,
  });
  const json = await response.json();

  if (!response.ok) {
    debugLog("generateTips", `❌ FAILED`, json);
    throw new Error(json?.message ?? "Failed to generate tips.");
  }

  debugLog(
    "generateTips",
    `✅ Generated ${json.data?.length ?? 0} new tips`,
    json.data,
  );
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

  const { latest_reading } = json.data;

  // Connectivity is decided by the backend from the age of the latest reading
  // (is_online / connection_status). device.status is only the record's
  // active/inactive flag and does not reflect whether hardware is reporting.
  const isOnline = resolveIsOnline(json.data);
  const status = isOnline ? "online" : "offline";

  debugLog(
    "getSensorStatus",
    `✅ Sensor "${deviceId}" → ${status} (last reading: ${latest_reading?.recorded_at})`,
  );

  return {
    acs712: status,
    zmpt: status,
    temp: status,
    esp32: status === "online" ? "connected" : "disconnected",
    lastUpdated: latest_reading?.recorded_at || "",
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

export function useGetBillingConfig(deviceId?: string) {
  return useQuery({
    queryKey: ["billing-config", deviceId],
    queryFn: () => getBillingConfig(deviceId),
  });
}

export function useGetMtdBilling(deviceId?: string) {
  return useQuery({
    queryKey: ["billing-mtd", deviceId],
    queryFn: () => getMtdBilling(deviceId),
    refetchInterval: ENERGY.POLLING_INTERVAL_MS,
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Firebase Real-Time Hook
// ─────────────────────────────────────────────────────────────────────────────

import { database } from "@/lib/firebase";
import { onValue, ref } from "firebase/database";
import { useEffect, useRef, useState } from "react";

/**
 * Hook that listens to Firebase Realtime Database for instant sensor updates.
 * Includes watchdog timer & staleness detection: if the hardware stops sending
 * packets for more than 6 seconds (or initial payload is old), isLive becomes false
 * and data drops to null (standby) so the UI doesn't display frozen fake numbers.
 */
export function useFirebaseLiveData(deviceId: string = "energy") {
  const [data, setData] = useState<LiveDataPoint | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const sensorRef = ref(database, deviceId);

    debugLog(
      "🔥 useFirebaseLiveData",
      `Subscribing to Firebase path: "/${deviceId}"`,
    );

    const resetWatchdog = () => {
      if (watchdogTimerRef.current) {
        clearTimeout(watchdogTimerRef.current);
      }
      // If hardware stops transmitting for 6 seconds, mark offline / standby
      watchdogTimerRef.current = setTimeout(() => {
        debugLog("🔥 useFirebaseLiveData", "⏱️ Hardware watchdog timeout: no packets received -> hardware OFF");
        setIsLive(false);
      }, 6000);
    };

    const unsubscribe = onValue(
      sensorRef,
      (snapshot) => {
        const val = snapshot.val();
        if (val) {
          const now = Date.now();

          // Check if payload contains an embedded timestamp to verify freshness
          const rawTs = val.timestamp ?? val.last_updated ?? val.updated_at ?? val.time;
          let isStale = false;

          if (typeof rawTs === "number") {
            const tsMs = rawTs < 1e11 ? rawTs * 1000 : rawTs;
            if (now - tsMs > 10000) {
              isStale = true;
            }
          } else if (typeof rawTs === "string" && !isNaN(Date.parse(rawTs))) {
            if (now - Date.parse(rawTs) > 10000) {
              isStale = true;
            }
          }

          if (isStale) {
            debugLog("🔥 useFirebaseLiveData", "⚠️ Stale snapshot detected (hardware is OFF)");
            setIsLive(false);
            setIsLoading(false);
            return;
          }

          setIsLive(true);
          resetWatchdog();

          const reading: LiveDataPoint = {
            time: formatTime(new Date()),
            voltage: parseFloat(val.voltage || "0"),
            current: parseFloat(val.current || "0"),
            power: parseFloat(val.power || val.power_watt || "0"),
            temperature: parseFloat(val.temp || val.temperature || "0"),
          };

          setData(reading);
          setIsLoading(false);
          setError(null);
        } else {
          setIsLive(false);
          setIsLoading(false);
        }
      },
      (err) => {
        debugLog("🔥 useFirebaseLiveData", `❌ Firebase listener ERROR`, err);
        setError(err);
        setIsLive(false);
        setIsLoading(false);
      },
    );

    return () => {
      if (watchdogTimerRef.current) {
        clearTimeout(watchdogTimerRef.current);
      }
      unsubscribe();
    };
  }, [deviceId]);

  return {
    data: isLive ? data : null,
    rawData: data,
    isLive,
    isLoading,
    isError: !!error,
    error,
  };
}
