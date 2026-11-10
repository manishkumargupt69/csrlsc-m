import type { ReactElement } from "react";
import { StyleSheet, View } from "react-native";
import { Redirect, Stack } from "expo-router";

import AppNavigationProvider from "@/src/components/navigation/AppNavigationContext";
import FloatingNavigationBar from "@/src/components/navigation/FloatingNavigationBar";
import { useAuthStore } from "@/src/features/auth/state/auth-store";

export default function AppLayout(): ReactElement {
  const session = useAuthStore((state) => state.session);

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <AppNavigationProvider>
      <View style={styles.container}>
        <Stack screenOptions={{ headerShown: false, animation: "ios_from_right", gestureEnabled: true }}>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        </Stack>
        <FloatingNavigationBar />
      </View>
    </AppNavigationProvider>
  );
}

const styles = StyleSheet.create({ container: { flex: 1 } });
