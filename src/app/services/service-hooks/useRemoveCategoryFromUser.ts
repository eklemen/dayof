import { removeCategoryFromUser } from '@/src/app/services/firestoreQueries';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useRemoveCategoryFromUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, userId, removeCategory }: { eventId: string; userId: string; removeCategory: string }) =>
      removeCategoryFromUser(eventId, userId, removeCategory),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['categories', 'user', variables.eventId, variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['users', 'category', variables.eventId, variables.removeCategory] });
    }
  });
}
