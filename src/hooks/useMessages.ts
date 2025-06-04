import { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, orderBy, onSnapshot, doc, getDoc, getDocs, Timestamp, updateDoc } from '@react-native-firebase/firestore';
import { getOrCreateEventConversation, sendMessageToConversation, addReaction as addReactionToMessage } from '@/src/services/firestoreQueries';
import { Message } from '@/src/models/Message';

// Cache for user data to avoid refetching on every message update
const usersCache = new Map<string, Map<string, any>>();

export function useMessages(eventId?: string, parentMessageId: string | null = null) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [conversationId, setConversationId] = useState<string | null>(null);


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
        console.log('conversationId set to---------->', conversation.conversationId);

        const db = getFirestore();

        // Create query for messages in the conversation
        const messagesQuery = query(
          collection(db, `conversations/${conversation.conversationId}/messages`),
          where('parentMessageId', '==', parentMessageId),
          orderBy('createdAt', 'desc') // Show messages in chronological order
        );


        // Set up real-time listener
        unsubscribe = onSnapshot(messagesQuery, async (snapshot) => {
          try {
            console.log('snapshot.docs.length---------->', snapshot.docs.length);

            // Extract unique author IDs from messages
            const authorIds = new Set<string>();
            snapshot.docs.forEach((messageDoc) => {
              const messageData = messageDoc.data();
              if (messageData.authorId && messageData.authorId !== 'system') {
                authorIds.add(messageData.authorId);
              }
            });

            // Fetch all event members and create a user map for efficient lookups
            const usersMap = new Map<string, any>();
            
            // Add system user
            usersMap.set('system', {
              id: 'system',
              displayName: 'System',
              instagramHandle: undefined
            });

            // Fetch event members if we have author IDs to fetch
            if (authorIds.size > 0) {
              console.log('Fetching users for authorIds---------->', Array.from(authorIds));
              
              // Check cache first
              const cacheKey = eventId;
              let cachedUsers = usersCache.get(cacheKey);
              
              if (cachedUsers) {
                console.log('Using cached users for event---------->', cacheKey);
                // Add cached users to the map
                cachedUsers.forEach((userData, userId) => {
                  usersMap.set(userId, userData);
                });
                
                // Check if we need to fetch any new users not in cache
                const uncachedAuthorIds = Array.from(authorIds).filter(authorId => 
                  !cachedUsers.has(authorId)
                );
                
                if (uncachedAuthorIds.length === 0) {
                  console.log('All users found in cache, skipping fetch');
                } else {
                  console.log('Some users not in cache, fetching:', uncachedAuthorIds);
                  // We'll fetch only the missing users below
                  authorIds.clear();
                  uncachedAuthorIds.forEach(id => authorIds.add(id));
                }
              }
              
              // Only fetch if we have uncached users or no cache exists
              if (authorIds.size > 0) {
                console.log('Fetching users from Firestore---------->', Array.from(authorIds));
                
                // Strategy 1: Try to get event members first (more efficient)
                try {
                const eventMembersQuery = query(collection(db, `events/${eventId}/members`));
                const membersSnapshot = await getDocs(eventMembersQuery);
                
                // Create a set of member user IDs for faster lookups
                const memberUserIds = new Set<string>();
                membersSnapshot.docs.forEach((memberDoc) => {
                  const memberData = memberDoc.data();
                  if (memberData.userId) {
                    memberUserIds.add(memberData.userId);
                  }
                });

                console.log('Event members found---------->', Array.from(memberUserIds));

                // Only fetch users that are both message authors AND event members
                const relevantUserIds = Array.from(authorIds).filter(authorId => 
                  memberUserIds.has(authorId)
                );

                console.log('Relevant user IDs (authors + members)---------->', relevantUserIds);

                // Fetch user data for relevant users in parallel
                const userFetches = relevantUserIds.map(async (authorId) => {
                  try {
                    const userDoc = await getDoc(doc(db, 'users', authorId));
                    if (userDoc.exists()) {
                      return {
                        id: userDoc.id,
                        data: userDoc.data()
                      };
                    }
                    return null;
                  } catch (error) {
                    console.error(`Error fetching user ${authorId}:`, error);
                    return null;
                  }
                });

                const userResults = await Promise.all(userFetches);
                
                // Populate the users map
                userResults.forEach((result) => {
                  if (result) {
                    usersMap.set(result.id, {
                      id: result.id,
                      displayName: result.data?.displayName,
                      instagramHandle: result.data?.instagramHandle,
                      photoURL: result.data?.photoURL
                    });
                  }
                });

                // For any author IDs not found in event members, add them with minimal data
                authorIds.forEach((authorId) => {
                  if (!usersMap.has(authorId)) {
                    usersMap.set(authorId, {
                      id: authorId,
                      displayName: 'Unknown User',
                      instagramHandle: undefined,
                      photoURL: undefined
                    });
                  }
                });

              } catch (error) {
                console.error('Error fetching event members, falling back to individual user fetches:', error);
                
                // Fallback: Fetch all users individually
                const userFetches = Array.from(authorIds).map(async (authorId) => {
                  try {
                    const userDoc = await getDoc(doc(db, 'users', authorId));
                    if (userDoc.exists()) {
                      return {
                        id: userDoc.id,
                        data: userDoc.data()
                      };
                    }
                    return null;
                  } catch (error) {
                    console.error(`Error fetching user ${authorId}:`, error);
                    return null;
                  }
                });

                const userResults = await Promise.all(userFetches);
                
                userResults.forEach((result) => {
                  if (result) {
                    usersMap.set(result.id, {
                      id: result.id,
                      displayName: result.data?.displayName,
                      instagramHandle: result.data?.instagramHandle,
                      photoURL: result.data?.photoURL
                    });
                  }
                });
              }
              
              // Update cache with fetched users
              if (!cachedUsers) {
                cachedUsers = new Map<string, any>();
                usersCache.set(cacheKey, cachedUsers);
              }
              
              // Add newly fetched users to cache
              usersMap.forEach((userData, userId) => {
                if (userId !== 'system') {
                  cachedUsers!.set(userId, userData);
                }
              });
              
              console.log('Updated cache for event---------->', cacheKey, 'with users:', Array.from(cachedUsers.keys()));
            }

            console.log('usersMap---------->', usersMap);

            // Process messages with optimized user lookups
            const messagesWithAuthors = snapshot.docs.map((messageDoc) => {
              const messageData = messageDoc.data();
              const author = usersMap.get(messageData.authorId);

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
                author: author
              };

              return message;
            });

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
      console.log('sendMessage called with conversationId---------->', conversationId);
      if (!conversationId) {
        console.log('conversationId is null, attempting to get/create conversation...');
        // If conversationId is not set, try to get/create it
        const conversation = await getOrCreateEventConversation(eventId);
        console.log('got conversation in sendMessage---------->', conversation);
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
