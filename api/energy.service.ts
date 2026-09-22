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
  DeviceUsage,
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

export async function getDashboardData(): Promise<DashboardData> {
  const deviceId = await getDefaultDeviceId();
  let device: any = null;
  let latest_reading: any = null;

  try {
    const endpoint = `${API_URL}/devices/${deviceId}/status`;
    debugLog("getDashboardData", `Calling GET ${endpoint}`);
    const response = await protectedFetch(endpoint, { method: "GET" });
    if (response.ok) {
      const json = await response.json();
      if (json && json.data) {
        device = json.data.device;
        latest_reading = json.data.latest_reading;
      }
    }
  } catch (err) {
    debugLog("getDashboardData", "⚠️ /devices/status error, using fallback", err);
  }

  let estimatedBill = 0;
  let currentBill = 0;
  let monthUnits = 0;
  try {
    const mtdEndpoint = `${API_URL}/bills/${deviceId}/mtd`;
    debugLog(
      "getDashboardData",
      `Calling GET ${mtdEndpoint} (for MTD bill & units)`,
    );
    const mtdResp = await protectedFetch(mtdEndpoint, { method: "GET" });
    if (mtdResp.ok) {
      const mtdJson = await mtdResp.json();
      if (mtdJson && mtdJson.data) {
        const mtd = mtdJson.data;
        monthUnits =
          typeof mtd.mtd_units === "number"
            ? mtd.mtd_units
            : parseFloat(mtd.mtd_units || "0");
        const rawBill = mtd.predicted_bill ?? mtd.mtd_bill ?? 0;
        estimatedBill =
          typeof rawBill === "number"
            ? rawBill
            : parseFloat(rawBill || "0");
        const rawCurrentBill = mtd.mtd_bill ?? 0;
        currentBill =
          typeof rawCurrentBill === "number"
            ? rawCurrentBill
            : parseFloat(rawCurrentBill || "0");

        if (typeof mtd.rate_per_kwh === "number" && mtd.rate_per_kwh > 0) {
          useSettingsStore.getState().setTariffConfig({
            ratePerKwh: mtd.rate_per_kwh,
            tariffType: mtd.tariff_type,
            currencySymbol: mtd.currency_symbol,
          });
        }
      }
    } else {
      // Fallback to latest prediction history
      const billEndpoint = `${API_URL}/bills/${deviceId}/history?limit=1`;
      const billResp = await protectedFetch(billEndpoint, { method: "GET" });
      if (billResp.ok) {
        const billJson = await billResp.json();
        const latestPrediction = billJson.data?.[0];
        if (latestPrediction) {
          const costRaw = latestPrediction.predicted_cost;
          const kwhRaw = latestPrediction.predicted_kwh;
          estimatedBill =
            typeof costRaw === "number" ? costRaw : parseFloat(costRaw || "0");
          currentBill = estimatedBill;
          monthUnits =
            typeof kwhRaw === "number" ? kwhRaw : parseFloat(kwhRaw || "0");
        }
      }
    }
  } catch (error) {
    debugLog(
      "getDashboardData",
      `⚠️ Bill info fetch FAILED (non-critical)`,
      error instanceof Error ? error.message : error,
    );
  }

  const result: DashboardData = {
    voltage: parseFloat(latest_reading?.voltage || "0"),
    current: parseFloat(latest_reading?.current || "0"),
    power: parseFloat(latest_reading?.power_watt || "0"),
    temperature: parseFloat(latest_reading?.temperature || "0"),
    todayUnits: parseFloat(latest_reading?.kwh || "0"),
    monthUnits,
    estimatedBill,
    currentBill,
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
    const allMonths = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const monthWeeks = ["Week 1", "Week 2", "Week 3", "Week 4"];

    const buildFromSeries = (
      title: string,
      unit: string,
      key: string,
      color: string,
      icon: string,
    ): MetricGraphData => {
      let data: AnalyticsDay[] = [];

      if (period === "monthly") {
        // Guarantee all 12 months on X-axis: only recorded months have values, rest are 0 (empty bars)
        data = allMonths.map((m, idx) => {
          const found = raw.series.find((item: any) => {
            const l = (item.label || item.month || item.date || "")
              .toString()
              .toLowerCase();
            return (
              l === m.toLowerCase() ||
              l.startsWith(m.toLowerCase()) ||
              parseInt(item.month, 10) === idx + 1
            );
          });
          return {
            label: m,
            units: found
              ? parseFloat(parseFloat(found[key] ?? 0).toFixed(2))
              : 0,
          };
        });
      } else if (period === "weekly") {
        // Guarantee Week 1 - Week 4 on X-axis: only recorded weeks have values, rest are 0
        data = monthWeeks.map((w, idx) => {
          const found = raw.series.find((item: any) => {
            const l = (item.label || item.week || "").toString().toLowerCase();
            return l === w.toLowerCase() || l.includes((idx + 1).toString());
          });
          return {
            label: w,
            units: found
              ? parseFloat(parseFloat(found[key] ?? 0).toFixed(2))
              : 0,
          };
        });
      } else if (period === "daily") {
        // Guarantee Mon - Sun on X-axis: only recorded days have values, rest are 0
        data = weekDays.map((day) => {
          const found = raw.series.find((item: any) => {
            const l = (item.label || item.day || item.date || "")
              .toString()
              .toLowerCase();
            return l === day.toLowerCase() || l.startsWith(day.toLowerCase());
          });
          return {
            label: day,
            units: found
              ? parseFloat(parseFloat(found[key] ?? 0).toFixed(2))
              : 0,
          };
        });
      } else {
        data = raw.series.map((item: any) => ({
          label: item.label || item.day || item.date || "",
          units: parseFloat(parseFloat(item[key] ?? 0).toFixed(2)),
        }));
      }

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

  // 2. Interim fallback while backend developer implements series:
  // Show actual reading only on recorded active periods, and 0 (empty bars) for unrecorded periods
  const kwhUnits = stats.avg_power
    ? parseFloat(((stats.avg_power * 24) / 1000).toFixed(2))
    : 0;

  const now = new Date();
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const currentDayName = dayNames[now.getDay()]; // e.g. "Sat"
  const currentMonthIdx = now.getMonth(); // 0-based, e.g. 8 for Sep
  const allMonths = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const buildMetricDataset = (
    title: string,
    unit: string,
    activeVal: number,
    color: string,
    icon: string,
  ): MetricGraphData => {
    let data: AnalyticsDay[] = [];
    if (period === "daily") {
      const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
      data = weekDays.map((day) => ({
        label: day,
        units: day === currentDayName ? activeVal : 0,
      }));
    } else if (period === "weekly") {
      const weeks = ["Week 1", "Week 2", "Week 3", "Week 4"];
      const currentWeekNum = Math.min(Math.ceil(now.getDate() / 7), 4);
      data = weeks.map((w, idx) => ({
        label: w,
        units: idx + 1 === currentWeekNum ? activeVal : 0,
      }));
    } else {
      // Map all 12 months (Jan - Dec): only recorded month has value, unrecorded months show 0 (no bar)
      data = allMonths.map((m, idx) => ({
        label: m,
        units: idx === currentMonthIdx ? activeVal : 0,
      }));
    }

    const total = activeVal;
    const average = activeVal;

    return { title, unit, average, total, data, color, icon };
  };

  const energy = buildMetricDataset(
    "Energy Consumption",
    "kWh",
    kwhUnits,
    "#10B981",
    "lightning-bolt",
  );
  const voltage = buildMetricDataset(
    "Voltage",
    "V",
    stats.avg_voltage,
    "#3B82F6",
    "flash",
  );
  const current = buildMetricDataset(
    "Current",
    "A",
    stats.avg_current,
    "#F59E0B",
    "current-ac",
  );
  const temperature = buildMetricDataset(
    "Temperature",
    "°C",
    stats.avg_temperature,
    "#EF4444",
    "thermometer",
  );

  const result: AnalyticsSummary = {
    period,
    energy,
    voltage,
    current,
    temperature,
    stats,
  };

  console.log(`📊 [Analytics] Computed result:`, result);
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
): Promise<MtdBillingData> {
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
    debugLog("getMtdBilling", "⚠️ MTD request failed, using safe fallback", err);
  }

  // Safe client fallback when offline or server returns 500/403
  const now = new Date();
  const currentDay = now.getDate();
  const totalDaysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const remainingDays = Math.max(totalDaysInMonth - currentDay, 0);

  return {
    device_id: deviceId,
    billing_period_start: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`,
    billing_period_end: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${totalDaysInMonth}`,
    current_date: now.toISOString().split("T")[0],
    elapsed_days: currentDay,
    total_days: totalDaysInMonth,
    remaining_days: remainingDays,
    mtd_units: 0,
    avg_daily_units: 0,
    mtd_bill: 0,
    predicted_units: 0,
    predicted_bill: 0,
    remaining_estimated_bill: 0,
    currency: "PKR",
    currency_symbol: storeState.currencySymbol || "Rs.",
    rate_per_kwh: storeState.ratePerKwh,
    tariff_type: storeState.tariffType || "flat",
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Bill Prediction
// ─────────────────────────────────────────────────────────────────────────────

export async function getBillPrediction(): Promise<BillPrediction> {
  const deviceId = await getDefaultDeviceId();

  // 1. Fetch deterministic MTD billing data (primary calculation source)
  let mtdData: MtdBillingData | null = null;
  try {
    mtdData = await getMtdBilling(deviceId);
  } catch (err) {
    debugLog("getBillPrediction", "⚠️ MTD billing fetch failed, attempting fallback", err);
  }

  // 2. Fetch AI prediction for summary/tips & rate fallback
  let aiSummary: string = "";
  let aiPredictedCost = 0;
  let aiPredictedKwh = 0;
  try {
    const endpoint = `${API_URL}/bills/${deviceId}/predict`;
    debugLog("getBillPrediction", `Calling POST ${endpoint}`);
    const predResp = await protectedFetch(endpoint, { method: "POST" });
    if (predResp.ok) {
      const predJson = await predResp.json();
      if (predJson.data) {
        aiSummary = predJson.data.summary || "";
        aiPredictedCost =
          typeof predJson.data.predicted_cost === "number"
            ? predJson.data.predicted_cost
            : parseFloat(predJson.data.predicted_cost || "0");
        aiPredictedKwh =
          typeof predJson.data.predicted_kwh === "number"
            ? predJson.data.predicted_kwh
            : parseFloat(predJson.data.predicted_kwh || "0");

        if (typeof predJson.data.rate_per_kwh === "number" && predJson.data.rate_per_kwh > 0) {
          useSettingsStore.getState().setRatePerKwh(predJson.data.rate_per_kwh);
        }
      }
    }
  } catch (error) {
    debugLog(
      "getBillPrediction",
      `⚠️ AI bill prediction fetch FAILED (non-critical)`,
      error instanceof Error ? error.message : error,
    );
  }

  // 3. Fetch tips history from /tips/{device_id}/history
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

  if (aiSummary) {
    savingTips = [{ text: aiSummary, category: "energy saving" }, ...savingTips];
  } else if (savingTips.length === 0) {
    savingTips = [
      {
        text: "Optimize appliance usage during peak demand to lower monthly bills.",
        category: "energy saving",
      },
    ];
  }

  // Monthly budget is user-controlled on frontend (stored in MMKV)
  const clientBudget = useSettingsStore.getState().monthlyBudget;
  const budget = clientBudget > 0 ? clientBudget : 5000;

  // Resolve values: prioritize deterministic MTD data
  const predictedBill = mtdData ? mtdData.predicted_bill : aiPredictedCost;
  const predictedUnits = mtdData ? mtdData.predicted_units : aiPredictedKwh;
  const mtdBill = mtdData ? mtdData.mtd_bill : 0;
  const monthUnits = mtdData ? mtdData.mtd_units : aiPredictedKwh;
  const dailyAverage = mtdData ? mtdData.avg_daily_units : (predictedUnits / 30);
  const daysRemaining = mtdData ? mtdData.remaining_days : (30 - new Date().getDate());

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
    remainingEstimatedBill: mtdData?.remaining_estimated_bill !== undefined ? parseFloat(mtdData.remaining_estimated_bill.toFixed(2)) : undefined,
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

  debugLog(
    "getDevices",
    `✅ Received ${json.data?.length ?? 0} devices`,
    json.data,
  );

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

  const response = await protectedFetch(endpoint, { method: "POST" });
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

  const { device, latest_reading } = json.data;

  // Use the actual device status from the database instead of timestamp math
  // This matches why the dashboard shows "Connected"
  const isOnline = device?.status === "active";
  const status = isOnline ? "online" : "offline";

  debugLog(
    "getSensorStatus",
    `✅ Sensor "${deviceId}" → ${status} (last reading: ${latest_reading?.recorded_at})`,
  );

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
import { useEffect, useState } from "react";

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

    debugLog(
      "🔥 useFirebaseLiveData",
      `Subscribing to Firebase path: "/${deviceId}"`,
    );
    debugLog(
      "🔥 useFirebaseLiveData",
      `Database URL: ${database.app.options.databaseURL}`,
    );

    const unsubscribe = onValue(
      sensorRef,
      (snapshot) => {
        const val = snapshot.val();
        if (val) {
          debugLog(
            "🔥 useFirebaseLiveData",
            `✅ Data received from Firebase →`,
            val,
          );

          const reading: LiveDataPoint = {
            time: formatTime(new Date()),
            voltage: parseFloat(val.voltage || "0"),
            current: parseFloat(val.current || "0"),
            power: parseFloat(val.power || val.power_watt || "0"),
            temperature: parseFloat(val.temp || val.temperature || "0"),
          };

          debugLog(
            "🔥 useFirebaseLiveData",
            `✅ Parsed to LiveDataPoint →`,
            reading,
          );

          setData(reading);
          setIsLoading(false);
          setError(null);
        } else {
          debugLog(
            "🔥 useFirebaseLiveData",
            `⚠️ snapshot.val() is NULL at path "/${deviceId}". Check Firebase console.`,
          );
          setIsLoading(false);
        }
      },
      (err) => {
        debugLog("🔥 useFirebaseLiveData", `❌ Firebase listener ERROR`, {
          code: (err as any)?.code,
          message: err.message,
        });
        debugLog("🔥 useFirebaseLiveData", `❌ Possible causes:`);
        debugLog(
          "🔥 useFirebaseLiveData",
          `   • Firebase rules deny read access`,
        );
        debugLog("🔥 useFirebaseLiveData", `   • Wrong databaseURL in config`);
        debugLog("🔥 useFirebaseLiveData", `   • No internet connection`);
        setError(err);
        setIsLoading(false);
      },
    );

    return () => {
      debugLog("🔥 useFirebaseLiveData", `Unsubscribing from "/${deviceId}"`);
      unsubscribe();
    };
  }, [deviceId]);

  return { data, isLoading, isError: !!error, error };
}
