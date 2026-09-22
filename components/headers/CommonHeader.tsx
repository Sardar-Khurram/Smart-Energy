import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from "react-native";

import { Typography, useResponsiveTokens } from "@/constants/theme";
import { useThemeColor } from "@/hooks/useThemeColor";
import { useSettingsStore } from "@/store/useSettingsStore";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

interface CommonHeaderProps {
  title: string;
  subtitle?: string;
  onBackPress?: () => void;
  style?: ViewStyle;
  showBack?: boolean;
  rightAction?: { icon: FeatherIconName; onPress: () => void; badge?: number };
  rightElement?: React.ReactNode;
  showProfile?: boolean;
}

export function CommonHeader({
  title, subtitle, onBackPress, style, showBack = true, rightAction, rightElement, showProfile = true,
}: CommonHeaderProps) {
  const styles = useStyles();
  const theme = useThemeColor();
  const { layout } = useResponsiveTokens();
  const { profileImage, profileName } = useSettingsStore();

  const handleBackPress = () => {
    if (onBackPress) onBackPress();
    else router.back();
  };

  const handleProfilePress = () => {
    router.push("/(tabs)/settings");
  };

  const initial = (profileName?.trim()?.[0] || "U").toUpperCase();

  return (
    <View style={[styles.header, style]}>
      <View style={styles.left}>
        {showBack && (
          <TouchableOpacity style={styles.backBtn} onPress={handleBackPress} activeOpacity={0.7}>
            <Feather name="arrow-left" size={layout.iconSize + 1} color={theme.foreground} />
          </TouchableOpacity>
        )}
        <View style={styles.titleBlock}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={styles.right}>
        {rightElement ? rightElement : rightAction ? (
          <TouchableOpacity style={styles.actionBtn} onPress={rightAction.onPress} activeOpacity={0.7}>
            <Feather name={rightAction.icon} size={layout.iconSize + 1} color={theme.foreground} />
            {rightAction.badge && rightAction.badge > 0 ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{rightAction.badge > 99 ? "99+" : rightAction.badge}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        ) : null}

        {showProfile && (
          <TouchableOpacity 
            style={styles.profileBtn} 
            onPress={handleProfilePress} 
            activeOpacity={0.8}
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImg} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitial}>{initial}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function useStyles() {
  const { spacing, radius, fontSizes } = useResponsiveTokens();
  const theme = useThemeColor();

  return StyleSheet.create({
    header: {
      flexDirection: "row", alignItems: "center", justifyContent: "space-between",
      paddingHorizontal: spacing.md, paddingVertical: spacing.sm + 4,
      backgroundColor: theme.background, borderBottomWidth: 0.5, borderBottomColor: theme.border,
    },
    left: { flexDirection: "row", alignItems: "center", gap: spacing.sm, flex: 1, marginRight: spacing.sm },
    backBtn: {
      width: 38, height: 38, borderRadius: radius.sm, backgroundColor: theme.card,
      borderWidth: 0.5, borderColor: theme.border, alignItems: "center", justifyContent: "center", flexShrink: 0,
    },
    titleBlock: { flex: 1 },
    title: {
      fontSize: fontSizes.h3, fontWeight: Typography.fontWeights.semibold,
      color: theme.foreground, fontFamily: Typography.fontFamily, lineHeight: fontSizes.h3 * 1.2,
    },
    subtitle: { fontSize: fontSizes.sm, color: theme.mutedForeground, fontFamily: Typography.fontFamily, marginTop: 2 },
    right: { flexDirection: "row", alignItems: "center", gap: spacing.xs, flexShrink: 0 },
    actionBtn: {
      width: 38, height: 38, borderRadius: radius.sm, backgroundColor: theme.card,
      borderWidth: 0.5, borderColor: theme.border, alignItems: "center", justifyContent: "center",
    },
    badge: {
      position: "absolute", top: 5, right: 5, minWidth: 16, height: 16, borderRadius: radius.full,
      backgroundColor: theme.destructive, alignItems: "center", justifyContent: "center",
      paddingHorizontal: 3, borderWidth: 1.5, borderColor: theme.background,
    },
    badgeText: { fontSize: fontSizes.xxs, fontWeight: Typography.fontWeights.bold, color: theme.destructiveForeground, fontFamily: Typography.fontFamily },
    profileBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: theme.card,
      borderWidth: 1.5,
      borderColor: theme.primary,
      overflow: "hidden",
      alignItems: "center",
      justifyContent: "center",
    },
    avatarImg: {
      width: "100%",
      height: "100%",
    },
    avatarPlaceholder: {
      width: "100%",
      height: "100%",
      backgroundColor: theme.primary,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarInitial: {
      fontSize: fontSizes.sm,
      fontWeight: Typography.fontWeights.bold,
      color: theme.primaryForeground,
      fontFamily: Typography.fontFamily,
    },
  });
}

export default CommonHeader;
