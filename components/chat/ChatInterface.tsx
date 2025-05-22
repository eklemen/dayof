import { useState, useCallback, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { GiftedChat, Bubble, Send, Time, IMessage } from 'react-native-gifted-chat';
import { useAuth } from '@/hooks/useAuth';
import { useMessages } from '@/hooks/useMessages';
import { COLORS } from '@/lib/constants';
import { Send as SendIcon } from 'lucide-react-native';

interface ChatInterfaceProps {
  eventId: string;
  parentId?: string | null;
  onClose?: () => void;
}

export function ChatInterface({ eventId, parentId = null, onClose }: ChatInterfaceProps) {
  const { user } = useAuth();
  const { messages, loading, sendMessage, fetchMessages } = useMessages(eventId);
  const [chatMessages, setChatMessages] = useState<IMessage[]>([]);

  useEffect(() => {
    if (eventId) {
      fetchMessages(eventId, parentId);
    }
  }, [eventId, parentId]);

  useEffect(() => {
    // Convert Supabase messages to GiftedChat format
    const formattedMessages = messages.map(msg => ({
      _id: msg.id,
      text: msg.body,
      createdAt: new Date(msg.created_at),
      user: {
        _id: msg.author_id,
        name: (msg as any).users?.display_name || 'User',
      },
    }));
    
    setChatMessages(formattedMessages);
  }, [messages]);

  const onSend = useCallback(async (messages: IMessage[] = []) => {
    if (!user) return;
    
    const { text } = messages[0];
    await sendMessage(eventId, user.id, text, parentId);
  }, [user, eventId, parentId]);

  const renderBubble = (props: any) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: COLORS.primary[600],
          },
          left: {
            backgroundColor: COLORS.gray[100],
          },
        }}
        textStyle={{
          right: {
            color: 'white',
          },
          left: {
            color: COLORS.gray[800],
          },
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
          },
          left: {
            color: COLORS.gray[500],
          },
        }}
      />
    );
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
        }}
        renderBubble={renderBubble}
        renderSend={renderSend}
        renderTime={renderTime}
        alwaysShowSend
        scrollToBottom
        placeholder="Type a message..."
        renderAvatar={null}
        renderUsernameOnMessage
        messagesContainerStyle={styles.messagesContainer}
        textInputStyle={styles.textInput}
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
  },
  textInput: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    paddingHorizontal: 12,
    marginRight: 10,
    paddingTop: 8,
    paddingBottom: 8,
  },
  sendContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
    marginBottom: 5,
  },
  sendButton: {
    backgroundColor: COLORS.primary[700],
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  threadHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  threadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[800],
  },
  closeButton: {
    fontSize: 16,
    color: COLORS.primary[700],
  },
});