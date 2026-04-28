import React, { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useGetAnalytics } from "@/api/energy.service";
import BarChart from "@/components/charts/BarChart";
import CommonHeader from "@/components/headers/CommonHeader";
import { Typography, useResponsiveTokens } from "@/constants/theme";
import { useThemeColor } from "@/hooks/useThemeColor";
import type { AnalyticsPeriod } from "@/types/energy";

export default function AnalyticsScreen() {
  const theme = useThemeColor();
  const { top } = useSafeAreaInsets();
  const styles = useStyles();
  
  const [period, setPeriod] = useState<AnalyticsPeriod>("daily");
  const { data, isLoading } = useGetAnalytics(period);

  if (isLoading || !data) {
    return (
      <View style={[styles.container, { paddingTop: top, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  // Format data for Gifted Charts
  const chartData = data.data.map(item => ({
    value: item.units,
    label: item.label,
    frontColor: item.units === data.highest.units ? theme.primary : theme.primary + "60",
  }));

  const isPositiveChange = data.changePercent > 0;

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <CommonHeader title="Analytics" showBack={false} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Period Selector */}
        <View style={styles.periodSelector}>
          <PeriodButton title="Daily" isActive={period === "daily"} onPress={() => setPeriod("daily")} />
          <PeriodButton title="Weekly" isActive={period === "weekly"} onPress={() => setPeriod("weekly")} />
          <PeriodButton title="Monthly" isActive={period === "monthly"} onPress={() => setPeriod("monthly")} />
        </View>

        {/* Main Chart Card */}
        <View style={styles.chartCard}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>Energy Consumption</Text>
            <View style={[styles.changeBadge, { backgroundColor: isPositiveChange ? theme.destructive + "20" : theme.success + "20" }]}>
              <MaterialCommunityIcons 
                name={isPositiveChange ? "trending-up" : "trending-down"} 
                size={14} 
                color={isPositiveChange ? theme.destructive : theme.success} 
              />
              <Text style={[styles.changeText, { color: isPositiveChange ? theme.destructive : theme.success }]}>
                {Math.abs(data.changePercent)}%
              </Text>
            </View>
          </View>
          
          <Text style={styles.totalUnits}>{data.total} <Text style={styles.unitText}>kWh</Text></Text>
          <Text style={styles.subtitle}>Total this {period === "daily" ? "week" : period === "weekly" ? "month" : "year"}</Text>

          <View style={styles.chartWrapper}>
            <BarChart data={chartData} height={200} color={theme.primary} />
          </View>
        </View>

        {/* Insights Grid */}
        <Text style={styles.sectionTitle}>Insights</Text>
        <View style={styles.insightsGrid}>
          <InsightCard 
            title="Highest Usage" 
            value={data.highest.units.toString()} 
            unit="kWh" 
            label={data.highest.label} 
            icon="arrow-up-circle-outline" 
            color={theme.destructive} 
          />
          <InsightCard 
            title="Lowest Usage" 
            value={data.lowest.units.toString()} 
            unit="kWh" 
            label={data.lowest.label} 
            icon="arrow-down-circle-outline" 
            color={theme.success} 
          />
          <InsightCard 
            title="Average" 
            value={data.average.toString()} 
            unit="kWh" 
            label={`per ${period === "daily" ? "day" : period === "weekly" ? "week" : "month"}`} 
            icon="chart-bell-curve" 
            color={theme.info} 
          />
        </View>

      </ScrollView>
    </View>
  );
}

// Subcomponents

function PeriodButton({ title, isActive, onPress }: { title: string, isActive: boolean, onPress: () => void }) {
  const styles = useStyles();
  const theme = useThemeColor();
  
  return (
    <TouchableOpacity 
      style={[styles.periodButton, isActive && { backgroundColor: theme.primary }]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.periodText, isActive && { color: theme.primaryForeground, fontWeight: Typography.fontWeights.bold }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

function InsightCard({ title, value, unit, label, icon, color }: { title: string, value: string, unit: string, label: string, icon: string, color: string }) {
  const styles = useStyles();
  const theme = useThemeColor();
  
  return (
    <View style={styles.insightCard}>
      <View style={styles.insightHeader}>
        <MaterialCommunityIcons name={icon as any} size={20} color={color} />
        <Text style={styles.insightTitle}>{title}</Text>
      </View>
      <View style={styles.insightBody}>
        <Text style={styles.insightValue}>{value}</Text>
        <Text style={styles.insightUnit}>{unit}</Text>
      </View>
      <Text style={styles.insightLabel}>{label}</Text>
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
      marginBottom: spacing.xl,
      borderWidth: 0.5,
      borderColor: theme.border,
      ...shadows.sm,
    },
    chartHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: spacing.xs,
    },
    chartTitle: {
      fontSize: fontSizes.base,
      fontWeight: Typography.fontWeights.medium,
      color: theme.mutedForeground,
      fontFamily: Typography.fontFamily,
    },
    changeBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.full,
    },
    changeText: {
      fontSize: fontSizes.xs,
      fontWeight: Typography.fontWeights.bold,
      fontFamily: Typography.fontFamily,
    },
    totalUnits: {
      fontSize: 42,
      fontWeight: Typography.fontWeights.bold,
      color: theme.foreground,
      fontFamily: Typography.fontFamily,
    },
    unitText: {
      fontSize: fontSizes.lg,
      fontWeight: Typography.fontWeights.medium,
      color: theme.mutedForeground,
    },
    subtitle: {
      fontSize: fontSizes.sm,
      color: theme.mutedForeground,
      fontFamily: Typography.fontFamily,
      marginBottom: spacing.xl,
    },
    chartWrapper: {
      marginLeft: -10,
    },
    
    sectionTitle: {
      fontSize: fontSizes.h3,
      fontWeight: Typography.fontWeights.bold,
      color: theme.foreground,
      fontFamily: Typography.fontFamily,
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
    },
    insightsGrid: {
      paddingHorizontal: spacing.md,
      gap: spacing.md,
    },
    insightCard: {
      backgroundColor: theme.card,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 0.5,
      borderColor: theme.border,
      ...shadows.xs,
    },
    insightHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    insightTitle: {
      fontSize: fontSizes.sm,
      color: theme.mutedForeground,
      fontFamily: Typography.fontFamily,
      fontWeight: Typography.fontWeights.medium,
    },
    insightBody: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 4,
    },
    insightValue: {
      fontSize: fontSizes.h2,
      fontWeight: Typography.fontWeights.bold,
      color: theme.foreground,
      fontFamily: Typography.fontFamily,
    },
    insightUnit: {
      fontSize: fontSizes.sm,
      color: theme.mutedForeground,
      fontFamily: Typography.fontFamily,
    },
    insightLabel: {
      fontSize: fontSizes.xs,
      color: theme.primary,
      fontFamily: Typography.fontFamily,
      fontWeight: Typography.fontWeights.medium,
      marginTop: spacing.xxs,
    },
  });
}
