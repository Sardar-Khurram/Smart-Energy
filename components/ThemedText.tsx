import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  type TextProps,
} from "react-native";

import { Typography, useResponsiveTokens } from "@/constants/theme";
import { useThemeColor } from "@/hooks/useThemeColor";

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  link?: string;
  type?:
    | "default"
    | "title"
    | "subtitle"
    | "defaultSemiBold"
    | "link"
    | "phone"
    | "mail"
    | "small"
    | "large"
    | "caption"
    | "heading1"
    | "heading2"
    | "heading3";
};

export function ThemedText({
  style,
  lightColor,
  link,
  darkColor,
  type = "default",
  ...rest
}: ThemedTextProps) {
  const colors = useThemeColor();
  const styles = useStyles();

  function handlePress() {
    if (!link) return;

    let url: string | undefined = undefined;

    switch (type) {
      case "link":
        url = link;
        break;
      case "phone":
        url = `tel:${link}`;
        break;
      case "mail":
        url = `mailto:${link}`;
        break;
    }

    if (url)
      Linking.openURL(url).catch((err) =>
        console.error("Failed to open URL:", url, err)
      );
  }

  const textColor = colors.foreground;

  const textElement = (
    <Text
      maxFontSizeMultiplier={1}
      style={[
        {
          color: textColor,
          fontFamily: Typography.fontFamily,
        },
        type === "default" ? styles.default : undefined,
        type === "title" ? styles.title : undefined,
        type === "subtitle" ? styles.subtitle : undefined,
        type === "defaultSemiBold" ? styles.defaultSemiBold : undefined,
        type === "link" || type === "mail" || type === "phone"
          ? styles.link
          : undefined,
        type === "small" ? styles.small : undefined,
        type === "large" ? styles.large : undefined,
        type === "caption" ? styles.caption : undefined,
        type === "heading1" ? styles.heading1 : undefined,
        type === "heading2" ? styles.heading2 : undefined,
        type === "heading3" ? styles.heading3 : undefined,
        style,
      ]}
      {...rest}
    />
  );

  if ((type === "link" || type === "phone" || type === "mail") && link) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={handlePress}>
        {textElement}
      </TouchableOpacity>
    );
  }

  return textElement;
}

function useStyles() {
  const { fontSizes } = useResponsiveTokens();
  const colors = useThemeColor();

  return StyleSheet.create({
    default: {
      fontSize: fontSizes.base,
      lineHeight: fontSizes.base * 1.5,
      fontWeight: Typography.fontWeights.normal,
    },
    defaultSemiBold: {
      fontSize: fontSizes.base,
      lineHeight: fontSizes.base * 1.5,
      fontWeight: Typography.fontWeights.semibold,
    },
    small: {
      fontSize: fontSizes.sm,
      lineHeight: fontSizes.sm * 1.4,
      fontWeight: Typography.fontWeights.normal,
    },
    large: {
      fontSize: fontSizes.lg,
      lineHeight: fontSizes.lg * 1.4,
      fontWeight: Typography.fontWeights.normal,
    },
    caption: {
      fontSize: fontSizes.xs,
      lineHeight: fontSizes.xs * 1.3,
      fontWeight: Typography.fontWeights.normal,
      color: colors.mutedForeground,
    },
    title: {
      fontSize: fontSizes.display,
      lineHeight: fontSizes.display * 1.2,
      fontWeight: Typography.fontWeights.bold,
    },
    heading1: {
      fontSize: fontSizes.h1,
      lineHeight: fontSizes.h1 * 1.2,
      fontWeight: Typography.fontWeights.bold,
    },
    heading2: {
      fontSize: fontSizes.h2,
      lineHeight: fontSizes.h2 * 1.3,
      fontWeight: Typography.fontWeights.bold,
    },
    heading3: {
      fontSize: fontSizes.h3,
      lineHeight: fontSizes.h3 * 1.3,
      fontWeight: Typography.fontWeights.semibold,
    },
    subtitle: {
      fontSize: fontSizes.lg,
      lineHeight: fontSizes.lg * 1.4,
      fontWeight: Typography.fontWeights.semibold,
    },
    link: {
      fontSize: fontSizes.base,
      lineHeight: fontSizes.base * 1.5,
      fontWeight: Typography.fontWeights.medium,
      color: colors.primary,
    },
  });
}
