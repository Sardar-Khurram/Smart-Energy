import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { Typography, useResponsiveTokens } from "@/constants/theme";
import { useThemeColor } from "@/hooks/useThemeColor";

interface StatusBadgeProps {
  status: "online" | "offline";
  label?: string;
}

export default function StatusBadge({ status, label }: StatusBadgeProps) {
  const styles = useStyles();
  const theme = useThemeColor();
  const isOnline = status === "online";

  return (
    <View style={[styles.badge, { backgroundColor: isOnline ? theme.success + "18" : theme.destructive + "18" }]}>
      <View style={[styles.dot, { backgroundColor: isOnline ? theme.success : theme.destructive }]} />
      <Text style={[styles.label, { color: isOnline ? theme.success : theme.destructive }]}>
        {label || (isOnline ? "Online" : "Offline")}
      </Text>
    </View>
  );
}

function useStyles() {
  const { spacing, fontSizes, radius } = useResponsiveTokens();

  return StyleSheet.create({
    badge: {
      flexDirection: "row", alignItems: "center", gap: spacing.xs,
      paddingHorizontal: spacing.sm, paddingVertical: spacing.xs,
      borderRadius: radius.full, alignSelf: "flex-start",
    },
    dot: { width: 8, height: 8, borderRadius: 4 },
    label: { fontSize: fontSizes.xs, fontWeight: Typography.fontWeights.medium, fontFamily: Typography.fontFamily },
  });
}
