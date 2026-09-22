import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useState } from "react";
import { Alert, Image, KeyboardAvoidingView, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getDefaultDeviceId, useGetBillingConfig } from "@/api/energy.service";
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
  const [refreshing, setRefreshing] = useState(false);

  const { data: tariffConfig, refetch: refetchTariff } = useGetBillingConfig();

  // ── Profile editing state ──
  const [showNameModal, setShowNameModal] = useState(false);
  const [tempName, setTempName] = useState("");

  const displayName = settings.profileName || "Smart Energy User";
  const displayImage = settings.profileImage || "";

  const handleEditName = () => {
    setTempName(displayName);
    setShowNameModal(true);
  };

  const handleSaveName = () => {
    const name = tempName.trim();
    if (name) {
      settings.setProfileName(name);
    }
    setShowNameModal(false);
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Required", "Please grant photo library permissions.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      settings.setProfileImage(result.assets[0].uri);
    }
  };
  // ── end profile ──

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetchTariff();
    setTimeout(() => {
      setRefreshing(false);
    }, 600);
  }, [refetchTariff]);

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
            <View style={styles.labelTextContainer}>
              <Text style={styles.settingText}>Monthly Budget</Text>
              <Text style={styles.readOnlySubtext} numberOfLines={1}>For bill prediction & alerts</Text>
            </View>
          </View>
          <View style={styles.budgetInputContainer}>
            <Text style={styles.currencyPrefix}>Rs.</Text>
            <TextInput 
              style={styles.budgetInput}
              value={settings.monthlyBudget ? settings.monthlyBudget.toString() : ""}
              onChangeText={(text) => {
                const val = parseInt(text.replace(/[^0-9]/g, ""), 10) || 0;
                settings.setMonthlyBudget(val);
              }}
              keyboardType="numeric"
              placeholder="5000"
              placeholderTextColor={theme.mutedForeground}
            />
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <MaterialCommunityIcons name="lightning-bolt" size={22} color={theme.primary} />
            <View style={styles.labelTextContainer}>
              <Text style={styles.settingText}>Rate per kWh</Text>
              <Text style={styles.readOnlySubtext} numberOfLines={1}>
                {tariffConfig?.tariff_type ? `${tariffConfig.tariff_type.toUpperCase()} • ` : ""}Official utility tariff
              </Text>
            </View>
          </View>
          <View style={styles.readOnlyValueBox}>
            <Text style={styles.readOnlyValueText}>
              Rs. {tariffConfig?.rate_per_kwh ?? settings.ratePerKwh} / unit
            </Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <MaterialCommunityIcons name="calendar-sync" size={22} color={theme.primary} />
            <View style={styles.labelTextContainer}>
              <Text style={styles.settingText}>Billing Cycle</Text>
              <Text style={styles.readOnlySubtext} numberOfLines={1}>Cycle resets every month</Text>
            </View>
          </View>
          <View style={styles.readOnlyValueBox}>
            <Text style={styles.readOnlyValueText}>
              Day {tariffConfig?.billing_cycle_start_day ?? settings.billingCycleStartDay}
            </Text>
          </View>
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
            <View style={styles.labelTextContainer}>
              <Text style={styles.settingText}>ESP32 IP Address</Text>
              <Text style={styles.readOnlySubtext} numberOfLines={1}>Hardware network IP</Text>
            </View>
          </View>
          <View style={styles.readOnlyValueBox}>
            <Text style={styles.readOnlyValueText}>{settings.esp32Ip || "192.168.1.100"}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <MaterialCommunityIcons name="ethernet" size={22} color={theme.primary} />
            <View style={styles.labelTextContainer}>
              <Text style={styles.settingText}>ESP32 Port</Text>
              <Text style={styles.readOnlySubtext} numberOfLines={1}>Communication port</Text>
            </View>
          </View>
          <View style={styles.readOnlyValueBox}>
            <Text style={styles.readOnlyValueText}>{settings.esp32Port || 80}</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <MaterialCommunityIcons name="refresh" size={22} color={theme.primary} />
            <View style={styles.labelTextContainer}>
              <Text style={styles.settingText}>Live Refresh Rate</Text>
              <Text style={styles.readOnlySubtext} numberOfLines={1}>Real-time sensor sync</Text>
            </View>
          </View>
          <View style={styles.readOnlyValueBox}>
            <Text style={styles.readOnlyValueText}>{settings.liveRefreshMs} ms</Text>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.settingRow}>
          <View style={styles.settingLabel}>
            <MaterialCommunityIcons name="view-dashboard" size={22} color={theme.primary} />
            <View style={styles.labelTextContainer}>
              <Text style={styles.settingText}>Dashboard Refresh</Text>
              <Text style={styles.readOnlySubtext} numberOfLines={1}>Telemetry polling interval</Text>
            </View>
          </View>
          <View style={styles.readOnlyValueBox}>
            <Text style={styles.readOnlyValueText}>{settings.dashboardRefreshMs} ms</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <CommonHeader title="Settings" showBack={false} showProfile={false} />

      {/* ── Profile Card ── */}
      <View style={styles.profileCard}>
        <TouchableOpacity onPress={handlePickImage} activeOpacity={0.7}>
          <View style={styles.avatarRing}>
            {displayImage ? (
              <Image source={{ uri: displayImage }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <MaterialCommunityIcons name="account" size={32} color={theme.mutedForeground} />
              </View>
            )}
            <View style={styles.cameraBadge}>
              <Feather name="camera" size={12} color="#fff" />
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleEditName} activeOpacity={0.7} style={styles.nameRow}>
          <Text style={styles.profileName} numberOfLines={1}>{displayName}</Text>
          <Feather name="edit-2" size={14} color={theme.mutedForeground} />
        </TouchableOpacity>
      </View>

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
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[theme.primary]}
              tintColor={theme.primary}
            />
          }
        >
          {activeTab === "General" && renderGeneralSettings()}
          {activeTab === "Hardware" && renderHardwareSettings()}
          
          <Text style={styles.versionText}>Smart Energy App v1.0.0</Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Name Edit Modal ── */}
      <Modal visible={showNameModal} transparent animationType="fade" onRequestClose={() => setShowNameModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowNameModal(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalContent} onPress={() => {}}>
            <Text style={styles.modalTitle}>Edit Display Name</Text>
            <TextInput
              style={styles.modalInput}
              value={tempName}
              onChangeText={setTempName}
              placeholder="Enter your name"
              placeholderTextColor={theme.mutedForeground}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSaveName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={[styles.modalBtn, styles.modalCancelBtn]} onPress={() => setShowNameModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalBtn, styles.modalSaveBtn]} onPress={handleSaveName}>
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
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
    sectionHeaderRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.xs,
    },
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
      flex: 1,
      marginRight: spacing.sm,
    },
    labelTextContainer: {
      flex: 1,
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
    budgetInputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.sm,
      height: 38,
      minWidth: 100,
      maxWidth: 130,
    },
    currencyPrefix: {
      fontSize: fontSizes.xs,
      fontFamily: Typography.fontFamily,
      color: theme.mutedForeground,
      fontWeight: Typography.fontWeights.semibold,
      marginRight: 4,
    },
    budgetInput: {
      flex: 1,
      color: theme.foreground,
      fontFamily: Typography.fontFamily,
      fontSize: fontSizes.sm,
      fontWeight: Typography.fontWeights.bold,
      padding: 0,
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

    readOnlyBadge: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      backgroundColor: theme.muted,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.full,
      borderWidth: 0.5,
      borderColor: theme.border,
    },
    readOnlyBadgeText: {
      fontSize: fontSizes.xs,
      fontFamily: Typography.fontFamily,
      color: theme.mutedForeground,
      fontWeight: Typography.fontWeights.medium,
    },
    readOnlySubtext: {
      fontSize: fontSizes.xs,
      fontFamily: Typography.fontFamily,
      color: theme.mutedForeground,
      marginTop: 2,
    },
    readOnlyValueBox: {
      backgroundColor: theme.muted,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.md,
      borderWidth: 0.5,
      borderColor: theme.border,
      alignItems: "center",
      justifyContent: "center",
      height: 38,
      minWidth: 95,
    },
    readOnlyValueText: {
      fontSize: fontSizes.xs,
      fontFamily: Typography.fontFamily,
      fontWeight: Typography.fontWeights.bold,
      color: theme.foreground,
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

    // ── Profile Card ──
    profileCard: {
      marginTop: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: theme.card,
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
      borderRadius: radius.xl,
      padding: spacing.md,
      borderWidth: 0.5,
      borderColor: theme.border,
      ...shadows.sm,
    },
    avatarRing: {
      width: 56,
      height: 56,
      borderRadius: 28,
      borderWidth: 2,
      borderColor: theme.primary,
      overflow: "hidden",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.muted,
    },
    avatarImage: {
      width: "100%",
      height: "100%",
      borderRadius: 28,
    },
    avatarPlaceholder: {
      width: "100%",
      height: "100%",
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: theme.muted,
    },
    cameraBadge: {
      position: "absolute",
      bottom: 0,
      right: 0,
      width: 20,
      height: 20,
      borderRadius: 10,
      backgroundColor: theme.primary,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1.5,
      borderColor: theme.card,
    },
    nameRow: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      marginLeft: spacing.md,
      gap: spacing.xs,
    },
    profileName: {
      fontSize: fontSizes.lg,
      fontWeight: Typography.fontWeights.bold,
      fontFamily: Typography.fontFamily,
      color: theme.foreground,
      flexShrink: 1,
    },

    // ── Name Edit Modal ──
    modalOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.lg,
    },
    modalContent: {
      backgroundColor: theme.card,
      borderRadius: radius.xl,
      padding: spacing.xl,
      width: "100%",
      maxWidth: 380,
    },
    modalTitle: {
      fontSize: fontSizes.lg,
      fontWeight: Typography.fontWeights.bold,
      fontFamily: Typography.fontFamily,
      color: theme.foreground,
      marginBottom: spacing.md,
      textAlign: "center",
    },
    modalInput: {
      backgroundColor: theme.background,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      fontFamily: Typography.fontFamily,
      fontSize: fontSizes.base,
      color: theme.foreground,
      marginBottom: spacing.lg,
    },
    modalButtons: {
      flexDirection: "row",
      gap: spacing.md,
    },
    modalBtn: {
      flex: 1,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      alignItems: "center",
    },
    modalCancelBtn: {
      backgroundColor: theme.muted,
      borderWidth: 1,
      borderColor: theme.border,
    },
    modalCancelText: {
      fontFamily: Typography.fontFamily,
      fontSize: fontSizes.base,
      fontWeight: Typography.fontWeights.semibold,
      color: theme.foreground,
    },
    modalSaveBtn: {
      backgroundColor: theme.primary,
    },
    modalSaveText: {
      fontFamily: Typography.fontFamily,
      fontSize: fontSizes.base,
      fontWeight: Typography.fontWeights.semibold,
      color: theme.primaryForeground,
    },
  });
}
