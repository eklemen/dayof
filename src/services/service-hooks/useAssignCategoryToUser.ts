import { assignCategoryToUser } from '@/src/services/firestoreQueries';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useAssignCategoryToUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, userId, newCategory }: { eventId: string; userId: string; newCategory: string }) =>
      assignCategoryToUser(eventId, userId, newCategory),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['categories', 'user', variables.eventId, variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['users', 'category', variables.eventId, variables.newCategory] });
    }
  });
}
