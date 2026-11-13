import type { ConfigContext, ExpoConfig } from 'expo/config';

// La version web est servie sous /Replica sur GitHub Pages : EXPO_BASE_URL le précise au build.
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...(config as ExpoConfig),
  experiments: { ...config.experiments, baseUrl: process.env.EXPO_BASE_URL || undefined },
});
