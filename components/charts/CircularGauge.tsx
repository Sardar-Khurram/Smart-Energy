import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { Typography, useResponsiveTokens } from "@/constants/theme";
import { useThemeColor } from "@/hooks/useThemeColor";

interface CircularGaugeProps {
  value: number;
  max: number;
  unit: string;
  label: string;
  color: string;
  size?: number;
  strokeWidth?: number;
  style?: ViewStyle;
}

export default function CircularGauge({
  value, max, unit, label, color, size = 120, strokeWidth = 10, style,
}: CircularGaugeProps) {
  const styles = useStyles();
  const theme = useThemeColor();

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min(value / max, 1);
  const strokeDashoffset = circumference * (1 - percentage);

  return (
    <View style={[styles.container, style]}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={theme.muted} strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2} cy={size / 2} r={radius}
          stroke={color} strokeWidth={strokeWidth}
          fill="transparent" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          rotation="-90" origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={[styles.labelContainer, { width: size, height: size }]}>
        <Text style={[styles.value, { color }]}>{Math.round(value)}</Text>
        <Text style={styles.unit}>{unit}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

function useStyles() {
  const theme = useThemeColor();
  const { fontSizes, spacing } = useResponsiveTokens();

  return StyleSheet.create({
    container: { alignItems: "center" },
    labelContainer: {
      position: "absolute", top: 0, alignItems: "center", justifyContent: "center",
    },
    value: {
      fontSize: fontSizes.h2, fontWeight: Typography.fontWeights.bold, fontFamily: Typography.fontFamily,
    },
    unit: {
      fontSize: fontSizes.xs, color: theme.mutedForeground, fontFamily: Typography.fontFamily,
    },
    label: {
      fontSize: fontSizes.sm, color: theme.foreground, fontWeight: Typography.fontWeights.medium,
      fontFamily: Typography.fontFamily, marginTop: spacing.sm,
    },
  });
}
