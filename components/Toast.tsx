import {
  Colors,
  Typography,
  palette,
  softPalette,
  useIsTablet,
  useResponsiveTokens
} from "@/constants/theme";
import AntDesign from '@expo/vector-icons/AntDesign';
import Ionicons from '@expo/vector-icons/Ionicons';
import React, { createContext, useContext, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type ToastType = "success" | "error" | "info" | "subtle";

type ToastConfig = {
  message: string;
  type: ToastType;
  duration?: number;
};

type ToastContextType = {
  showToast: (config: ToastConfig) => void;
};

type ToastServiceType = {
  showToast: ((config: ToastConfig) => void) | null;
};

export const ToastService: ToastServiceType = {
  showToast: null,
};

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

type ToastProviderProps = {
  children: React.ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
  const [toastConfig, setToastConfig] = useState<ToastConfig | null>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const isTablet = useIsTablet();
  const { spacing, fontSizes, radius, shadows } = useResponsiveTokens();

  const showToast = (config: ToastConfig) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setToastConfig(config);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    timeoutRef.current = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 20,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setToastConfig(null));
    }, config.duration || 3000);
  };

  React.useEffect(() => {
    ToastService.showToast = showToast;

    return () => {
      ToastService.showToast = null;
    };
  }, []);

  const getToastStyle = (type: ToastType) => {
    const baseStyle = {
      backgroundColor: Colors.light.card,
      borderColor: Colors.light.border,
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginHorizontal: spacing.md,
      ...shadows.sm,
    };

    switch (type) {
      case "success":
        return {
          ...baseStyle,
          backgroundColor: softPalette.green,
          borderColor: palette.safeGreen,
        };
      case "error":
        return {
          ...baseStyle,
          backgroundColor: "#FEF2F2",
          borderColor: Colors.light.destructive,
        };
      case "info":
        return {
          ...baseStyle,
          backgroundColor: softPalette.blue,
          borderColor: Colors.light.primary,
        };
      case "subtle":
        return {
          ...baseStyle,
          backgroundColor: Colors.light.foreground,
          borderColor: "transparent",
        };
      default:
        return baseStyle;
    }
  };

  const getToastIcon = (type: ToastType) => {
    const iconSize = isTablet ? 24 : 20;

    switch (type) {
      case "success":
        return <AntDesign name="check-circle" size={iconSize} color={Colors.light.success} />;
      case "error":
        return <Ionicons name="alert-circle" size={iconSize} color={Colors.light.destructive} />;
      case "info":
        return <AntDesign name="info-circle" size={iconSize} color={Colors.light.primary} />;
      default:
        return null;
    }
  };

  const getTextColor = (type: ToastType) => {
    switch (type) {
      case "subtle":
        return Colors.light.primaryForeground;
      default:
        return Colors.light.foreground;
    }
  };

  const dynamicStyles = StyleSheet.create({
    container: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: insets.bottom + spacing.md,
      flexDirection: "row",
      alignItems: "center",
      ...getToastStyle(toastConfig?.type || "subtle"),
    },
    iconContainer: {
      marginRight: spacing.sm,
    },
    message: {
      flex: 1,
      fontSize: fontSizes.base,
      fontWeight: Typography.fontWeights.medium,
      color: getTextColor(toastConfig?.type || "subtle"),
      fontFamily: Typography.fontFamily,
      textAlign: toastConfig?.type === "subtle" ? "center" : "left",
    },
  });

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toastConfig && (
        <Animated.View
          style={[
            dynamicStyles.container,
            { opacity: fadeAnim, transform: [{ translateY }] },
          ]}
        >
          {toastConfig.type !== "subtle" && (
            <View style={dynamicStyles.iconContainer}>
              {getToastIcon(toastConfig.type)}
            </View>
          )}
          <Text maxFontSizeMultiplier={1} style={dynamicStyles.message}>
            {toastConfig.message}
          </Text>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
}

export const Toast = {
  success: (message: string, duration?: number) => {
    if (ToastService.showToast) {
      ToastService.showToast({ message, type: "success", duration });
    } else {
      console.warn("Toast service not initialized. Make sure ToastProvider is mounted.");
    }
  },
  error: (message: string, duration?: number) => {
    if (ToastService.showToast) {
      ToastService.showToast({ message, type: "error", duration });
    } else {
      console.warn("Toast service not initialized. Make sure ToastProvider is mounted.");
    }
  },
  info: (message: string, duration?: number) => {
    if (ToastService.showToast) {
      ToastService.showToast({ message, type: "info", duration });
    } else {
      console.warn("Toast service not initialized. Make sure ToastProvider is mounted.");
    }
  },
  subtle: (message: string, duration?: number) => {
    if (ToastService.showToast) {
      ToastService.showToast({ message, type: "subtle", duration });
    } else {
      console.warn("Toast service not initialized. Make sure ToastProvider is mounted.");
    }
  },
};
