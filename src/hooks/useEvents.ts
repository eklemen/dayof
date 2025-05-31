import { useEffect, useState } from 'react';
import {
  db,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from '@/src/lib/firebase';
import { DEFAULT_VENDOR_CATEGORIES } from '@/src/lib/constants';
import { generateGroupCode } from '@/src/lib/utils';
import { Event } from '@/src/models/Event';

export interface EventMembership {
  userId: string;
  eventId: string;
  categories: string[];
}

export interface VendorCategory {
  id: string;
  eventId: string;
  name: string;
}

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
      const membershipQuery = query(
        collection(db, 'eventMemberships'),
        where('userId', '==', userId)
      );

      const membershipSnapshot = await getDocs(membershipQuery);
      const eventIds = membershipSnapshot.docs.map(doc => doc.data().eventId);

      // Fetch events where user is owner
      const ownerQuery = query(
        collection(db, 'events'),
        where('ownerId', '==', userId)
      );

      const ownerSnapshot = await getDocs(ownerQuery);
      const ownerEvents = ownerSnapshot.docs.map(doc => ({
        eventId: doc.id,
        ...doc.data()
      })) as Event[];

      // Fetch events where user is a member
      let memberEvents: Event[] = [];
      if (eventIds.length > 0) {
        // Firebase doesn't support 'in' queries with more than 10 items
        // So we need to batch the queries if there are more than 10 eventIds
        const batchSize = 10;
        const batches = [];

        for (let i = 0; i < eventIds.length; i += batchSize) {
          const batch = eventIds.slice(i, i + batchSize);
          batches.push(batch);
        }

        for (const batch of batches) {
          const memberQuery = query(
            collection(db, 'events'),
            where('eventId', 'in', batch)
          );

          const memberSnapshot = await getDocs(memberQuery);
          const batchEvents = memberSnapshot.docs.map(doc => ({
            eventId: doc.id,
            ...doc.data()
          })) as Event[];

          memberEvents = [...memberEvents, ...batchEvents];
        }
      }

      // Combine and deduplicate events
      const allEvents = [...ownerEvents, ...memberEvents];
      const uniqueEvents = Array.from(
        new Map(allEvents.map(event => [event.eventId, event])).values()
      );

      // Sort by startDate descending
      uniqueEvents.sort((a, b) => {
        if (!a.startDate) return 1;
        if (!b.startDate) return -1;
        return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
      });

      setEvents(uniqueEvents);
      setUserEvents(uniqueEvents);
    } catch (error) {
      console.error('Error in fetchUserEvents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEvent = async (eventId: string) => {
    try {
      const eventDoc = await getDoc(doc(db, 'events', eventId));

      if (!eventDoc.exists()) {
        console.error('Event not found');
        return null;
      }

      return {
        eventId: eventDoc.id,
        ...eventDoc.data()
      } as Event;
    } catch (error) {
      console.error('Error in getEvent:', error);
      return null;
    }
  };

  const createEvent = async (eventData: Omit<Event, 'eventId'>, ownerId: string) => {
    try {
      const groupCode = generateGroupCode();

      // Create the event
      const newEventRef = doc(collection(db, 'events'));
      const newEvent = {
        ...eventData,
        ownerId,
        groupCode,
        isArchived: false,
        createdAt: serverTimestamp()
      };

      await setDoc(newEventRef, newEvent);

      const createdEvent = {
        eventId: newEventRef.id,
        ...newEvent
      } as Event;

      // Add default vendor categories
      const categoriesPromises = DEFAULT_VENDOR_CATEGORIES.map(name => {
        const categoryRef = doc(collection(db, 'vendorCategories'));
        return setDoc(categoryRef, {
          eventId: newEventRef.id,
          name,
        });
      });

      await Promise.all(categoriesPromises);

      // Add the creator as a member (planner role)
      const membershipRef = doc(collection(db, 'eventMemberships'));
      await setDoc(membershipRef, {
        userId: ownerId,
        eventId: newEventRef.id,
        categories: [], // Planner doesn't need categories
        role: 'planner',
        joinedAt: serverTimestamp()
      });

      // Refetch events to update the state
      fetchUserEvents(ownerId);

      return { success: true, data: createdEvent, error: null };
    } catch (error: any) {
      console.error('Error creating event:', error);
      return { success: false, data: null, error: error.message };
    }
  };

  const joinEventWithCode = async (groupCode: string, userId: string) => {
    try {
      // Find the event with the code
      const eventQuery = query(
        collection(db, 'events'),
        where('groupCode', '==', groupCode)
      );

      const eventSnapshot = await getDocs(eventQuery);

      if (eventSnapshot.empty) {
        throw new Error('Event not found with that code');
      }

      const eventDoc = eventSnapshot.docs[0];
      const event = {
        eventId: eventDoc.id,
        ...eventDoc.data()
      } as Event;

      // Check if already a member
      const membershipQuery = query(
        collection(db, 'eventMemberships'),
        where('userId', '==', userId),
        where('eventId', '==', event.eventId)
      );

      const membershipSnapshot = await getDocs(membershipQuery);

      if (!membershipSnapshot.empty) {
        return { success: true, data: event, error: null, alreadyMember: true };
      }

      // Add as a member
      const membershipRef = doc(collection(db, 'eventMemberships'));
      await setDoc(membershipRef, {
        userId,
        eventId: event.eventId,
        categories: [], // Categories will be assigned by planner
        role: 'member',
        joinedAt: serverTimestamp()
      });

      // Refetch events to update the state
      fetchUserEvents(userId);

      return { success: true, data: event, error: null };
    } catch (error: any) {
      console.error('Error joining event:', error);
      return { success: false, data: null, error: error.message };
    }
  };

  const getEventMembers = async (eventId: string) => {
    try {
      const membershipQuery = query(
        collection(db, 'eventMemberships'),
        where('eventId', '==', eventId)
      );

      const membershipSnapshot = await getDocs(membershipQuery);

      if (membershipSnapshot.empty) {
        return { success: true, data: [], error: null };
      }

      // Get all user IDs from memberships
      const userIds = membershipSnapshot.docs.map(doc => doc.data().userId);

      // Get user details for each member
      const membersWithDetails = await Promise.all(
        membershipSnapshot.docs.map(async (memberDoc) => {
          const memberData = memberDoc.data();
          const userDoc = await getDoc(doc(db, 'users', memberData.userId));

          if (!userDoc.exists()) {
            return {
              ...memberData,
              user: { id: memberData.userId }
            };
          }

          const userData = userDoc.data();
          return {
            ...memberData,
            user: {
              id: userDoc.id,
              displayName: userData.displayName,
              companyName: userData.companyName,
              instagramHandle: userData.instagramHandle,
              roles: userData.roles
            }
          };
        })
      );

      return { success: true, data: membersWithDetails, error: null };
    } catch (error: any) {
      console.error('Error fetching event members:', error);
      return { success: false, data: null, error: error.message };
    }
  };

  const getEventCategories = async (eventId: string) => {
    try {
      const categoriesQuery = query(
        collection(db, 'vendorCategories'),
        where('eventId', '==', eventId)
      );

      const categoriesSnapshot = await getDocs(categoriesQuery);

      if (categoriesSnapshot.empty) {
        return { success: true, data: [], error: null };
      }

      const categories = categoriesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as VendorCategory[];

      return { success: true, data: categories, error: null };
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
