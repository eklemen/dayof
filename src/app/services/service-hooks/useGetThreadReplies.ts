import { getThreadReplies } from '@/src/app/services/firestoreQueries';
import { useQuery } from '@tanstack/react-query';

export function useGetThreadReplies(conversationId: string, rootMessageId: string) {
  return useQuery({
    queryKey: ['messages', 'thread', conversationId, rootMessageId],
    enabled: !!conversationId && !!rootMessageId,
    queryFn: () => getThreadReplies(conversationId, rootMessageId),
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });
}
