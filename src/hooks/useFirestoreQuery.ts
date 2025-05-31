import { useQuery } from '@tanstack/react-query';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { firestore } from '@/src/lib/firebase'

function useFirestoreCollection(path: string) {
  return useQuery(
    {
      queryKey: ['firestore', path],
      queryFn: () =>
        new Promise((resolve, reject) => {
          const q = query(collection(firestore, path));
          const unsubscribe = onSnapshot(
            q,
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
