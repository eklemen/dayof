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
  parentId?: string | null;
  onClose?: () => void;
  onOpenThread?: (messageId: string) => void;
}

export function ChatInterface({ eventId, parentId = null, onClose, onOpenThread }: ChatInterfaceProps) {
  const { user } = useAuth();
  const { messages, loading, sendMessage } = useMessages(eventId, parentId);

  // Memoize message conversion to prevent unnecessary re-renders
  const chatMessages = useMemo(() => {
    // Convert Firestore messages to GiftedChat format
    return (messages ?? []).map(msg => {
      const userName = msg.author?.displayName || (msg.authorId === 'system' ? 'System' : 'User');
      return {
        _id: msg.messageId,
        text: (<Text>{msg.body}</Text>),
        createdAt: new Date(msg.createdAt),
        user: {
          _id: msg.authorId,
          name: userName,
          avatar: msg.author?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=${msg.authorId === 'system' ? '6366f1' : '10b981'}&color=fff&size=128`,
        },
      };
    });
  }, [messages]);

  const onSend = useCallback(async (messages: IMessage[] = []) => {
    if (!user) {
      console.log('onSend: no user found');
      return;
    }

    const { text } = messages[0];
    const result = await sendMessage(eventId, user.id, text, parentId);
  }, [user, eventId, parentId, sendMessage]);

  return (
    <View style={styles.container}>
      {parentId && onClose && (
        <View style={styles.threadHeader}>
          <Text style={styles.threadTitle}>Thread</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>Close</Text>
          </TouchableOpacity>
        </View>
      )}

      <GiftedChat
        messages={chatMessages}
        onSend={onSend}
        user={{
          _id: user?.id || 'unknown',
          name: user?.displayName || 'You',
          avatar: user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'You')}&background=3b82f6&color=fff&size=128`,
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
        onPressAvatar={(e) => console.log('onPressAvatar------->', e)}
        onPress={(context, message) => {
          console.log('onPress message bubble------->', message);
          // Only open thread for root messages (not already in a thread)
          if (!parentId && onOpenThread) {
            onOpenThread(message._id);
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
});
