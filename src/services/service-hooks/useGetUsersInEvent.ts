import { getUsersInEvent } from '@/src/services/firestoreQueries';
import { useQuery } from '@tanstack/react-query';

export function useGetUsersInEvent(eventId: string) {
  return useQuery({
    queryKey: ['users', 'event', eventId],
    enabled: !!eventId,
    queryFn: () => getUsersInEvent(eventId),
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });
}
