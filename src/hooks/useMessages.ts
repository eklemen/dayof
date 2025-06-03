import { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, orderBy, onSnapshot, doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp } from '@react-native-firebase/firestore';

export function useMessages(eventId?: string, parentMessageId: string | null = null) {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!eventId) return;

    const db = getFirestore();

    // Create consistent query between subscription and fetch
    const messagesQuery = query(
      collection(db, 'messages'),
      where('eventId', '==', eventId),
      where('parentMessageId', '==', parentMessageId),
      orderBy('createdAt', 'desc')
    );

    // Set up the snapshot listener
    const unsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
      setLoading(true);
      try {
        // Process the messages directly from the snapshot
        const messagesWithAuthors = await Promise.all(
          snapshot.docs.map(async (messageDoc) => {
            const messageData = messageDoc.data();
            console.log('messageData---------->', messageData);
            const authorDoc = await getDoc(doc(db, 'users', messageData.authorId));
            console.log('authorDoc---------->', authorDoc);

            return {
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
          })
        );

        console.log('messagesWithAuthors---------->', messagesWithAuthors);
        setMessages(messagesWithAuthors);
      } catch (error) {
        console.error('Error processing messages:', error);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error('Error in messages subscription:', error);
      setLoading(false);
    });

    // Clean up subscription
    return () => unsubscribe();
  }, [eventId, parentMessageId]);

  const sendMessage = async (
    eventId: string,
    authorId: string,
    body: string,
    parentMessageId: string | null = null
  ) => {
    try {
      const mentionRegex = /@(\w+)/g;
      const mentions = [];
      let match;
      while ((match = mentionRegex.exec(body)) !== null) {
        mentions.push(match[1]);
      }

      const db = getFirestore();
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

      const authorDoc = await getDoc(doc(db, 'users', authorId));

      const newMessage: Message = {
        messageId: messageRef.id,
        ...messageData,
        createdAt: new Date().toISOString(),
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
      const db = getFirestore();
      const messageRef = doc(db, 'messages', messageId);
      const messageDoc = await getDoc(messageRef);

      if (!messageDoc.exists()) {
        throw new Error('Message not found');
      }

      const messageData = messageDoc.data();
      const currentReactions = messageData.reactions || {};
      const emojiUsers = currentReactions[emoji] || [];

      if (!emojiUsers.includes(userId)) {
        const updatedReactions = {
          ...currentReactions,
          [emoji]: [...emojiUsers, userId]
        };

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

  return {
    messages,
    loading,
    sendMessage,
    addReaction,
  };
}
