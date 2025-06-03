import { getEvent } from '@/src/services/firestoreQueries';
import { useQuery } from '@tanstack/react-query';

export function useGetEvent(eventId: string) {
  console.log('eventId---------->', eventId);
  return useQuery({
    queryKey: ['event', eventId],
    enabled: !!eventId,
    queryFn: () => getEvent(eventId),
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });
}
