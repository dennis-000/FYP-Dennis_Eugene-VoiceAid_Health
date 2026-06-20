const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Define directories to exclude from Metro's file watcher and bundle resolution
const customExclusions = [
  // Exclude Next.js web application node_modules and builds
  /[/\\]admin-dashboard[/\\]node_modules[/\\]/,
  /[/\\]admin-dashboard[/\\]\.next[/\\]/,
  
  // Exclude Python virtual environment
  /[/\\]backend-env[/\\]/,
  
  // Exclude colab and dataset scripts
  /[/\\]colab[/\\]/,
  /[/\\]dataset[/\\]/
];

if (Array.isArray(config.resolver.blockList)) {
  config.resolver.blockList = config.resolver.blockList.concat(customExclusions);
} else {
  config.resolver.blockList = customExclusions;
}

// Keep blacklistRE in sync for compatibility
config.resolver.blacklistRE = config.resolver.blockList;

module.exports = config;
