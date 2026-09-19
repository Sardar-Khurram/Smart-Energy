import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Tabs, useSegments } from "expo-router";
import React from "react";
import { View } from "react-native";
import { useNavigationMode } from "react-native-navigation-mode";

import { useIsTablet, useResponsiveTokens } from "@/constants/theme";
import { useThemeColor } from "@/hooks/useThemeColor";

type TabIconProps = {
  name: keyof typeof MaterialCommunityIcons.glyphMap;
  focusedName: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  focused: boolean;
  size: number;
  primaryColor: string;
};

function TabIcon({ name, focusedName, color, focused, size, primaryColor }: TabIconProps) {
  return (
    <View
      style={{
        width: 44, height: 30, borderRadius: 15,
        backgroundColor: focused ? primaryColor + "18" : "transparent",
        alignItems: "center", justifyContent: "center",
      }}
    >
      <MaterialCommunityIcons
        name={focused ? focusedName : name}
        size={size}
        color={focused ? primaryColor : color}
      />
    </View>
  );
}

export default function TabLayout(): React.JSX.Element {
  const theme = useThemeColor();
  const segments = useSegments();
  const { layout, fontSizes, fontWeights, spacing } = useResponsiveTokens();
  const { navigationMode } = useNavigationMode();
  const isTablet = useIsTablet();

  const bottomInset = navigationMode?.isGestureNavigation
    ? isTablet ? 18 : 12
    : 8;

  // Show tab bar only on main tab screens
  const secondSegment = segments[1];
  const isTabRoute =
    segments.length === 1 ||
    secondSegment === "analytics" ||
    secondSegment === "live" ||
    // secondSegment === "alerts" ||
    secondSegment === "settings";

  const tabs = [
    { name: "index",     title: "Home",      icon: "home-outline",          iconFocused: "home" },
    { name: "analytics", title: "Analytics",  icon: "chart-line",            iconFocused: "chart-line-variant" },
    { name: "live",      title: "Live",       icon: "pulse",                 iconFocused: "pulse" },
    // { name: "alerts",    title: "Alerts",     icon: "bell-outline",          iconFocused: "bell" },
    { name: "settings",  title: "Settings",   icon: "cog-outline",           iconFocused: "cog" },
  ];

  const hiddenScreens = ["bill", "devices", "sensors", "alerts"];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.mutedForeground,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          display: isTabRoute ? "flex" : "none",
          height: isTablet ? 90 : 82,
          paddingTop: spacing.xs,
          paddingBottom: bottomInset,
          backgroundColor: theme.background,
          borderTopColor: theme.border,
          borderTopWidth: 0.5,
          elevation: 0,
        },
        tabBarItemStyle: { paddingVertical: spacing.xs, gap: 2 },
        tabBarLabelStyle: {
          fontSize: isTablet ? fontSizes.sm : fontSizes.xs,
          fontWeight: fontWeights.medium,
          marginBottom: 2,
        },
      }}
    >
      {tabs.map(({ name, title, icon, iconFocused }) => (
        <Tabs.Screen
          key={name}
          name={name}
          options={{
            title,
            tabBarActiveTintColor: theme.primary,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon
                name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
                focusedName={iconFocused as keyof typeof MaterialCommunityIcons.glyphMap}
                color={color} focused={focused}
                size={layout.iconSize + 2} primaryColor={theme.primary}
              />
            ),
          }}
        />
      ))}

      {hiddenScreens.map((name) => (
        <Tabs.Screen key={name} name={name} options={{ href: null, headerShown: false }} />
      ))}
    </Tabs>
  );
}
