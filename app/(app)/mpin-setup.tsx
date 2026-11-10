import type { ReactElement } from "react";
import { Redirect } from "expo-router";

export default function MpinSetupRedirect(): ReactElement {
  return <Redirect href="/(app)/(tabs)/profile" />;
}
