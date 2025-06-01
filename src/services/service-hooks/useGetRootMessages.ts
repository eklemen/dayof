import { getRootMessages } from '@/src/services/firestoreQueries';
import { useQuery } from '@tanstack/react-query';

export function useGetRootMessages(conversationId: string) {
  return useQuery({
    queryKey: ['messages', 'root', conversationId],
    enabled: !!conversationId,
    queryFn: () => getRootMessages(conversationId),
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });
}
