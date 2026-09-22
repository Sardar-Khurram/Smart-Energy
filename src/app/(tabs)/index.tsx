import { Ionicons } from "@expo/vector-icons";
import { Href, router } from "expo-router";
import React, { useCallback } from "react";
import { ActivityIndicator, Image, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSettingsStore } from "@/store/useSettingsStore";

import { useFirebaseLiveData, useGetDashboardData } from "@/api/energy.service";
import HeroCard from "@/components/dashboard/HeroCard";
import QuickActions from "@/components/dashboard/QuickActions";
import MetricCard from "@/components/ui/MetricCard";
import { METRIC_COLORS } from "@/constants/energyConstants";
import { palette, Typography, useResponsiveTokens } from "@/constants/theme";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/utils/formatters";

const QUICK_ACTIONS = [
  {
    id: "bill", title: "Bill Prediction", subtitle: "Monthly estimate",
    icon: "cash-multiple" as const, gradient: [palette.voltYellowDark, palette.voltYellow] as [string, string],
    route: { pathname: "/(tabs)/bill", params: { mode: "bill" } } as Href,
  },
  // {
  //   id: "devices", title: "Devices", subtitle: "Appliance usage",
  //   icon: "power-plug" as const, gradient: [palette.purple, palette.blue400] as [string, string],
  //   route: "/(tabs)/devices" as Href,
  // },
  {
    id: "sensors", title: "Sensors", subtitle: "Hardware status",
    icon: "chip" as const, gradient: [palette.cyan500, palette.cyan400] as [string, string],
    route: "/(tabs)/sensors" as Href,
  },
  // {
  //   id: "alerts", title: "Alerts", subtitle: "System alerts",
  //   icon: "bell-outline" as const, gradient: [palette.safeGreenDark, palette.safeGreen] as [string, string],
  //   route: "/(tabs)/alerts" as Href,
  // },
];

export default function DashboardScreen() {
  const theme = useThemeColor();
  const { top } = useSafeAreaInsets();
  const styles = useStyles();
  
  const { profileImage, profileName } = useSettingsStore();
  const initial = (profileName?.trim()?.[0] || "U").toUpperCase();
  
  // Fetch slow/calculated data from API
  const { data: apiData, isLoading: isApiLoading, refetch, isRefetching } = useGetDashboardData();
  
  // Fetch real-time sensor data from Firebase
  const { data: liveData, isLoading: isFirebaseLoading } = useFirebaseLiveData("energy");

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  // Merge them: prioritize live data for metrics just like live.tsx
  const data = React.useMemo(() => {
    const isOnline = Boolean(liveData || apiData?.status === "online");
    return {
      voltage: liveData?.voltage ?? apiData?.voltage ?? 0,
      current: liveData?.current ?? apiData?.current ?? 0,
      power: liveData?.power ?? apiData?.power ?? 0,
      temperature: liveData?.temperature ?? apiData?.temperature ?? 0,
      todayUnits: apiData?.todayUnits ?? 0,
      monthUnits: apiData?.monthUnits ?? 0,
      estimatedBill: apiData?.estimatedBill ?? 0,
      currentBill: apiData?.currentBill ?? 0,
      status: isOnline ? ("online" as const) : ("offline" as const),
    };
  }, [apiData, liveData]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    const timeGreeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
    const name = profileName?.trim();
    return name ? `${timeGreeting}, ${name}` : timeGreeting;
  };

  const formatDate = () =>
    new Date().toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" });

  const isInitialLoading = isApiLoading && isFirebaseLoading && !apiData && !liveData;

  if (isInitialLoading) {
    return (
      <View style={[styles.container, { paddingTop: top, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: top }]}>
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting} numberOfLines={1}>{getGreeting()}</Text>
            <Text style={styles.dateText}>{formatDate()}</Text>
          </View>
          <View style={styles.headerRight}>
            <TouchableOpacity 
              style={styles.iconButton}
              onPress={() => router.push("/(tabs)/alerts")}
              activeOpacity={0.7}
            >
              <Ionicons name="notifications-outline" size={22} color={theme.foreground} />
              <View style={styles.notifDot} />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.profileBtn}
              onPress={() => router.push("/(tabs)/settings")}
              activeOpacity={0.8}
            >
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarInitial}>{initial}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Card */}
        <HeroCard data={data} />

        {/* Today's Summary */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{"Today's Summary"}</Text>
          </View>
          <View style={styles.metricsGrid}>
            <View style={styles.metricWrapper}>
              <MetricCard
                title="Current Bill"
                subtitle="Till today"
                value={formatCurrency(data.currentBill).replace("Rs. ", "")}
                unit="Rs."
                icon={METRIC_COLORS.currentBill.icon}
                color={METRIC_COLORS.currentBill.color}
                bgColor={METRIC_COLORS.currentBill.bg}
                onPress={() => router.push({ pathname: "/(tabs)/bill", params: { mode: "bill" } } as any)}
              />
            </View>
            <View style={styles.metricWrapper}>
              <MetricCard
                title="Est. Bill"
                subtitle="End of month"
                value={formatCurrency(data.estimatedBill).replace("Rs. ", "")}
                unit="Rs."
                icon={METRIC_COLORS.bill.icon}
                color={METRIC_COLORS.bill.color}
                bgColor={METRIC_COLORS.bill.bg}
                onPress={() => router.push({ pathname: "/(tabs)/bill", params: { mode: "bill" } } as any)}
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
    headerLeft: { gap: spacing.xxs, flex: 1, marginRight: spacing.sm },
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
    profileBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: theme.card,
      borderWidth: 1.5,
      borderColor: theme.primary,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarImg: {
      width: "100%",
      height: "100%",
    },
    avatarPlaceholder: {
      width: "100%",
      height: "100%",
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarInitial: {
      fontSize: fontSizes.base,
      fontWeight: Typography.fontWeights.bold,
      color: theme.primaryForeground,
      fontFamily: Typography.fontFamily,
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
