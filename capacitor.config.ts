import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.twealth.app',
  appName: 'Twealth',
  webDir: 'dist/public',
  server: {
    // Load from production server 
    // This allows all API calls and auth to work
    url: 'https://twealth.ltd',
    cleartext: false
  },
  ios: {
    contentInset: 'automatic'
  }
};

export default config;
