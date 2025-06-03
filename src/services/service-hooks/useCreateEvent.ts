import { createEvent } from '@/src/services/firestoreQueries';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useCreateEvent() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ eventData, ownerId }: { 
      eventData: {
        eventName: string;
        startDate: string;
        endDate: string;
        venueName?: string | null;
        address?: string | null;
        venuePhone?: string | null;
      }, 
      ownerId: string 
    }) => createEvent(eventData, ownerId),
    onSuccess: () => {
      // Invalidate events query to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['events'] });
    },
  });
}