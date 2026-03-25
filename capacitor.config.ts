import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.sneaker.drp',
  appName: 'SNEAKER.DRP',
  webDir: 'public/build',
  server: {
    url: 'https://zarnidev.online',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 0,
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: process.env.VITE_GOOGLE_WEB_CLIENT_ID ?? '',
      forceCodeForRefreshToken: false,
    },
  },
};

export default config;
