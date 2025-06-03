import { useQuery } from '@tanstack/react-query';
import { getFirestore, collection, onSnapshot } from '@react-native-firebase/firestore';

function useFirestoreCollection(path: string) {
  return useQuery(
    {
      queryKey: ['firestore', path],
      queryFn: () =>
        new Promise((resolve, reject) => {
          const db = getFirestore();
          const unsubscribe = onSnapshot(
            collection(db, path),
            (snapshot) => {
              const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              resolve(data);
            },
            (error) => reject(error)
          );

          // Cleanup subscription on unmount
          return unsubscribe;
        }),
      staleTime: 1000 * 60, // 1 min cache lifetime
      refetchOnWindowFocus: false,
    },
  );
}
