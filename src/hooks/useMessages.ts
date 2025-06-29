import { useState, useEffect, useMemo, useRef } from 'react';
import { getFirestore, collection, query, where, orderBy, onSnapshot, doc, getDoc, getDocs, Timestamp, updateDoc } from '@react-native-firebase/firestore';
import { getOrCreateEventConversation, sendMessageToConversation, addReaction as addReactionToMessage } from '@/src/services/firestoreQueries';
import { Message } from '@/src/models/Message';
import { useGetUsers } from '@/src/services/service-hooks/useGetUsers';
import { useThreadReplyCounts } from './useThreadReplyCounts';

// React Query now handles user caching, so we don't need manual cache

export function useMessages(eventId?: string, parentMessageId: string | null = null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [rawMessages, setRawMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Extract unique author IDs from raw messages
  const authorIds = useMemo(() => {
    const ids = new Set<string>();
    rawMessages.forEach((msg) => {
      if (msg.authorId) {
        ids.add(msg.authorId);
      }
    });
    return Array.from(ids).sort(); // Sort for stable reference
  }, [rawMessages]);

  // Use React Query to fetch user data
  const userQueries = useGetUsers(authorIds);

  // Get thread reply counts for root messages only
  const rootMessageIds = useMemo(() => {
    if (parentMessageId !== null) return []; // Don't get reply counts for thread messages
    return rawMessages.map(msg => msg.messageId);
  }, [rawMessages, parentMessageId]);

  const { replyCounts } = useThreadReplyCounts(conversationId || '', rootMessageIds);
  
  // Debug logging
  useEffect(() => {
    if (replyCounts.size > 0) {
      console.log('useMessages reply counts:', Array.from(replyCounts.entries()));
    }
  }, [replyCounts]);

  // Use ref to track when to update messages
  const prevRawMessagesRef = useRef<any[]>([]);
  const prevUserDataRef = useRef<string>('');
  const prevReplyCountsRef = useRef<string>('');

  // Process messages whenever raw messages or user data changes
  useEffect(() => {
    // Create users map from current query state
    const usersMap = new Map<string, any>();
    userQueries.forEach((query, index) => {
      const userId = authorIds[index];
      if (query.data) {
        usersMap.set(userId, query.data);
      }
    });

    // Create a signature of current user data and reply counts
    const currentUserDataSignature = JSON.stringify(
      Array.from(usersMap.entries()).sort()
    );
    const currentReplyCountsSignature = JSON.stringify(
      Array.from(replyCounts.entries()).sort()
    );

    // Check if we should update (messages, user data, or reply counts changed)
    const messagesChanged = JSON.stringify(rawMessages) !== JSON.stringify(prevRawMessagesRef.current);
    const userDataChanged = currentUserDataSignature !== prevUserDataRef.current;
    const replyCountsChanged = currentReplyCountsSignature !== prevReplyCountsRef.current;

    if (!messagesChanged && !userDataChanged && !replyCountsChanged) {
      return; // No changes, skip update
    }

    // Update refs
    prevRawMessagesRef.current = rawMessages;
    prevUserDataRef.current = currentUserDataSignature;
    prevReplyCountsRef.current = currentReplyCountsSignature;

    if (rawMessages.length === 0) {
      setMessages([]);
      return;
    }

    // Check if all user queries are finished loading
    const allUsersLoaded = userQueries.every(query => !query.isLoading);

    if (!allUsersLoaded && authorIds.length > 0) {
      // Still loading users, don't update messages yet
      return;
    }

    // Combine messages with user data and reply counts
    const messagesWithAuthors = rawMessages.map((messageData) => {
      const author = usersMap.get(messageData.authorId);
      const replyCount = replyCounts.get(messageData.messageId) || 0;

      const message: Message = {
        messageId: messageData.messageId,
        authorId: messageData.authorId,
        body: messageData.body,
        createdAt: messageData.createdAt instanceof Timestamp
          ? messageData.createdAt.toDate().toISOString()
          : messageData.createdAt,
        parentMessageId: messageData.parentMessageId,
        reactions: messageData.reactions || {},
        mentions: messageData.mentions || [],
        author: author,
        replyCount: parentMessageId === null ? replyCount : undefined // Only include for root messages
      };

      return message;
    });

    setMessages(messagesWithAuthors);
  }); // No dependency array - runs on every render but with internal change detection

  useEffect(() => {
    if (!eventId) {
      console.log('useMessages: No eventId provided, returning early');
      return;
    }

    let unsubscribe: (() => void) | null = null;

    const initializeConversation = async () => {
      try {
        setLoading(true);

        // Get or create conversation for this event
        const conversation = await getOrCreateEventConversation(eventId);
        setConversationId(conversation.conversationId);

        const db = getFirestore();

        // Create query for messages in the conversation
        const messagesQuery = query(
          collection(db, `conversations/${conversation.conversationId}/messages`),
          where('parentMessageId', '==', parentMessageId),
          orderBy('createdAt', 'desc') // Show messages in chronological order
        );


        // Set up real-time listener for messages only
        unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
          try {

            // Store raw message data - React Query will handle user fetching
            const rawMessageData = snapshot.docs.map((messageDoc) => {
              const data = messageDoc.data();
              return {
                messageId: messageDoc.id,
                authorId: data.authorId,
                body: data.body,
                createdAt: data.createdAt,
                parentMessageId: data.parentMessageId,
                reactions: data.reactions || {},
                mentions: data.mentions || []
              };
            });

            setRawMessages(rawMessageData);
          } catch (error) {
            console.error('Error processing messages:', error);
          } finally {
            setLoading(false);
          }
        }, (error) => {
          console.error('Error in messages subscription:', error);
          setLoading(false);
        });

      } catch (error) {
        console.error('Error initializing conversation:', error);
        setLoading(false);
      }
    };

    initializeConversation();

    // Clean up subscription
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [eventId, parentMessageId]);

  const sendMessage = async (
    eventId: string,
    authorId: string,
    body: string,
    parentMessageId: string | null = null
  ) => {
    try {
      if (!conversationId) {
        // If conversationId is not set, try to get/create it
        const conversation = await getOrCreateEventConversation(eventId);
        setConversationId(conversation.conversationId);

        // Use the conversation ID directly for this send operation
        const messageResult = await sendMessageToConversation(
          conversation.conversationId,
          authorId,
          body,
          parentMessageId
        );

        const authorDoc = await getDoc(doc(getFirestore(), 'users', authorId));

        const newMessage: Message = {
          messageId: messageResult.messageId,
          authorId,
          body,
          parentMessageId,
          reactions: {},
          mentions: messageResult.mentions || [],
          createdAt: new Date().toISOString(),
          author: authorDoc.exists() ? {
            id: authorDoc.id,
            displayName: authorDoc.data()?.displayName,
            instagramHandle: authorDoc.data()?.instagramHandle
          } : undefined
        };

        return { success: true, data: [newMessage], error: null };
      }

      const messageResult = await sendMessageToConversation(
        conversationId,
        authorId,
        body,
        parentMessageId
      );

      const authorDoc = await getDoc(doc(getFirestore(), 'users', authorId));

      const newMessage: Message = {
        messageId: messageResult.messageId,
        authorId,
        body,
        parentMessageId,
        reactions: {},
        mentions: messageResult.mentions || [],
        createdAt: new Date().toISOString(),
        author: authorDoc.exists() ? {
          id: authorDoc.id,
          displayName: authorDoc.data()?.displayName,
          instagramHandle: authorDoc.data()?.instagramHandle
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
      if (!conversationId) {
        throw new Error('Conversation not initialized');
      }

      await addReactionToMessage(conversationId, messageId, emoji, userId);
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
