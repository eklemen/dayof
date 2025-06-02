import { useQuery } from '@tanstack/react-query';
import { firestore } from '@/src/lib/firebase'

function useFirestoreCollection(path: string) {
  return useQuery(
    {
      queryKey: ['firestore', path],
      queryFn: () =>
        new Promise((resolve, reject) => {
          const unsubscribe = firestore()
            .collection(path)
            .onSnapshot(
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
