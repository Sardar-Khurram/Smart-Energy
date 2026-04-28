import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Href, router } from "expo-router";
import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGetDashboardData } from "@/api/energy.service";
import HeroCard from "@/components/dashboard/HeroCard";
import QuickActions from "@/components/dashboard/QuickActions";
import MiniSparkline from "@/components/charts/MiniSparkline";
import MetricCard from "@/components/ui/MetricCard";
import { METRIC_COLORS } from "@/constants/energyConstants";
import { palette, PRIMARY_GRADIENT, Typography, useResponsiveTokens } from "@/constants/theme";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency, formatUnits } from "@/utils/formatters";

const QUICK_ACTIONS = [
  {
    id: "bill", title: "Bill Prediction", subtitle: "Monthly estimate",
    icon: "cash-multiple" as const, gradient: [palette.voltYellowDark, palette.voltYellow] as [string, string],
    route: "/(tabs)/bill" as Href,
  },
  {
    id: "devices", title: "Devices", subtitle: "Appliance usage",
    icon: "power-plug" as const, gradient: [palette.purple, palette.blue400] as [string, string],
    route: "/(tabs)/devices" as Href,
  },
  {
    id: "sensors", title: "Sensors", subtitle: "Hardware status",
    icon: "chip" as const, gradient: [palette.cyan500, palette.cyan400] as [string, string],
    route: "/(tabs)/sensors" as Href,
  },
  {
    id: "tips", title: "AI Tips", subtitle: "Save electricity",
    icon: "lightbulb-on-outline" as const, gradient: [palette.safeGreenDark, palette.safeGreen] as [string, string],
    route: "/(tabs)/bill" as Href,
  },
];

// Mock sparkline data
const SPARK_DATA = [420, 450, 430, 482, 500, 470, 490, 510, 480, 495, 520, 505];

export default function DashboardScreen() {
  const theme = useThemeColor();
  const { top } = useSafeAreaInsets();
  const styles = useStyles();
  const { data, isLoading } = useGetDashboardData();

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const formatDate = () =>
    new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  if (isLoading || !data) {
    return (
      <View style={[styles.container, { paddingTop: top, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{getGreeting()}</Text>
            <Text style={styles.dateText}>{formatDate()}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconButton}>
              <Ionicons name="notifications-outline" size={22} color={theme.foreground} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Card */}
        <HeroCard data={data} />

        {/* Today's Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Today's Summary</Text>
            <MiniSparkline data={SPARK_DATA} color={theme.primary} width={80} height={24} />
          </View>
          <View style={styles.metricsGrid}>
            <View style={styles.metricWrapper}>
              <MetricCard
                title="Units Used" value={formatUnits(data.todayUnits).split(" ")[0]}
                unit="kWh" icon={METRIC_COLORS.units.icon} color={METRIC_COLORS.units.color} bgColor={METRIC_COLORS.units.bg}
              />
            </View>
            <View style={styles.metricWrapper}>
              <MetricCard
                title="Est. Bill" value={formatCurrency(data.estimatedBill).replace("Rs. ", "")}
                unit="Rs." icon={METRIC_COLORS.bill.icon} color={METRIC_COLORS.bill.color} bgColor={METRIC_COLORS.bill.bg}
              />
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <QuickActions actions={QUICK_ACTIONS} />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

function useStyles() {
  const theme = useThemeColor();
  const { spacing, fontSizes, radius, shadows } = useResponsiveTokens();

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollContent: { paddingBottom: spacing["2xl"] },
    header: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center",
      paddingHorizontal: spacing.md, paddingVertical: spacing.md,
    },
    headerLeft: { gap: spacing.xxs },
    greeting: {
      fontSize: fontSizes.h2, fontWeight: Typography.fontWeights.bold,
      color: theme.foreground, fontFamily: Typography.fontFamily,
    },
    dateText: { fontSize: fontSizes.sm, color: theme.mutedForeground, fontFamily: Typography.fontFamily },
    headerRight: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
    iconButton: {
      width: 42, height: 42, borderRadius: radius.md, backgroundColor: theme.card,
      borderWidth: 0.5, borderColor: theme.border, alignItems: "center", justifyContent: "center",
    },
    notifDot: {
      position: "absolute", top: 10, right: 10, width: 8, height: 8,
      borderRadius: radius.full, backgroundColor: theme.destructive, borderWidth: 1.5, borderColor: theme.card,
    },
    section: { paddingHorizontal: spacing.md, marginBottom: spacing.lg },
    sectionHeader: {
      flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: spacing.md,
    },
    sectionTitle: {
      fontSize: fontSizes.h3, fontWeight: Typography.fontWeights.bold,
      color: theme.foreground, fontFamily: Typography.fontFamily,
    },
    metricsGrid: { flexDirection: "row", gap: spacing.sm },
    metricWrapper: { flex: 1 },
  });
}
