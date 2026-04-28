/**
 * Learn more about light and dark modes:
 * https://docs.expo.dev/guides/color-schemes/
 */

import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/useColorScheme";

export function useThemeColor() {
  const colorScheme = useColorScheme();

  if (colorScheme === "dark") {
    return Colors.dark;
  } else {
    return Colors.light;
  }
}
