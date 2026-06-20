const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const customExclusions = [
  // Exclude Next.js web application entirely
  /[/\\]admin-dashboard[/\\]/,
  
  // Exclude Python backend and virtual environment entirely
  /[/\\]backend[/\\]/,
  /[/\\]backend-env[/\\]/,
  
  // Exclude colab and dataset scripts
  /[/\\]colab[/\\]/,
  /[/\\]dataset[/\\]/,
  
  // Exclude docs, database migrations, and raw resources
  /[/\\]docs[/\\]/,
  /[/\\]supabase[/\\]/,
  /[/\\]resources[/\\]/
];

if (Array.isArray(config.resolver.blockList)) {
  config.resolver.blockList = config.resolver.blockList.concat(customExclusions);
} else {
  config.resolver.blockList = customExclusions;
}

// Keep blacklistRE in sync for compatibility
config.resolver.blacklistRE = config.resolver.blockList;

module.exports = config;
