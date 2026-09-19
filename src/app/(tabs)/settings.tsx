import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getDefaultDeviceId } from "@/api/energy.service";
import { ExportAction, ExportFormat, exportReport, ExportType } from "@/api/export.service";
import CommonHeader from "@/components/headers/CommonHeader";
import { Typography, useResponsiveTokens } from "@/constants/theme";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useSettingsStore } from "@/store/useSettingsStore";
import { showError, showSuccess } from "@/utils/toast";

type SettingsTab = "General" | "Hardware";

export default function SettingsScreen() {
  const theme = useThemeColor();
  const { top } = useSafeAreaInsets();
  const styles = useStyles();
  
  const settings = useSettingsStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>("General");
  const [isExporting, setIsExporting] = useState(false);

  const tabs: SettingsTab[] = ["General", "Hardware"];

  const handleExport = (type: ExportType, format: ExportFormat) => {
    Alert.alert(
      "Export Report",
      "How would you like to export this data?",
      [
        {
          text: "Share Link/File",
          onPress: () => performExport(type, format, "share"),
        },
        {
          text: "Download to Device",
          onPress: () => performExport(type, format, "save"),
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  };

  const performExport = async (type: ExportType, format: ExportFormat, action: ExportAction) => {
    try {
      setIsExporting(true);
      const deviceId = await getDefaultDeviceId();
      await exportReport(deviceId, type, format, action);
      
      // On Android 'save' finishes silently after directory picking, so we show success.
      // On iOS/Share, the system UI handles the completion.
      if (action === 'save' && Platform.OS === 'android') {
        showSuccess("Report saved successfully!");
      }
    } catch (error) {
      showError("Export failed: " + (error instanceof Error ? error.message : "Unknown error"));
    } finally {
      setIsExporting(false);
    }
  };

  const renderGeneralSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Appearance</Text>
      <View style={styles.card}>
        <View style={[styles.settingRow, { flexDirection: "column", alignItems: "flex-start", gap: 12 }]}>
          <View style={styles.settingLabel}>
            <MaterialCommunityIcons name="theme-light-dark" size={22} color={theme.primary} />
            <Text style={styles.settingText}>Theme Mode</Text>
          </View>
          <View style={styles.segmentedControl}>
            {(["system", "light", "dark"] as const).map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.segmentButton, settings.themeMode === mode && styles.segmentButtonActive]}
                onPress={() => settings.setThemeMode(mode)}
              >
                <Text style={[styles.segmentText, settings.themeMode === mode && styles.segmentTextActive]}>
                  {mode.charAt(0).toUpperCase() + mode.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Billing & Budget</Text>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <MaterialCommunityIcons name="cash-multiple" size={22} color={theme.primary} />
            <Text style={styles.settingText}>Monthly Budget (Rs.)</Text>
          </View>
          <TextInput 
            style={styles.input}
            value={settings.monthlyBudget.toString()}
            onChangeText={(text) => {
              const val = parseInt(text) || 0;
              settings.setMonthlyBudget(val);
            }}
            keyboardType="numeric"
            placeholderTextColor={theme.mutedForeground}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <MaterialCommunityIcons name="lightning-bolt" size={22} color={theme.primary} />
            <Text style={styles.settingText}>Rate per kWh (Rs.)</Text>
          </View>
          <TextInput 
            style={styles.input}
            value={settings.ratePerKwh.toString()}
            onChangeText={(text) => {
              const val = parseFloat(text) || 0;
              settings.setRatePerKwh(val);
            }}
            keyboardType="numeric"
            placeholderTextColor={theme.mutedForeground}
          />
        </View>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Data Export</Text>
      <View style={styles.card}>
        <TouchableOpacity 
          style={styles.settingRow} 
          onPress={() => handleExport("consumption", "csv")} 
          disabled={isExporting}
        >
          <View style={styles.settingLabel}>
            <MaterialCommunityIcons name="file-excel-outline" size={22} color={theme.primary} />
            <Text style={styles.settingText}>Export Consumption (CSV)</Text>
          </View>
          <MaterialCommunityIcons name="download" size={20} color={theme.mutedForeground} />
        </TouchableOpacity>
        <View style={styles.divider} />
        <TouchableOpacity 
          style={styles.settingRow} 
          onPress={() => handleExport("billing", "pdf")} 
          disabled={isExporting}
        >
          <View style={styles.settingLabel}>
            <MaterialCommunityIcons name="file-pdf-box" size={22} color={theme.destructive} />
            <Text style={styles.settingText}>Export Invoice (PDF)</Text>
          </View>
          <MaterialCommunityIcons name="download" size={20} color={theme.mutedForeground} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderHardwareSettings = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Hardware Config</Text>
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <MaterialCommunityIcons name="ip-network" size={22} color={theme.primary} />
            <Text style={styles.settingText}>ESP32 IP Address</Text>
          </View>
          <TextInput 
            style={styles.input}
            value={settings.esp32Ip}
            onChangeText={settings.setEsp32Ip}
            placeholder="192.168.x.x"
            placeholderTextColor={theme.mutedForeground}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <MaterialCommunityIcons name="refresh" size={22} color={theme.primary} />
            <Text style={styles.settingText}>Live Refresh Rate (ms)</Text>
          </View>
          <TextInput 
            style={styles.input}
            value={settings.liveRefreshMs.toString()}
            onChangeText={(text) => {
              const val = parseInt(text) || 1000;
              settings.setLiveRefreshMs(val);
            }}
            keyboardType="numeric"
            placeholderTextColor={theme.mutedForeground}
          />
        </View>
        <View style={styles.divider} />
        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <MaterialCommunityIcons name="view-dashboard" size={22} color={theme.primary} />
            <Text style={styles.settingText}>Dashboard Refresh (ms)</Text>
          </View>
          <TextInput 
            style={styles.input}
            value={settings.dashboardRefreshMs.toString()}
            onChangeText={(text) => {
              const val = parseInt(text) || 5000;
              settings.setDashboardRefreshMs(val);
            }}
            keyboardType="numeric"
            placeholderTextColor={theme.mutedForeground}
          />
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <CommonHeader title="Settings" showBack={false} />

      {/* Tabs Layout */}
      <View style={styles.tabContainer}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          {activeTab === "General" && renderGeneralSettings()}
          {activeTab === "Hardware" && renderHardwareSettings()}
          
          <Text style={styles.versionText}>Smart Energy App v1.0.0</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function useStyles() {
  const theme = useThemeColor();
  const { spacing, fontSizes, radius, shadows } = useResponsiveTokens();

  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.background },
    scrollContent: { paddingBottom: spacing["2xl"], paddingTop: spacing.md },
    
    // Tabs styling
    tabContainer: {
      flexDirection: "row",
      paddingHorizontal: spacing.md,
      marginBottom: spacing.md,
      backgroundColor: theme.background,
    },
    tabButton: {
      flex: 1,
      paddingVertical: spacing.md,
      alignItems: "center",
      borderBottomWidth: 2,
      borderBottomColor: "transparent",
    },
    tabButtonActive: {
      borderBottomColor: theme.primary,
    },
    tabText: {
      fontSize: fontSizes.sm,
      fontFamily: Typography.fontFamily,
      fontWeight: Typography.fontWeights.medium,
      color: theme.mutedForeground,
    },
    tabTextActive: {
      color: theme.primary,
      fontWeight: Typography.fontWeights.bold,
    },

    section: { marginBottom: spacing.xl, paddingHorizontal: spacing.md },
    sectionTitle: {
      fontSize: fontSizes.base,
      fontWeight: Typography.fontWeights.bold,
      color: theme.mutedForeground,
      fontFamily: Typography.fontFamily,
      marginBottom: spacing.sm,
      marginLeft: spacing.xs,
    },
    card: {
      backgroundColor: theme.card,
      borderRadius: radius.xl,
      borderWidth: 0.5,
      borderColor: theme.border,
      overflow: "hidden",
      ...shadows.sm,
    },
    settingRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      padding: spacing.md,
    },
    settingLabel: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    settingText: {
      fontSize: fontSizes.base,
      color: theme.foreground,
      fontFamily: Typography.fontFamily,
      fontWeight: Typography.fontWeights.medium,
    },
    input: {
      backgroundColor: theme.background,
      color: theme.foreground,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.md,
      fontFamily: Typography.fontFamily,
      fontSize: fontSizes.base,
      borderWidth: 1,
      borderColor: theme.border,
      minWidth: 100,
      textAlign: "right",
    },
    
    // Segmented control for theme
    segmentedControl: {
      flexDirection: "row",
      backgroundColor: theme.muted,
      borderRadius: radius.lg,
      padding: 4,
      width: "100%",
    },
    segmentButton: {
      flex: 1,
      paddingVertical: 8,
      alignItems: "center",
      borderRadius: radius.md,
    },
    segmentButtonActive: {
      backgroundColor: theme.card,
      ...shadows.sm,
    },
    segmentText: {
      fontSize: fontSizes.sm,
      fontFamily: Typography.fontFamily,
      fontWeight: Typography.fontWeights.medium,
      color: theme.mutedForeground,
    },
    segmentTextActive: {
      color: theme.foreground,
      fontWeight: Typography.fontWeights.bold,
    },

    divider: {
      height: 1,
      backgroundColor: theme.border,
      marginLeft: spacing.xl + spacing.md, // Align with text, skipping icon
    },
    versionText: {
      textAlign: "center",
      fontSize: fontSizes.sm,
      color: theme.mutedForeground,
      fontFamily: Typography.fontFamily,
      marginTop: spacing.md,
      marginBottom: spacing.xl,
    },
  });
}
