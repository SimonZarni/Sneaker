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
      launchShowDuration: 1500,  // fallback auto-hide if finish event never fires
      launchAutoHide: false,     // hide manually once page is painted
      backgroundColor: '#0A0A0A',
      splashFullScreen: true,
      splashImmersive: true,
    },
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '941450594198-g9jagh4gnesi6sk4ghis5frcumfeg4dv.apps.googleusercontent.com',
      forceCodeForRefreshToken: false,
    },
  },
};

export default config;
