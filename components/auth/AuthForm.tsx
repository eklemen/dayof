import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { COLORS, SPACING } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';

interface AuthFormProps {
  type: 'login' | 'register';
}

export function AuthForm({ type }: AuthFormProps) {
  const { signInWithEmail, createUserProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [role, setRole] = useState<'planner' | 'vendor'>('planner');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleAuth = async () => {
    if (!email.trim()) {
      setError('Email is required');
      return;
    }

    if (type === 'register') {
      if (!displayName.trim()) {
        setError('Name is required');
        return;
      }
    }

    setLoading(true);
    setError(null);

    if (type === 'login') {
      const { success, error } = await signInWithEmail(email);
      setLoading(false);
      
      if (error) {
        setError(error);
      } else {
        setSuccess(true);
      }
    } else {
      // Register flow - first create user with auth, then profile
      const { success, error } = await signInWithEmail(email);
      
      if (error) {
        setLoading(false);
        setError(error);
        return;
      }

      // After successful auth, we'll create user profile in onAuthStateChange
      // This will be handled by the user profile completion step
      setSuccess(true);
      setLoading(false);
    }
  };

  const toggleAuthMode = () => {
    if (type === 'login') {
      router.replace('/register');
    } else {
      router.replace('/login');
    }
  };

  if (success) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.description}>
          We've sent a magic link to {email}. Click the link to sign in.
        </Text>
        <Button 
          title="Back to Login" 
          onPress={() => router.replace('/login')} 
          variant="outline"
          style={styles.button}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{type === 'login' ? 'Sign In' : 'Create Account'}</Text>
      
      <View style={styles.form}>
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {type === 'register' && (
          <>
            <Input
              label="Your Name"
              placeholder="Jane Smith"
              value={displayName}
              onChangeText={setDisplayName}
              autoCapitalize="words"
            />
            
            <Input
              label="Company Name (Optional)"
              placeholder="Your Business"
              value={companyName}
              onChangeText={setCompanyName}
            />

            <Text style={styles.label}>I am a:</Text>
            <View style={styles.roleSelector}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'planner' && styles.roleButtonActive,
                ]}
                onPress={() => setRole('planner')}
              >
                <Text style={[
                  styles.roleText,
                  role === 'planner' && styles.roleTextActive,
                ]}>
                  Event Planner
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'vendor' && styles.roleButtonActive,
                ]}
                onPress={() => setRole('vendor')}
              >
                <Text style={[
                  styles.roleText,
                  role === 'vendor' && styles.roleTextActive,
                ]}>
                  Vendor
                </Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        <Input
          label="Email"
          placeholder="your.email@example.com"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Button
          title={type === 'login' ? 'Sign In' : 'Create Account'}
          onPress={handleAuth}
          loading={loading}
          style={styles.button}
        />

        <TouchableOpacity onPress={toggleAuthMode} style={styles.toggleLink}>
          <Text style={styles.toggleText}>
            {type === 'login' 
              ? "Don't have an account? Sign up" 
              : "Already have an account? Sign in"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: SPACING.l,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.gray[800],
    marginBottom: SPACING.m,
  },
  description: {
    fontSize: 16,
    color: COLORS.gray[600],
    marginBottom: SPACING.l,
  },
  form: {
    marginTop: SPACING.m,
  },
  errorContainer: {
    backgroundColor: COLORS.error[500] + '15',
    padding: SPACING.m,
    borderRadius: 8,
    marginBottom: SPACING.m,
  },
  errorText: {
    color: COLORS.error[600],
    fontSize: 14,
  },
  button: {
    marginTop: SPACING.m,
  },
  toggleLink: {
    marginTop: SPACING.l,
    alignItems: 'center',
  },
  toggleText: {
    color: COLORS.primary[700],
    fontSize: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: SPACING.xs,
    color: COLORS.gray[700],
  },
  roleSelector: {
    flexDirection: 'row',
    marginBottom: SPACING.m,
  },
  roleButton: {
    flex: 1,
    padding: SPACING.m,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleButtonActive: {
    borderColor: COLORS.primary[700],
    backgroundColor: COLORS.primary[50],
  },
  roleText: {
    color: COLORS.gray[600],
    fontWeight: '500',
  },
  roleTextActive: {
    color: COLORS.primary[700],
  },
});