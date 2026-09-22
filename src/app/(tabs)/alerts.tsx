import React, { useCallback, useState } from "react";
import { ActivityIndicator, Alert, FlatList, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";

import { useGetAlerts } from "@/api/alerts.service";
import { generateTips } from "@/api/energy.service";
import CommonHeader from "@/components/headers/CommonHeader";
import AlertItem from "@/components/ui/AlertItem";
import { ALERT_STYLES } from "@/constants/energyConstants";
import { Typography, useResponsiveTokens } from "@/constants/theme";
import { useThemeColor } from "@/hooks/useThemeColor";

type FilterType = "all" | "danger" | "warning" | "info";

export default function AlertsScreen() {
  const theme = useThemeColor();
  const { top } = useSafeAreaInsets();
  const styles = useStyles();
  const queryClient = useQueryClient();
  
  const [filter, setFilter] = useState<FilterType>("all");
  const [isGenerating, setIsGenerating] = useState(false);
  const { data: alerts, isLoading, refetch, isRefetching } = useGetAlerts();

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const handleGenerateAlerts = async () => {
    try {
      setIsGenerating(true);
      await generateTips();
      // Refetch the alerts query to show the newly generated ones
      await queryClient.invalidateQueries({ queryKey: ["alerts"] });
    } catch (error) {
      Alert.alert("Generation Failed", error instanceof Error ? error.message : "Could not generate alerts.");
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: top, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  const effectiveAlerts = alerts || [];
  const filteredAlerts =
    filter === "all"
      ? effectiveAlerts
      : effectiveAlerts.filter((a) => a.type === filter);

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <CommonHeader 
        title="Alerts" 
        showBack={false} 
        rightAction={{
          icon: "cpu", // Using Feather 'cpu' icon representing AI/Smart Analysis
          onPress: isGenerating ? () => {} : handleGenerateAlerts,
          badge: effectiveAlerts.filter(a => !a.read).length
        }}
      />

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          <FilterChip title="All" type="all" isActive={filter === "all"} onPress={() => setFilter("all")} />
          <FilterChip title="Danger" type="danger" isActive={filter === "danger"} onPress={() => setFilter("danger")} />
          <FilterChip title="Warning" type="warning" isActive={filter === "warning"} onPress={() => setFilter("warning")} />
          <FilterChip title="Info" type="info" isActive={filter === "info"} onPress={() => setFilter("info")} />
        </ScrollView>
      </View>

      {isGenerating && (
        <View style={styles.generatingOverlay}>
          <ActivityIndicator size="small" color={theme.primary} style={{ marginRight: 8 }} />
          <Text style={{ color: theme.primary, fontFamily: Typography.fontFamily, fontWeight: "500" }}>
            AI is analyzing data and generating new alerts...
          </Text>
        </View>
      )}

      <FlatList
        data={filteredAlerts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AlertItem alert={item} style={styles.alertItem} />}
        contentContainerStyle={[
          styles.listContent,
          filteredAlerts.length === 0 && { flex: 1, justifyContent: "center" },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={onRefresh}
            colors={[theme.primary]}
            tintColor={theme.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="bell-check-outline" size={64} color={theme.success} />
            <Text style={styles.emptyTitle}>No Alerts</Text>
            <Text style={styles.emptyDesc}>
              {filter !== "all"
                ? `No ${filter} alerts at the moment.`
                : "System is operating normally. No alerts to show."}
            </Text>
            <View style={styles.emptyActionsRow}>
              <TouchableOpacity
                style={styles.refreshButton}
                onPress={onRefresh}
                disabled={isRefetching}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="refresh"
                  size={18}
                  color={theme.primaryForeground}
                />
                <Text style={styles.refreshButtonText}>
                  {isRefetching ? "Refreshing..." : "Refresh"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.generateButton}
                onPress={handleGenerateAlerts}
                disabled={isGenerating}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="robot-outline"
                  size={18}
                  color={theme.primaryForeground}
                />
                <Text style={styles.generateButtonText}>AI Alerts</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
      />
    </View>
  );
}

function FilterChip({ title, type, isActive, onPress }: { title: string, type: FilterType, isActive: boolean, onPress: () => void }) {
  const styles = useStyles();
  const theme = useThemeColor();
  
  let color = theme.primary;
  if (type !== "all") color = ALERT_STYLES[type].color;

  return (
    <TouchableOpacity 
      style={[
        styles.chip, 
        isActive ? { backgroundColor: color, borderColor: color } : { backgroundColor: theme.card, borderColor: theme.border }
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[
        styles.chipText, 
        isActive ? { color: theme.background, fontWeight: Typography.fontWeights.bold } : { color: theme.mutedForeground }
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

function useStyles() {
  const theme = useThemeColor();
  const { spacing, fontSizes, radius } = useResponsiveTokens();

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    
    filterContainer: {
      paddingVertical: spacing.md,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.border,
      backgroundColor: theme.background,
    },
    filterScroll: {
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
    },
    chip: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      borderWidth: 1,
    },
    chipText: {
      fontSize: fontSizes.sm,
      fontFamily: Typography.fontFamily,
      fontWeight: Typography.fontWeights.medium,
    },
    
    listContent: {
      padding: spacing.md,
      paddingBottom: spacing["2xl"],
    },
    alertItem: {
      marginBottom: spacing.md,
    },
    
    emptyContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      padding: spacing.xl,
    },
    emptyTitle: {
      fontSize: fontSizes.h2,
      fontWeight: Typography.fontWeights.bold,
      color: theme.foreground,
      fontFamily: Typography.fontFamily,
      marginTop: spacing.md,
      marginBottom: spacing.xs,
    },
    emptyDesc: {
      fontSize: fontSizes.base,
      color: theme.mutedForeground,
      fontFamily: Typography.fontFamily,
      textAlign: "center",
      marginBottom: spacing.xl,
    },
    emptyActionsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    refreshButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      borderWidth: 1,
      borderColor: theme.border,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      gap: spacing.xs,
    },
    refreshButtonText: {
      color: theme.foreground,
      fontFamily: Typography.fontFamily,
      fontWeight: Typography.fontWeights.bold,
      fontSize: fontSizes.sm,
    },
    generateButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.primary,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
      gap: spacing.xs,
    },
    generateButtonText: {
      color: theme.primaryForeground,
      fontFamily: Typography.fontFamily,
      fontWeight: Typography.fontWeights.bold,
      fontSize: fontSizes.sm,
    },
    generatingOverlay: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: theme.primary + "15", // 15% opacity
      paddingVertical: spacing.md,
      marginHorizontal: spacing.md,
      borderRadius: radius.md,
      marginBottom: spacing.md,
    },
  });
}
