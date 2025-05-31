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
  onSnapshot,
  Timestamp,
  serverTimestamp
} from '@/src/lib/firebase';
import { Message } from '@/src/models/Message';

export function useMessages(eventId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      fetchMessages(eventId);
      subscribeToMessages(eventId);
    }

    return () => {
      if (eventId) {
        unsubscribeFromMessages();
      }
    };
  }, [eventId]);

  const fetchMessages = async (eventId: string, parentMessageId: string | null = null) => {
    try {
      setLoading(true);

      // Create query based on whether we're fetching top-level messages or replies
      let messagesQuery;
      if (parentMessageId === null) {
        messagesQuery = query(
          collection(db, 'messages'),
          where('eventId', '==', eventId),
          where('parentMessageId', '==', null),
          orderBy('createdAt', 'desc')
        );
      } else {
        messagesQuery = query(
          collection(db, 'messages'),
          where('eventId', '==', eventId),
          where('parentMessageId', '==', parentMessageId),
          orderBy('createdAt', 'desc')
        );
      }

      const messagesSnapshot = await getDocs(messagesQuery);

      if (messagesSnapshot.empty) {
        setMessages([]);
        return [];
      }

      // Get messages with author details
      const messagesWithAuthors = await Promise.all(
        messagesSnapshot.docs.map(async (messageDoc) => {
          const messageData = messageDoc.data();
          const authorDoc = await getDoc(doc(db, 'users', messageData.authorId));

          const message: Message = {
            messageId: messageDoc.id,
            authorId: messageData.authorId,
            body: messageData.body,
            createdAt: messageData.createdAt instanceof Timestamp
              ? messageData.createdAt.toDate().toISOString()
              : messageData.createdAt,
            parentMessageId: messageData.parentMessageId,
            reactions: messageData.reactions || {},
            mentions: messageData.mentions || [],
            author: authorDoc.exists() ? {
              id: authorDoc.id,
              displayName: authorDoc.data().displayName,
              instagramHandle: authorDoc.data().instagramHandle
            } : undefined
          };

          return message;
        })
      );

      setMessages(messagesWithAuthors);
      return messagesWithAuthors;
    } catch (error) {
      console.error('Error in fetchMessages:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (
    eventId: string,
    authorId: string,
    body: string,
    parentMessageId: string | null = null
  ) => {
    try {
      // Extract mentions from the message body (e.g., @username)
      const mentionRegex = /@(\w+)/g;
      const mentions = [];
      let match;
      while ((match = mentionRegex.exec(body)) !== null) {
        mentions.push(match[1]);
      }

      // Create a new message document
      const messageRef = doc(collection(db, 'messages'));
      const messageData = {
        eventId,
        authorId,
        body,
        parentMessageId,
        reactions: {},
        mentions: mentions,
        createdAt: serverTimestamp()
      };

      await setDoc(messageRef, messageData);

      // Get the author details
      const authorDoc = await getDoc(doc(db, 'users', authorId));

      const newMessage: Message = {
        messageId: messageRef.id,
        ...messageData,
        createdAt: new Date().toISOString(), // Use current time until server timestamp is available
        author: authorDoc.exists() ? {
          id: authorDoc.id,
          displayName: authorDoc.data().displayName,
          instagramHandle: authorDoc.data().instagramHandle
        } : undefined
      };

      return { success: true, data: [newMessage], error: null };
    } catch (error: any) {
      console.error('Error sending message:', error);
      return { success: false, data: null, error: error.message };
    }
  };

  const addReaction = async (messageId: string, emoji: string, userId: string) => {
    try {
      // Get the message document
      const messageRef = doc(db, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);

      if (!messageDoc.exists()) {
        throw new Error('Message not found');
      }

      // Get current reactions
      const messageData = messageDoc.data();
      const currentReactions = messageData.reactions || {};

      // Update reactions - in our new model, we store user IDs who reacted with each emoji
      const emojiUsers = currentReactions[emoji] || [];

      // Only add the user if they haven't already reacted with this emoji
      if (!emojiUsers.includes(userId)) {
        const updatedReactions = {
          ...currentReactions,
          [emoji]: [...emojiUsers, userId]
        };

        // Update the message document
        await updateDoc(messageRef, {
          reactions: updatedReactions
        });
      }

      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error adding reaction:', error);
      return { success: false, error: error.message };
    }
  };

  // Realtime subscriptions
  let unsubscribeListener: (() => void) | null = null;

  const subscribeToMessages = (eventId: string) => {
    // Create a query for messages in this event
    const messagesQuery = query(
      collection(db, 'messages'),
      where('eventId', '==', eventId)
    );

    // Set up the snapshot listener
    unsubscribeListener = onSnapshot(messagesQuery, (snapshot) => {
      console.log('Messages changed, refreshing...');
      fetchMessages(eventId);
    }, (error) => {
      console.error('Error in messages subscription:', error);
    });

    return unsubscribeListener;
  };

  const unsubscribeFromMessages = () => {
    if (unsubscribeListener) {
      unsubscribeListener();
      unsubscribeListener = null;
    }
  };

  return {
    messages,
    loading,
    fetchMessages,
    sendMessage,
    addReaction,
  };
}
