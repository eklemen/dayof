import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { getThreadReplies } from '@/src/services/firestoreQueries';

interface ThreadReplyCount {
  messageId: string;
  replyCount: number;
}

export function useThreadReplyCounts(conversationId: string, rootMessageIds: string[]) {
  // Create queries for each root message to get its thread replies
  const replyQueries = useQueries({
    queries: rootMessageIds.map(messageId => ({
      queryKey: ['threadReplies', conversationId, messageId],
      queryFn: () => getThreadReplies(conversationId, messageId),
      enabled: !!conversationId && !!messageId,
      staleTime: 30 * 1000, // Cache for 30 seconds
    }))
  });

  // Convert query results to a map of messageId -> count
  const replyCounts = useMemo(() => {
    const counts = new Map<string, number>();
    
    replyQueries.forEach((query, index) => {
      const messageId = rootMessageIds[index];
      if (query.data) {
        counts.set(messageId, query.data.length);
      } else {
        counts.set(messageId, 0);
      }
    });
    
    return counts;
  }, [replyQueries, rootMessageIds]);

  // Check if any queries are still loading
  const isLoading = replyQueries.some(query => query.isLoading);

  return {
    replyCounts,
    isLoading,
  };
}