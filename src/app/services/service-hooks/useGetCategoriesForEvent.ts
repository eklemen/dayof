import { getCategoriesForEvent } from '@/src/app/services/firestoreQueries';
import { useQuery } from '@tanstack/react-query';

export function useGetCategoriesForEvent(eventId: string) {
  return useQuery({
    queryKey: ['categories', 'event', eventId],
    enabled: !!eventId,
    queryFn: () => getCategoriesForEvent(eventId),
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });
}
