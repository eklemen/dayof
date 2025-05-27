export default {
  expo: {
    name: 'Dayof',
    slug: 'dayof',
    version: '1.0.0',
    owner: 'ejklemen',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'dayof',
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      bundleIdentifier: 'com.anonymous.dayof',
      infoPlist: {
        CFBundleURLTypes: [
          {
            CFBundleURLSchemes: ['dayof'],
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
      intentFilters: [
        {
          action: 'VIEW',
          autoVerify: true,
          data: [
            {
              scheme: 'dayof',
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
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnon: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    }
  }
}
