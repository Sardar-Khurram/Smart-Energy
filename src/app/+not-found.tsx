import { Link, Stack } from "expo-router";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";

export default function NotFoundScreen() {
  const theme = useThemeColor();
  return (
    <>
      <Stack.Screen options={{ title: "Oops!" }} />
      <View style={[styles.container, { backgroundColor: theme.background }]}>
        <ThemedText type="heading1">Page not found</ThemedText>
        <Link href="/" style={{ marginTop: 16 }}>
          <ThemedText type="link">Go to home screen</ThemedText>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
});
