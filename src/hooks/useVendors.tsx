import { useState } from 'react';
import { useGetUsersInEvent } from '@/src/services/service-hooks/useGetUsersInEvent';
import { getCategoriesForUser, getUserProfile } from '@/src/services/firestoreQueries';
import { VendorData, EventMember } from '@/src/types/events';

interface UseVendorsReturn {
  vendorData: VendorData[];
  isLoading: boolean;
  loadVendorData: () => Promise<VendorData[]>;
  hasVendors: boolean;
}

export function useVendors(eventId: string): UseVendorsReturn {
  const { data: eventUsers } = useGetUsersInEvent(eventId);
  const [vendorData, setVendorData] = useState<VendorData[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadVendorData = async (): Promise<VendorData[]> => {
    if (!eventUsers || eventUsers.length === 0) {
      setVendorData([]);
      return [];
    }

    setIsLoading(true);
    
    try {
      // Prepare vendor data with categories and full user profiles
      const vendorsWithCategories = await Promise.all(
        eventUsers.map(async (member: EventMember): Promise<VendorData> => {
          try {
            const [userProfile, userCategories] = await Promise.all([
              getUserProfile(member.userId),
              getCategoriesForUser(eventId, member.userId)
            ]);
            
            return {
              ...member,
              ...userProfile,
              categories: userCategories || []
            };
          } catch (error) {
            console.error('Error fetching vendor data:', error);
            return {
              userId: member.userId,
              displayName: 'Unknown User',
              categories: [],
              email: undefined,
              social: undefined,
              role: member.role,
              joinedAt: member.joinedAt
            };
          }
        })
      );

      setVendorData(vendorsWithCategories);
      return vendorsWithCategories;
    } catch (error) {
      console.error('Error loading vendor data:', error);
      const emptyData: VendorData[] = [];
      setVendorData(emptyData);
      return emptyData;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    vendorData,
    isLoading,
    loadVendorData,
    hasVendors: vendorData.length > 0,
  };
}