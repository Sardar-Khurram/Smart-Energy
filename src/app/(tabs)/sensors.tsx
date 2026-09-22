import React, { useCallback } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { useGetSensorStatus } from "@/api/energy.service";
import CommonHeader from "@/components/headers/CommonHeader";
import StatusBadge from "@/components/ui/StatusBadge";
import { Typography, useResponsiveTokens } from "@/constants/theme";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatRelativeTime } from "@/utils/formatters";

export default function SensorsScreen() {
  const theme = useThemeColor();
  const { top } = useSafeAreaInsets();
  const styles = useStyles();
  
  const { data: status, isLoading, isError, refetch, isRefetching } = useGetSensorStatus();

  const onRefresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: top, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (isError || !status) {
    return (
      <View style={[styles.container, { paddingTop: top }]}>
        <CommonHeader title="Hardware & Sensors" />
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { flex: 1, justifyContent: "center", alignItems: "center" }]}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        >
          <Text style={{ color: theme.destructive, marginBottom: 12 }}>Failed to load sensor status.</Text>
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

  const isSystemOnline = status.esp32 === "connected";

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <CommonHeader title="Hardware & Sensors" />

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
        
        {/* Main Controller Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Main Controller</Text>
          <View style={styles.controllerCard}>
            <View style={styles.controllerHeader}>
              <View style={styles.iconBox}>
                <MaterialCommunityIcons name="developer-board" size={32} color={theme.primary} />
              </View>
              <View style={styles.controllerInfo}>
                <Text style={styles.controllerName}>ESP32 NodeMCU</Text>
                <Text style={styles.controllerIp}>IP: {status.ip}</Text>
              </View>
              <StatusBadge status={isSystemOnline ? "online" : "offline"} label={isSystemOnline ? "Connected" : "Disconnected"} />
            </View>
            
            <View style={styles.metricsGrid}>
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Uptime</Text>
                <Text style={styles.metricValue}>{status.uptime}</Text>
              </View>
              <View style={styles.metricDivider} />
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Last Ping</Text>
                <Text style={styles.metricValue}>{formatRelativeTime(status.lastUpdated)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Network Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <MaterialCommunityIcons 
                  name={status.wifi === "strong" ? "wifi" : status.wifi === "weak" ? "wifi-strength-2" : "wifi-off"} 
                  size={24} 
                  color={status.wifi === "disconnected" ? theme.destructive : theme.success} 
                />
                <Text style={styles.rowTitle}>WiFi Signal</Text>
              </View>
              <Text style={[styles.rowValue, { color: status.wifi === "disconnected" ? theme.destructive : theme.success }]}>
                {status.wifi.charAt(0).toUpperCase() + status.wifi.slice(1)}
              </Text>
            </View>
          </View>
        </View>

        {/* Sensor Modules */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sensor Modules</Text>
          
          <View style={styles.card}>
            <SensorRow 
              name="Current Sensor" 
              model="ACS712 (30A)" 
              icon="current-ac" 
              status={status.acs712} 
            />
            <View style={styles.divider} />
            <SensorRow 
              name="Voltage Sensor" 
              model="ZMPT101B" 
              icon="flash" 
              status={status.zmpt} 
            />
            <View style={styles.divider} />
            <SensorRow 
              name="Temperature Sensor" 
              model="DS18B20" 
              icon="thermometer" 
              status={status.temp} 
            />
          </View>
        </View>

      </ScrollView>
    </View>
  );
}

function SensorRow({ name, model, icon, status }: { name: string, model: string, icon: string, status: "online" | "offline" }) {
  const styles = useStyles();
  const theme = useThemeColor();
  
  return (
    <View style={styles.sensorRow}>
      <View style={styles.rowLeft}>
        <View style={[styles.smallIconBox, { backgroundColor: theme.primary + "15" }]}>
          <MaterialCommunityIcons name={icon as any} size={20} color={theme.primary} />
        </View>
        <View>
          <Text style={styles.sensorName}>{name}</Text>
          <Text style={styles.sensorModel}>{model}</Text>
        </View>
      </View>
      <StatusBadge status={status} />
    </View>
  );
}

function useStyles() {
  const theme = useThemeColor();
  const { spacing, fontSizes, radius, shadows } = useResponsiveTokens();

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollContent: { paddingBottom: spacing["2xl"], paddingTop: spacing.md },
    
    section: { marginBottom: spacing.xl, paddingHorizontal: spacing.md },
    sectionTitle: {
      fontSize: fontSizes.h3,
      fontWeight: Typography.fontWeights.bold,
      color: theme.foreground,
      fontFamily: Typography.fontFamily,
      marginBottom: spacing.md,
      marginLeft: spacing.xs,
    },
    
    controllerCard: {
      backgroundColor: theme.card,
      borderRadius: radius.xl,
      borderWidth: 0.5,
      borderColor: theme.border,
      padding: spacing.md,
      ...shadows.md,
    },
    controllerHeader: {
      flexDirection: "row",
      alignItems: "center",
      marginBottom: spacing.lg,
    },
    iconBox: {
      width: 56,
      height: 56,
      borderRadius: radius.lg,
      backgroundColor: theme.primary + "15",
      alignItems: "center",
      justifyContent: "center",
      marginRight: spacing.md,
    },
    controllerInfo: { flex: 1 },
    controllerName: {
      fontSize: fontSizes.lg,
      fontWeight: Typography.fontWeights.bold,
      color: theme.foreground,
      fontFamily: Typography.fontFamily,
      marginBottom: 2,
    },
    controllerIp: {
      fontSize: fontSizes.sm,
      color: theme.mutedForeground,
      fontFamily: Typography.fontFamily,
    },
    metricsGrid: {
      flexDirection: "row",
      backgroundColor: theme.background,
      borderRadius: radius.lg,
      padding: spacing.md,
    },
    metricItem: { flex: 1, alignItems: "center" },
    metricDivider: { width: 1, backgroundColor: theme.border, marginHorizontal: spacing.sm },
    metricLabel: {
      fontSize: fontSizes.xs,
      color: theme.mutedForeground,
      fontFamily: Typography.fontFamily,
      marginBottom: spacing.xxs,
    },
    metricValue: {
      fontSize: fontSizes.base,
      fontWeight: Typography.fontWeights.bold,
      color: theme.foreground,
      fontFamily: Typography.fontFamily,
    },
    
    card: {
      backgroundColor: theme.card,
      borderRadius: radius.xl,
      borderWidth: 0.5,
      borderColor: theme.border,
      padding: spacing.md,
      ...shadows.sm,
    },
    row: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.xs,
    },
    rowLeft: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.md,
    },
    rowTitle: {
      fontSize: fontSizes.base,
      fontWeight: Typography.fontWeights.medium,
      color: theme.foreground,
      fontFamily: Typography.fontFamily,
    },
    rowValue: {
      fontSize: fontSizes.base,
      fontWeight: Typography.fontWeights.bold,
      fontFamily: Typography.fontFamily,
    },
    
    sensorRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.sm,
    },
    smallIconBox: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    sensorName: {
      fontSize: fontSizes.base,
      fontWeight: Typography.fontWeights.medium,
      color: theme.foreground,
      fontFamily: Typography.fontFamily,
      marginBottom: 2,
    },
    sensorModel: {
      fontSize: fontSizes.xs,
      color: theme.mutedForeground,
      fontFamily: Typography.fontFamily,
    },
    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: spacing.xs,
    },
  });
}
