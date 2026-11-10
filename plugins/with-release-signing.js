// Signs the Android release build with the CSRLSC release key instead of the debug key.
// The key never lives in the project: it is read from ~/.csrlsc-signing/signing.properties
// (storeFile, storePassword, keyAlias, keyPassword). If that file is missing the build falls back to the
// debug key, so a fresh checkout still builds, but such an APK must not be published.
const { withAppBuildGradle } = require("expo/config-plugins");

const MARKER = "// release-signing: CSRLSC release key";

const SNIPPET = `
${MARKER}
def csrlscSigningFile = new File(System.getProperty("user.home"), ".csrlsc-signing/signing.properties")
if (csrlscSigningFile.exists()) {
  def csrlscSigning = new Properties()
  csrlscSigningFile.withInputStream { csrlscSigning.load(it) }
  android {
    signingConfigs {
      release {
        storeFile file(csrlscSigning.getProperty("storeFile"))
        storePassword csrlscSigning.getProperty("storePassword")
        keyAlias csrlscSigning.getProperty("keyAlias")
        keyPassword csrlscSigning.getProperty("keyPassword")
      }
    }
    buildTypes {
      release {
        signingConfig signingConfigs.release
      }
    }
  }
} else {
  logger.warn("CSRLSC release key not found; the release build is signed with the DEBUG key.")
}
`;

module.exports = function withReleaseSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    if (!mod.modResults.contents.includes(MARKER)) {
      mod.modResults.contents += SNIPPET;
    }
    return mod;
  });
};
