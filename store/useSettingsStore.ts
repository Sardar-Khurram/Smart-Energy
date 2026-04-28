import { create } from "zustand";
import { createJSONStorage, persist, StateStorage } from "zustand/middleware";

import { storage } from "@/lib/storage";
import { ENERGY } from "@/constants/energyConstants";

// ─────────────────────────────────────────────────────────────────────────────
// Settings Store (Zustand + MMKV)
// ─────────────────────────────────────────────────────────────────────────────

interface SettingsState {
  hydrated: boolean;

  // ESP32 connection
  esp32Ip: string;
  esp32Port: number;

  // Budget & billing
  monthlyBudget: number;
  ratePerKwh: number;

  // Alert preferences
  alertVoltage: boolean;
  alertCurrent: boolean;
  alertTemperature: boolean;
  alertOverload: boolean;

  // Refresh rates
  liveRefreshMs: number;
  dashboardRefreshMs: number;

  // Actions
  setHydrated: (value: boolean) => void;
  setEsp32Ip: (ip: string) => void;
  setEsp32Port: (port: number) => void;
  setMonthlyBudget: (budget: number) => void;
  setRatePerKwh: (rate: number) => void;
  setAlertPreference: (key: keyof Pick<SettingsState, "alertVoltage" | "alertCurrent" | "alertTemperature" | "alertOverload">, value: boolean) => void;
  setLiveRefreshMs: (ms: number) => void;
  setDashboardRefreshMs: (ms: number) => void;
}

const mmkvStorage: StateStorage = {
  getItem: (name: string): string | null => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string): void => {
    storage.set(name, value);
  },
  removeItem: (name: string): void => {
    storage.remove(name);
  },
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      hydrated: false,

      esp32Ip: "192.168.1.100",
      esp32Port: 80,

      monthlyBudget: 5000,
      ratePerKwh: ENERGY.RATE_PER_KWH,

      alertVoltage: true,
      alertCurrent: true,
      alertTemperature: true,
      alertOverload: true,

      liveRefreshMs: ENERGY.REFRESH_INTERVAL_MS,
      dashboardRefreshMs: ENERGY.POLLING_INTERVAL_MS,

      setHydrated: (value) => set({ hydrated: value }),
      setEsp32Ip: (ip) => set({ esp32Ip: ip }),
      setEsp32Port: (port) => set({ esp32Port: port }),
      setMonthlyBudget: (budget) => set({ monthlyBudget: budget }),
      setRatePerKwh: (rate) => set({ ratePerKwh: rate }),
      setAlertPreference: (key, value) => set({ [key]: value }),
      setLiveRefreshMs: (ms) => set({ liveRefreshMs: ms }),
      setDashboardRefreshMs: (ms) => set({ dashboardRefreshMs: ms }),
    }),
    {
      name: "settings-storage",
      storage: createJSONStorage(() => mmkvStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
