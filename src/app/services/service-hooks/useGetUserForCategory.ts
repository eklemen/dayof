import { getUserForCategory } from '@/src/app/services/firestoreQueries';
import { useQuery } from '@tanstack/react-query';

export function useGetUserForCategory(eventId: string, categoryId: string) {
  return useQuery({
    queryKey: ['user', 'category', eventId, categoryId],
    enabled: !!eventId && !!categoryId,
    queryFn: () => getUserForCategory(eventId, categoryId),
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });
}
