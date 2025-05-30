import { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, signInWithCredential, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, FacebookAuthProvider } from '@/src/lib/firebase';
import * as WebBrowser from 'expo-web-browser';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { makeRedirectUri } from 'expo-auth-session';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();

// Define user type
export interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  facebookAccessToken?: string;
}

// Define auth context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithFacebook: () => Promise<{ success: boolean; error?: string; user?: User }>;
  signOut: () => Promise<void>;
  createUserProfile: (partial: Partial<User>) => Promise<{ success: boolean; error?: string; data?: User }>;
  refreshUser: () => Promise<void>;
}

// Create auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Facebook App ID from environment variables or constants
const FACEBOOK_APP_ID = Constants.expoConfig?.extra?.facebookAppId || process.env.EXPO_PUBLIC_FACEBOOK_APP_ID;

// Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [facebookAccessToken, setFacebookAccessToken] = useState<string | null>(null);

  // Set up Facebook auth request
  const [request, response, promptAsync] = Facebook.useAuthRequest({
    clientId: FACEBOOK_APP_ID,
    redirectUri: makeRedirectUri({ scheme: 'dayof', path: 'auth/callback' }),
    responseType: Facebook.ResponseType.Token,
    scopes: ['public_profile', 'email'],
  });

  // Handle Firebase auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Convert Firebase user to our User type
        const userData: User = {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          facebookAccessToken: facebookAccessToken,
        };

        // Store user data
        setUser(userData);

        // Save user data to secure storage
        await SecureStore.setItemAsync('user', JSON.stringify(userData));
      } else {
        setUser(null);
        await SecureStore.deleteItemAsync('user');
      }

      setLoading(false);
    });

    // Load user from secure storage on init
    const loadUser = async () => {
      try {
        const savedUser = await SecureStore.getItemAsync('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    // Cleanup subscription
    return () => unsubscribe();
  }, [facebookAccessToken]);

  // Handle Facebook auth response
  useEffect(() => {
    if (response?.type === 'success' && response.authentication) {
      const { accessToken } = response.authentication;
      setFacebookAccessToken(accessToken);
      handleFacebookLogin(accessToken);
    }
  }, [response]);

  // Function to handle Facebook login with Firebase
  const handleFacebookLogin = async (token: string) => {
    try {
      // Create a Facebook credential with the token
      const credential = FacebookAuthProvider.credential(token);

      // Sign in to Firebase with the Facebook credential
      const result = await signInWithCredential(auth, credential);

      // User is signed in
      const firebaseUser = result.user;

      // Navigate to main app
      router.replace('/(tabs)');

      return {
        success: true,
        user: {
          id: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          facebookAccessToken: token,
        },
      };
    } catch (error) {
      console.error('Firebase authentication error:', error);
      return {
        success: false,
        error: error.message || 'Failed to authenticate with Firebase',
      };
    }
  };

  // Function to sign in with Facebook
  const signInWithFacebook = async () => {
    try {
      const result = await promptAsync();

      if (result.type !== 'success') {
        return {
          success: false,
          error: 'Facebook login was cancelled or failed',
        };
      }

      // The actual authentication is handled in the useEffect above
      return { success: true };
    } catch (error) {
      console.error('Error during Facebook login:', error);
      return {
        success: false,
        error: error.message || 'An error occurred during Facebook login',
      };
    }
  };

  // Function to sign out
  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setFacebookAccessToken(null);
      router.replace('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Function to create or update user profile
  const createUserProfile = async (partial: Partial<User>) => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      // In a real app, you would update the user profile in your database
      // For now, we'll just update the local state
      const updatedUser = { ...user, ...partial };
      setUser(updatedUser);
      await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));

      return { success: true, data: updatedUser };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error: error.message };
    }
  };

  // Function to refresh user data
  const refreshUser = async () => {
    if (!auth.currentUser) return;

    // In a real app, you would fetch the latest user data from your database
    // For now, we'll just use the current Firebase user
    const firebaseUser = auth.currentUser;
    const userData: User = {
      id: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      photoURL: firebaseUser.photoURL,
      facebookAccessToken: facebookAccessToken,
    };

    setUser(userData);
    await SecureStore.setItemAsync('user', JSON.stringify(userData));
  };

  // Provide auth context values
  return {
    user,
    loading,
    signInWithFacebook,
    signOut,
    createUserProfile,
    refreshUser,
  };
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
