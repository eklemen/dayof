import {
  getFirestore,
  collection,
  doc,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  runTransaction,
  collectionGroup,
  setDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from '@react-native-firebase/firestore';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';
import { DEFAULT_VENDOR_CATEGORIES } from '@/src/lib/constants';
import { generateGroupCode } from '@/src/lib/utils';

// Helper function to get venue details by ID
async function getVenueById(venueId: string) {
  if (!venueId) return null;
  const db = getFirestore();
  const venueDoc = await getDoc(doc(db, "venues", venueId));
  if (venueDoc.exists()) {
    return { id: venueDoc.id, ...venueDoc.data() };
  } else {
    return null;
  }
}

// 1. Get all events for a user (via membership)
export async function getEventsForUser(userId: string) {
  // 1. Find all the membership documents for this user
  const db = getFirestore();
  const q = query(
    collectionGroup(db, 'members'),
    where('userId', '==', userId)
  );

  const snapshot = await getDocs(q);
  const eventIds = snapshot.docs
    .map((docSnap) => docSnap.ref.parent.parent?.id)
    .filter(Boolean) as string[];

  if (eventIds.length === 0) return [];

  // 2. Fetch each event and its venue details
  const eventPromises = eventIds.map(async (eventId) => {
    const eventDocSnap = await getDoc(doc(db, 'events', eventId));

    if (!eventDocSnap.exists) return null;
    const eventData = eventDocSnap.data()!;

    // Convert Firestore Timestamp → JS Date
    const startDate: Date | null = eventData.startDate
      ? (eventData.startDate as FirebaseFirestoreTypes.Timestamp).toDate()
      : null;
    const endDate: Date | null = eventData.endDate
      ? (eventData.endDate as FirebaseFirestoreTypes.Timestamp).toDate()
      : null;

    // eventData.venueId is a DocumentReference, so do `.id`
    let fullVenue = null;
    if (eventData.venueId) {
      const venueRef = eventData.venueId as FirebaseFirestoreTypes.DocumentReference;
      fullVenue = await getVenueById(venueRef.id);
    }

    return {
      eventId: eventDocSnap.id,
      eventName: eventData.eventName,
      ownerId: (eventData.ownerId as FirebaseFirestoreTypes.DocumentReference).id,
      venueId: (eventData.venueId as FirebaseFirestoreTypes.DocumentReference).id,
      startDate,
      endDate,
      venue: fullVenue,  // full venue object or null
    };
  });

  const events = await Promise.all(eventPromises);
  return events.filter((e) => e !== null);
}

// 2. Get all users in a room/event
export async function getUsersInEvent(eventId: string) {
  const db = getFirestore();
  const snapshot = await getDocs(collection(db, `events/${eventId}/members`));
  return snapshot.docs.map((doc) => doc.data());
}

// 3. Get all messages in a conversation, root messages only (threadId == null)
export async function getRootMessages(conversationId: string) {
  const db = getFirestore();
  const q = query(
    collection(db, `conversations/${conversationId}/messages`),
    where("parentMessageId", "==", null),
    orderBy("createdAt", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data());
}

// 4. Get replies to a message (thread)
export async function getThreadReplies(conversationId: string, rootMessageId: string) {
  const db = getFirestore();
  const q = query(
    collection(db, `conversations/${conversationId}/messages`),
    where("parentMessageId", "==", rootMessageId),
    orderBy("createdAt", "asc")
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data());
}

// 5. Get all categories for an event
export async function getCategoriesForEvent(eventId: string) {
  const db = getFirestore();
  const snapshot = await getDocs(collection(db, `events/${eventId}/categories`));
  return snapshot.docs.map((doc) => doc.data());
}

// 6. Get category assignments (all users assigned to a category) - when multiple categories per user allowed
export async function getUsersByCategory(eventId: string, categoryName: string) {
  const db = getFirestore();
  const q = query(
    collection(db, `events/${eventId}/categoryAssignments`),
    where("categories", "array-contains", categoryName)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data());
}

// 7. Get categories assigned to a user for an event
export async function getCategoriesForUser(eventId: string, userId: string) {
  const db = getFirestore();
  const docSnap = await getDoc(doc(db, `events/${eventId}/categoryAssignments`, userId));
  if (docSnap.exists()) {
    return docSnap.data()?.categories || [];
  }
  return [];
}

// 8. Assign category to user (transaction ensuring no duplicate category in array)
export async function assignCategoryToUser(eventId: string, userId: string, newCategory: string) {
  const db = getFirestore();
  const docRef = doc(db, `events/${eventId}/categoryAssignments`, userId);
  await runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(docRef);
    let categories: string[] = [];
    if (docSnap.exists()) {
      categories = docSnap.data()?.categories || [];
      if (categories.includes(newCategory)) {
        throw new Error("Category already assigned");
      }
    }
    categories.push(newCategory);
    transaction.set(docRef, { userId, categories });
  });
}

