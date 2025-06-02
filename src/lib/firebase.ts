// firebase.ts
import firebase from '@react-native-firebase/app';
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import Constants from 'expo-constants';

// Initialize Firebase if it hasn't been initialized yet
if (!firebase.apps.length) {
  const firebaseConfig = {
    apiKey: Constants.expoConfig?.extra?.firebaseApiKey,
    authDomain: Constants.expoConfig?.extra?.firebaseAuthDomain,
    projectId: Constants.expoConfig?.extra?.firebaseProjectId,
    storageBucket: Constants.expoConfig?.extra?.firebaseStorageBucket,
    messagingSenderId: Constants.expoConfig?.extra?.firebaseSenderId,
    appId: Constants.expoConfig?.extra?.firebaseAppId,
  };

  firebase.initializeApp(firebaseConfig)
    .catch(err => console.log('Error initializing firebase app: ', err));
}

// Enable Firestore persistence (optional)
firestore().settings({
  persistence: true,
}).catch(err => console.log('Error configuring additional settings for firebase app: ', err));

// Export the firebase modules
export { firebase, auth, firestore };

// Export Facebook Auth Provider
export const FacebookAuthProvider = auth.FacebookAuthProvider;
//
// // Export Firestore utility functions
// export const {
//   collection,
//   doc,
//   getDoc,
//   getDocs,
//   setDoc,
//   addDoc,
//   updateDoc,
//   deleteDoc,
//   query,
//   where,
//   orderBy,
//   onSnapshot,
//   Timestamp,
//   serverTimestamp
// } = firestore;
