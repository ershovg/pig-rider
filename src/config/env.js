/**
 * Environment Configuration
 * Manages API keys and environment-specific settings
 */

export const ENV = {
  // ElevenLabs API Key
  // Get your API key from: https://elevenlabs.io/app/settings/api-keys
  ELEVENLABS_API_KEY: import.meta.env.VITE_ELEVENLABS_API_KEY || '',

  // Development mode
  isDevelopment: import.meta.env.DEV,

  // Production mode
  isProduction: import.meta.env.PROD,
};

/**
 * Validate required environment variables
 */
export function validateEnv() {
  const warnings = [];

  if (!ENV.ELEVENLABS_API_KEY) {
    warnings.push('ELEVENLABS_API_KEY is not set. AI voice features will not work.');
    warnings.push('Please set VITE_ELEVENLABS_API_KEY in your .env file or enter it in the UI.');
  }

  if (warnings.length > 0) {
    console.warn('⚠️ Environment Configuration Warnings:');
    warnings.forEach(warning => console.warn(`  - ${warning}`));
  }

  return warnings;
}
