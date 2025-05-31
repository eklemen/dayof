import { removeReaction } from '@/src/app/services/firestoreQueries';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useRemoveReaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      conversationId,
      messageId,
      emoji,
      userId
    }: {
      conversationId: string;
      messageId: string;
      emoji: string;
      userId: string
    }) => removeReaction(conversationId, messageId, emoji, userId),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['messages', 'root', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['messages', 'thread', variables.conversationId] });
    }
  });
}
