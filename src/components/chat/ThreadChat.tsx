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

interface ThreadChatProps {
  eventId: string;
  parentMessage: any;
  onClose: () => void;
}

export function ThreadChat({ eventId, parentMessage, onClose }: ThreadChatProps) {
  const { user } = useAuth();
  const { messages, loading, sendMessage } = useMessages(eventId, parentMessage._id);

  // Memoize message conversion to prevent unnecessary re-renders
  const chatMessages = useMemo(() => {
    // Convert thread messages
    const threadMessages = (messages ?? []).map((msg) => {
      const userName = msg.author?.displayName || (msg.authorId === 'system' ? 'System' : 'User');
      return {
        _id: msg.messageId,
        text: msg.body,
        createdAt: new Date(msg.createdAt),
        user: {
          _id: msg.authorId,
          name: userName,
          avatar:
            msg.author?.photoURL ||
            `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=${msg.authorId === 'system' ? '6366f1' : '10b981'}&color=fff&size=128`,
          companyName: msg.author?.companyName,
          email: msg.author?.email,
          phone: msg.author?.phone,
          website: msg.author?.website,
          social: msg.author?.social,
          instagramHandle: msg.author?.social?.instagram,
          facebookHandle: msg.author?.social?.facebook,
          youtubeHandle: msg.author?.social?.youtube,
          tiktokHandle: msg.author?.social?.tiktok,
        },
      };
    });

    // Add parent message at the beginning (last in array since GiftedChat is reversed)
    if (parentMessage) {
      const parentChatMessage = {
        _id: parentMessage._id,
        text: parentMessage.text,
        createdAt: parentMessage.createdAt,
        user: parentMessage.user,
      };
      return [...threadMessages, parentChatMessage];
    }
    
    return threadMessages;
  }, [messages, parentMessage]);
  console.log('chatMessages---------->', chatMessages);
  console.log('User object:', user);

  const onSend = useCallback(
    async (messages: IMessage[] = []) => {
      if (!user) {
        console.log('onSend: no user found');
        return;
      }

      const { text } = messages[0];
      await sendMessage(eventId, user.id, String(text), parentMessage._id);
    },
    [user, eventId, parentMessage._id, sendMessage]
  );

  // Render empty chat state - fixed for inverted=false
  const renderEmptyChat = () => {
    return null;
    // return (
    //   <View style={styles.emptyContainer}>
    //     <Text style={styles.emptyText}>No messages in this thread yet.</Text>
    //     <Text style={styles.emptySubtext}>Be the first to reply!</Text>
    //   </View>
    // );
  };

  return (
    <View style={styles.container}>
      <View style={styles.threadHeader}>
        <Text style={styles.threadTitle}>Thread</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.closeButton}>Close</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.chatContainer}>
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
          placeholder="Reply to thread..."
          renderUsernameOnMessage
          showAvatarForEveryMessage
          renderAvatarOnTop
          messagesContainerStyle={styles.messagesContainer}
          textInputStyle={styles.textInput}
          minInputToolbarHeight={60}
          bottomOffset={0}
          onPressAvatar={(user) => console.log('onPressAvatar------->', user)}
          renderChatEmpty={renderEmptyChat}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  chatContainer: {
    flex: 1,
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
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
    backgroundColor: 'white',
  },
  threadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[800],
  },
  closeButton: {
    fontSize: 16,
    color: COLORS.primary[700],
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 100, // Add space above the input
  },
  emptyText: {
    scaleY: -1,
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.gray[600],
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: COLORS.gray[500],
  },
});
