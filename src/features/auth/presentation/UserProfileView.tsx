import type { ReactElement } from "react";
import { memo } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import Constants from "expo-constants";

import InfoRow, { InfoGroup } from "@/src/components/ui/InfoRow";
import MetaChip from "@/src/components/ui/MetaChip";
import SettingsRow from "@/src/components/ui/SettingsRow";
import UserAvatar from "@/src/components/ui/UserAvatar";
import type { AuthenticatedUser } from "@/src/features/auth/domain/auth.types";
import { COLORS, RADII, SCREEN_HORIZONTAL_PADDING, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";
import { formatDateTime } from "@/src/utils/format-date-time";
import { useScreenInsets } from "@/src/components/ui/ScreenContainer";

const AVATAR_SIZE = 96;
const BADGE_SIZE = 32;

const getCompanySummary = (user: AuthenticatedUser): string =>
  user.company.map((company) => company.name).join(", ");

interface UserProfileViewProps {
  user: AuthenticatedUser;
  isSigningOut: boolean;
  /** Link to the profile picture, or null to show initials. */
  photoUrl: string | null;
  isUpdatingPhoto: boolean;
  onChangePhotoPress: () => void;
  onMpinPress: () => void;
  onChangePasswordPress: () => void;
  onSignOutPress: () => void;
}

interface SectionLabelProps {
  children: string;
}

function SectionLabel({ children }: SectionLabelProps): ReactElement {
  return <Text accessibilityRole="header" style={styles.sectionLabel}>{children}</Text>;
}

function UserProfileView({
  user,
  isSigningOut,
  photoUrl,
  isUpdatingPhoto,
  onChangePhotoPress,
  onMpinPress,
  onChangePasswordPress,
  onSignOutPress,
}: UserProfileViewProps): ReactElement {
  const insets = useScreenInsets();
  const companySummary = getCompanySummary(user);
  const appVersion = Constants.expoConfig?.version;
  const showsClientChip = Boolean(user.clientName) && user.clientName !== user.name;

  return (
    <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + SPACING.large, paddingBottom: insets.bottom + SPACING.section }]} showsVerticalScrollIndicator={false}>
      <View style={styles.identity}>
        <Pressable
          accessibilityLabel="Change profile photo"
          accessibilityRole="button"
          accessibilityState={{ busy: isUpdatingPhoto, disabled: isUpdatingPhoto }}
          disabled={isUpdatingPhoto}
          onPress={onChangePhotoPress}
          style={styles.avatar}
        >
          <UserAvatar name={user.name} size={AVATAR_SIZE} uri={photoUrl} />
          {isUpdatingPhoto ? (
            <View style={styles.avatarBusy}><ActivityIndicator color={COLORS.white} /></View>
          ) : (
            <View style={styles.badge}><Feather color={COLORS.maroonDark} name="camera" size={16} /></View>
          )}
        </Pressable>
        <Text accessibilityRole="header" numberOfLines={2} style={styles.name}>{user.name}</Text>
        {user.email ? <Text numberOfLines={1} selectable style={styles.email}>{user.email}</Text> : null}
        <View style={styles.chips}>
          <MetaChip icon="shield" label={user.roleName} tone="info" />
          {showsClientChip ? <MetaChip icon="briefcase" label={user.clientName} /> : null}
        </View>
      </View>

      <View style={styles.section}>
        <SectionLabel>Account</SectionLabel>
        <InfoGroup>
          <InfoRow iconName="briefcase" isSelectable label="Employee code" value={user.employeeCode ?? ""} />
          <InfoRow iconName="at-sign" isSelectable label="Login ID" value={user.userId} />
          <InfoRow iconName="phone" isSelectable label="Mobile" value={user.mobile} />
          <InfoRow iconName="home" label="Company" value={companySummary} />
          {user.branchId ? <InfoRow iconName="map-pin" label="Branch ID" value={user.branchId} /> : null}
          <InfoRow iconName="clock" label="Last sign-in" value={formatDateTime(user.lastLogin)} />
        </InfoGroup>
      </View>

      <View style={styles.section}>
        <SectionLabel>Security</SectionLabel>
        <InfoGroup>
          <SettingsRow
            badge={user.hasMpin ? { label: "On", tone: "success" } : { label: "Not set up", tone: "warning" }}
            iconName="hash"
            onPress={onMpinPress}
            subtitle="Sign in faster with a short PIN"
            title={user.hasMpin ? "Change MPIN" : "Set up MPIN"}
          />
          <SettingsRow iconName="key" onPress={onChangePasswordPress} subtitle="Use a password you have not used before" title="Change password" />
        </InfoGroup>
      </View>

      <View style={styles.section}>
        <InfoGroup>
          <SettingsRow
            iconName="log-out"
            isDisabled={isSigningOut}
            onPress={onSignOutPress}
            title={isSigningOut ? "Signing out…" : "Sign out"}
            tone="danger"
          />
        </InfoGroup>
      </View>

      {appVersion ? <Text style={styles.version}>CSRLSC · Version {appVersion}</Text> : null}
    </ScrollView>
  );
}

export default memo(UserProfileView);

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
    gap: SPACING.large,
    paddingBottom: SPACING.section,
    paddingHorizontal: SCREEN_HORIZONTAL_PADDING,
    paddingTop: SPACING.large,
  },
  identity: {
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderRadius: RADII.sheet,
    borderWidth: StyleSheet.hairlineWidth,
    gap: SPACING.small,
    paddingHorizontal: SPACING.large,
    paddingVertical: SPACING.extraLarge,
  },
  avatar: { height: AVATAR_SIZE, marginBottom: SPACING.small, width: AVATAR_SIZE },
  avatarBusy: { alignItems: "center", backgroundColor: "rgba(0, 0, 0, 0.45)", borderRadius: AVATAR_SIZE / 2, bottom: 0, justifyContent: "center", left: 0, position: "absolute", right: 0, top: 0 },
  badge: { alignItems: "center", backgroundColor: COLORS.gold, borderColor: COLORS.surface, borderRadius: BADGE_SIZE / 2, borderWidth: 2, bottom: -2, height: BADGE_SIZE, justifyContent: "center", position: "absolute", right: -2, width: BADGE_SIZE },
  name: { color: COLORS.ink, fontSize: 22, fontWeight: "800", textAlign: "center" },
  email: { color: COLORS.inkMuted, ...TYPOGRAPHY.body },
  chips: { alignItems: "center", flexDirection: "row", flexWrap: "wrap", gap: SPACING.small, justifyContent: "center", marginTop: SPACING.small },
  section: { gap: SPACING.small },
  sectionLabel: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption, fontSize: 13, fontWeight: "700", letterSpacing: 0.3, paddingHorizontal: SPACING.small },
  version: { color: COLORS.inkMuted, ...TYPOGRAPHY.caption, textAlign: "center" },
});
