import { getFirestore, doc, getDoc } from '@react-native-firebase/firestore';
import { useQueries } from '@tanstack/react-query';
import { UserProfile, SocialHandles } from '@/src/models/User';

// Extended user data for chat messages
export interface ChatUserProfile extends Omit<UserProfile, 'userId'> {
  id: string;
  // Legacy field for backward compatibility
  instagramHandle?: string;
}

// Fetch multiple users efficiently with React Query
export function useGetUsers(userIds: string[]) {
  return useQueries({
    queries: userIds.map((userId) => ({
      queryKey: ['user', userId],
      queryFn: async (): Promise<ChatUserProfile> => {
        if (userId === 'system') {
          return {
            id: 'system',
            displayName: 'System',
            instagramHandle: undefined,
            photoURL: undefined,
            companyName: undefined,
            phone: undefined,
            email: undefined,
            website: undefined,
            social: undefined,
          };
        }
        
        const db = getFirestore();
        const userDoc = await getDoc(doc(db, 'users', userId));
        
        if (userDoc.exists()) {
          const data = userDoc.data();
          return {
            id: userDoc.id,
            displayName: data?.displayName || 'Unknown User',
            companyName: data?.companyName,
            phone: data?.phone,
            email: data?.email,
            website: data?.website,
            photoURL: data?.photoURL,
            social: data?.social as SocialHandles,
            // Legacy field for backward compatibility
            instagramHandle: data?.instagramHandle || data?.social?.instagram,
          };
        }
        
        return {
          id: userId,
          displayName: 'Unknown User',
          instagramHandle: undefined,
          photoURL: undefined,
          companyName: undefined,
          phone: undefined,
          email: undefined,
          website: undefined,
          social: undefined,
        };
      },
      staleTime: 5 * 60 * 1000, // User data is relatively static
      cacheTime: 30 * 60 * 1000, // Keep users in cache for 30 minutes
      enabled: !!userId,
    })),
  });
}