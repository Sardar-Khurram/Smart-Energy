import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGetDevices, useFirebaseLiveData } from "@/api/energy.service";
import CircularGauge from "@/components/charts/CircularGauge";
import CommonHeader from "@/components/headers/CommonHeader";
import DeviceItem from "@/components/ui/DeviceItem";
import { Typography, useResponsiveTokens } from "@/constants/theme";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function DevicesScreen() {
  const theme = useThemeColor();
  const { top } = useSafeAreaInsets();
  const styles = useStyles();
  
  const { data: devices, isLoading, isError } = useGetDevices();
  const { data: liveData } = useFirebaseLiveData("energy");

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: top, justifyContent: "center", alignItems: "center" }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (isError || !devices) {
    return (
      <View style={[styles.container, { paddingTop: top, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: theme.destructive }}>Failed to load devices.</Text>
      </View>
    );
  }

  // Since the hardware only has 1 main sensor measuring TOTAL power,
  // we build a "virtual estimator" to guess which bulb is on.
  const totalPower = liveData?.power || 0;
  
  let bulb1Power = 0;
  let bulb2Power = 0;
  
  if (totalPower > 20) { // Noise threshold
    // If power is > 65W, it means both 44W bulbs are on (total ~88W)
    if (totalPower > 65) {
      bulb1Power = totalPower / 2;
      bulb2Power = totalPower / 2;
    } else {
      // If power is around 43-44W, assume only Bulb 1 is turned on
      bulb1Power = totalPower;
      bulb2Power = 0;
    }
  }

  const hardcodedDevices = [
    {
      id: "bulb-1",
      device: "Room Bulb 1",
      power: bulb1Power,
      icon: "lightbulb-on",
      isOn: bulb1Power > 0,
    },
    {
      id: "bulb-2",
      device: "Room Bulb 2",
      power: bulb2Power,
      icon: "lightbulb-outline",
      isOn: bulb2Power > 0,
    }
  ];

  const activeDevices = hardcodedDevices.filter(d => d.isOn);
  const inactiveDevices = hardcodedDevices.filter(d => !d.isOn);

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <CommonHeader title="Devices & Appliances" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Total Usage Gauge */}
        <View style={styles.gaugeContainer}>
          <CircularGauge 
            value={totalPower}
            max={5000} // Assuming 5kW system limit
            unit="W"
            label="Total Active Load"
            color={theme.primary}
            size={180}
            strokeWidth={14}
          />
          <Text style={styles.activeCount}>{activeDevices.length} devices currently active</Text>
        </View>

        {/* Device List */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Active Devices</Text>
          <View style={styles.card}>
            {activeDevices.map((device, index) => (
              <View key={device.id}>
                <DeviceItem device={device} totalPower={totalPower} />
                {index < activeDevices.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
            {activeDevices.length === 0 && (
              <Text style={styles.emptyText}>No devices currently drawing power.</Text>
            )}
          </View>
        </View>

        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Standby / Off</Text>
          <View style={styles.card}>
            {inactiveDevices.map((device, index, arr) => (
              <View key={device.id}>
                <DeviceItem device={device} totalPower={totalPower} />
                {index < arr.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
            {inactiveDevices.length === 0 && (
              <Text style={styles.emptyText}>All bulbs are currently ON.</Text>
            )}
          </View>
        </View>

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
    
    gaugeContainer: {
      alignItems: "center",
      paddingVertical: spacing.xl,
      backgroundColor: theme.card,
      borderBottomWidth: 0.5,
      borderBottomColor: theme.border,
      marginBottom: spacing.xl,
    },
    activeCount: {
      marginTop: spacing.md,
      fontSize: fontSizes.sm,
      color: theme.mutedForeground,
      fontFamily: Typography.fontFamily,
      fontWeight: Typography.fontWeights.medium,
    },
    
    listContainer: {
      paddingHorizontal: spacing.md,
      marginBottom: spacing.xl,
    },
    sectionTitle: {
      fontSize: fontSizes.h3,
      fontWeight: Typography.fontWeights.bold,
      color: theme.foreground,
      fontFamily: Typography.fontFamily,
      marginBottom: spacing.md,
      marginLeft: spacing.xs,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: radius.xl,
      padding: spacing.md,
      borderWidth: 0.5,
      borderColor: theme.border,
      ...shadows.sm,
    },
    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginVertical: spacing.sm,
    },
    emptyText: {
      textAlign: "center",
      padding: spacing.md,
      color: theme.mutedForeground,
      fontFamily: Typography.fontFamily,
      fontSize: fontSizes.base,
    },
  });
}
