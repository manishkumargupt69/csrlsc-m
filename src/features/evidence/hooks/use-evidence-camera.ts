import { useCallback, useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { CameraView, useCameraPermissions, useMicrophonePermissions } from "expo-camera";
import type { CameraMode } from "expo-camera";

import type { CapturedEvidence } from "@/src/types/evidence";

interface EvidenceCameraResult {
  cameraRef: RefObject<CameraView | null>;
  mode: CameraMode;
  isReady: boolean;
  isCapturing: boolean;
  isRecording: boolean;
  hasCameraPermission: boolean;
  isCheckingPermission: boolean;
  error: string | null;
  requestCameraAccess: () => Promise<void>;
  selectPhotoMode: () => void;
  selectVideoMode: () => Promise<void>;
  markReady: () => void;
  setCameraError: (message: string) => void;
  capture: () => Promise<void>;
  stopRecording: () => void;
}

const getCameraErrorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : "The camera could not capture evidence.";

export const useEvidenceCamera = (
  isVisible: boolean,
  onCaptured: (evidence: CapturedEvidence) => void,
): EvidenceCameraResult => {
  const cameraRef = useRef<CameraView | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission] = useMicrophonePermissions();
  const [mode, setMode] = useState<CameraMode>("picture");
  const [isReady, setReady] = useState(false);
  const [isCapturing, setCapturing] = useState(false);
  const [isRecording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const permissionRequested = useRef(false);
  const recordingStopRequested = useRef(false);

  const requestCameraAccess = useCallback(async (): Promise<void> => {
    try {
      await requestCameraPermission();
    } catch (requestError: unknown) {
      setError(getCameraErrorMessage(requestError));
    }
  }, [requestCameraPermission]);

  useEffect(() => {
    if (!isVisible) {
      permissionRequested.current = false;
      setMode("picture");
      setReady(false);
      setError(null);
      return;
    }
    if (cameraPermission && !cameraPermission.granted && !permissionRequested.current) {
      permissionRequested.current = true;
      void requestCameraAccess();
    }
  }, [cameraPermission, isVisible, requestCameraAccess]);

  const selectPhotoMode = useCallback((): void => {
    if (isRecording) return;
    setError(null);
    setMode("picture");
  }, [isRecording]);

  const selectVideoMode = useCallback(async (): Promise<void> => {
    if (isRecording) return;
    try {
      const permission = microphonePermission?.granted
        ? microphonePermission
        : await requestMicrophonePermission();
      if (!permission.granted) {
        setError("Allow microphone access to record video evidence.");
        return;
      }
      setError(null);
      setMode("video");
    } catch (permissionError: unknown) {
      setError(getCameraErrorMessage(permissionError));
    }
  }, [isRecording, microphonePermission, requestMicrophonePermission]);

  const markReady = useCallback((): void => setReady(true), []);
  const setCameraError = useCallback((message: string): void => setError(message), []);

  const capture = useCallback(async (): Promise<void> => {
    if (!cameraRef.current || !isReady || isCapturing || isRecording) return;
    setError(null);
    if (mode === "picture") {
      setCapturing(true);
      try {
        const picture = await cameraRef.current.takePictureAsync({ quality: 0.8 });
        onCaptured({
          kind: "photo",
          name: `photo-${Date.now()}.${picture.format}`,
          uri: picture.uri,
          mimeType: `image/${picture.format === "jpg" ? "jpeg" : "png"}`,
        });
      } catch (captureError: unknown) {
        setError(getCameraErrorMessage(captureError));
      } finally {
        setCapturing(false);
      }
      return;
    }

    setRecording(true);
    recordingStopRequested.current = false;
    try {
      const video = await cameraRef.current.recordAsync({ codec: "avc1" });
      if (video) onCaptured({
        kind: "video",
        name: `video-${Date.now()}.mp4`,
        uri: video.uri,
        mimeType: "video/mp4",
      });
    } catch (recordError: unknown) {
      setError(getCameraErrorMessage(recordError));
    } finally {
      setRecording(false);
      recordingStopRequested.current = false;
    }
  }, [isCapturing, isReady, isRecording, mode, onCaptured]);

  const stopRecording = useCallback((): void => {
    if (!isRecording || recordingStopRequested.current) return;
    recordingStopRequested.current = true;
    cameraRef.current?.stopRecording();
  }, [isRecording]);

  return {
    cameraRef,
    mode,
    isReady,
    isCapturing,
    isRecording,
    hasCameraPermission: Boolean(cameraPermission?.granted),
    isCheckingPermission: cameraPermission === null,
    error,
    requestCameraAccess,
    selectPhotoMode,
    selectVideoMode,
    markReady,
    setCameraError,
    capture,
    stopRecording,
  };
};
