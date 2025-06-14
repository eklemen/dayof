export default {
  expo: {
    name: 'Dayof',
    slug: 'dayof',
    version: '1.0.0',
    owner: 'ejklemen',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'vendorfriendr',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      bundleIdentifier: 'com.anonymous.dayof',
      googleServicesFile: './account-services/GoogleService-Info.plist',
      associatedDomains: ['applinks:vendorfriendr.app'],
      infoPlist: {
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: ['vendorfriendr'],
          },
          {
            // Add Facebook client ID scheme for Facebook authentication
            CFBundleURLSchemes: [`fb${process.env.EXPO_PUBLIC_FACEBOOK_APP_ID}`],
          },
        ],
      },
    },
    web: {
      bundler: 'metro',
      output: 'single',
      favicon: './assets/images/favicon.png'
    },
    android: {
      package: 'com.anonymous.dayof',
      googleServicesFile: './account-services/google-services.json',
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'vendorfriendr',
            },
            {
              // Add Facebook client ID scheme for Facebook authentication
              scheme: `fb${process.env.EXPO_PUBLIC_FACEBOOK_APP_ID}`,
            },
            {
              scheme: 'https',
              host: 'vendorfriendr.page.link',
            },
            {
              scheme: 'https',
              host: 'vendorfriendr.app',
            },
          ],
          category: ['BROWSABLE', 'DEFAULT'],
        },
      ],
    },
    plugins: [
      'expo-router',
      'expo-font',
      'expo-web-browser',
      'expo-secure-store',
      [
        'expo-linking',
        {
          scheme: 'vendorfriendr',
          prefixes: [
            'https://vendorfriendr.page.link',
            'https://vendorfriendr.app'
          ]
        }
      ],
      '@react-native-firebase/app',
      '@react-native-firebase/auth',
      '@react-native-firebase/crashlytics',
      [
        'expo-build-properties',
        {
          'ios': {
            'useFrameworks': 'static'
          }
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      firebaseApiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
      facebookAppId: process.env.EXPO_PUBLIC_FACEBOOK_APP_ID,
    }
  }
}
