import type { ReactElement } from "react";
import { StyleSheet } from "react-native";
import { Tabs } from "expo-router";

import FloatingTabBar from "@/src/components/navigation/FloatingTabBar";
import { TAB_ITEMS } from "@/src/components/navigation/tab-items";
import { COLORS } from "@/src/theme/tokens";

export default function AppTabsLayout(): ReactElement {
  return (
    <Tabs
      backBehavior="history"
      initialRouteName="dashboard"
      screenOptions={{ animation: "none", headerShown: false, lazy: false, sceneStyle: styles.scene }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      {TAB_ITEMS.map((item) => (
        <Tabs.Screen key={item.name} name={item.name} options={{ title: item.title, tabBarAccessibilityLabel: item.accessibilityLabel }} />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scene: { backgroundColor: COLORS.background },
});
