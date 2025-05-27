import { useState } from 'react';
import { View, Image, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Feather } from '@expo/vector-icons';

export default function RegisterScreen() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signInWithFacebook } = useAuth();

  const handleFacebookLogin = async () => {
    console.log('🔵 handleFacebookLogin called');
    setLoading(true);
    setError(null);

    console.log('🔵 About to call signInWithFacebook');
    try {
      const { success, error } = await signInWithFacebook();
      console.log('🔵 signInWithFacebook returned:', { success, error });
      setLoading(false);

      if (error) {
        console.log('🔴 Setting error:', error);
        setError(error);
      } else {
        console.log('🟢 Success, navigating to tabs');
        router.replace('/(tabs)');
      }
    } catch (err) {
      console.log('err-------->', err);
      debugger
    }
  };

  const navigateToLogin = () => {
    router.replace('/login');
  };

  const navigateToEnrollmentInfo = () => {
    router.push('/enrollment-info');
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="h-[200px] justify-center items-center relative">
        <Image
          source={{ uri: 'https://images.pexels.com/photos/1047940/pexels-photo-1047940.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260' }}
          className="absolute w-full h-full"
        />
        <View className="absolute w-full h-full bg-black/40" />
      </View>
      <View className="flex-1 bg-white rounded-t-3xl -mt-6 p-4">
        <Text className="text-2xl font-bold text-gray-800 mb-4">Create Account</Text>

        {error && (
          <View className="bg-error-500/[0.15] p-4 rounded-lg mb-4">
            <Text className="text-error-600 text-sm">{error}</Text>
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

        <View className="flex-row items-center my-4">
          <View className="flex-1 h-[1px] bg-gray-300" />
          <Text className="mx-4 text-gray-500 font-medium">OR</Text>
          <View className="flex-1 h-[1px] bg-gray-300" />
        </View>

        <Button
          title="Sign Up with Email"
          onPress={navigateToEnrollmentInfo}
          variant="outline"
          style={{ marginTop: SPACING.s }}
        />

        <TouchableOpacity onPress={navigateToLogin} className="mt-4 items-center">
          <Text className="text-primary-700 text-base">
            Already have an account? Sign in
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
