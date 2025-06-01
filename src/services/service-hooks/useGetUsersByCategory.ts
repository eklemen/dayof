import { getUsersByCategory } from '@/src/services/firestoreQueries';
import { useQuery } from '@tanstack/react-query';

export function useGetUsersByCategory(eventId: string, categoryName: string) {
  return useQuery({
    queryKey: ['users', 'category', eventId, categoryName],
    enabled: !!eventId && !!categoryName,
    queryFn: () => getUsersByCategory(eventId, categoryName),
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });
}
