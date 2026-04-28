import React from "react";
import { View, ViewStyle } from "react-native";
import Svg, { Polyline } from "react-native-svg";

import { useThemeColor } from "@/hooks/useThemeColor";

interface MiniSparklineProps {
  data: number[];
  color?: string;
  width?: number;
  height?: number;
  style?: ViewStyle;
}

export default function MiniSparkline({
  data, color, width = 100, height = 30, style,
}: MiniSparklineProps) {
  const theme = useThemeColor();
  const lineColor = color || theme.primary;

  if (data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data
    .map((val, i) => {
      const x = padding + (i / (data.length - 1)) * (width - padding * 2);
      const y = padding + (1 - (val - min) / range) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <View style={[{ width, height }, style]}>
      <Svg width={width} height={height}>
        <Polyline
          points={points} fill="none" stroke={lineColor}
          strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
        />
      </Svg>
    </View>
  );
}
