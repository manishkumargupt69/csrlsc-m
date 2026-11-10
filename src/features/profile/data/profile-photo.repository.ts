import { API_BASE_URL } from "@/src/config/env";
import type { AuthSession } from "@/src/features/auth/domain/auth.types";
import { appendFormDataFile } from "@/src/utils/append-form-data-file";
import { asRecord, requestJson, requestMultipart } from "@/src/utils/authenticated-request";

export interface ProfilePhotoFile {
  uri: string;
  name: string;
  type: string;
}

/**
 * Both profile-picture endpoints answer with `{ data: { signedUrl } }`. On this server it is a path such as
 * "/uploads/Test/1001/Users/photo.png" that is served under the API address; cloud storage would give a full link.
 */
const readSignedUrl = (body: unknown): string | null => {
  const { signedUrl } = asRecord(asRecord(body).data);
  if (typeof signedUrl !== "string" || !signedUrl) return null;
  if (/^https?:\/\//i.test(signedUrl)) return signedUrl;
  return API_BASE_URL + (signedUrl.startsWith("/") ? "" : "/") + signedUrl;
};

/** Turns the stored picture path (login `profilePic`) into a link the app can display. */
export const fetchProfilePhotoUrl = async (session: AuthSession, path: string): Promise<string | null> => {
  const body = await requestJson(
    session,
    "GET",
    "/user/signed-url?path=" + encodeURIComponent(path),
    undefined,
    "The profile photo could not be loaded.",
  );
  return readSignedUrl(body);
};

/** Replaces the signed-in user's profile picture. Returns a link to the new image when the server provides one. */
export const uploadProfilePhoto = async (session: AuthSession, file: ProfilePhotoFile): Promise<string | null> => {
  const formData = new FormData();
  appendFormDataFile({ formData, fieldName: "file", file });
  const body = await requestMultipart(
    session,
    "PUT",
    "/user/upload/" + session.user.id,
    formData,
    "The profile photo could not be updated.",
  );
  return readSignedUrl(body);
};
