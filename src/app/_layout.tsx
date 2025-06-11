import { useEffect, useState } from 'react';
import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/src/hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { COLORS } from '@/src/lib/constants';
import { Text, TouchableOpacity, View } from 'react-native';
import '@/src/styles/global.css'
import { AuthProvider } from '@/src/hooks/useAuth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ActionSheetProvider } from '@expo/react-native-action-sheet';
const queryClient = new QueryClient()

export default function RootLayout() {
  // Keep the framework ready hook
  useFrameworkReady();

  const [isReady, setIsReady] = useState(false);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    if (fontError) {
      console.error('Error loading fonts:', fontError);
    }
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      setIsReady(true);
    }
  }, [fontsLoaded, fontError]);

  if (!isReady) {
    return <View />;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ActionSheetProvider>
          <>
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: COLORS.gray[50] },
            }}
          >
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen name="enrollment-info" options={{ headerShown: false }} />
            <Stack.Screen name="events/[id]" options={{ headerShown: false, headerLeft: () => (
                <TouchableOpacity onPress={() => router.back()}>
                  <Text>{`<`}</Text>
                </TouchableOpacity>
              ), }} />
            <Stack.Screen name="events/create" options={{ headerShown: false, headerLeft: () => (
                <TouchableOpacity onPress={() => router.back()}>
                  <Text>{`<`}</Text>
                </TouchableOpacity>
              ), }} />
            <Stack.Screen name="events/join" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
          </>
        </ActionSheetProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
