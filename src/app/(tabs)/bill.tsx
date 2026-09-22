import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGetBillPrediction } from "@/api/energy.service";
import CommonHeader from "@/components/headers/CommonHeader";
import { palette, Typography, useResponsiveTokens } from "@/constants/theme";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useSettingsStore } from "@/store/useSettingsStore";
import { formatCurrency } from "@/utils/formatters";

export default function BillPredictionScreen() {
  const theme = useThemeColor();
  const { top } = useSafeAreaInsets();
  const { mode: initialMode } = useLocalSearchParams<{ mode?: "bill" | "tips" }>();
  const styles = useStyles();

  const [activeTab, setActiveTab] = useState<"bill" | "tips">(
    initialMode === "tips" ? "tips" : "bill",
  );

  const { monthlyBudget, ratePerKwh, tariffType } = useSettingsStore();

  const { data, isLoading, isError, refetch, isRefetching } =
    useGetBillPrediction();

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <View
        style={[
          styles.container,
          { paddingTop: top, justifyContent: "center", alignItems: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={[styles.container, { paddingTop: top }]}>
        <CommonHeader title="Billing & Forecast" />
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { flex: 1, justifyContent: "center", alignItems: "center" },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        >
          <Text style={{ color: theme.destructive, marginBottom: 12 }}>
            Failed to load billing prediction.
          </Text>
          <TouchableOpacity
            onPress={() => refetch()}
            style={{
              paddingHorizontal: 16,
              paddingVertical: 8,
              backgroundColor: theme.primary,
              borderRadius: 8,
            }}
          >
            <Text style={{ color: theme.primaryForeground }}>Retry</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  const currentBudget = monthlyBudget > 0 ? monthlyBudget : data.budget;

  const isOverBudget = data.predictedBill > currentBudget;
  const isWarning = !isOverBudget && data.predictedBill > currentBudget * 0.8;
  const currentStatus = isOverBudget
    ? "Over Budget"
    : isWarning
      ? "Warning"
      : "Safe";

  const gradientColors = isOverBudget
    ? [palette.criticalRed, palette.thermalOrange]
    : isWarning
      ? [palette.voltYellowDark, palette.voltYellow]
      : [palette.blue500, palette.cyan500];

  const progressPercentage =
    currentBudget > 0
      ? Math.min((data.predictedBill / currentBudget) * 100, 100)
      : 0;

  const effectiveRate = data.ratePerKwh || ratePerKwh;
  const effectiveTariffType = data.tariffType || tariffType || "flat";

  // Cycle date formatting
  const cycleInfo =
    data.billingPeriodStart && data.billingPeriodEnd
      ? `${data.billingPeriodStart} to ${data.billingPeriodEnd}`
      : "Current Billing Cycle";

  const elapsedDays = data.elapsedDays ?? (30 - data.daysRemaining);
  const totalDays = data.totalDays ?? 30;

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <CommonHeader title="Billing & Forecast" />

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
        {/* Mode Selector Tabs */}
        <View style={styles.tabSelector}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "bill" && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab("bill")}
          >
            <MaterialCommunityIcons
              name="chart-timeline-variant"
              size={18}
              color={
                activeTab === "bill"
                  ? theme.primaryForeground
                  : theme.mutedForeground
              }
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "bill" && styles.tabTextActive,
              ]}
            >
              Billing & Forecast
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === "tips" && styles.tabButtonActive,
            ]}
            onPress={() => setActiveTab("tips")}
          >
            <MaterialCommunityIcons
              name="lightbulb-outline"
              size={18}
              color={
                activeTab === "tips"
                  ? theme.primaryForeground
                  : theme.mutedForeground
              }
            />
            <Text
              style={[
                styles.tabText,
                activeTab === "tips" && styles.tabTextActive,
              ]}
            >
              Saving Tips
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === "bill" && (
          <>
            {/* Primary Hero Card: Forecast + Accrued MTD */}
            <View style={styles.cardWrapper}>
              <LinearGradient
                colors={gradientColors as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.predictionCard}
              >
                {/* Header Row: Status Badge & Cycle Counter */}
                <View style={styles.cardTopRow}>
                  <View style={styles.statusBadge}>
                    <MaterialCommunityIcons
                      name={
                        isOverBudget
                          ? "alert-circle"
                          : isWarning
                            ? "alert"
                            : "check-circle"
                      }
                      size={15}
                      color={palette.white}
                    />
                    <Text style={styles.statusText}>{currentStatus}</Text>
                  </View>

                  <View style={styles.cycleBadge}>
                    <MaterialCommunityIcons
                      name="calendar-clock"
                      size={14}
                      color={palette.white}
                    />
                    <Text style={styles.cycleBadgeText}>
                      Day {elapsedDays} of {totalDays}
                    </Text>
                  </View>
                </View>

                {/* Main Forecast Metric */}
                <Text style={styles.cardLabel}>Projected Month-End Bill</Text>
                <Text style={styles.billAmount}>
                  {formatCurrency(data.predictedBill)}
                </Text>

                {/* Sub-Metric Row: Accrued MTD Bill & Est. Total Cost with Units */}
                <View style={styles.mtdSubCard}>
                  <View style={styles.mtdSubCol}>
                    <Text style={styles.mtdSubLabel}>Accrued Till Today</Text>
                    <Text style={styles.mtdSubValue}>
                      {formatCurrency(data.mtdBill)}
                    </Text>
                    <View style={styles.mtdSubUnitTag}>
                      <MaterialCommunityIcons
                        name="lightning-bolt"
                        size={12}
                        color={palette.white}
                      />
                      <Text style={styles.mtdSubUnitText}>
                        {data.monthUnits} kWh
                      </Text>
                    </View>
                  </View>
                  <View style={styles.mtdSubDivider} />
                  <View style={styles.mtdSubCol}>
                    <Text style={styles.mtdSubLabel}>Est. Month-End Total</Text>
                    <Text style={styles.mtdSubValue}>
                      {formatCurrency(data.predictedBill)}
                    </Text>
                    <View style={styles.mtdSubUnitTag}>
                      <MaterialCommunityIcons
                        name="chart-line"
                        size={12}
                        color={palette.white}
                      />
                      <Text style={styles.mtdSubUnitText}>
                        {data.predictedUnits} kWh
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Progress Bar against User Budget */}
                <View style={styles.progressSection}>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressLabel}>
                      {progressPercentage.toFixed(0)}% of target budget
                    </Text>
                    <Text style={styles.progressLabel}>
                      Budget: {formatCurrency(currentBudget)}
                    </Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View
                      style={[
                        styles.progressBar,
                        { width: `${progressPercentage}%` },
                      ]}
                    />
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Official Tariff & Cycle Info Banner */}
            <View style={styles.tariffBanner}>
              <View style={styles.tariffIconBox}>
                <MaterialCommunityIcons
                  name="shield-check"
                  size={22}
                  color={theme.primary}
                />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.tariffTitleRow}>
                  <Text style={styles.tariffTitle}>
                    Utility Tariff: Rs. {effectiveRate.toFixed(2)} / kWh
                  </Text>
                  <View style={styles.tariffTypeTag}>
                    <Text style={styles.tariffTypeTagText}>
                      {effectiveTariffType.toUpperCase()}
                    </Text>
                  </View>
                </View>
                <Text style={styles.tariffSubtitle}>
                  Cycle: {cycleInfo} • Server-Managed Tariff
                </Text>
              </View>
            </View>

            {/* Consumption Breakdown Grid */}
            <Text style={styles.sectionTitle}>Consumption Breakdown</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <MaterialCommunityIcons
                  name="lightning-bolt"
                  size={24}
                  color={palette.safeGreenDark}
                />
                <Text style={styles.statValue}>{data.monthUnits} kWh</Text>
                <Text style={styles.statLabel}>Used So Far (MTD)</Text>
              </View>

              <View style={styles.statBox}>
                <MaterialCommunityIcons
                  name="chart-line"
                  size={24}
                  color={palette.blue500}
                />
                <Text style={styles.statValue}>
                  {data.dailyAverage} kWh/day
                </Text>
                <Text style={styles.statLabel}>Avg Daily Usage</Text>
              </View>

              <View style={styles.statBox}>
                <MaterialCommunityIcons
                  name="sigma"
                  size={24}
                  color={palette.voltYellowDark}
                />
                <Text style={styles.statValue}>
                  {data.predictedUnits} kWh
                </Text>
                <Text style={styles.statLabel}>Predicted Total</Text>
              </View>

              <View style={styles.statBox}>
                <MaterialCommunityIcons
                  name="calendar-clock"
                  size={24}
                  color={palette.thermalOrange}
                />
                <Text style={styles.statValue}>{data.daysRemaining} days</Text>
                <Text style={styles.statLabel}>Remaining in Cycle</Text>
              </View>
            </View>
          </>
        )}

        {activeTab === "tips" && (
          <>
            <Text style={styles.sectionTitle}>Recommended Energy Tips</Text>
            <View style={styles.tipsContainer}>
              {data.savingTips.map((tip, index) => (
                <TipCard key={index} tip={tip} />
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function TipCard({ tip }: { tip: { text: string; category?: string } }) {
  const styles = useStyles();
  const isAlert = tip.category === "alert";
  const isMaintenance = tip.category === "maintenance";

  const categoryColor = isAlert
    ? palette.criticalRed
    : isMaintenance
      ? palette.thermalOrange
      : palette.safeGreenDark;

  const iconName = isAlert
    ? "alert-circle-outline"
    : isMaintenance
      ? "wrench-outline"
      : "lightbulb-on-outline";

  const iconBgColor = categoryColor + "15";
  const categoryLabel = isAlert
    ? "Alert"
    : isMaintenance
      ? "Maintenance"
      : "Energy Saving";

  return (
    <View
      style={[
        styles.tipCard,
        { borderLeftWidth: 4, borderLeftColor: categoryColor },
      ]}
    >
      <View style={[styles.tipIconWrapper, { backgroundColor: iconBgColor }]}>
        <MaterialCommunityIcons
          name={iconName as any}
          size={20}
          color={categoryColor}
        />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[styles.tipCategoryText, { color: categoryColor }]}>
          {categoryLabel}
        </Text>
        <Text style={styles.tipText}>{tip.text}</Text>
      </View>
    </View>
  );
}

function useStyles() {
  const theme = useThemeColor();
  const { spacing, fontSizes, radius, shadows } = useResponsiveTokens();

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollContent: { paddingBottom: spacing["2xl"], paddingTop: spacing.sm },

    tabSelector: {
      flexDirection: "row",
      backgroundColor: theme.card,
      marginHorizontal: spacing.md,
      marginBottom: spacing.lg,
      borderRadius: radius.lg,
      padding: 4,
      borderWidth: 0.5,
      borderColor: theme.border,
      gap: 4,
    },
    tabButton: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      gap: spacing.xs,
    },
    tabButtonActive: {
      backgroundColor: theme.primary,
    },
    tabText: {
      fontSize: fontSizes.sm,
      color: theme.mutedForeground,
      fontFamily: Typography.fontFamily,
      fontWeight: Typography.fontWeights.medium,
    },
    tabTextActive: {
      color: theme.primaryForeground,
      fontWeight: Typography.fontWeights.bold,
    },

    cardWrapper: { paddingHorizontal: spacing.md, marginBottom: spacing.lg },
    predictionCard: {
      borderRadius: radius.xl,
      padding: spacing.xl,
      alignItems: "center",
      ...shadows.md,
    },
    cardTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      width: "100%",
      marginBottom: spacing.md,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      backgroundColor: "rgba(255,255,255,0.2)",
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.full,
    },
    statusText: {
      color: palette.white,
      fontSize: fontSizes.xs,
      fontWeight: Typography.fontWeights.bold,
      fontFamily: Typography.fontFamily,
    },
    cycleBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: "rgba(255,255,255,0.15)",
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.full,
    },
    cycleBadgeText: {
      color: palette.white,
      fontSize: fontSizes.xs,
      fontWeight: Typography.fontWeights.medium,
      fontFamily: Typography.fontFamily,
    },
    cardLabel: {
      color: "rgba(255,255,255,0.85)",
      fontSize: fontSizes.sm,
      fontFamily: Typography.fontFamily,
      marginBottom: 2,
    },
    billAmount: {
      color: palette.white,
      fontSize: 44,
      fontWeight: Typography.fontWeights.extrabold,
      fontFamily: Typography.fontFamily,
      marginBottom: spacing.md,
    },

    mtdSubCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: "rgba(255,255,255,0.15)",
      borderRadius: radius.lg,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      width: "100%",
      marginBottom: spacing.lg,
    },
    mtdSubCol: {
      flex: 1,
      alignItems: "center",
    },
    mtdSubLabel: {
      color: "rgba(255,255,255,0.75)",
      fontSize: fontSizes.xxs,
      fontFamily: Typography.fontFamily,
      marginBottom: 2,
    },
    mtdSubValue: {
      color: palette.white,
      fontSize: fontSizes.base,
      fontWeight: Typography.fontWeights.bold,
      fontFamily: Typography.fontFamily,
    },
    mtdSubDivider: {
      width: 1,
      height: 42,
      backgroundColor: "rgba(255,255,255,0.25)",
    },
    mtdSubUnitTag: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: "rgba(255,255,255,0.18)",
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: radius.full,
      marginTop: 5,
    },
    mtdSubUnitText: {
      color: palette.white,
      fontSize: fontSizes.xxs,
      fontWeight: Typography.fontWeights.semibold,
      fontFamily: Typography.fontFamily,
    },

    progressSection: { width: "100%" },
    progressLabels: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: spacing.xs,
    },
    progressLabel: {
      color: "rgba(255,255,255,0.9)",
      fontSize: fontSizes.xs,
      fontFamily: Typography.fontFamily,
      fontWeight: Typography.fontWeights.medium,
    },
    progressTrack: {
      height: 8,
      backgroundColor: "rgba(255,255,255,0.25)",
      borderRadius: radius.full,
      overflow: "hidden",
    },
    progressBar: {
      height: "100%",
      backgroundColor: palette.white,
      borderRadius: radius.full,
    },

    tariffBanner: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      marginHorizontal: spacing.md,
      marginBottom: spacing.xl,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 0.5,
      borderColor: theme.border,
      gap: spacing.md,
      ...shadows.xs,
    },
    tariffIconBox: {
      width: 42,
      height: 42,
      borderRadius: radius.md,
      backgroundColor: theme.primary + "15",
      alignItems: "center",
      justifyContent: "center",
    },
    tariffTitleRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
    },
    tariffTitle: {
      fontSize: fontSizes.sm,
      fontWeight: Typography.fontWeights.bold,
      color: theme.foreground,
      fontFamily: Typography.fontFamily,
    },
    tariffTypeTag: {
      backgroundColor: theme.primary + "20",
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: 4,
    },
    tariffTypeTagText: {
      fontSize: 10,
      color: theme.primary,
      fontWeight: Typography.fontWeights.bold,
    },
    tariffSubtitle: {
      fontSize: fontSizes.xs,
      color: theme.mutedForeground,
      fontFamily: Typography.fontFamily,
      marginTop: 2,
    },

    sectionTitle: {
      fontSize: fontSizes.h3,
      fontWeight: Typography.fontWeights.bold,
      color: theme.foreground,
      fontFamily: Typography.fontFamily,
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
    },

    statsGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: spacing.md,
      gap: spacing.md,
      marginBottom: spacing.xl,
    },
    statBox: {
      width: "47%",
      backgroundColor: theme.card,
      padding: spacing.md,
      borderRadius: radius.lg,
      alignItems: "center",
      borderWidth: 0.5,
      borderColor: theme.border,
      ...shadows.xs,
    },
    statValue: {
      fontSize: fontSizes.base,
      fontWeight: Typography.fontWeights.bold,
      color: theme.foreground,
      fontFamily: Typography.fontFamily,
      marginTop: spacing.sm,
      marginBottom: 2,
    },
    statLabel: {
      fontSize: fontSizes.xs,
      color: theme.mutedForeground,
      fontFamily: Typography.fontFamily,
    },

    tipsPreviewHeader: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingRight: spacing.md,
      marginBottom: 4,
    },
    viewAllText: {
      fontSize: fontSizes.xs,
      fontWeight: Typography.fontWeights.bold,
      color: theme.primary,
      fontFamily: Typography.fontFamily,
    },

    tipsContainer: {
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    tipCard: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 0.5,
      borderColor: theme.border,
      gap: spacing.md,
      ...shadows.xs,
    },
    tipIconWrapper: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      alignItems: "center",
      justifyContent: "center",
    },
    tipText: {
      flex: 1,
      fontSize: fontSizes.sm,
      color: theme.foreground,
      fontFamily: Typography.fontFamily,
      lineHeight: fontSizes.sm * 1.4,
    },
    tipCategoryText: {
      fontSize: fontSizes.xs,
      fontWeight: Typography.fontWeights.bold,
      fontFamily: Typography.fontFamily,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },
  });
}
