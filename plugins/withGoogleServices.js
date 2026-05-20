const { withAndroidGradle } = require('expo-build-context');
const { resolve } = require('path');
const fs = require('fs');

module.exports = function withGoogleServices(config) {
  return withAndroidGradle(config, async (config) => {
    try {
      const googleServicesPath = resolve(__dirname, '../google-services.json');
      const androidAppDir = resolve(__dirname, '../android/app');

      // Ensure android/app directory exists
      if (!fs.existsSync(androidAppDir)) {
        fs.mkdirSync(androidAppDir, { recursive: true });
      }

      // Copy google-services.json if it exists
      if (fs.existsSync(googleServicesPath)) {
        const destPath = resolve(androidAppDir, 'google-services.json');
        fs.copyFileSync(googleServicesPath, destPath);
        console.log(`✓ Copied google-services.json to ${destPath}`);
      } else {
        console.warn(`⚠ google-services.json not found at ${googleServicesPath}`);
      }
    } catch (error) {
      console.error('Error in withGoogleServices plugin:', error);
    }

    return config;
  });
};
