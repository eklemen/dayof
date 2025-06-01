import { assignUserToCategory } from '@/src/services/firestoreQueries';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useAssignUserToCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, categoryId, userId }: { eventId: string; categoryId: string; userId: string | null }) =>
      assignUserToCategory(eventId, categoryId, userId),
    onSuccess: (_, variables) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['user', 'category', variables.eventId, variables.categoryId] });
      queryClient.invalidateQueries({ queryKey: ['categories', 'event', variables.eventId] });
    }
  });
}
