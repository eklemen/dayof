import { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, orderBy, onSnapshot, doc, getDoc, Timestamp, updateDoc } from '@react-native-firebase/firestore';
import { getOrCreateEventConversation, sendMessageToConversation, addReaction as addReactionToMessage } from '@/src/services/firestoreQueries';
import { Message } from '@/src/models/Message';

export function useMessages(eventId?: string, parentMessageId: string | null = null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);

  console.log('useMessages called with eventId---------->', eventId);
  console.log('useMessages called with parentMessageId---------->', parentMessageId);

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
        console.log('conversation---------->', conversation);
        setConversationId(conversation.conversationId);

        const db = getFirestore();

        // Create query for messages in the conversation
        const messagesQuery = query(
          collection(db, `conversations/${conversation.conversationId}/messages`),
          where('parentMessageId', '==', parentMessageId),
          orderBy('createdAt', 'asc') // Show messages in chronological order
        );
        
        console.log('messagesQuery path---------->', `conversations/${conversation.conversationId}/messages`);
        console.log('parentMessageId filter---------->', parentMessageId);

        // Set up real-time listener
        unsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
          try {
            console.log('snapshot.docs.length---------->', snapshot.docs.length);
            console.log('snapshot.docs---------->', snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() })));
            
            // Process the messages directly from the snapshot
            const messagesWithAuthors = await Promise.all(
              snapshot.docs.map(async (messageDoc) => {
                const messageData = messageDoc.data();
                console.log('messageData---------->', messageData);
                const authorDoc = await getDoc(doc(db, 'users', messageData.authorId));

                console.log('authorDoc.data()---------->', authorDoc.data());
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
                    displayName: authorDoc.data()?.displayName,
                    instagramHandle: authorDoc.data()?.instagramHandle
                  } : undefined
                };

                return message;
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
        throw new Error('Conversation not initialized');
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
