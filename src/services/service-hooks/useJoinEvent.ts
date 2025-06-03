import { joinEventWithCode } from '@/src/services/firestoreQueries';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useJoinEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ groupCode, userId }: { groupCode: string, userId: string }) => 
      joinEventWithCode(groupCode, userId),
    onSuccess: () => {
      // Invalidate events query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}