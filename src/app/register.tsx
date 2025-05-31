import { useState } from 'react';
import { StyleSheet, View, Image, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '@/src/lib/constants';
import { Button } from '@/src/components/ui/Button';
import { BackButton } from '@/src/components/ui/BackButton';
import { router } from 'expo-router';
import { useAuth } from '@/src/hooks/useAuth';
import { Feather } from '@expo/vector-icons';

export default function RegisterScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signInWithFacebook } = useAuth();

  const handleFacebookLogin = async () => {
    setLoading(true);
    setError(null);
    const { user } = await signInWithFacebook('register');
    console.log('user---------->', user);
    setLoading(false);
  };

  const navigateToLogin = () => {
    router.replace('/login');
  };

  const navigateToEnrollmentInfo = () => {
    router.push('/enrollment-info');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.logoContainer}>
        <Image
          source={{ uri: 'https://images.pexels.com/photos/1047940/pexels-photo-1047940.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260' }}
          style={styles.backgroundImage}
        />
        <View style={styles.overlay} />
      </View>
      <View style={styles.formContainer}>
        <View style={styles.header}>
          <BackButton color={COLORS.primary[700]} />
          <Text style={styles.title}>Create Account</Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Something went wrong while logging in.</Text>
          </View>
        )}

        <Button
          title="Continue with Facebook"
          onPress={handleFacebookLogin}
          loading={loading}
          style={{ backgroundColor: '#1877F2', marginTop: SPACING.m }}
          textStyle={{ color: 'white' }}
          icon={<Feather name="facebook" size={20} color="white" style={{ marginRight: SPACING.s }} />}
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <Button
          title="Sign Up with Email"
          onPress={navigateToEnrollmentInfo}
          variant="outline"
          style={{ marginTop: SPACING.s }}
        />

        <TouchableOpacity onPress={navigateToLogin} style={styles.loginLink}>
          <Text style={styles.loginLinkText}>
            Already have an account? Sign in
          </Text>
        </TouchableOpacity>
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
  loginLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  loginLinkText: {
    color: COLORS.primary[700],
    fontSize: 16,
  },
});
