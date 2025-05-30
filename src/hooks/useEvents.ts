import { useEffect, useState } from 'react';
// import { supabase } from '@/src/lib/supabase';
// import { Database } from '@/src/types/supabase';
import { DEFAULT_VENDOR_CATEGORIES } from '@/src/lib/constants';
import { generateGroupCode } from '@/src/lib/utils';
//
// export type Event = Database['public']['Tables']['events']['Row'];
// export type EventMembership = Database['public']['Tables']['event_memberships']['Row'];
// export type VendorCategory = Database['public']['Tables']['vendor_categories']['Row'];

export function useEvents(userId?: string) {
  const [events, setEvents] = useState<Event[]>([]);
  const [userEvents, setUserEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchUserEvents(userId);
    }
  }, [userId]);

  const fetchUserEvents = async (userId: string) => {
    try {
      setLoading(true);

      // Fetch events where user is a member
      // const { data: memberships, error: membershipError } = await supabase
      //   .from('event_memberships')
      //   .select('event_id')
      //   .eq('user_id', userId);
      //
      // if (membershipError) {
      //   console.error('Error fetching memberships:', membershipError);
      //   return;
      // }

      // Fetch events where user is owner or member
      // const eventIds = memberships?.map(m => m.event_id) || [];
      //
      // const { data, error } = await supabase
      //   .from('events')
      //   .select('*')
      //   .or(`owner_id.eq.${userId},id.in.(${eventIds.join(',')})`)
      //   .order('start_date', { ascending: false });
      //
      // if (error) {
      //   console.error('Error fetching events:', error);
      //   return;
      // }
      //
      // setEvents(data || []);
      // setUserEvents(data || []);
    } catch (error) {
      console.error('Error in fetchUserEvents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEvent = async (eventId: string) => {
    try {
      // const { data, error } = await supabase
      //   .from('events')
      //   .select('*')
      //   .eq('id', eventId)
      //   .single();
      //
      // if (error) {
      //   console.error('Error fetching event:', error);
      //   return null;
      // }
      //
      // return data;
    } catch (error) {
      console.error('Error in getEvent:', error);
      return null;
    }
  };

  const createEvent = async (eventData: Omit<Event, 'id' | 'created_at' | 'group_code' | 'is_archived'>, ownerId: string) => {
    try {
      const groupCode = generateGroupCode();

      // Create the event
      // const { data: eventData, error: eventError } = await supabase
      //   .from('events')
      //   .insert({
      //     ...eventData,
      //     owner_id: ownerId,
      //     group_code: groupCode,
      //     is_archived: false,
      //   })
      //   .select()
      //   .single();
      //
      // if (eventError) throw eventError;
      //
      // // Add default vendor categories
      // const categoriesData = DEFAULT_VENDOR_CATEGORIES.map(name => ({
      //   event_id: eventData.id,
      //   name,
      // }));
      //
      // const { error: categoriesError } = await supabase
      //   .from('vendor_categories')
      //   .insert(categoriesData);
      //
      // if (categoriesError) throw categoriesError;
      //
      // // Add the creator as a member (planner role)
      // const { error: membershipError } = await supabase
      //   .from('event_memberships')
      //   .insert({
      //     user_id: ownerId,
      //     event_id: eventData.id,
      //     categories: [], // Planner doesn't need categories
      //   });
      //
      // if (membershipError) throw membershipError;
      //
      // // Refetch events to update the state
      // fetchUserEvents(ownerId);
      //
      // return { success: true, data: eventData, error: null };
    } catch (error: any) {
      console.error('Error creating event:', error);
      return { success: false, data: null, error: error.message };
    }
  };

  const joinEventWithCode = async (groupCode: string, userId: string) => {
    try {
      // Find the event with the code
      // const { data: event, error: eventError } = await supabase
      //   .from('events')
      //   .select('*')
      //   .eq('group_code', groupCode)
      //   .single();
      //
      // if (eventError) throw new Error('Event not found with that code');
      //
      // // Check if already a member
      // const { data: existingMembership, error: membershipCheckError } = await supabase
      //   .from('event_memberships')
      //   .select('*')
      //   .eq('user_id', userId)
      //   .eq('event_id', event.id)
      //   .single();
      //
      // if (existingMembership) {
      //   return { success: true, data: event, error: null, alreadyMember: true };
      // }
      //
      // // Add as a member
      // const { error: membershipError } = await supabase
      //   .from('event_memberships')
      //   .insert({
      //     user_id: userId,
      //     event_id: event.id,
      //     categories: [], // Categories will be assigned by planner
      //   });
      //
      // if (membershipError) throw membershipError;
      //
      // // Refetch events to update the state
      // fetchUserEvents(userId);
      //
      // return { success: true, data: event, error: null };
    } catch (error: any) {
      console.error('Error joining event:', error);
      return { success: false, data: null, error: error.message };
    }
  };

  const getEventMembers = async (eventId: string) => {
    try {
      // const { data, error } = await supabase
      //   .from('event_memberships')
      //   .select(`
      //     users (id, display_name, company_name, instagram_handle, roles),
      //     categories
      //   `)
      //   .eq('event_id', eventId);

      if (error) throw error;

      return { success: true, data, error: null };
    } catch (error: any) {
      console.error('Error fetching event members:', error);
      return { success: false, data: null, error: error.message };
    }
  };

  const getEventCategories = async (eventId: string) => {
    try {
      // const { data, error } = await supabase
      //   .from('vendor_categories')
      //   .select('*')
      //   .eq('event_id', eventId);
      //
      // if (error) throw error;
      //
      // return { success: true, data, error: null };
    } catch (error: any) {
      console.error('Error fetching event categories:', error);
      return { success: false, data: null, error: error.message };
    }
  };

  return {
    events,
    userEvents,
    loading,
    getEvent,
    createEvent,
    joinEventWithCode,
    getEventMembers,
    getEventCategories,
    refreshEvents: (userId: string) => fetchUserEvents(userId),
  };
}
