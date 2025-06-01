import { useState } from 'react';
import { StyleSheet, View, Image, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '@/src/lib/constants';
import { AuthForm } from '@/src/components/auth/AuthForm';
import { Button } from '@/src/components/ui/Button';
import { BackButton } from '@/src/components/ui/BackButton';
import { useAuth } from '@/src/hooks/useAuth';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signInWithFacebook } = useAuth();

  const handleFacebookLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { user } = await signInWithFacebook('login');
    } catch (err) {
      setError('Failed to login with Facebook');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={{ uri: 'https://images.pexels.com/photos/2747449/pexels-photo-2747449.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260' }}
          style={styles.backgroundImage}
        />
        <View style={styles.overlay} />
      </View>
      <View style={styles.formContainer}>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <AuthForm type="login" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  logoContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  formContainer: {
    flex: 1,
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.gray[800],
    marginBottom: 16,
  },
  errorContainer: {
    backgroundColor: COLORS.error[500] + '26', // 15% opacity
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: COLORS.error[600],
    fontSize: 14,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.gray[300],
  },
  dividerText: {
    marginHorizontal: 16,
    color: COLORS.gray[500],
    fontWeight: '500',
  },
});
