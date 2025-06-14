import { useState, useCallback, useEffect, useMemo } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { GiftedChat, type IMessage } from '@/src/lib/react-native-gifted-chat/src';
import { useAuth } from '@/src/hooks/useAuth';
import { useMessages } from '@/src/hooks/useMessages';
import { Avatar } from './components/Avatar';
import { Send } from './components/Send';
import { Time } from './components/Time';
import SquareMessage from './components/SquareMessage';
import { COLORS } from '@/src/lib/constants';

interface ChatInterfaceProps {
  eventId: string;
  onOpenThread?: (message: any) => void;
}

export function ChatInterface({
  eventId,
  onOpenThread,
}: ChatInterfaceProps) {
  const { user } = useAuth();
  const { messages, loading, sendMessage } = useMessages(eventId, null);

  // Memoize message conversion to prevent unnecessary re-renders
  const chatMessages = useMemo(() => {
    // Convert Firestore messages to GiftedChat format
    return (messages ?? []).map((msg) => {
      const userName = msg.author?.displayName || (msg.authorId === 'system' ? 'System' : 'User');

      // Console log to show all available user properties
      if (msg.author && msg.authorId !== 'system') {
        console.log('Available user properties for message author:', msg.author);
      }

      // Example: Enhanced display name with company and Instagram handle
      const enhancedDisplayName = (() => {
        let displayName = userName;
        let companyName = '';
        // Add company name if available
        if (msg.author?.companyName) {
          companyName = msg.author.companyName;
        }

        return displayName;
      })();

      const chatMessage = {
        _id: msg.messageId,
        text: msg.body,
        createdAt: new Date(msg.createdAt),
        user: {
          _id: msg.authorId,
          name: userName, // Using enhanced name with company
          avatar:
            msg.author?.photoURL ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=${msg.authorId === 'system' ? '6366f1' : '10b981'}&color=fff&size=128`,
          // You can now access these additional properties:
          companyName: msg.author?.companyName,
          email: msg.author?.email,
          phone: msg.author?.phone,
          website: msg.author?.website,
          social: msg.author?.social,
          // Social handles from the social object:
          instagramHandle: msg.author?.social?.instagram,
          facebookHandle: msg.author?.social?.facebook,
          youtubeHandle: msg.author?.social?.youtube,
          tiktokHandle: msg.author?.social?.tiktok,
        },
        // Pass thread reply count for custom rendering
        replyCount: msg.replyCount,
      };
      
      // Debug logging
      if (msg.replyCount && msg.replyCount > 0) {
        console.log('ChatInterface message with replies:', {
          messageId: msg.messageId,
          replyCount: msg.replyCount,
          body: msg.body
        });
      }
      
      return chatMessage;
    });
  }, [messages]);

  const onSend = useCallback(
    async (messages: IMessage[] = []) => {
      if (!user) {
        console.log('onSend: no user found');
        return;
      }

      const { text } = messages[0];
      await sendMessage(eventId, user.id, String(text), null);
    },
    [user, eventId, sendMessage]
  );

  return (
    <View style={styles.container}>
      <GiftedChat
        messages={chatMessages}
        onSend={onSend}
        user={{
          _id: user?.id || 'unknown',
          name: user?.displayName || 'You',
          avatar:
            user?.photoURL ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'You')}&background=3b82f6&color=fff&size=128`,
        }}
        renderMessage={SquareMessage}
        renderSend={Send}
        renderTime={Time}
        dateFormat="MMMM D"
        renderAvatar={Avatar}
        alwaysShowSend
        isScrollToBottomEnabled
        placeholder="Type a message..."
        renderUsernameOnMessage
        showAvatarForEveryMessage
        renderAvatarOnTop
        messagesContainerStyle={styles.messagesContainer}
        textInputStyle={styles.textInput}
        minInputToolbarHeight={60}
        bottomOffset={0}
        onPressAvatar={(user) => console.log('onPressAvatar------->', user)}
        onPress={(_, message) => {
          console.log('onPress message bubble------->', message);
          // Open thread for root messages
          if (onOpenThread) {
            onOpenThread(message);
          }
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  messagesContainer: {
    paddingBottom: 10,
    paddingHorizontal: 8,
    backgroundColor: 'white',
  },
  textInput: {
    borderRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    paddingHorizontal: 16,
    marginRight: 8,
    paddingTop: 18,
    paddingBottom: 18,
    height: 80,
    backgroundColor: 'white',
    fontSize: 15,
    lineHeight: 15,
    maxHeight: 150,
  },
});
