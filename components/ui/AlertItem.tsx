import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

import { ALERT_STYLES } from "@/constants/energyConstants";
import { Typography, useResponsiveTokens } from "@/constants/theme";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { AlertItem as AlertItemType } from "@/types/energy";
import { formatRelativeTime } from "@/utils/formatters";

interface AlertItemProps {
  alert: AlertItemType;
  style?: ViewStyle;
}

export default function AlertItem({ alert, style }: AlertItemProps) {
  const styles = useStyles();
  const alertStyle = ALERT_STYLES[alert.type];

  return (
    <View style={[styles.card, { borderLeftColor: alertStyle.color }, style]}>
      <View style={[styles.iconContainer, { backgroundColor: alertStyle.bgColor }]}>
        <MaterialCommunityIcons
          name={alertStyle.icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]}
          size={20} color={alertStyle.color}
        />
      </View>
      <View style={styles.content}>
        <Text style={styles.message}>{alert.msg}</Text>
        <Text style={styles.timestamp}>{formatRelativeTime(alert.timestamp)}</Text>
      </View>
      <View style={[styles.typeBadge, { backgroundColor: alertStyle.bgColor }]}>
        <Text style={[styles.typeText, { color: alertStyle.color }]}>{alertStyle.label}</Text>
      </View>
    </View>
  );
}

function useStyles() {
  const theme = useThemeColor();
  const { spacing, fontSizes, radius, shadows } = useResponsiveTokens();

  return StyleSheet.create({
    card: {
      flexDirection: "row", alignItems: "center", gap: spacing.sm,
      backgroundColor: theme.card, padding: spacing.md, borderRadius: radius.md,
      borderLeftWidth: 3, ...shadows.xs,
    },
    iconContainer: {
      width: 40, height: 40, borderRadius: radius.md,
      alignItems: "center", justifyContent: "center", flexShrink: 0,
    },
    content: { flex: 1 },
    message: {
      fontSize: fontSizes.base, fontWeight: Typography.fontWeights.medium,
      color: theme.foreground, fontFamily: Typography.fontFamily,
    },
    timestamp: {
      fontSize: fontSizes.xs, color: theme.mutedForeground,
      fontFamily: Typography.fontFamily, marginTop: spacing.xxs,
    },
    typeBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.full },
    typeText: { fontSize: fontSizes.xxs, fontWeight: Typography.fontWeights.semibold, fontFamily: Typography.fontFamily },
  });
}
