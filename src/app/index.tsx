import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';
import { COLORS } from '@/src/lib/constants';
import * as SplashScreen from 'expo-splash-screen';

// Keep the splash screen visible while we check authentication
SplashScreen.preventAutoHideAsync();

export default function SplashScreenComponent() {
  const { user, loading, refreshUser } = useAuth();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    async function checkAuthAndNavigate() {
      try {
        // If auth is still loading, wait for it
        if (loading) return;

        // Navigate based on auth state without calling refreshUser
        if (user) {
          setTimeout(() => {
            // Navigate to the main app
            router.replace('/(tabs)');
          }, 1000);
        } else {
          setTimeout(() => {
            // No user found, navigate to login
            router.replace('/login');
          }, 1000);
        }
      } catch (error) {
        console.error('Error checking authentication:', error);
        // If there's an error, go to login
        router.replace('/login');
      } finally {
        // Hide the splash screen
        setTimeout(() => {
          setIsCheckingAuth(false);
          SplashScreen.hideAsync();
        }, 1500);
      }
    }

    // Only run once when loading completes
    if (!loading) {
      checkAuthAndNavigate();
    }
  }, [loading]); // Only depend on loading, not user

  // This component will only be visible briefly between the native splash screen
  // hiding and the navigation completing
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: 'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260' }}
        style={styles.logo}
      />
      <Text style={styles.title}>VendorFriendr</Text>
      <ActivityIndicator size="large" color={COLORS.primary[700]} style={styles.loader} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary[700],
    marginBottom: 20,
  },
  loader: {
    marginTop: 20,
  },
});
