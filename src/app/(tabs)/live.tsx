import React, { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGetLiveData, useFirebaseLiveData } from "@/api/energy.service";
import LineChart from "@/components/charts/LineChart";
import CommonHeader from "@/components/headers/CommonHeader";
import LivePulse from "@/components/dashboard/LivePulse";
import StatusBadge from "@/components/ui/StatusBadge";
import { METRIC_COLORS } from "@/constants/energyConstants";
import { Typography, useResponsiveTokens } from "@/constants/theme";
import { useThemeColor } from "@/hooks/useThemeColor";
import { formatCurrent, formatTemp, formatVoltage, formatWatts } from "@/utils/formatters";

type MetricTab = "power" | "voltage" | "current";

export default function LiveMonitorScreen() {
  const theme = useThemeColor();
  const { top } = useSafeAreaInsets();
  const styles = useStyles();
  
  const [activeTab, setActiveTab] = useState<MetricTab>("power");
  
  // Use Firebase for true real-time updates
  const { data, isLoading, isError } = useFirebaseLiveData("energy");
  
  // State to hold real historical data points
  const [history, setHistory] = useState<{ power: any[], voltage: any[], current: any[] }>({
    power: [],
    voltage: [],
    current: []
  });

  // Accumulate data when it changes
  React.useEffect(() => {
    if (data) {
      setHistory(prev => {
        const MAX_POINTS = 30;
        
        const newPoint = (val: number, label: string) => ({ value: val, label });
        
        const updateBuffer = (buffer: any[], newValue: number) => {
          const updated = [...buffer, newPoint(newValue, data.time)];
          if (updated.length > MAX_POINTS) return updated.slice(updated.length - MAX_POINTS);
          return updated;
        };

        return {
          power: updateBuffer(prev.power, data.power),
          voltage: updateBuffer(prev.voltage, data.voltage),
          current: updateBuffer(prev.current, data.current)
        };
      });
    }
  }, [data]);

  const chartData = React.useMemo(() => {
    const dataPoints = history[activeTab];
    if (dataPoints.length === 0 && data) {
        // Fallback if history is empty but we have data (initial load)
        return [{ value: data[activeTab], label: "Now" }];
    }
    return dataPoints;
  }, [history, activeTab, data]);

  const getChartColor = () => {
    if (activeTab === "voltage") return METRIC_COLORS.voltage.color;
    if (activeTab === "current") return METRIC_COLORS.current.color;
    return METRIC_COLORS.power.color;
  };

  const getActiveTabLabel = () => {
    if (activeTab === "voltage") return "Voltage (V)";
    if (activeTab === "current") return "Current (A)";
    return "Power (W)";
  };

  if (isLoading && history[activeTab].length === 0) {
    return (
      <View style={[styles.container, { paddingTop: top, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (isError && history[activeTab].length === 0) {
    return (
      <View style={[styles.container, { paddingTop: top, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: theme.destructive }}>Failed to load live data.</Text>
      </View>
    );
  }

  const displayData = data || (history[activeTab].length > 0 ? {
    power: history.power[history.power.length - 1].value,
    voltage: history.voltage[history.voltage.length - 1].value,
    current: history.current[history.current.length - 1].value,
    temperature: 0, // Not tracked in history buffer yet
    time: history.power[history.power.length - 1].label
  } : null);

  if (!displayData) return null;

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <CommonHeader 
        title="Live Monitor" 
        showBack={false}
        rightElement={<LivePulse />}
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Metric Tabs Selector */}
        <View style={styles.tabContainer}>
          <MetricTabButton 
            title="Power" 
            isActive={activeTab === "power"} 
            color={METRIC_COLORS.power.color}
            onPress={() => setActiveTab("power")} 
          />
          <MetricTabButton 
            title="Voltage" 
            isActive={activeTab === "voltage"} 
            color={METRIC_COLORS.voltage.color}
            onPress={() => setActiveTab("voltage")} 
          />
          <MetricTabButton 
            title="Current" 
            isActive={activeTab === "current"} 
            color={METRIC_COLORS.current.color}
            onPress={() => setActiveTab("current")} 
          />
        </View>

        {/* Live Chart Section */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>{getActiveTabLabel()}</Text>
            <Text style={[styles.liveValue, { color: getChartColor() }]}>
              {activeTab === "power" ? formatWatts(displayData.power) : 
               activeTab === "voltage" ? formatVoltage(displayData.voltage) : 
               formatCurrent(displayData.current)}
            </Text>
          </View>
          
          <View style={styles.chartWrapper}>
            <LineChart 
              data={chartData} 
              color={getChartColor()} 
              height={220}
              showDataPoints={false}
            />
          </View>
        </View>

        {/* Current Values Grid */}
        <View style={styles.valuesGrid}>
          <ValueCard title="Voltage" value={formatVoltage(displayData.voltage)} color={METRIC_COLORS.voltage.color} />
          <ValueCard title="Current" value={formatCurrent(displayData.current)} color={METRIC_COLORS.current.color} />
          <ValueCard title="Power" value={formatWatts(displayData.power)} color={METRIC_COLORS.power.color} />
          <ValueCard title="Temp" value={formatTemp(displayData.temperature || 0)} color={METRIC_COLORS.temperature.color} />
        </View>

        {/* Status Section */}
        <View style={styles.statusSection}>
          <Text style={styles.sectionTitle}>System Status</Text>
          <View style={styles.statusCard}>
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>ESP32 Controller</Text>
              <StatusBadge status={isError ? "offline" : "online"} />
            </View>
            <View style={styles.divider} />
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Power Sensor (ACS712)</Text>
              <StatusBadge status={isError ? "offline" : "online"} />
            </View>
            <View style={styles.divider} />
            <View style={styles.statusRow}>
              <Text style={styles.statusLabel}>Last Updated</Text>
              <Text style={styles.timeText}>{displayData.time}</Text>
            </View>
          </View>
        </View>

      </ScrollView>
    </View>
  );
}


// Subcomponents

function MetricTabButton({ title, isActive, color, onPress }: { title: string, isActive: boolean, color: string, onPress: () => void }) {
  const styles = useStyles();
  const theme = useThemeColor();
  
  return (
    <TouchableOpacity 
      style={[
        styles.tabButton, 
        isActive && { backgroundColor: color + "20", borderColor: color }
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.tabText, isActive && { color: color, fontWeight: Typography.fontWeights.bold }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

function ValueCard({ title, value, color }: { title: string, value: string, color: string }) {
  const styles = useStyles();
  return (
    <View style={styles.valueCard}>
      <Text style={styles.valueCardTitle}>{title}</Text>
      <Text style={[styles.valueCardValue, { color }]}>{value}</Text>
    </View>
  );
}

function useStyles() {
  const theme = useThemeColor();
  const { spacing, fontSizes, radius, shadows } = useResponsiveTokens();

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollContent: { paddingBottom: spacing["2xl"], paddingTop: spacing.md },
    
    tabContainer: {
      flexDirection: "row",
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    tabButton: {
      flex: 1,
      paddingVertical: spacing.sm,
      alignItems: "center",
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.card,
    },
    tabText: {
      fontSize: fontSizes.sm,
      color: theme.mutedForeground,
      fontFamily: Typography.fontFamily,
      fontWeight: Typography.fontWeights.medium,
    },
    
    chartSection: {
      backgroundColor: theme.card,
      marginHorizontal: spacing.md,
      borderRadius: radius.xl,
      padding: spacing.md,
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
    chartTitle: {
      fontSize: fontSizes.base,
      fontWeight: Typography.fontWeights.semibold,
      color: theme.foreground,
      fontFamily: Typography.fontFamily,
    },
    liveValue: {
      fontSize: fontSizes.h3,
      fontWeight: Typography.fontWeights.bold,
      fontFamily: Typography.fontFamily,
    },
    chartWrapper: {
      marginLeft: -10, // Adjust for gifted-charts default padding
    },
    
    valuesGrid: {
      flexDirection: "row",
      flexWrap: "wrap",
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    valueCard: {
      width: "48%",
      backgroundColor: theme.card,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 0.5,
      borderColor: theme.border,
      alignItems: "center",
      ...shadows.xs,
    },
    valueCardTitle: {
      fontSize: fontSizes.sm,
      color: theme.mutedForeground,
      fontFamily: Typography.fontFamily,
      marginBottom: spacing.xs,
    },
    valueCardValue: {
      fontSize: fontSizes.h3,
      fontWeight: Typography.fontWeights.bold,
      fontFamily: Typography.fontFamily,
    },
    
    statusSection: {
      paddingHorizontal: spacing.md,
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      fontSize: fontSizes.h3,
      fontWeight: Typography.fontWeights.bold,
      color: theme.foreground,
      fontFamily: Typography.fontFamily,
      marginBottom: spacing.md,
    },
    statusCard: {
      backgroundColor: theme.card,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 0.5,
      borderColor: theme.border,
      ...shadows.sm,
    },
    statusRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: spacing.xs,
    },
    statusLabel: {
      fontSize: fontSizes.base,
      color: theme.foreground,
      fontFamily: Typography.fontFamily,
      fontWeight: Typography.fontWeights.medium,
    },
    timeText: {
      fontSize: fontSizes.sm,
      color: theme.mutedForeground,
      fontFamily: Typography.fontFamily,
    },
    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: spacing.sm,
    },
  });
}
