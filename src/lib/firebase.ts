// firebase.ts
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  FacebookAuthProvider,
  getAuth,
  Auth,
  getReactNativePersistence
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp,
  initializeFirestore,
} from 'firebase/firestore';
import Constants from 'expo-constants';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';


let app: FirebaseApp;
let auth: Auth;

const firebaseConfig = {
  apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
  authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
  projectId: Constants.expoConfig?.extra?.firebaseProjectId,
  storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket,
  messagingSenderId: Constants.expoConfig?.extra?.firebaseSenderId,
  appId: Constants.expoConfig?.extra?.firebaseAppId,
};
if (!getApps().length) {
  app = initializeApp(firebaseConfig);

  // ✅ initialize auth with browser local persistence
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} else {
  app = getApp();
  // 👇 safely fallback if already initialized
  try {
    auth = getAuth(app);
  } catch (e) {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  }
}

// Initialize Firestore
const firestore = initializeFirestore(app, {
  experimentalForceLongPolling: true,
});

export {
  auth,
  firestore,
  FacebookAuthProvider,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  Timestamp,
  serverTimestamp
};
