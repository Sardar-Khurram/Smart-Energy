import React from "react";
import { ScrollView, StyleSheet, Switch, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import CommonHeader from "@/components/headers/CommonHeader";
import { Typography, useResponsiveTokens } from "@/constants/theme";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useSettingsStore } from "@/store/useSettingsStore";

export default function SettingsScreen() {
  const theme = useThemeColor();
  const { top } = useSafeAreaInsets();
  const styles = useStyles();
  
  const settings = useSettingsStore();

  return (
    <View style={[styles.container, { paddingTop: top }]}>
      <CommonHeader title="Settings" showBack={false} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Hardware Settings */}
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
                  const val = parseInt(text);
                  if (!isNaN(val)) settings.setLiveRefreshMs(val);
                }}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Billing & Budget */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Billing & Budget</Text>
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
                  const val = parseInt(text);
                  if (!isNaN(val)) settings.setMonthlyBudget(val);
                }}
                keyboardType="numeric"
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
                  const val = parseFloat(text);
                  if (!isNaN(val)) settings.setRatePerKwh(val);
                }}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        {/* Alerts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alert Preferences</Text>
          <View style={styles.card}>
            <View style={styles.settingRow}>
              <View style={styles.settingLabel}>
                <MaterialCommunityIcons name="flash-alert" size={22} color={theme.destructive} />
                <Text style={styles.settingText}>Voltage Fluctuations</Text>
              </View>
              <Switch 
                value={settings.alertVoltage} 
                onValueChange={(val) => settings.setAlertPreference("alertVoltage", val)}
                trackColor={{ false: theme.muted, true: theme.primary }}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLabel}>
                <MaterialCommunityIcons name="thermometer-alert" size={22} color={theme.destructive} />
                <Text style={styles.settingText}>High Temperature</Text>
              </View>
              <Switch 
                value={settings.alertTemperature} 
                onValueChange={(val) => settings.setAlertPreference("alertTemperature", val)}
                trackColor={{ false: theme.muted, true: theme.primary }}
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.settingRow}>
              <View style={styles.settingLabel}>
                <MaterialCommunityIcons name="power-plug-off" size={22} color={theme.destructive} />
                <Text style={styles.settingText}>Overload Warning</Text>
              </View>
              <Switch 
                value={settings.alertOverload} 
                onValueChange={(val) => settings.setAlertPreference("alertOverload", val)}
                trackColor={{ false: theme.muted, true: theme.primary }}
              />
            </View>
          </View>
        </View>

        <Text style={styles.versionText}>Smart Energy App v1.0.0</Text>

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
