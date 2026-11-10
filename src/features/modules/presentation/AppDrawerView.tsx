import type { ReactElement } from "react";
import { useCallback } from "react";
import type { ListRenderItemInfo } from "react-native";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";

import BrandLogo from "@/src/components/branding/BrandLogo";
import GlassBackground from "@/src/components/ui/GlassBackground";
import UserAvatar from "@/src/components/ui/UserAvatar";
import type { ModuleViewModel } from "@/src/features/modules/domain/module.types";
import { useProfilePhoto } from "@/src/features/profile/hooks/use-profile-photo";
import DrawerModuleRow from "@/src/features/modules/presentation/DrawerModuleRow";
import { COLORS, MINIMUM_TOUCH_SIZE, RADII, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

const DRAWER_ICON_SIZE = 20;
/** Light red that stays legible on the dark maroon menu. */
const DRAWER_LOGOUT = "#FCA5A5";

interface AppDrawerViewProps {
  clientName: string;
  isLoggingOut: boolean;
  modules: readonly ModuleViewModel[];
  onClose: () => void;
  onLogout: () => void;
  onModulePress: (module: ModuleViewModel) => void;
  onProfile: () => void;
  selectedRoute?: string;
  userEmail: string;
  userName: string;
}

const getModuleKey = (module: ModuleViewModel): string => module.id;
const noop = (): void => undefined;

export default function AppDrawerView({
  clientName,
  isLoggingOut,
  modules,
  onClose,
  onLogout,
  onModulePress,
  onProfile,
  selectedRoute,
  userEmail,
  userName,
}: AppDrawerViewProps): ReactElement {
  const { photoUrl } = useProfilePhoto();
  const renderModule = useCallback(({ item }: ListRenderItemInfo<ModuleViewModel>): ReactElement => (
    <DrawerModuleRow
      depth={0}
      isExpanded={false}
      isSelected={item.key === selectedRoute}
      module={item}
      onModulePress={onModulePress}
      onToggle={noop}
    />
  ), [onModulePress, selectedRoute]);

  return (
    <View style={styles.drawer}>
      <GlassBackground highlight="all" intensity={60} radius={RADII.sheet} tint={COLORS.glassMaroonDeep} />
      <FlatList
        contentContainerStyle={styles.content}
        data={modules}
        keyExtractor={getModuleKey}
        ListHeaderComponent={
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <View style={styles.brand}>
                <BrandLogo tone="light" width={150} />
              </View>
              <Pressable accessibilityLabel="Close menu" accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.closeButton, pressed && styles.heroButtonPressed]}>
                <Feather accessibilityElementsHidden color={COLORS.white} name="menu" size={21} />
              </Pressable>
            </View>
            <Pressable accessibilityLabel={`Open profile for ${userName || "user"}`} accessibilityRole="button" onPress={onProfile} style={({ pressed }) => [styles.profile, pressed && styles.heroButtonPressed]}>
              <UserAvatar name={userName} size={MINIMUM_TOUCH_SIZE} tone="light" uri={photoUrl} />
              <View style={styles.profileCopy}>
                <Text numberOfLines={1} style={styles.userName}>{userName}</Text>
                <Text numberOfLines={1} style={styles.userEmail}>{userEmail}</Text>
                {clientName ? <Text numberOfLines={1} style={styles.clientName}>{clientName}</Text> : null}
              </View>
            </Pressable>
          </View>
        }
        ListEmptyComponent={<Text style={styles.stateText}>No mobile modules are assigned to your role.</Text>}
        renderItem={renderModule}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />
      <View style={styles.footer}>
        <Pressable accessibilityLabel="Logout" accessibilityRole="button" accessibilityState={{ disabled: isLoggingOut }} disabled={isLoggingOut} onPress={onLogout} style={({ pressed }) => [styles.logout, pressed && styles.logoutPressed]}>
          {isLoggingOut ? <ActivityIndicator color={DRAWER_LOGOUT} size="small" /> : <Feather accessibilityElementsHidden color={DRAWER_LOGOUT} name="log-out" size={DRAWER_ICON_SIZE} />}
          <Text style={styles.logoutLabel}>Logout</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  drawer: { borderBottomRightRadius: RADII.sheet, borderTopRightRadius: RADII.sheet, flex: 1, overflow: "hidden" },
  list: { flex: 1 },
  content: { flexGrow: 1, gap: SPACING.extraSmall, paddingBottom: SPACING.small },
  hero: { backgroundColor: "rgba(255, 255, 255, 0.06)", gap: SPACING.large, marginBottom: SPACING.large, paddingBottom: SPACING.extraLarge, paddingHorizontal: SPACING.extraLarge, paddingTop: SPACING.medium },
  heroTop: { alignItems: "center", flexDirection: "row", justifyContent: "space-between" },
  brand: { alignItems: "center", flex: 1, flexDirection: "row" },
  closeButton: { alignItems: "center", borderRadius: RADII.medium, height: MINIMUM_TOUCH_SIZE, justifyContent: "center", width: MINIMUM_TOUCH_SIZE },
  heroButtonPressed: { backgroundColor: "rgba(255, 255, 255, 0.16)" },
  profile: { alignItems: "center", borderRadius: RADII.medium, flexDirection: "row", gap: SPACING.medium, minHeight: MINIMUM_TOUCH_SIZE, paddingVertical: SPACING.extraSmall },
  profileCopy: { flex: 1 },
  avatar: { alignItems: "center", backgroundColor: COLORS.white, borderRadius: RADII.pill, height: MINIMUM_TOUCH_SIZE, justifyContent: "center", overflow: "hidden", width: MINIMUM_TOUCH_SIZE },
  userName: { color: COLORS.white, ...TYPOGRAPHY.control, fontWeight: "700" },
  userEmail: { color: COLORS.white, ...TYPOGRAPHY.caption, marginTop: SPACING.extraSmall, opacity: 0.95 },
  clientName: { color: COLORS.white, ...TYPOGRAPHY.caption, marginTop: SPACING.extraSmall, opacity: 0.8 },
  stateText: { color: COLORS.onMaroonMuted, ...TYPOGRAPHY.caption, paddingHorizontal: SPACING.extraLarge, paddingVertical: SPACING.small },
  footer: { borderTopColor: COLORS.onMaroonLine, borderTopWidth: StyleSheet.hairlineWidth, marginHorizontal: SPACING.medium, paddingBottom: SPACING.small, paddingTop: SPACING.medium },
  logout: { alignItems: "center", borderRadius: RADII.medium, flexDirection: "row", gap: SPACING.medium, minHeight: 52, paddingHorizontal: SPACING.medium },
  logoutPressed: { backgroundColor: "rgba(255, 255, 255, 0.08)" },
  logoutLabel: { color: DRAWER_LOGOUT, ...TYPOGRAPHY.body, fontWeight: "700" },
});
