import { getEventsForUser } from '@/src/services/firestoreQueries';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/src/hooks/useAuth';

export function useGetEventsForUser() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['events'],
    enabled: !!user?.id,
    queryFn: () => getEventsForUser(user!.id),
    staleTime: 5 * 60 * 1000, // cache for 5 minutes
  });
}
