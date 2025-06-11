import { useState } from 'react';
import { useGetUsersInEvent } from '@/src/services/service-hooks/useGetUsersInEvent';
import { getCategoriesForUser, getUserProfile } from '@/src/services/firestoreQueries';

export interface VendorData {
  userId: string;
  displayName: string;
  categories: string[];
  email?: string;
  social?: {
    instagram?: string;
    facebook?: string;
  };
  role?: string;
  joinedAt?: any;
}

export function useVendors(eventId: string) {
  const { data: eventUsers } = useGetUsersInEvent(eventId);
  const [vendorData, setVendorData] = useState<VendorData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadVendorData = async () => {
    if (!eventUsers || eventUsers.length === 0) {
      setVendorData([]);
      return [];
    }

    setIsLoading(true);
    
    try {
      // Prepare vendor data with categories and full user profiles
      const vendorsWithCategories = await Promise.all(
        eventUsers.map(async (member: any) => {
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
              ...member,
              displayName: 'Unknown User',
              categories: [],
              email: undefined,
              social: {}
            };
          }
        })
      );

      setVendorData(vendorsWithCategories);
      return vendorsWithCategories;
    } catch (error) {
      console.error('Error loading vendor data:', error);
      setVendorData([]);
      return [];
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