import { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { GiftedChat, Bubble, Send, Time, Avatar, type IMessage } from '@/src/lib/react-native-gifted-chat/src';
import { useAuth } from '@/src/hooks/useAuth';
import { useMessages } from '@/src/hooks/useMessages';
import { COLORS } from '@/src/lib/constants';
import { Send as SendIcon, User } from 'lucide-react-native';

interface ChatInterfaceProps {
  eventId: string;
  parentId?: string | null;
  onClose?: () => void;
}

export function ChatInterface({ eventId, parentId = null, onClose }: ChatInterfaceProps) {
  const { user } = useAuth();
  const { messages, loading, sendMessage } = useMessages(eventId, parentId);
  const [chatMessages, setChatMessages] = useState<IMessage[]>([]);

  console.log('messages---------->', messages);
  useEffect(() => {
    // Convert Firestore messages to GiftedChat format
    const formattedMessages = (messages ?? []).map(msg => {
      const userName = msg.author?.displayName || (msg.authorId === 'system' ? 'System' : 'User');
      return {
        _id: msg.messageId,
        text: msg.body,
        createdAt: new Date(msg.createdAt),
        user: {
          _id: msg.authorId,
          name: userName,
          avatar: msg.author?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=${msg.authorId === 'system' ? '6366f1' : '10b981'}&color=fff&size=128`,
        },
      };
    });

    setChatMessages(formattedMessages);
  }, [messages]);

  const onSend = useCallback(async (messages: IMessage[] = []) => {
    if (!user) {
      console.log('onSend: no user found');
      return;
    }

    const { text } = messages[0];
    console.log('onSend: sending message---------->', { eventId, userId: user.id, text, parentId });
    const result = await sendMessage(eventId, user.id, text, parentId);
    console.log('onSend: message sent result---------->', result);
  }, [user, eventId, parentId, sendMessage]);

  const renderBubble = (props: any) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: COLORS.primary[600],
            borderBottomRightRadius: 4,
            borderBottomLeftRadius: 16,
            borderTopRightRadius: 16,
            borderTopLeftRadius: 16,
            marginVertical: 2,
          },
          left: {
            backgroundColor: COLORS.gray[100],
            borderBottomRightRadius: 16,
            borderBottomLeftRadius: 4,
            borderTopRightRadius: 16,
            borderTopLeftRadius: 16,
            marginVertical: 2,
          },
        }}
        textStyle={{
          right: {
            color: 'white',
            fontSize: 15,
            lineHeight: 20,
          },
          left: {
            color: COLORS.gray[800],
            fontSize: 15,
            lineHeight: 20,
          },
        }}
        usernameStyle={{
          color: COLORS.gray[600],
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 2,
        }}
      />
    );
  };

  const renderSend = (props: any) => {
    return (
      <Send {...props} containerStyle={styles.sendContainer}>
        <View style={styles.sendButton}>
          <SendIcon size={20} color="white" />
        </View>
      </Send>
    );
  };

  const renderTime = (props: any) => {
    return (
      <Time
        {...props}
        timeTextStyle={{
          right: {
            color: COLORS.primary[200],
            fontSize: 11,
          },
          left: {
            color: COLORS.gray[500],
            fontSize: 11,
          },
        }}
      />
    );
  };

  const renderAvatar = (props: any) => {
    return (
      <Avatar
        {...props}
        imageStyle={{
          left: {
            width: 32,
            height: 32,
            borderRadius: 16,
          },
          right: {
            width: 32,
            height: 32,
            borderRadius: 16,
          },
        }}
        renderAvatarOnTop
      />
    );
  };

  const getAvatarInitials = (name: string) => {
    if (!name) return '?';
    const words = name.trim().split(' ');
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

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
        renderBubble={renderBubble}
        renderSend={renderSend}
        renderTime={renderTime}
        renderAvatar={renderAvatar}
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
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  messagesContainer: {
    paddingBottom: 10,
    paddingHorizontal: 8,
    backgroundColor: '#f8f9fa',
  },
  textInput: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    paddingHorizontal: 16,
    marginRight: 8,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: 'white',
    fontSize: 15,
    maxHeight: 100,
  },
  sendContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    marginBottom: 8,
  },
  sendButton: {
    backgroundColor: COLORS.primary[600],
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
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
