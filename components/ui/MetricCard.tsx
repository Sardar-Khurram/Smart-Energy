import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";

import { Typography, useResponsiveTokens } from "@/constants/theme";
import { useThemeColor } from "@/hooks/useThemeColor";

interface MetricCardProps {
  title: string;
  value: string;
  unit: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  color: string;
  bgColor: string;
  onPress?: () => void;
  style?: ViewStyle;
}

export default function MetricCard({ title, value, unit, icon, color, bgColor, onPress, style }: MetricCardProps) {
  const styles = useStyles();
  const theme = useThemeColor();

  const content = (
    <View style={[styles.card, { backgroundColor: bgColor }, style]}>
      <View style={[styles.iconContainer, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={icon} size={20} color={theme.primaryForeground} />
      </View>
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.unit}>{unit}</Text>
      <Text style={styles.title}>{title}</Text>
    </View>
  );

  if (onPress) {
    return <TouchableOpacity activeOpacity={0.85} onPress={onPress}>{content}</TouchableOpacity>;
  }
  return content;
}

function useStyles() {
  const theme = useThemeColor();
  const { spacing, fontSizes, radius } = useResponsiveTokens();

  return StyleSheet.create({
    card: { padding: spacing.md, borderRadius: radius.lg, minHeight: 120 },
    iconContainer: {
      width: 36, height: 36, borderRadius: radius.md,
      alignItems: "center", justifyContent: "center", marginBottom: spacing.sm,
    },
    value: { fontSize: fontSizes.h2, fontWeight: Typography.fontWeights.bold, fontFamily: Typography.fontFamily },
    unit: { fontSize: fontSizes.xs, color: theme.mutedForeground, fontFamily: Typography.fontFamily, marginTop: spacing.xxs },
    title: {
      fontSize: fontSizes.sm, color: theme.foreground, fontWeight: Typography.fontWeights.medium,
      fontFamily: Typography.fontFamily, marginTop: spacing.xs,
    },
  });
}
