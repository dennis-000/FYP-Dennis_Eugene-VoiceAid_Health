const { getDefaultConfig } = require('expo/metro-config');
const exclusionList = require('metro-config/src/defaults/exclusionList');

const config = getDefaultConfig(__dirname);

// Define directories to exclude from Metro's file watcher and bundle resolution
const exclusionPattern = exclusionList([
  // Exclude Next.js web application node_modules and builds
  /.*\/admin-dashboard\/node_modules\/.*/,
  /.*\/admin-dashboard\/\.next\/.*/,
  
  // Exclude Python virtual environment
  /.*\/backend-env\/.*/,
  
  // Exclude colab and dataset scripts
  /.*\/colab\/.*/,
  /.*\/dataset\/.*/
]);

config.resolver.blacklistRE = exclusionPattern;
config.resolver.blockList = exclusionPattern;

module.exports = config;
