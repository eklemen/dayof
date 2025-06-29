import React, { createContext, useContext, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import auth from '@react-native-firebase/auth';
import { getFirestore, doc, getDoc, setDoc, serverTimestamp } from '@react-native-firebase/firestore';
import * as WebBrowser from 'expo-web-browser';
import * as Facebook from 'expo-auth-session/providers/facebook';
import { makeRedirectUri } from 'expo-auth-session';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';

WebBrowser.maybeCompleteAuthSession();
const redirectUri = Platform.select({
  web: makeRedirectUri({ useProxy: true }),
  default: `fb${Constants.expoConfig?.extra?.facebookAppId}://authorize`,
});
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

  // Function to create a user document in Firestore if it doesn't exist
  const createUserDocIfNotExists = async () => {
    const user = auth().currentUser;
    if (!user) return;

    const db = getFirestore();
    const userDocRef = doc(db, 'users', user.uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      await setDoc(userDocRef, {
        email: user.email,
        displayName: user.displayName || '',
        photoURL: user.photoURL || '',
        createdAt: serverTimestamp(),
        // add any custom fields here
      });
    }
  };

  // Set up Facebook auth request
  const [request, response, promptAsync] = Facebook.useAuthRequest({
    clientId: FACEBOOK_APP_ID,
    redirectUri,
    responseType: "token",
    scopes: ['public_profile', 'email'],
  });

  // Load user from secure storage on initial mount only
  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = await SecureStore.getItemAsync('user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
      } catch (error) {
        console.error('Error loading user from storage:', error);
      }
      setLoading(false);
    };

    loadUser();
  }, []); // Empty dependency array - run only once on mount

  // Handle Firebase auth state changes - separate useEffect
  useEffect(() => {
    const unsubscribe = auth().onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Convert Firebase user to our User type, preserving existing data
        const userData: User = {
          ...(user || {}), // Keep existing fields if user exists
          id: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          photoURL: firebaseUser.photoURL,
          facebookAccessToken: facebookAccessToken,
        };

        // Only update if user data has actually changed to prevent loops
        const hasChanged = !user || 
          user.id !== userData.id || 
          user.email !== userData.email || 
          user.displayName !== userData.displayName ||
          user.facebookAccessToken !== userData.facebookAccessToken;

        if (hasChanged) {
          setUser(userData);
          // Save user data to secure storage
          await SecureStore.setItemAsync('user', JSON.stringify(userData));
        }
      } else {
        // Only clear user if we currently have one
        if (user) {
          setUser(null);
          await SecureStore.deleteItemAsync('user');
        }
      }
      setLoading(false);
    });

    // Cleanup subscription
    return () => unsubscribe();
  }, [facebookAccessToken]); // Remove 'user' from dependencies to prevent loop

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
      const credential = auth.FacebookAuthProvider.credential(token);

      // Sign in to Firebase with the Facebook credential
      const result = await auth().signInWithCredential(credential);
      // User is signed in
      const firebaseUser = result.user;

      // Check if user document already exists in Firestore
      const db = getFirestore();
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDocSnap = await getDoc(userDocRef);

      const isNewUser = !userDocSnap.exists();

      // If user doesn't exist, create the document
      if (isNewUser) {
        await setDoc(userDocRef, {
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || '',
          photoURL: firebaseUser.photoURL || '',
          createdAt: serverTimestamp(),
        });
      }

      const userObj = {
        id: firebaseUser.uid,
        email: firebaseUser.email,
        displayName: firebaseUser.displayName,
        photoURL: firebaseUser.photoURL,
        facebookAccessToken: token,
      }
      setUser(userObj);

      // Route based on whether user is new or existing
      if (isNewUser) {
        // First time logging in - go to enrollment info
        router.replace('/enrollment-info');
      } else {
        // Existing user - go directly to main app
        router.replace('/(tabs)');
      }

      return {
        success: true,
        user: userObj
      };
    } catch (error) {
      console.error('Firebase authentication error:', error);
      return {
        success: false,
        error: error?.message || 'Failed to authenticate with Firebase',
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
        error: error?.message || 'An error occurred during Facebook login',
      };
    }
  };

  // Function to sign out
  const signOut = async () => {
    try {
      await auth().signOut();
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
      // Ensure user document exists in Firestore (for legacy calls)
      if (auth().currentUser) {
        const db = getFirestore();
        const userDocRef = doc(db, 'users', auth().currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);

        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, {
            email: auth().currentUser.email,
            displayName: auth().currentUser.displayName || '',
            photoURL: auth().currentUser.photoURL || '',
            createdAt: serverTimestamp(),
          });
        }
      }

      // In a real app, you would update the user profile in your database
      // Update the Firestore document with the new profile data
      if (auth().currentUser) {
        const db = getFirestore();
        const userDocRef = doc(db, 'users', auth().currentUser.uid);
        await setDoc(userDocRef, {
          ...partial,
          updatedAt: serverTimestamp(),
        }, { merge: true });
      }
      console.log('userDocRef updated');

      // Update the local state
      const updatedUser = { ...user, ...partial };
      setUser(updatedUser);
      await SecureStore.setItemAsync('user', JSON.stringify(updatedUser));

      return { success: true, data: updatedUser };
    } catch (error) {
      console.error('Error updating user profile:', error);
      return { success: false, error: error?.message };
    }
  };

  // Function to refresh user data
  const refreshUser = async () => {
    if (!auth().currentUser) return;

    // In a real app, you would fetch the latest user data from your database
    // For now, we'll just use the current Firebase user and preserve any additional fields
    const firebaseUser = auth().currentUser;

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
