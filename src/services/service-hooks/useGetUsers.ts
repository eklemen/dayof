import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';
import { useQueries } from '@tanstack/react-query';

// Fetch multiple users efficiently with React Query
export function useGetUsers(userIds: string[]) {
  return useQueries({
    queries: userIds.map((userId) => ({
      queryKey: ['user', userId],
      queryFn: async () => {
        if (userId === 'system') {
          return {
            id: 'system',
            displayName: 'System',
            instagramHandle: undefined,
            photoURL: undefined
          };
        }
        
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (userDoc.exists()) {
          return {
            id: userDoc.id,
            displayName: userDoc.data()?.displayName,
            instagramHandle: userDoc.data()?.instagramHandle,
            photoURL: userDoc.data()?.photoURL
          };
        }
        
        return {
          id: userId,
          displayName: 'Unknown User',
          instagramHandle: undefined,
          photoURL: undefined
        };
      },
      staleTime: 5 * 60 * 1000, // User data is relatively static
      cacheTime: 30 * 60 * 1000, // Keep users in cache for 30 minutes
      enabled: !!userId,
    })),
  });
}