import { firestore } from '@/src/lib/firebase';
import type { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// Helper function to get venue details by ID
async function getVenueById(venueId: string) {
  if (!venueId) return null;
  const venueDoc = await firestore().collection("venues").doc(venueId).get();
  if (venueDoc.exists()) {
    return { id: venueDoc.id, ...venueDoc.data() };
  } else {
    return null;
  }
}

// 1. Get all events for a user (via membership)
export async function getEventsForUser(userId: string) {
  // 1. Find all the membership documents for this user
  const q = firestore()
    .collectionGroup('members')
    .where('userId', '==', userId);

  const snapshot = await q.get();
  const eventIds = snapshot.docs
    .map((docSnap) => docSnap.ref.parent.parent?.id)
    .filter(Boolean) as string[];

  if (eventIds.length === 0) return [];

  // 2. Fetch each event and its venue details
  const eventPromises = eventIds.map(async (eventId) => {
    const eventDocSnap = await firestore()
      .collection('events')
      .doc(eventId)
      .get();

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
      id: eventDocSnap.id,
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
  const snapshot = await firestore().collection(`events/${eventId}/members`).get();
  return snapshot.docs.map((doc) => doc.data());
}

// 3. Get all messages in a conversation, root messages only (threadId == null)
export async function getRootMessages(conversationId: string) {
  const snapshot = await firestore()
    .collection(`conversations/${conversationId}/messages`)
    .where("parentMessageId", "==", null)
    .orderBy("createdAt", "asc")
    .get();
  return snapshot.docs.map((doc) => doc.data());
}

// 4. Get replies to a message (thread)
export async function getThreadReplies(conversationId: string, rootMessageId: string) {
  const snapshot = await firestore()
    .collection(`conversations/${conversationId}/messages`)
    .where("parentMessageId", "==", rootMessageId)
    .orderBy("createdAt", "asc")
    .get();
  return snapshot.docs.map((doc) => doc.data());
}

// 5. Get all categories for an event
export async function getCategoriesForEvent(eventId: string) {
  const snapshot = await firestore().collection(`events/${eventId}/categories`).get();
  return snapshot.docs.map((doc) => doc.data());
}

// 6. Get category assignments (all users assigned to a category) - when multiple categories per user allowed
export async function getUsersByCategory(eventId: string, categoryName: string) {
  const snapshot = await firestore()
    .collection(`events/${eventId}/categoryAssignments`)
    .where("categories", "array-contains", categoryName)
    .get();
  return snapshot.docs.map((doc) => doc.data());
}

// 7. Get categories assigned to a user for an event
export async function getCategoriesForUser(eventId: string, userId: string) {
  const docSnap = await firestore().collection(`events/${eventId}/categoryAssignments`).doc(userId).get();
  if (docSnap.exists()) {
    return docSnap.data()?.categories || [];
  }
  return [];
}

// 8. Assign category to user (transaction ensuring no duplicate category in array)
export async function assignCategoryToUser(eventId: string, userId: string, newCategory: string) {
  const docRef = firestore().collection(`events/${eventId}/categoryAssignments`).doc(userId);
  await firestore().runTransaction(async (transaction) => {
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
  const docRef = firestore().collection(`events/${eventId}/categoryAssignments`).doc(userId);
  await firestore().runTransaction(async (transaction) => {
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
  const docSnap = await firestore().collection(`events/${eventId}/categories`).doc(categoryId).get();
  if (docSnap.exists()) {
    return docSnap.data()?.assignedUserId || null;
  }
  return null;
}

// 11. Set or reassign a user for a category (single-user-per-category model)
export async function assignUserToCategory(eventId: string, categoryId: string, userId: string | null) {
  const docRef = firestore().collection(`events/${eventId}/categories`).doc(categoryId);
  await docRef.set({ assignedUserId: userId }, { merge: true });
}

// 12. Add reaction to a message
export async function addReaction(conversationId: string, messageId: string, emoji: string, userId: string) {
  const messageRef = firestore().collection(`conversations/${conversationId}/messages`).doc(messageId);
  await firestore().runTransaction(async (transaction) => {
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
  const messageRef = firestore().collection(`conversations/${conversationId}/messages`).doc(messageId);
  await firestore().runTransaction(async (transaction) => {
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
