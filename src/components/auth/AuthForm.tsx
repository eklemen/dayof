import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { COLORS, SPACING } from '@/src/lib/constants';
import { useAuth } from '@/src/hooks/useAuth';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import { Feather } from '@expo/vector-icons';

interface AuthFormProps {
  type: 'login' | 'register';
}

type FormValues = {
  email: string;
  displayName: string;
  companyName: string;
  role: 'planner' | 'vendor';
};

export function AuthForm({ type }: AuthFormProps) {
  const { signInWithEmail, signInWithFacebook } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const handleFacebookLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      const { user } = await signInWithFacebook('login');
      console.log('user from login page---------->', user);
    } catch (err) {
      setError('Failed to login with Facebook');
    } finally {
      setLoading(false);
    }
  };

  const { control, handleSubmit, formState: { errors }, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      email: '',
      displayName: '',
      companyName: '',
      role: 'planner'
    },
    mode: 'onSubmit'
  });

  // Watch the email field for displaying in success message
  const email = watch('email');
  // Watch the role field for styling the role selector
  const role = watch('role');

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setLoading(true);
    setError(null);

    if (type === 'login') {
      const { success, error } = await signInWithEmail(data.email);
      setLoading(false);

      if (error) {
        setError(error);
      } else {
        setSuccess(true);
      }
    } else {
      // Register flow - first create user with auth, then profile
      const { success, error } = await signInWithEmail(data.email);

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
            <Controller
              control={control}
              name="displayName"
              rules={{
                required: 'Name is required'
              }}
              render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
                <Input
                  label="Your Name"
                  placeholder="Jane Smith"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  autoCapitalize="words"
                  error={error?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="companyName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Company Name (Optional)"
                  placeholder="Your Business"
                  value={value}
                  onChangeText={onChange}
                  onBlur={onBlur}
                />
              )}
            />

            <Text style={styles.label}>I am a:</Text>
            <View style={styles.roleSelector}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  role === 'planner' && styles.roleButtonActive,
                ]}
                onPress={() => setValue('role', 'planner')}
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
                onPress={() => setValue('role', 'vendor')}
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
        <Button
          title="Continue with Facebook"
          onPress={handleFacebookLogin}
          loading={loading}
          style={{ backgroundColor: '#1877F2', marginBottom: SPACING.m }}
          textStyle={{ color: 'white' }}
          icon={<Feather name="facebook" size={20} color="white" style={{ marginRight: SPACING.s }} />}
        />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        <Controller
          control={control}
          name="email"
          rules={{
            required: 'Email is required',
            pattern: {
              value: /\S+@\S+\.\S+/,
              message: 'Please enter a valid email'
            }
          }}
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <Input
              label="Email"
              placeholder="your.email@example.com"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="email-address"
              autoCapitalize="none"
              error={error?.message}
            />
          )}
        />

        <Button
          title={type === 'login' ? 'Sign In' : 'Create Account'}
          onPress={handleSubmit(onSubmit)}
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
