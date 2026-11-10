import { useCallback } from "react";
import { Alert } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Image as ImageCompressor } from "react-native-compressor";

import { useAuthStore } from "@/src/features/auth/state/auth-store";
import { fetchProfilePhotoUrl, uploadProfilePhoto } from "@/src/features/profile/data/profile-photo.repository";
import type { ProfilePhotoFile } from "@/src/features/profile/data/profile-photo.repository";
import { useProfilePhotoStore } from "@/src/features/profile/state/profile-photo-store";
import { showSuccessMessage } from "@/src/utils/show-success-message";

const PHOTO_QUERY_KEY = "profile-photo";
const SIGNED_URL_STALE_MS = 10 * 60 * 1000;
const PHOTO_MAX_WIDTH = 640;
const PHOTO_QUALITY = 0.8;
const PICKER_QUALITY = 0.9;

export type PhotoSource = "camera" | "gallery";

const pickPhoto = async (source: PhotoSource): Promise<string | null> => {
  const options: ImagePicker.ImagePickerOptions = {
    allowsEditing: true,
    aspect: [1, 1],
    mediaTypes: ["images"],
    quality: PICKER_QUALITY,
  };
  if (source === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) throw new Error("Allow camera access to take a profile photo.");
    const result = await ImagePicker.launchCameraAsync(options);
    return result.canceled ? null : result.assets[0].uri;
  }
  const result = await ImagePicker.launchImageLibraryAsync(options);
  return result.canceled ? null : result.assets[0].uri;
};

/** Shrinks the picture before upload: a profile photo needs a few hundred pixels, not a camera original. */
const prepareFile = async (sourceUri: string): Promise<ProfilePhotoFile> => {
  // JPEG has no transparency, so a transparent PNG (a logo, say) would get a black background.
  const isPng = /\.png($|\?)/i.test(sourceUri);
  const uri = await ImageCompressor.compress(sourceUri, {
    compressionMethod: "manual",
    maxWidth: PHOTO_MAX_WIDTH,
    output: isPng ? "png" : "jpg",
    quality: PHOTO_QUALITY,
  });
  return isPng ? { uri, name: "profile.png", type: "image/png" } : { uri, name: "profile.jpg", type: "image/jpeg" };
};

/** The signed-in user's profile picture: the link to show, and the action that replaces it. */
export const useProfilePhoto = () => {
  const session = useAuthStore((state) => state.session);
  const userId = session?.user.id ?? "";
  const path = session?.user.profilePicPath ?? null;
  const uploadedUrl = useProfilePhotoStore((state) => state.urls[userId]);
  const setUrl = useProfilePhotoStore((state) => state.setUrl);

  const query = useQuery({
    queryKey: [PHOTO_QUERY_KEY, userId, path],
    queryFn: () => (session && path ? fetchProfilePhotoUrl(session, path) : Promise.resolve(null)),
    enabled: Boolean(session && path && !uploadedUrl),
    staleTime: SIGNED_URL_STALE_MS,
    retry: 0,
  });

  const upload = useMutation({
    mutationFn: async (sourceUri: string): Promise<string> => {
      if (!session) throw new Error("Sign in again to change your photo.");
      const file = await prepareFile(sourceUri);
      const signedUrl = await uploadProfilePhoto(session, file);
      return signedUrl ?? file.uri;
    },
    onSuccess: (url) => {
      setUrl(userId, url);
      showSuccessMessage("Profile photo updated");
    },
    onError: (error: unknown) => {
      Alert.alert("Photo not updated", error instanceof Error ? error.message : "Try again.", [{ text: "OK" }], { cancelable: true });
    },
  });
  const { mutate, isPending } = upload;

  const choosePhoto = useCallback(
    async (source: PhotoSource): Promise<void> => {
      try {
        const uri = await pickPhoto(source);
        if (uri) mutate(uri);
      } catch (error: unknown) {
        Alert.alert("Photo not updated", error instanceof Error ? error.message : "Try again.", [{ text: "OK" }], { cancelable: true });
      }
    },
    [mutate],
  );

  return { photoUrl: uploadedUrl ?? query.data ?? null, isUpdating: isPending, choosePhoto };
};