// 9. Remove category from user assignment
export async function removeCategoryFromUser(eventId: string, userId: string, removeCategory: string) {
  const db = getFirestore();
  const docRef = doc(db, `events/${eventId}/categoryAssignments`, userId);
  await runTransaction(db, async (transaction) => {
    const docSnap = await transaction.get(docRef);
    if (!docSnap.exists) return;
    let categories: string[] = docSnap.data()?.categories || [];
    categories = categories.filter((c) => c !== removeCategory);
    if (categories.length === 0) {
      transaction.delete(docRef);
    } else {
      transaction.update(docRef, { categories });
    }
  });
}

// 10. Get assigned user for a single category (single-user-per-category model)
export async function getUserForCategory(eventId: string, categoryId: string) {
  const db = getFirestore();
  const docSnap = await getDoc(doc(db, `events/${eventId}/categories`, categoryId));
  if (docSnap.exists()) {
    return docSnap.data()?.assignedUserId || null;
  }
  return null;
}

// 11. Set or reassign a user for a category (single-user-per-category model)
export async function assignUserToCategory(eventId: string, categoryId: string, userId: string | null) {
  const db = getFirestore();
  const docRef = doc(db, `events/${eventId}/categories`, categoryId);
  await setDoc(docRef, { assignedUserId: userId }, { merge: true });
}

// 12. Add reaction to a message
export async function addReaction(conversationId: string, messageId: string, emoji: string, userId: string) {
  const db = getFirestore();
  const messageRef = doc(db, `conversations/${conversationId}/messages`, messageId);
  await runTransaction(db, async (transaction) => {
    const msgSnap = await transaction.get(messageRef);
    if (!msgSnap.exists) throw new Error("Message not found");
    const reactions = msgSnap.data()?.reactions || {};
    const users = reactions[emoji] || [];
    if (!users.includes(userId)) {
      reactions[emoji] = [...users, userId];
      transaction.update(messageRef, { reactions });
    }
  });
}

// 13. Remove reaction from a message
export async function removeReaction(conversationId: string, messageId: string, emoji: string, userId: string) {
  const db = getFirestore();
  const messageRef = doc(db, `conversations/${conversationId}/messages`, messageId);
  await runTransaction(db, async (transaction) => {
    const msgSnap = await transaction.get(messageRef);
    if (!msgSnap.exists) throw new Error("Message not found");
    const reactions = msgSnap.data()?.reactions || {};
    const users = reactions[emoji] || [];
    if (users.includes(userId)) {
      reactions[emoji] = users.filter((u: string) => u !== userId);
      if (reactions[emoji].length === 0) {
        delete reactions[emoji];
      }
      transaction.update(messageRef, { reactions });
    }
  });
}

// Get a single event by ID
export async function getEvent(eventId: string) {
  const db = getFirestore();
  const eventDoc = await getDoc(doc(db, 'events', eventId));

  if (!eventDoc.exists()) {
    console.log('Event doc doesnt exist-------->');
    return null;
  }

  const eventData = eventDoc.data()!;
  console.log('eventDoc.data() eventData---------->', eventData);
  // Convert Firestore Timestamp → JS Date
  const startDate: Date | null = eventData.startDate
    ? (eventData.startDate as FirebaseFirestoreTypes.Timestamp).toDate()
    : null;
  const endDate: Date | null = eventData.endDate
    ? (eventData.endDate as FirebaseFirestoreTypes.Timestamp).toDate()
    : null;

  // Get venue details if venueId exists
  let fullVenue = null;
  if (eventData.venueId) {
    const venueRef = eventData.venueId as FirebaseFirestoreTypes.DocumentReference;
    fullVenue = await getVenueById(venueRef.id);
  }

  const builtResponse = {
    eventId: eventDoc.id,
    eventName: eventData.eventName,
    ownerId: (eventData.ownerId as FirebaseFirestoreTypes.DocumentReference).id,
    venueId: eventData.venueId ? (eventData.venueId as FirebaseFirestoreTypes.DocumentReference).id : null,
    startDate,
    endDate,
    venue: fullVenue,
  };
  console.log('builtResponse---------->', builtResponse);
  return builtResponse
}

