import { useEffect } from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';

export default function AuthCallback() {
  useEffect(() => {
    // Just redirect to tabs - the useAuth hook's onAuthStateChange will handle the session
    console.log('Auth callback route hit, redirecting to tabs...');
    router.replace('/(tabs)');
  }, []);

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'white'
    }}>
      <Text style={{ fontSize: 18, color: '#666' }}>
        Authentication successful!
      </Text>
      <Text style={{ fontSize: 14, color: '#999', marginTop: 10 }}>
        Redirecting...
      </Text>
    </View>
  );
}
