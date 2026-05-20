const { withDangerousMod } = require('expo/config-plugins');
const { resolve } = require('path');
const fs = require('fs');

module.exports = function withGoogleServices(config) {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      try {
        const projectRoot = config.modRequest.projectRoot;
        const googleServicesPath = resolve(projectRoot, 'google-services.json');
        const androidAppDir = resolve(projectRoot, 'android', 'app');

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
    },
  ]);
};

