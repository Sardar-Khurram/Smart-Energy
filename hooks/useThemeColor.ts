/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/useColorScheme";
import { useSettingsStore } from "@/store/useSettingsStore";

export function useThemeColor() {
  const systemColorScheme = useColorScheme();
  const themeMode = useSettingsStore((state) => state.themeMode);

  const activeMode = themeMode === "system" ? systemColorScheme : themeMode;

  if (activeMode === "dark") {
    return Colors.dark;
  } else {
    return Colors.light;
  }
}
