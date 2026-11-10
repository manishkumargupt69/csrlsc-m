import { Keyboard } from "react-native";

export const runAfterKeyboardDismissed = (action: () => void): void => {
  if (!Keyboard.isVisible()) {
    action();
    return;
  }

  const keyboardSubscription = Keyboard.addListener("keyboardDidHide", () => {
    keyboardSubscription.remove();
    action();
  });
  Keyboard.dismiss();
};