// Create a new event
export async function createEvent(eventData: {
  eventName: string;
  startDate: string;
  endDate: string;
  venueName?: string | null;
  address?: string | null;
  venuePhone?: string | null;
}, ownerId: string) {
  const db = getFirestore();
  const groupCode = generateGroupCode();

  // Create venue if venue data provided
  let venueRef = null;
  if (eventData.venueName) {
    venueRef = doc(collection(db, 'venues'));
    await setDoc(venueRef, {
      name: eventData.venueName,
      address: eventData.address || null,
      phone: eventData.venuePhone || null,
    });
  }

  // Create the event
  const newEventRef = doc(collection(db, 'events'));
  const ownerRef = doc(db, 'users', ownerId);

  const newEvent = {
    eventName: eventData.eventName,
    ownerId: ownerRef,
    venueId: venueRef,
    startDate: new Date(eventData.startDate),
    endDate: new Date(eventData.endDate),
    groupCode,
    isArchived: false,
    createdAt: serverTimestamp()
  };

  await setDoc(newEventRef, newEvent);

  // Add default vendor categories
  const categoriesPromises = DEFAULT_VENDOR_CATEGORIES.map(name => {
    const categoryRef = doc(collection(db, `events/${newEventRef.id}/categories`));
    return setDoc(categoryRef, { name });
  });

  await Promise.all(categoriesPromises);

  // Add the creator as a member
  const memberRef = doc(collection(db, `events/${newEventRef.id}/members`));
  await setDoc(memberRef, {
    userId: ownerId,
    role: 'planner',
    joinedAt: serverTimestamp()
  });

  // Create conversation for the event automatically
  const conversationRef = doc(collection(db, 'conversations'));
  await setDoc(conversationRef, {
    eventId: newEventRef.id,
    type: 'event',
    createdAt: serverTimestamp(),
    participantCount: 1 // Start with the creator
  });

  return newEventRef.id;
}

// Join an event with a group code
export async function joinEventWithCode(groupCode: string, userId: string) {
  const db = getFirestore();

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
  const eventId = eventDoc.id;

  // Check if already a member
  const memberQuery = query(
    collection(db, `events/${eventId}/members`),
    where('userId', '==', userId)
  );

  const memberSnapshot = await getDocs(memberQuery);

  if (!memberSnapshot.empty) {
    throw new Error('You are already a member of this event');
  }

  // Add as a member
  const memberRef = doc(collection(db, `events/${eventId}/members`));
  await setDoc(memberRef, {
    userId,
    role: 'member',
    joinedAt: serverTimestamp()
  });

  return eventId;
}

// Get or create a conversation for an event
export async function getOrCreateEventConversation(eventId: string) {
  const db = getFirestore();
  
  // Check if conversation already exists for this event
  const conversationsQuery = query(
    collection(db, 'conversations'),
    where('eventId', '==', eventId),
    where('type', '==', 'event')
  );
  
  const conversationSnapshot = await getDocs(conversationsQuery);
  
  if (!conversationSnapshot.empty) {
    // Return existing conversation
    const conversationDoc = conversationSnapshot.docs[0];
    return {
      conversationId: conversationDoc.id,
      ...conversationDoc.data()
    };
  }
  
  // Create new conversation for the event
  const newConversationRef = doc(collection(db, 'conversations'));
  const conversationData = {
    eventId,
    type: 'event',
    createdAt: serverTimestamp(),
    participantCount: 0
  };
  
  await setDoc(newConversationRef, conversationData);

  // Add a welcome message to get the conversation started
  const welcomeMessageRef = doc(collection(db, `conversations/${newConversationRef.id}/messages`));
  await setDoc(welcomeMessageRef, {
    authorId: 'system',
    body: '🎉 Welcome to your event chat! Use this space to coordinate with vendors, share updates, and ask questions.',
    parentMessageId: null,
    reactions: {},
    mentions: [],
    createdAt: serverTimestamp()
  });
  
  return {
    conversationId: newConversationRef.id,
    ...conversationData
  };
}

// Send a message to a conversation
export async function sendMessageToConversation(
  conversationId: string,
  authorId: string,
  body: string,
  parentMessageId: string | null = null
) {
  const db = getFirestore();
  
  // Extract mentions from the message body
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  while ((match = mentionRegex.exec(body)) !== null) {
    mentions.push(match[1]);
  }

  // Create a new message document
  const messageRef = doc(collection(db, `conversations/${conversationId}/messages`));
  const messageData = {
    authorId,
    body,
    parentMessageId,
    reactions: {},
    mentions: mentions,
    createdAt: serverTimestamp()
  };

  await setDoc(messageRef, messageData);

  return {
    messageId: messageRef.id,
    ...messageData
  };
}
