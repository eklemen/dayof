import { getUsersInEvent } from '@/src/services/firestoreQueries';
import { useQuery } from '@tanstack/react-query';

export function useGetEventMembers(eventId: string) {
  return useQuery({
    queryKey: ['eventMembers', eventId],
    enabled: !!eventId,
    queryFn: () => getUsersInEvent(eventId),
    staleTime: 2 * 60 * 1000, // Cache for 2 minutes (members don't change often)
    cacheTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });
}