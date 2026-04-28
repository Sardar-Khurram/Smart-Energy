import { Platform, View, ViewStyle } from "react-native";
import { useNavigationMode } from "react-native-navigation-mode";

import { NAVBAR_HEIGHT, useResponsiveTokens } from "@/constants/theme";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type SafeAreaVariant = "normal" | "withTab" | "topOverflow";

interface SafeAreaProps {
  children: React.ReactNode;
  variant?: SafeAreaVariant;
  style?: ViewStyle | ViewStyle[];
}

const SafeArea: React.FC<SafeAreaProps> = ({
  children,
  variant = "normal",
  style,
}) => {
  const theme = useThemeColor();
  const { spacing } = useResponsiveTokens();
  const { navigationMode } = useNavigationMode();
  const { top } = useSafeAreaInsets();

  const getContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      flex: 1,
      backgroundColor: theme.background,
    };

    switch (variant) {
      case "normal":
        return {
          ...baseStyle,
          paddingTop: top + (Platform.OS === "ios" ? 0 : spacing.sm),
          paddingBottom: navigationMode?.isGestureNavigation
            ? 0
            : NAVBAR_HEIGHT,
        };

      case "withTab":
        return {
          ...baseStyle,
          paddingTop: top + (Platform.OS === "ios" ? 0 : spacing.sm),
          paddingBottom:
            (navigationMode?.isGestureNavigation
              ? 0
              : NAVBAR_HEIGHT) + NAVBAR_HEIGHT,
        };

      case "topOverflow":
        return {
          ...baseStyle,
          paddingBottom: navigationMode?.isGestureNavigation
            ? 0
            : NAVBAR_HEIGHT,
        };

      default:
        return baseStyle;
    }
  };

  return <View style={[getContainerStyle(), style]}>{children}</View>;
};

export default SafeArea;
