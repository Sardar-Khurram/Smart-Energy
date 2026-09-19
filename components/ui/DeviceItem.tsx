import { MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

import { DEVICE_ICONS } from "@/constants/energyConstants";
import { Typography, useResponsiveTokens } from "@/constants/theme";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { DeviceUsage } from "@/types/energy";
import { formatWatts } from "@/utils/formatters";

interface DeviceItemProps {
  device: DeviceUsage;
  totalPower: number;
  style?: ViewStyle;
}

export default function DeviceItem({ device, totalPower, style }: DeviceItemProps) {
  const styles = useStyles();
  const theme = useThemeColor();
  const percentage = totalPower > 0 ? (device.power / totalPower) * 100 : 0;
  const iconName = device.icon || DEVICE_ICONS[device.device] || DEVICE_ICONS.Default;

  return (
    <View style={[styles.card, style]}>
      <View style={[styles.iconContainer, { backgroundColor: device.isOn ? theme.primary + "18" : theme.muted }]}>
        <MaterialCommunityIcons
          name={iconName as React.ComponentProps<typeof MaterialCommunityIcons>["name"]}
          size={22} color={device.isOn ? theme.primary : theme.mutedForeground}
        />
      </View>
      <View style={styles.content}>
        <View style={styles.row}>
          <Text style={styles.name}>{device.device}</Text>
          <Text style={[styles.power, { color: device.isOn ? theme.foreground : theme.mutedForeground }]}>
            {formatWatts(device.power)}
          </Text>
        </View>
        <View style={styles.progressTrack}>
          <View style={[styles.progressBar, { width: `${percentage}%`, backgroundColor: theme.primary }]} />
        </View>
        <Text style={styles.percentText}>{percentage.toFixed(1)}% of total</Text>
      </View>
    </View>
  );
}

function useStyles() {
  const theme = useThemeColor();
  const { spacing, fontSizes, radius } = useResponsiveTokens();

  return StyleSheet.create({
    card: { flexDirection: "row", alignItems: "center", gap: spacing.md, paddingVertical: spacing.sm },
    iconContainer: {
      width: 44, height: 44, borderRadius: radius.md,
      alignItems: "center", justifyContent: "center", flexShrink: 0,
    },
    content: { flex: 1 },
    row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    name: { fontSize: fontSizes.base, fontWeight: Typography.fontWeights.medium, color: theme.foreground, fontFamily: Typography.fontFamily },
    power: { fontSize: fontSizes.base, fontWeight: Typography.fontWeights.bold, fontFamily: Typography.fontFamily },
    progressTrack: {
      height: 6, backgroundColor: theme.muted, borderRadius: radius.full,
      marginTop: spacing.xs, overflow: "hidden",
    },
    progressBar: { height: "100%", borderRadius: radius.full },
    percentText: { fontSize: fontSizes.xs, color: theme.mutedForeground, fontFamily: Typography.fontFamily, marginTop: spacing.xxs },
  });
}
