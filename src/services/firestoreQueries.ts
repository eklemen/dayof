import {
  collection,
  collectionGroup,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  runTransaction,
  setDoc,
  updateDoc,
  deleteDoc,
  orderBy,
} from "firebase/firestore";
import { firestore } from '@/src/lib/firebase';

// 1. Get all events for a user (via membership)
export async function getEventsForUser(userId: string) {
  const q = query(
    collectionGroup(firestore, "members"),
    where("userId", "==", userId)
  );

  const snapshot = await getDocs(q);
  const eventIds = snapshot.docs.map((doc) => doc.ref.parent.parent?.id);
  const filteredEventIds = eventIds.filter(Boolean) as string[];

  // If no events found, return empty array
  if (filteredEventIds.length === 0) {
    return [];
  }

  // Fetch the complete event objects using the event IDs
  const eventPromises = filteredEventIds.map(async (eventId) => {
    const eventDoc = await getDoc(doc(firestore, 'events', eventId));
    if (eventDoc.exists()) {
      return {
        id: eventDoc.id,
        ...eventDoc.data()
      };
    }
    return null;
  });

  const events = await Promise.all(eventPromises);

  // Filter out any null values (events that might have been deleted)
  return events.filter(Boolean);
}

// 2. Get all users in a room/event
export async function getUsersInEvent(eventId: string) {
  const membersCol = collection(firestore, `events/${eventId}/members`);
  const snapshot = await getDocs(membersCol);
  return snapshot.docs.map((doc) => doc.data());
}

// 3. Get all messages in a conversation, root messages only (threadId == null)
export async function getRootMessages(conversationId: string) {
  const messagesCol = collection(firestore, `conversations/${conversationId}/messages`);
  const q = query(messagesCol, where("parentMessageId", "==", null), orderBy("createdAt", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data());
}

// 4. Get replies to a message (thread)
export async function getThreadReplies(conversationId: string, rootMessageId: string) {
  const messagesCol = collection(firestore, `conversations/${conversationId}/messages`);
  const q = query(messagesCol, where("parentMessageId", "==", rootMessageId), orderBy("createdAt", "asc"));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data());
}

// 5. Get all categories for an event
export async function getCategoriesForEvent(eventId: string) {
  const categoriesCol = collection(firestore, `events/${eventId}/categories`);
  const snapshot = await getDocs(categoriesCol);
  return snapshot.docs.map((doc) => doc.data());
}

// 6. Get category assignments (all users assigned to a category) - when multiple categories per user allowed
export async function getUsersByCategory(eventId: string, categoryName: string) {
  const assignmentsCol = collection(firestore, `events/${eventId}/categoryAssignments`);
  const q = query(assignmentsCol, where("categories", "array-contains", categoryName));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => doc.data());
}

// 7. Get categories assigned to a user for an event
export async function getCategoriesForUser(eventId: string, userId: string) {
  const docRef = doc(firestore, `events/${eventId}/categoryAssignments/${userId}`);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data()?.categories || [];
  }
  return [];
}

// 8. Assign category to user (transaction ensuring no duplicate category in array)
export async function assignCategoryToUser(eventId: string, userId: string, newCategory: string) {
  const docRef = doc(firestore, `events/${eventId}/categoryAssignments/${userId}`);
  await runTransaction(firestore, async (transaction) => {
    const docSnap = await transaction.get(docRef);
    let categories: string[] = [];
    if (docSnap.exists()) {
      categories = docSnap.data().categories || [];
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
  const docRef = doc(firestore, `events/${eventId}/categoryAssignments/${userId}`);
  await runTransaction(firestore, async (transaction) => {
    const docSnap = await transaction.get(docRef);
    if (!docSnap.exists()) return;
    let categories: string[] = docSnap.data().categories || [];
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
  const docRef = doc(firestore, `events/${eventId}/categories/${categoryId}`);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    return docSnap.data()?.assignedUserId || null;
  }
  return null;
}

// 11. Set or reassign a user for a category (single-user-per-category model)
export async function assignUserToCategory(eventId: string, categoryId: string, userId: string | null) {
  const docRef = doc(firestore, `events/${eventId}/categories/${categoryId}`);
  await setDoc(docRef, { assignedUserId: userId }, { merge: true });
}

// 12. Add reaction to a message
export async function addReaction(conversationId: string, messageId: string, emoji: string, userId: string) {
  const messageRef = doc(firestore, `conversations/${conversationId}/messages/${messageId}`);
  await runTransaction(firestore, async (transaction) => {
    const msgSnap = await transaction.get(messageRef);
    if (!msgSnap.exists()) throw new Error("Message not found");
    const reactions = msgSnap.data().reactions || {};
    const users = reactions[emoji] || [];
    if (!users.includes(userId)) {
      reactions[emoji] = [...users, userId];
      transaction.update(messageRef, { reactions });
    }
  });
}

// 13. Remove reaction from a message
export async function removeReaction(conversationId: string, messageId: string, emoji: string, userId: string) {
  const messageRef = doc(firestore, `conversations/${conversationId}/messages/${messageId}`);
  await runTransaction(firestore, async (transaction) => {
    const msgSnap = await transaction.get(messageRef);
    if (!msgSnap.exists()) throw new Error("Message not found");
    const reactions = msgSnap.data().reactions || {};
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
