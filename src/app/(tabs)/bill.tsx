import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams } from "expo-router";
import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGetBillPrediction } from "@/api/energy.service";
import CommonHeader from "@/components/headers/CommonHeader";
import { palette, Typography, useResponsiveTokens } from "@/constants/theme";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrency } from "@/utils/formatters";

export default function BillPredictionScreen() {
  const theme = useThemeColor();
  const { top } = useSafeAreaInsets();
  const { mode } = useLocalSearchParams<{ mode?: "bill" | "tips" }>();
  const styles = useStyles();

  const isTipsMode = mode === "tips";
  const title = isTipsMode ? "AI Saving Tips" : "Bill Prediction";
  
  const { data, isLoading, isError } = useGetBillPrediction();

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: top, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (isError || !data) {
    return (
      <View style={[styles.container, { paddingTop: top, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: theme.destructive }}>Failed to load bill prediction.</Text>
      </View>
    );
  }

  const isOverBudget = data.status === "Over Budget";
  const isWarning = data.status === "Warning";
  
  const gradientColors = isOverBudget 
    ? [palette.criticalRed, palette.thermalOrange] 
    : isWarning
      ? [palette.voltYellowDark, palette.voltYellow]
      : [palette.blue500, palette.cyan500];

  const progressPercentage = Math.min((data.predictedBill / data.budget) * 100, 100);

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <CommonHeader title={title} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {!isTipsMode && (
          <>
            {/* Prediction Card */}
            <View style={styles.cardWrapper}>
              <LinearGradient
                colors={gradientColors as [string, string]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.predictionCard}
              >
                <View style={styles.statusBadge}>
                  <MaterialCommunityIcons 
                    name={isOverBudget ? "alert-circle" : isWarning ? "alert" : "check-circle"} 
                    size={16} color={palette.white} 
                  />
                  <Text style={styles.statusText}>{data.status}</Text>
                </View>

                <Text style={styles.cardLabel}>Estimated Monthly Bill</Text>
                <Text style={styles.billAmount}>{formatCurrency(data.predictedBill)}</Text>
                <Text style={styles.budgetDesc}>Based on current usage patterns</Text>
                
                {/* Progress Bar */}
                <View style={styles.progressSection}>
                  <View style={styles.progressLabels}>
                    <Text style={styles.progressLabel}>0</Text>
                    <Text style={styles.progressLabel}>Budget: {formatCurrency(data.budget)}</Text>
                  </View>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressBar, { width: `${progressPercentage}%` }]} />
                  </View>
                </View>
              </LinearGradient>
            </View>

            {/* Breakdown */}
            <Text style={styles.sectionTitle}>Breakdown</Text>
            <View style={styles.statsGrid}>
              <View style={styles.statBox}>
                <MaterialCommunityIcons name="calendar-today" size={24} color={theme.primary} />
                <Text style={styles.statValue}>{data.daysRemaining}</Text>
                <Text style={styles.statLabel}>Days Left</Text>
              </View>
              <View style={styles.statBox}>
                <MaterialCommunityIcons name="lightning-bolt" size={24} color={theme.info} />
                <Text style={styles.statValue}>{data.monthUnits}</Text>
                <Text style={styles.statLabel}>Units Used</Text>
              </View>
              <View style={styles.statBox}>
                <MaterialCommunityIcons name="chart-line" size={24} color={theme.accent} />
                <Text style={styles.statValue}>{data.dailyAverage}</Text>
                <Text style={styles.statLabel}>Daily Avg (kWh)</Text>
              </View>
              <View style={styles.statBox}>
                <MaterialCommunityIcons name="sigma" size={24} color={theme.secondary} />
                <Text style={styles.statValue}>{data.predictedUnits}</Text>
                <Text style={styles.statLabel}>Predicted Units</Text>
              </View>
            </View>
          </>
        )}

        {/* Saving Tips */}
        {isTipsMode && (
          <>
            <Text style={styles.sectionTitle}>Recommended Tips</Text>
            <View style={styles.tipsContainer}>
              {data.savingTips.map((tip, index) => {
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
                  <View key={index} style={[styles.tipCard, { borderLeftWidth: 4, borderLeftColor: categoryColor }]}>
                    <View style={[styles.tipIconWrapper, { backgroundColor: iconBgColor }]}>
                      <MaterialCommunityIcons name={iconName} size={20} color={categoryColor} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={[styles.tipCategoryText, { color: categoryColor }]}>
                        {categoryLabel}
                      </Text>
                      <Text style={styles.tipText}>{tip.text}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function useStyles() {
  const theme = useThemeColor();
  const { spacing, fontSizes, radius, shadows } = useResponsiveTokens();

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollContent: { paddingBottom: spacing["2xl"], paddingTop: spacing.md },
    
    cardWrapper: { paddingHorizontal: spacing.md, marginBottom: spacing.xl },
    predictionCard: {
      borderRadius: radius.xl,
      padding: spacing.xl,
      alignItems: "center",
      ...shadows.md,
    },
    statusBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.xs,
      backgroundColor: "rgba(255,255,255,0.2)",
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.full,
      marginBottom: spacing.lg,
    },
    statusText: {
      color: palette.white,
      fontSize: fontSizes.sm,
      fontWeight: Typography.fontWeights.bold,
      fontFamily: Typography.fontFamily,
    },
    cardLabel: {
      color: "rgba(255,255,255,0.8)",
      fontSize: fontSizes.base,
      fontFamily: Typography.fontFamily,
      marginBottom: spacing.xs,
    },
    billAmount: {
      color: palette.white,
      fontSize: 48,
      fontWeight: Typography.fontWeights.extrabold,
      fontFamily: Typography.fontFamily,
      marginBottom: spacing.xs,
    },
    budgetDesc: {
      color: "rgba(255,255,255,0.7)",
      fontSize: fontSizes.sm,
      fontFamily: Typography.fontFamily,
      marginBottom: spacing.xl,
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
      backgroundColor: "rgba(255,255,255,0.2)",
      borderRadius: radius.full,
      overflow: "hidden",
    },
    progressBar: {
      height: "100%",
      backgroundColor: palette.white,
      borderRadius: radius.full,
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
      fontSize: fontSizes.h3,
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
    
    tipsContainer: {
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
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
      backgroundColor: palette.voltYellowDark + "15",
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
