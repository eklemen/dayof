import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { User as FirebaseUser, signInWithCredential, signOut as firebaseSignOut } from 'firebase/auth/react-native';
import { auth, FacebookAuthProvider } from '@/src/lib/firebase';
import * as WebBrowser from 'expo-web-browser';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { makeRedirectUri } from 'expo-auth-session';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();
console.log('Constants.expoConfig?.extra?.facebookAppId---------->', Constants.expoConfig?.extra?.facebookAppId);
const redirectUri = Platform.select({
  web: makeRedirectUri({ useProxy: true }),
  default: `fb${Constants.expoConfig?.extra?.facebookAppId}://authorize`,
});
console.log('redirectUri---------->', redirectUri);
// Define user type
export interface User {
  id: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  facebookAccessToken?: string;
  businessName?: string;
  instagramHandle?: string;
  tiktokHandle?: string;
  facebookHandle?: string;
}

// Define auth context type
interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithFacebook: (source?: 'login' | 'register') => Promise<{ success: boolean; error?: string; user?: User }>;
  signOut: () => Promise<void>;
  createUserProfile: (partial: Partial<User>) => Promise<{ success: boolean; error?: string; data?: User }>;
  refreshUser: () => Promise<void>;
}

// Create auth context
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithFacebook: async () => ({ success: false, error: 'Not implemented' }),
  signOut: async () => {},
  createUserProfile: async () => ({ success: false, error: 'Not implemented' }),
  refreshUser: async () => {},
});

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
    redirectUri,
    responseType: "token",
    scopes: ['public_profile', 'email'],
  });

  // Handle Firebase auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Get existing user data from secure storage
        let existingUserData = {};
        try {
          const savedUser = await SecureStore.getItemAsync('user');
          if (savedUser) {
            existingUserData = JSON.parse(savedUser);
          }
        } catch (error) {
          console.error('Error loading user from storage:', error);
        }

        // Convert Firebase user to our User type, preserving existing data
        const userData: User = {
          ...existingUserData, // Keep existing fields
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
          // If we have a saved user, route to the main app
          router.replace('/(tabs)');
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
      handleFacebookLogin(accessToken, loginSource);
    }
  }, [response]);

  // Track the source of the login (login page or register page)
  const [loginSource, setLoginSource] = useState<'login' | 'register' | undefined>(undefined);

  // Function to handle Facebook login with Firebase
  const handleFacebookLogin = async (token: string, source?: 'login' | 'register') => {
    try {
      // Create a Facebook credential with the token
      const credential = FacebookAuthProvider.credential(token);

      // Sign in to Firebase with the Facebook credential
      const result = await signInWithCredential(auth, credential);
      console.log('result---------->', result);
      // User is signed in
      const firebaseUser = result.user;

      // Route based on the source of the login
      if (source === 'login') {
        // If logging in from the login page, go directly to the main app
        router.replace('/(tabs)');
      } else {
        // If registering from the register page, go to enrollment info
        router.replace('/enrollment-info');
      }

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
  const signInWithFacebook = async (source?: 'login' | 'register') => {
    try {
      // Set the login source to be used in the useEffect when the response comes back
      setLoginSource(source);

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
    // For now, we'll just use the current Firebase user and preserve any additional fields
    const firebaseUser = auth.currentUser;

    // Preserve existing user data while updating with fresh Firebase data
    const userData: User = {
      ...(user || {}), // Keep existing fields if user exists
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
  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        user,
        loading,
        signInWithFacebook,
        signOut,
        createUserProfile,
        refreshUser,
      }
    },
    children
  );
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
