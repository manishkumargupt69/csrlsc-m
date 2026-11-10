import { useCallback, useState } from "react";
import { Alert } from "react-native";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";

import type { VoiceNoteRecording } from "@/src/features/evidence/hooks/use-evidence-attachments";

interface VoiceNoteRecorderResult {
  isRecording: boolean;
  durationMilliseconds: number;
  start: () => Promise<void>;
  /** Stops recording and returns the file, or null when nothing was recorded. */
  stop: () => Promise<VoiceNoteRecording | null>;
}

const showRecorderError = (message: string): void => {
  Alert.alert("Voice note unavailable", message);
};

export const useVoiceNoteRecorder = (): VoiceNoteRecorderResult => {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const [isStarting, setIsStarting] = useState(false);

  const start = useCallback(async (): Promise<void> => {
    if (isStarting || recorderState.isRecording) return;
    setIsStarting(true);
    try {
      const permission = await AudioModule.requestRecordingPermissionsAsync();
      if (!permission.granted) {
        showRecorderError("Allow microphone access to record a voice note.");
        return;
      }
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
    } catch (error: unknown) {
      showRecorderError(error instanceof Error ? error.message : "Recording could not be started.");
    } finally {
      setIsStarting(false);
    }
  }, [isStarting, recorder, recorderState.isRecording]);

  const stop = useCallback(async (): Promise<VoiceNoteRecording | null> => {
    try {
      const durationMilliseconds = recorderState.durationMillis;
      await recorder.stop();
      await setAudioModeAsync({ allowsRecording: false });
      const uri = recorder.uri;
      return uri ? { uri, durationMilliseconds } : null;
    } catch (error: unknown) {
      showRecorderError(error instanceof Error ? error.message : "Recording could not be saved.");
      return null;
    }
  }, [recorder, recorderState.durationMillis]);

  return {
    isRecording: recorderState.isRecording,
    durationMilliseconds: recorderState.durationMillis,
    start,
    stop,
  };
};
