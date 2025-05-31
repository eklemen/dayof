import { getCategoriesForUser } from '@/src/app/services/firestoreQueries';
import { useQuery } from '@tanstack/react-query';

export function useGetCategoriesForUser(eventId: string, userId: string) {
  return useQuery({
    queryKey: ['categories', 'user', eventId, userId],
    enabled: !!eventId && !!userId,
    queryFn: () => getCategoriesForUser(eventId, userId),
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });
}
