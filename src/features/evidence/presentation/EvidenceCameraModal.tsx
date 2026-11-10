import { memo, useCallback } from "react";
import type { ReactElement } from "react";
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from "react-native";
import Feather from "@expo/vector-icons/Feather";
import { CameraView } from "expo-camera";
import type { CameraMountError } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";

import PrimaryButton from "@/src/components/ui/PrimaryButton";
import { useEvidenceCamera } from "@/src/features/evidence/hooks/use-evidence-camera";
import type { CapturedEvidence } from "@/src/types/evidence";
import { COLORS, MINIMUM_TOUCH_SIZE, RADII, SPACING, TYPOGRAPHY } from "@/src/theme/tokens";

interface EvidenceCameraModalProps {
  isVisible: boolean;
  onClose: () => void;
  onDismiss: () => void;
  onCaptured: (evidence: CapturedEvidence) => void;
}

const CAMERA_SAFE_AREA_EDGES = ["top", "bottom"] as const;

function EvidenceCameraModal({ isVisible, onClose, onDismiss, onCaptured }: EvidenceCameraModalProps): ReactElement {
  const camera = useEvidenceCamera(isVisible, onCaptured);
  const handleCameraError = useCallback((event: CameraMountError): void => camera.setCameraError(event.message), [camera]);
  const handleCapture = useCallback((): void => { void camera.capture(); }, [camera]);
  const handleSelectVideo = useCallback((): void => { void camera.selectVideoMode(); }, [camera]);
  const handleRequestAccess = useCallback((): void => { void camera.requestCameraAccess(); }, [camera]);
  const isBusy = camera.isCapturing || camera.isRecording;
  const handleClose = useCallback((): void => { if (!isBusy) onClose(); }, [isBusy, onClose]);

  return (
    <Modal animationType="slide" onDismiss={onDismiss} onRequestClose={handleClose} visible={isVisible}>
      <SafeAreaView edges={CAMERA_SAFE_AREA_EDGES} style={styles.root}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <Pressable accessibilityLabel="Close camera" accessibilityRole="button" disabled={isBusy} onPress={handleClose} style={styles.closeButton}>
            <Feather color={COLORS.white} name="x" size={24} />
          </Pressable>
          <Text accessibilityRole="header" style={styles.title}>Capture evidence</Text>
          <View style={styles.headerSpacer} />
        </View>
        {camera.hasCameraPermission ? (
          <>
            <View style={styles.preview}>
              <CameraView
                facing="back"
                mode={camera.mode}
                onCameraReady={camera.markReady}
                onMountError={handleCameraError}
                ref={camera.cameraRef}
                style={styles.camera}
                videoQuality="4:3"
              />
              {!camera.isReady ? <ActivityIndicator color={COLORS.white} size="large" style={styles.previewLoading} /> : null}
            </View>
            <View style={styles.controls}>
              <View style={styles.modePicker}>
                <Pressable accessibilityRole="button" accessibilityState={{ selected: camera.mode === "picture", disabled: isBusy }} disabled={isBusy} onPress={camera.selectPhotoMode} style={[styles.modeButton, camera.mode === "picture" && styles.modeSelected]}>
                  <Text style={[styles.modeText, camera.mode === "picture" && styles.modeTextSelected]}>Photo</Text>
                </Pressable>
                <Pressable accessibilityRole="button" accessibilityState={{ selected: camera.mode === "video", disabled: isBusy }} disabled={isBusy} onPress={handleSelectVideo} style={[styles.modeButton, camera.mode === "video" && styles.modeSelected]}>
                  <Text style={[styles.modeText, camera.mode === "video" && styles.modeTextSelected]}>Video</Text>
                </Pressable>
              </View>
              <Text accessibilityLiveRegion="polite" style={styles.hint}>{camera.isRecording ? "Recording video · tap to stop" : camera.mode === "video" ? "Tap to start recording" : "Tap to take a photo"}</Text>
              <Pressable
                accessibilityLabel={camera.isRecording ? "Stop recording" : camera.mode === "video" ? "Start recording" : "Take photo"}
                accessibilityRole="button"
                accessibilityState={{ disabled: !camera.isReady || camera.isCapturing }}
                disabled={!camera.isReady || camera.isCapturing}
                onPress={camera.isRecording ? camera.stopRecording : handleCapture}
                style={[styles.shutter, camera.isRecording && styles.recordingShutter]}
              >
                {camera.isCapturing ? <ActivityIndicator color={COLORS.ink} /> : <View style={[styles.shutterCenter, camera.mode === "video" && styles.videoCenter, camera.isRecording && styles.recordingCenter]} />}
              </Pressable>
              {camera.error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{camera.error}</Text> : null}
            </View>
          </>
        ) : (
          <View style={styles.permissionState}>
            {camera.isCheckingPermission ? <ActivityIndicator color={COLORS.white} size="large" /> : <Feather color={COLORS.white} name="camera" size={36} />}
            <Text style={styles.permissionTitle}>Camera access needed</Text>
            <Text style={styles.permissionMessage}>Allow camera access to take photos or record videos as evidence.</Text>
            {!camera.isCheckingPermission ? <PrimaryButton label="Allow camera" onPress={handleRequestAccess} /> : null}
            {camera.error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{camera.error}</Text> : null}
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

export default memo(EvidenceCameraModal);

const styles = StyleSheet.create({
  root: { backgroundColor: COLORS.ink, flex: 1 },
  header: { alignItems: "center", flexDirection: "row", minHeight: 60, paddingHorizontal: SPACING.medium },
  closeButton: { alignItems: "center", justifyContent: "center", minHeight: MINIMUM_TOUCH_SIZE, minWidth: MINIMUM_TOUCH_SIZE },
  title: { color: COLORS.white, ...TYPOGRAPHY.control, flex: 1, fontWeight: "700", textAlign: "center" },
  headerSpacer: { width: MINIMUM_TOUCH_SIZE },
  preview: { flex: 1, overflow: "hidden" },
  camera: { flex: 1 },
  previewLoading: { left: 0, position: "absolute", right: 0, top: "48%" },
  controls: { alignItems: "center", gap: SPACING.large, padding: SPACING.extraLarge },
  modePicker: { backgroundColor: COLORS.neutralInk, borderRadius: RADII.pill, flexDirection: "row", padding: SPACING.extraSmall },
  modeButton: { alignItems: "center", borderRadius: RADII.pill, minHeight: MINIMUM_TOUCH_SIZE, minWidth: 94, justifyContent: "center" },
  modeSelected: { backgroundColor: COLORS.white },
  modeText: { color: COLORS.white, ...TYPOGRAPHY.body, fontWeight: "700" },
  modeTextSelected: { color: COLORS.ink },
  hint: { color: COLORS.white, ...TYPOGRAPHY.caption },
  shutter: { alignItems: "center", backgroundColor: COLORS.white, borderRadius: RADII.pill, height: 74, justifyContent: "center", width: 74 },
  shutterCenter: { backgroundColor: COLORS.white, borderColor: COLORS.ink, borderRadius: RADII.pill, borderWidth: 2, height: 62, width: 62 },
  videoCenter: { backgroundColor: COLORS.danger, borderColor: COLORS.white },
  recordingShutter: { backgroundColor: COLORS.danger },
  recordingCenter: { backgroundColor: COLORS.white, borderColor: COLORS.danger, borderRadius: RADII.small, height: 26, width: 26 },
  error: { color: COLORS.white, ...TYPOGRAPHY.caption, textAlign: "center" },
  permissionState: { alignItems: "center", flex: 1, gap: SPACING.large, justifyContent: "center", padding: SPACING.extraLarge },
  permissionTitle: { color: COLORS.white, ...TYPOGRAPHY.sectionTitle, fontWeight: "700" },
  permissionMessage: { color: COLORS.white, ...TYPOGRAPHY.body, textAlign: "center" },
});
