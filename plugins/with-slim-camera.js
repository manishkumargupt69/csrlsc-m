// expo-camera ships Google's barcode scanner (about 5 MB of native code) even though CSRLSC only takes
// photos and videos. This leaves the scanner out of the Android app. Nothing here touches the camera
// classes the app uses; the barcode classes are simply never packaged, and the app never calls them.
const { withAppBuildGradle } = require("expo/config-plugins");

const MARKER = "// slim-camera: leave out the unused barcode scanner";

const SNIPPET = `
${MARKER}
configurations.configureEach { configuration ->
  // Runtime classpaths only, so expo-camera still compiles against these libraries.
  if (configuration.name.toLowerCase().contains("runtimeclasspath")) {
    exclude group: "com.google.mlkit", module: "barcode-scanning"
    exclude group: "com.google.android.gms", module: "play-services-code-scanner"
    exclude group: "androidx.camera", module: "camera-mlkit-vision"
  }
}
`;

module.exports = function withSlimCamera(config) {
  return withAppBuildGradle(config, (mod) => {
    if (!mod.modResults.contents.includes(MARKER)) {
      mod.modResults.contents += SNIPPET;
    }
    return mod;
  });
};
