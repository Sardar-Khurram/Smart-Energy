import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useCallback, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGetAnalytics } from "@/api/energy.service";
import BarChart from "@/components/charts/BarChart";
import CommonHeader from "@/components/headers/CommonHeader";
import { Typography, useResponsiveTokens } from "@/constants/theme";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { AnalyticsPeriod, AnalyticsSummary, MetricGraphData } from "@/types/energy";

const ALL_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const WEEK_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
// Matches the backend: ceil(days in current month / 7) weeks (4 or 5)
const MONTH_WEEKS = Array.from(
  { length: Math.ceil(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() / 7) },
  (_, i) => `Week ${i + 1}`,
);

function getEmptyAnalyticsData(period: AnalyticsPeriod): AnalyticsSummary {
  const labels = period === "daily" ? WEEK_DAYS : period === "weekly" ? MONTH_WEEKS : ALL_MONTHS;
  const buildEmptyMetric = (
    title: string,
    unit: string,
    color: string,
    icon: string,
    hasTotal = false,
  ): MetricGraphData => ({
    title,
    unit,
    color,
    icon,
    average: 0,
    ...(hasTotal ? { total: 0 } : {}),
    data: labels.map((label) => ({ label, units: 0 })),
  });

  return {
    period,
    energy: buildEmptyMetric("Energy Consumption", "kWh", "#10B981", "lightning-bolt", true),
    voltage: buildEmptyMetric("Voltage", "V", "#3B82F6", "flash"),
    current: buildEmptyMetric("Current", "A", "#F59E0B", "current-ac"),
    temperature: buildEmptyMetric("Temperature", "°C", "#EF4444", "thermometer"),
  };
}

