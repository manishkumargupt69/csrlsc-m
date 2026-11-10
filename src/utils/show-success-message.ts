import { Alert, Platform, ToastAndroid } from "react-native";

export const showMessage = (message: string, title = "Notice"): void => {
  if (Platform.OS === "android") {
    ToastAndroid.show(message, ToastAndroid.SHORT);
    return;
  }
  Alert.alert(title, message);
};

export const showSuccessMessage = (message: string): void =>
  showMessage(message, "Success");
