import CryptoJS from "crypto-js";
import * as Crypto from "expo-crypto";

import { AUTH_SECRET } from "@/src/config/env";

const KEY_LENGTH = 32;
const IV_BYTES = 16;

export interface EncryptedSecret {
  /** Base64 AES ciphertext. */
  cipher: string;
  /** Base64 initialisation vector used for this ciphertext. */
  iv: string;
}

/**
 * Encrypts a password or MPIN the way the CSRLSC web client does:
 * AES-256-CBC, PKCS7, random 16-byte IV, key = secret padded to 32 characters.
 * The API expects the ciphertext and its IV as separate fields.
 */
export const encryptSecret = (plainText: string): EncryptedSecret => {
  if (!AUTH_SECRET) {
    throw new Error("Sign-in is not configured. Set EXPO_PUBLIC_AUTH_SECRET.");
  }
  const key = CryptoJS.enc.Utf8.parse(AUTH_SECRET.padEnd(KEY_LENGTH, "0"));
  const ivHex = Array.from(Crypto.getRandomBytes(IV_BYTES), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
  const iv = CryptoJS.enc.Hex.parse(ivHex);
  const encrypted = CryptoJS.AES.encrypt(plainText, key, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });
  return {
    cipher: CryptoJS.enc.Base64.stringify(encrypted.ciphertext),
    iv: CryptoJS.enc.Base64.stringify(iv),
  };
};