export default function AnalyticsScreen() {
  const theme = useThemeColor();
  const { top } = useSafeAreaInsets();
  const styles = useStyles();

  const [period, setPeriod] = useState<AnalyticsPeriod>("daily");
  const { data, isLoading, isError, refetch, isRefetching } = useGetAnalytics(period);

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const fallbackData = React.useMemo(() => getEmptyAnalyticsData(period), [period]);
  const displayData = data || fallbackData;
  const isOffline = Boolean(isError || (!data && !isLoading));

  // Only block on cold start if actively loading and no fallback/cached data is ready
  if (isLoading && !data) {
    return (
      <View style={[styles.container, { paddingTop: top }]}>
        <CommonHeader title="Analytics" showBack={false} />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <CommonHeader title="Analytics" showBack={false} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
      >
        {/* Offline / Standby Notice Banner */}
        {isOffline && (
          <View style={styles.fallbackNotice}>
            <MaterialCommunityIcons
              name="cloud-sync-outline"
              size={18}
              color={theme.primary}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.fallbackNoticeTitle}>Hardware Standby Mode</Text>
              <Text style={styles.fallbackNoticeText}>
                Device offline or backend unreachable. Showing standby readings.
              </Text>
            </View>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={onRefresh}
              activeOpacity={0.7}
              disabled={isRefetching}
            >
              <Text style={styles.retryButtonText}>
                {isRefetching ? "Syncing..." : "Refresh"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <PeriodButton title="Daily" isActive={period === "daily"} onPress={() => setPeriod("daily")} />
          <PeriodButton title="Weekly" isActive={period === "weekly"} onPress={() => setPeriod("weekly")} />
          <PeriodButton title="Monthly" isActive={period === "monthly"} onPress={() => setPeriod("monthly")} />
        </View>

        {/* Weekly Month Indicator Banner */}
        {period === "weekly" && (
          <View style={styles.weeklyBanner}>
            <MaterialCommunityIcons name="calendar-month-outline" size={18} color={theme.primary} />
            <Text style={styles.weeklyBannerText}>
              Showing Weekly Breakdown for{" "}
              <Text style={{ fontWeight: Typography.fontWeights.bold, color: theme.primary }}>
                {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
              </Text>
            </Text>
          </View>
        )}

        {/* Monthly Notice Banner */}
        {period === "monthly" && (
          <View style={styles.monthlyNotice}>
            <MaterialCommunityIcons name="information-outline" size={18} color={theme.primary} />
            <Text style={styles.monthlyNoticeText}>
              Showing all 12 months. Only months with recorded readings display bars.
            </Text>
          </View>
        )}

        {/* 4 Analytics Graph Cards */}
        <MetricGraphCard metric={displayData.energy} period={period} />
        <MetricGraphCard metric={displayData.voltage} period={period} />
        <MetricGraphCard metric={displayData.current} period={period} />
        <MetricGraphCard metric={displayData.temperature} period={period} />

        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Subcomponents
// ─────────────────────────────────────────────────────────────────────────────

function PeriodButton({
  title,
  isActive,
  onPress,
}: {
  title: string;
  isActive: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  const theme = useThemeColor();

  return (
    <TouchableOpacity
      style={[styles.periodButton, isActive && { backgroundColor: theme.primary }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.periodText,
          isActive && { color: theme.primaryForeground, fontWeight: Typography.fontWeights.bold },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

function MetricGraphCard({
  metric,
  period,
}: {
  metric: MetricGraphData;
  period: AnalyticsPeriod;
}) {
  const styles = useStyles();
  const theme = useThemeColor();

  // Format data for Gifted Charts (value 0 renders as empty space/no bar)
  const chartData = (metric?.data || []).map((item) => ({
    value: Number((item?.units ?? 0).toFixed(2)),
    label: item?.label || "",
    frontColor: metric?.color || theme.primary,
  }));

  const currentMonthFull = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
  const currentMonthShort = new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" });
  const currentYear = new Date().getFullYear();

  const timeframeSubtitle =
    period === "weekly"
      ? `Weeks of ${currentMonthFull}`
      : period === "daily"
        ? "Days of Current Week (Mon – Sun)"
        : `Year ${currentYear} (Jan – Dec)`;

  const periodLabel =
    period === "daily" ? "/ day" : period === "weekly" ? "/ week" : "/ month";

  return (
    <View style={styles.chartCard}>
      {/* Card Header */}
      <View style={styles.chartHeader}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBox, { backgroundColor: (metric?.color || theme.primary) + "20" }]}>
            <MaterialCommunityIcons name={(metric?.icon || "chart-bar") as any} size={20} color={metric?.color || theme.primary} />
          </View>
          <View>
            <Text style={styles.chartTitle}>{metric?.title || ""}</Text>
            <View style={styles.subtitleRow}>
              {period === "weekly" && (
                <MaterialCommunityIcons name="calendar" size={13} color={metric?.color || theme.primary} style={{ marginRight: 3 }} />
              )}
              <Text
                style={[
                  styles.cardSubtitle,
                  period === "weekly" && { color: theme.foreground, fontWeight: "600" },
                ]}
              >
                {timeframeSubtitle}
              </Text>
            </View>
          </View>
        </View>
        <View style={[styles.badge, { backgroundColor: (metric?.color || theme.primary) + "20" }]}>
          <Text style={[styles.badgeText, { color: metric?.color || theme.primary }]}>{metric?.unit || ""}</Text>
        </View>
      </View>

      {/* BarChart (automatic responsive widths for 4 weeks, 7 days, and 12 months) */}
      <View style={styles.chartWrapper}>
        <BarChart
          data={chartData}
          height={170}
          color={metric?.color || theme.primary}
        />
      </View>

      {/* Card Footer: Prominently displaying Average */}
      <View style={styles.cardFooter}>
        <View style={styles.footerRow}>
          <MaterialCommunityIcons name="chart-bell-curve" size={18} color={metric?.color || theme.primary} />
          <Text style={styles.footerLabel}>Average:</Text>
          <Text style={styles.footerValue}>
            {Number(metric?.average || 0).toFixed(2)}{" "}
            <Text style={styles.footerUnit}>
              {metric?.unit || ""} {periodLabel}
            </Text>
          </Text>
        </View>

        {period === "weekly" ? (
          <View style={[styles.monthPill, { backgroundColor: (metric?.color || theme.primary) + "18" }]}>
            <MaterialCommunityIcons name="calendar-range" size={12} color={metric?.color || theme.primary} />
            <Text style={[styles.monthPillText, { color: metric?.color || theme.primary }]}>{currentMonthShort}</Text>
          </View>
        ) : metric?.total !== undefined && metric?.unit === "kWh" ? (
          <Text style={styles.footerTotal}>
            Total: {Number(metric.total).toFixed(2)} {metric.unit}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function useStyles() {
  const theme = useThemeColor();
  const { spacing, fontSizes, radius, shadows } = useResponsiveTokens();

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollContent: { paddingBottom: spacing["2xl"], paddingTop: spacing.md },

    periodSelector: {
      flexDirection: "row",
      backgroundColor: theme.card,
      marginHorizontal: spacing.md,
      borderRadius: radius.full,
      padding: 4,
      marginBottom: spacing.lg,
      borderWidth: 0.5,
      borderColor: theme.border,
    },
    periodButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      alignItems: "center",
      borderRadius: radius.full,
    },
    periodText: {
      fontSize: fontSizes.sm,
      color: theme.mutedForeground,
      fontFamily: Typography.fontFamily,
      fontWeight: Typography.fontWeights.medium,
    },

    chartCard: {
      backgroundColor: theme.card,
      marginHorizontal: spacing.md,
      borderRadius: radius.xl,
      padding: spacing.lg,
      marginBottom: spacing.lg,
      borderWidth: 0.5,
      borderColor: theme.border,
      ...shadows.sm,
    },
    chartHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.md,
    },
    headerLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    iconBox: {
      width: 36,
      height: 36,
      borderRadius: radius.md,
      justifyContent: "center",
      alignItems: "center",
    },
    chartTitle: {
      fontSize: fontSizes.base,
      fontWeight: Typography.fontWeights.bold,
      color: theme.foreground,
      fontFamily: Typography.fontFamily,
    },
    cardSubtitle: {
      fontSize: fontSizes.xs,
      color: theme.mutedForeground,
      fontFamily: Typography.fontFamily,
      marginTop: 1,
    },
    badge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.full,
    },
    badgeText: {
      fontSize: fontSizes.xs,
      fontWeight: Typography.fontWeights.bold,
      fontFamily: Typography.fontFamily,
    },

    chartWrapper: {
      marginLeft: -10,
      marginVertical: spacing.xs,
    },

    cardFooter: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginTop: spacing.md,
      paddingTop: spacing.md,
      borderTopWidth: 0.5,
      borderTopColor: theme.border,
    },
    footerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    footerLabel: {
      fontSize: fontSizes.sm,
      color: theme.mutedForeground,
      fontFamily: Typography.fontFamily,
      fontWeight: Typography.fontWeights.medium,
    },
    footerValue: {
      fontSize: fontSizes.base,
      fontWeight: Typography.fontWeights.bold,
      color: theme.foreground,
      fontFamily: Typography.fontFamily,
    },
    footerUnit: {
      fontSize: fontSizes.xs,
      color: theme.mutedForeground,
      fontFamily: Typography.fontFamily,
      fontWeight: Typography.fontWeights.medium,
    },
    footerTotal: {
      fontSize: fontSizes.xs,
      fontWeight: Typography.fontWeights.bold,
      color: theme.mutedForeground,
      fontFamily: Typography.fontFamily,
    },
    weeklyBanner: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      backgroundColor: theme.primary + "15",
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.lg,
      borderWidth: 0.5,
      borderColor: theme.primary + "30",
    },
    weeklyBannerText: {
      fontSize: fontSizes.xs,
      color: theme.foreground,
      fontFamily: Typography.fontFamily,
      flex: 1,
    },
    monthlyNotice: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      backgroundColor: theme.card,
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.lg,
      borderWidth: 0.5,
      borderColor: theme.border,
    },
    monthlyNoticeText: {
      fontSize: fontSizes.xs,
      color: theme.mutedForeground,
      fontFamily: Typography.fontFamily,
      flex: 1,
    },
    subtitleRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 2,
    },
    monthPill: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.full,
    },
    monthPillText: {
      fontSize: fontSizes.xs,
      fontWeight: Typography.fontWeights.bold,
      fontFamily: Typography.fontFamily,
    },
    fallbackNotice: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      backgroundColor: theme.card,
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 0.5,
      borderColor: theme.border,
      ...shadows.xs,
    },
    fallbackNoticeTitle: {
      fontSize: fontSizes.xs,
      fontWeight: Typography.fontWeights.bold,
      color: theme.foreground,
      fontFamily: Typography.fontFamily,
    },
    fallbackNoticeText: {
      fontSize: fontSizes.xxs,
      color: theme.mutedForeground,
      fontFamily: Typography.fontFamily,
      marginTop: 2,
    },
    retryButton: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
      backgroundColor: theme.primary + "18",
      borderRadius: radius.sm,
      borderWidth: 0.5,
      borderColor: theme.primary + "30",
    },
    retryButtonText: {
      fontSize: fontSizes.xs,
      fontWeight: Typography.fontWeights.bold,
      color: theme.primary,
      fontFamily: Typography.fontFamily,
    },
  });
}
