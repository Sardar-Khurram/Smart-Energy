import React, { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";

import { Typography, useResponsiveTokens } from "@/constants/theme";
import { useThemeColor } from "@/hooks/useThemeColor";

interface LivePulseProps {
  label?: string;
}

export default function LivePulse({ label = "LIVE" }: LivePulseProps) {
  const styles = useStyles();
  const theme = useThemeColor();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    scale.value = withRepeat(
      withTiming(1.5, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    opacity.value = withRepeat(
      withTiming(0.3, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <View style={styles.container}>
      <View style={styles.dotWrapper}>
        <Animated.View style={[styles.pulseRing, { backgroundColor: theme.success }, pulseStyle]} />
        <View style={[styles.dot, { backgroundColor: theme.success }]} />
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function useStyles() {
  const theme = useThemeColor();
  const { spacing, fontSizes, radius } = useResponsiveTokens();

  return StyleSheet.create({
    container: {
      flexDirection: "row", alignItems: "center", gap: spacing.xs,
      backgroundColor: theme.success + "18", paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs, borderRadius: radius.full,
    },
    dotWrapper: { width: 12, height: 12, alignItems: "center", justifyContent: "center" },
    pulseRing: { position: "absolute", width: 12, height: 12, borderRadius: 6 },
    dot: { width: 6, height: 6, borderRadius: 3 },
    label: {
      fontSize: fontSizes.xxs, fontWeight: Typography.fontWeights.bold,
      color: theme.success, fontFamily: Typography.fontFamily, letterSpacing: 1,
    },
  });
}
