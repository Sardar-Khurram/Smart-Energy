import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import LivePulse from "@/components/dashboard/LivePulse";
import { METRIC_COLORS } from "@/constants/energyConstants";
import { palette, PRIMARY_GRADIENT, Typography, useResponsiveTokens } from "@/constants/theme";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { DashboardData } from "@/types/energy";
import { formatCurrent, formatTemp, formatVoltage, formatWatts } from "@/utils/formatters";

interface HeroCardProps {
  data: DashboardData;
}

export default function HeroCard({ data }: HeroCardProps) {
  const styles = useStyles();
  const theme = useThemeColor();

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={[PRIMARY_GRADIENT.start, PRIMARY_GRADIENT.end]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Top row: label + live pulse */}
        <View style={styles.topRow}>
          <Text style={styles.label}>Live Power Consumption</Text>
          <LivePulse />
        </View>

        {/* Main power value */}
        <View style={styles.powerRow}>
          <Text style={styles.powerValue}>{formatWatts(data.power)}</Text>
        </View>

        {/* 3 mini metrics row */}
        <View style={styles.metricsRow}>
          <MiniMetric icon={METRIC_COLORS.voltage.icon} value={formatVoltage(data.voltage)} label="Voltage" />
          <View style={styles.divider} />
          <MiniMetric icon={METRIC_COLORS.current.icon} value={formatCurrent(data.current)} label="Current" />
          <View style={styles.divider} />
          <MiniMetric icon={METRIC_COLORS.temperature.icon} value={formatTemp(data.temperature)} label="Temp" />
        </View>

        {/* Decorative circles */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
      </LinearGradient>
    </View>
  );
}

function MiniMetric({ icon, value, label }: { icon: string; value: string; label: string }) {
  const styles = useStyles();
  return (
    <View style={styles.miniMetric}>
      <MaterialCommunityIcons
        name={icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]}
        size={16} color={palette.white + "CC"}
      />
      <Text style={styles.miniValue}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

function useStyles() {
  const theme = useThemeColor();
  const { spacing, fontSizes, radius, shadows } = useResponsiveTokens();

  return StyleSheet.create({
    wrapper: { marginHorizontal: spacing.md, marginBottom: spacing.lg, borderRadius: radius.xl, overflow: "hidden", ...shadows.md },
    gradient: { padding: spacing.lg, minHeight: 200, position: "relative", overflow: "hidden" },
    topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    label: { fontSize: fontSizes.sm, color: palette.white + "CC", fontFamily: Typography.fontFamily },
    powerRow: { marginTop: spacing.md, marginBottom: spacing.lg },
    powerValue: {
      fontSize: 56, fontWeight: Typography.fontWeights.extrabold,
      color: palette.white, fontFamily: Typography.fontFamily,
    },
    metricsRow: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-around",
      backgroundColor: palette.white + "15", borderRadius: radius.md,
      paddingVertical: spacing.sm, paddingHorizontal: spacing.sm,
    },
    miniMetric: { alignItems: "center", gap: spacing.xxs, flex: 1 },
    miniValue: {
      fontSize: fontSizes.base, fontWeight: Typography.fontWeights.bold,
      color: palette.white, fontFamily: Typography.fontFamily,
    },
    miniLabel: { fontSize: fontSizes.xxs, color: palette.white + "99", fontFamily: Typography.fontFamily },
    divider: { width: 1, height: 32, backgroundColor: palette.white + "25" },
    decorCircle1: {
      position: "absolute", top: -40, right: -40, width: 120, height: 120,
      borderRadius: 60, backgroundColor: palette.white + "10",
    },
    decorCircle2: {
      position: "absolute", bottom: -30, left: -30, width: 100, height: 100,
      borderRadius: 50, backgroundColor: palette.white + "08",
    },
  });
}
