import { useState, useEffect } from 'react';
import { StyleSheet, View, Image, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '@/src/lib/constants';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { useAuth } from '@/src/hooks/useAuth';
import { router } from 'expo-router';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';

type FormValues = {
  displayName: string;
  email: string;
  businessName: string;
  instagramHandle: string;
  tiktokHandle: string;
  facebookHandle: string;
};

export default function EnrollmentInfoScreen() {
  const { user, createUserProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors }, setValue } = useForm<FormValues>({
    defaultValues: {
      displayName: '',
      email: '',
      businessName: '',
      instagramHandle: '',
      tiktokHandle: '',
      facebookHandle: ''
    },
    mode: 'onSubmit'
  });

  // Pre-fill form with user data from Facebook auth if available
  useEffect(() => {
    if (user) {
      if (user.displayName) setValue('displayName', user.displayName);
      if (user.email) setValue('email', user.email);

      // If we have a Facebook access token, we could potentially fetch more data
      // from the Facebook Graph API here, but for now we'll just use what we have
      if (user.facebookAccessToken) {
        // Pre-fill Facebook handle if we can extract it
        const facebookHandle = user.displayName?.toLowerCase().replace(/\s+/g, '') || '';
        setValue('facebookHandle', facebookHandle);
      }
    }
  }, [user, setValue]);

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setLoading(true);
    setError(null);

    try {
      // Update user profile with form data
      const { success, error } = await createUserProfile({
        displayName: data.displayName,
        // We don't update email here as it's managed by Firebase Auth
        businessName: data.businessName,
        instagramHandle: data.instagramHandle,
        tiktokHandle: data.tiktokHandle,
        facebookHandle: data.facebookHandle
      });

      if (!success) {
        throw new Error(error);
      }

      // Navigate to main app after successful profile update
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
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
        <ScrollView style={styles.scrollView}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.subtitle}>Tell us a bit more about yourself</Text>

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

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

          <Controller
            control={control}
            name="businessName"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Business Name"
                placeholder="Your Business"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
              />
            )}
          />

          <Controller
            control={control}
            name="instagramHandle"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Instagram Handle"
                placeholder="@yourbusiness"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="none"
              />
            )}
          />

          <Controller
            control={control}
            name="tiktokHandle"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="TikTok Handle"
                placeholder="@yourbusiness"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="none"
              />
            )}
          />

          <Controller
            control={control}
            name="facebookHandle"
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Facebook Handle"
                placeholder="yourbusiness"
                value={value}
                onChangeText={onChange}
                onBlur={onBlur}
                autoCapitalize="none"
              />
            )}
          />

          <Button
            title="Complete Profile"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
            style={styles.button}
          />
        </ScrollView>
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
  },
  scrollView: {
    padding: SPACING.l,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.gray[800],
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.gray[600],
    marginBottom: SPACING.l,
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
    marginTop: SPACING.l,
    marginBottom: SPACING.xl,
  },
});
