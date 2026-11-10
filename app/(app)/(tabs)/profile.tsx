import type { ReactElement } from "react";
import { useCallback, useEffect, useState } from "react";
import { Alert } from "react-native";
import { Redirect, router, useLocalSearchParams } from "expo-router";

import DrawerHeader from "@/src/components/ui/DrawerHeader";
import ScreenContainer from "@/src/components/ui/ScreenContainer";
import { useChangePassword } from "@/src/features/auth/hooks/use-change-password";
import { useChangeMpin } from "@/src/features/auth/hooks/use-change-mpin";
import { useSignOut } from "@/src/features/auth/hooks/use-sign-out";
import { useSetMpin } from "@/src/features/auth/hooks/use-set-mpin";
import ChangeMpinModal from "@/src/features/auth/presentation/ChangeMpinModal";
import ChangePasswordModal from "@/src/features/auth/presentation/ChangePasswordModal";
import SetMpinModal from "@/src/features/auth/presentation/SetMpinModal";
import UserProfileView from "@/src/features/auth/presentation/UserProfileView";
import { useAuthStore } from "@/src/features/auth/state/auth-store";
import { useProfilePhoto } from "@/src/features/profile/hooks/use-profile-photo";

export default function ProfileScreen(): ReactElement {
  const session = useAuthStore((state) => state.session);
  const signOut = useSignOut();
  const { photoUrl, isUpdating: isUpdatingPhoto, choosePhoto } = useProfilePhoto();
  const changePassword = useChangePassword(session);
  const changeMpin = useChangeMpin(session);
  const setMpin = useSetMpin(session);
  const { updateField: updateChangePasswordField } = changePassword;
  const {
    open: openChangeMpin,
    updateField: updateChangeMpinField,
  } = changeMpin;
  const { open: openSetMpin, updateField: updateSetMpinField } = setMpin;
  // Arriving from the "Sign in faster" offer opens the Set MPIN sheet straight away.
  const { setupMpin } = useLocalSearchParams<{ setupMpin?: string }>();
  useEffect(() => {
    if (!setupMpin) return;
    openSetMpin();
    // Clear the flag so returning to this tab later does not reopen the sheet.
    router.setParams({ setupMpin: undefined });
  }, [openSetMpin, setupMpin]);
  const handleOldPasswordChange = useCallback(
    (value: string): void => updateChangePasswordField("oldPassword", value),
    [updateChangePasswordField],
  );
  const handleNewPasswordChange = useCallback(
    (value: string): void => updateChangePasswordField("newPassword", value),
    [updateChangePasswordField],
  );
  const handleConfirmationChange = useCallback(
    (value: string): void => updateChangePasswordField("confirmation", value),
    [updateChangePasswordField],
  );
  const handleMobileChange = useCallback(
    (value: string): void => updateSetMpinField("mobile", value),
    [updateSetMpinField],
  );
  const handleMpinChange = useCallback(
    (value: string): void => updateSetMpinField("mpin", value),
    [updateSetMpinField],
  );
  const handleMpinConfirmationChange = useCallback(
    (value: string): void => updateSetMpinField("confirmation", value),
    [updateSetMpinField],
  );
  const handleMpinPress = useCallback((): void => {
    if (session?.user.hasMpin) {
      openChangeMpin();
      return;
    }
    openSetMpin();
  }, [openChangeMpin, openSetMpin, session?.user.hasMpin]);
  const handleOldMpinChange = useCallback(
    (value: string): void => updateChangeMpinField("oldMpin", value),
    [updateChangeMpinField],
  );
  const handleNewMpinChange = useCallback(
    (value: string): void => updateChangeMpinField("newMpin", value),
    [updateChangeMpinField],
  );
  const handleNewMpinConfirmationChange = useCallback(
    (value: string): void => updateChangeMpinField("confirmation", value),
    [updateChangeMpinField],
  );
  const handleChangePhoto = useCallback((): void => {
    Alert.alert("Profile photo", "Choose where the new photo comes from.", [
      { text: "Take photo", onPress: () => void choosePhoto("camera") },
      { text: "Choose from gallery", onPress: () => void choosePhoto("gallery") },
      { text: "Cancel", style: "cancel" },
    ], { cancelable: true });
  }, [choosePhoto]);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const performSignOut = useCallback(async (): Promise<void> => {
    setIsSigningOut(true);
    try {
      await signOut();
      router.replace("/(auth)/sign-in");
    } finally {
      setIsSigningOut(false);
    }
  }, [signOut]);
  // Signing out ends the session on this device, so ask first.
  const handleSignOut = useCallback((): void => {
    if (isSigningOut) return;
    Alert.alert("Sign out?", "You will need to sign in again to use CSRLSC.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => void performSignOut() },
    ], { cancelable: true });
  }, [isSigningOut, performSignOut]);

  if (!session) {
    return <Redirect href="/(auth)/sign-in" />;
  }

  return (
    <>
      <ScreenContainer>
        <DrawerHeader title="Profile" />
        <UserProfileView
          isSigningOut={isSigningOut}
          isUpdatingPhoto={isUpdatingPhoto}
          onChangePhotoPress={handleChangePhoto}
          photoUrl={photoUrl}
          onChangePasswordPress={changePassword.open}
          onMpinPress={handleMpinPress}
          onSignOutPress={handleSignOut}
          user={session.user}
        />
      </ScreenContainer>
      <ChangePasswordModal
        confirmation={changePassword.fields.confirmation}
        confirmationError={changePassword.errors.confirmation}
        isSubmitting={changePassword.isSubmitting}
        isVisible={changePassword.isVisible}
        newPassword={changePassword.fields.newPassword}
        newPasswordError={changePassword.errors.newPassword}
        notice={changePassword.notice}
        oldPassword={changePassword.fields.oldPassword}
        oldPasswordError={changePassword.errors.oldPassword}
        onChangeConfirmation={handleConfirmationChange}
        onChangeNewPassword={handleNewPasswordChange}
        onChangeOldPassword={handleOldPasswordChange}
        onClose={changePassword.close}
        onSubmit={changePassword.submit}
      />
      <SetMpinModal
        confirmation={setMpin.fields.confirmation}
        confirmationError={setMpin.errors.confirmation}
        isSubmitting={setMpin.isSubmitting}
        isVisible={setMpin.isVisible}
        mobile={setMpin.fields.mobile}
        mobileError={setMpin.errors.mobile}
        mpin={setMpin.fields.mpin}
        mpinError={setMpin.errors.mpin}
        notice={setMpin.notice}
        onChangeConfirmation={handleMpinConfirmationChange}
        onChangeMobile={handleMobileChange}
        onChangeMpin={handleMpinChange}
        onClose={setMpin.close}
        onSubmit={setMpin.submit}
      />
      <ChangeMpinModal
        confirmation={changeMpin.fields.confirmation}
        confirmationError={changeMpin.errors.confirmation}
        isSubmitting={changeMpin.isSubmitting}
        isVisible={changeMpin.isVisible}
        newMpin={changeMpin.fields.newMpin}
        newMpinError={changeMpin.errors.newMpin}
        notice={changeMpin.notice}
        oldMpin={changeMpin.fields.oldMpin}
        oldMpinError={changeMpin.errors.oldMpin}
        onChangeConfirmation={handleNewMpinConfirmationChange}
        onChangeNewMpin={handleNewMpinChange}
        onChangeOldMpin={handleOldMpinChange}
        onClose={changeMpin.close}
        onSubmit={changeMpin.submit}
      />
    </>
  );
}
