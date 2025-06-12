import React, { useCallback, useMemo } from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  View,
  Platform,
  TextStyle,
  ViewStyle,
} from 'react-native';
import {
  MessageText,
  MessageImage,
  Time,
  utils,
  useChatContext,
  IMessage,
  User,
  LeftRightStyle,
} from '@/src/lib/react-native-gifted-chat/src';
import { COLORS } from '@/src/lib/constants';

const { isSameUser, isSameDay } = utils;

interface ChatBubbleProps {
  touchableProps?: object;
  onLongPress?: (context: any, message: IMessage) => void;
  onPress?: (context: any, message: IMessage) => void;
  renderCustomView?: (props: ChatBubbleProps) => React.ReactNode;
  renderMessageText?: (props: ChatBubbleProps) => React.ReactNode;
  renderMessageImage?: (props: ChatBubbleProps) => React.ReactNode;
  renderTicks?: (message: IMessage) => React.ReactNode;
  renderTime?: (props: ChatBubbleProps) => React.ReactNode;
  currentMessage: IMessage;
  previousMessage?: IMessage;
  user: User;
  containerStyle?: LeftRightStyle<ViewStyle>;
  wrapperStyle?: LeftRightStyle<ViewStyle>;
  usernameStyle?: TextStyle;
  tickStyle?: TextStyle;
  textStyle?: LeftRightStyle<TextStyle>;
  imageStyle?: any;
  position: 'left' | 'right';
}

const ChatBubble = (props: ChatBubbleProps) => {
  const {
    touchableProps,
    onLongPress,
    onPress,
    renderCustomView,
    currentMessage,
    previousMessage,
    user,
    containerStyle,
    wrapperStyle,
    usernameStyle,
    tickStyle,
    position,
  } = props;

  const context = useChatContext();

  const handleLongPress = useCallback(() => {
    if (onLongPress) {
      onLongPress(context, currentMessage);
      return;
    }

    if (!currentMessage.text) return;

    const options = ['Copy Text', 'Cancel'];
    const cancelButtonIndex = options.length - 1;
    context.actionSheet().showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex,
      },
      (buttonIndex?: number) => {
        switch (buttonIndex) {
          case 0:
            // Copy text functionality would go here
            break;
        }
      }
    );
  }, [onLongPress, currentMessage, context]);

  const handlePress = useCallback(() => {
    if (onPress) {
      onPress(context, currentMessage);
    }
  }, [onPress, context, currentMessage]);

  const renderMessageText = useCallback(() => {
    if (currentMessage.text) {
      if (props.renderMessageText) return props.renderMessageText(props);

      return (
        <MessageText
          {...props}
          textStyle={{
            left: [styles.standardFont, styles.messageText, props.textStyle?.left],
            right: [styles.standardFont, styles.messageText, props.textStyle?.right],
          }}
        />
      );
    }

    return null;
  }, [currentMessage, props]);

  const renderMessageImage = useCallback(() => {
    if (currentMessage.image) {
      if (props.renderMessageImage) return props.renderMessageImage(props);

      return <MessageImage {...props} imageStyle={[styles.image, props.imageStyle]} />;
    }

    return null;
  }, [currentMessage, props]);

  const renderTicks = useCallback(() => {
    const { currentMessage } = props;

    if (props.renderTicks) return props.renderTicks(currentMessage);

    if (currentMessage.user._id !== user._id) return null;

    if (currentMessage.sent || currentMessage.received) {
      return (
        <View style={[styles.headerItem, styles.tickView]}>
          {currentMessage.sent && (
            <Text style={[styles.standardFont, styles.tick, tickStyle]}>✓</Text>
          )}
          {currentMessage.received && (
            <Text style={[styles.standardFont, styles.tick, tickStyle]}>✓</Text>
          )}
        </View>
      );
    }

    return null;
  }, [props, user]);

  const renderUsername = useCallback((): React.ReactNode => {
    const username = currentMessage.user.name;
    if (username) {
      return (
        <View>
          <Text style={[styles.standardFont, styles.headerItem, styles.username, usernameStyle]}>
            {username}
          </Text>
          <Text style={{ color: COLORS.gray[500], fontSize: 12 }}>CompanyName</Text>
        </View>
      );
    }
    return null;
  }, [currentMessage, usernameStyle]);

  const renderTime = useCallback(() => {
    if (currentMessage.createdAt) {
      if (props.renderTime) return props.renderTime(props);

      return (
        <Time
          {...props}
          containerStyle={{ left: [styles.timeContainer] }}
          textStyle={{
            left: [styles.standardFont, styles.headerItem, styles.time, props.textStyle?.left],
            right: [styles.standardFont, styles.headerItem, styles.time, props.textStyle?.right],
          }}
        />
      );
    }

    return null;
  }, [currentMessage, props]);

  const isSameThread = useMemo(
    () => isSameUser(currentMessage, previousMessage) && isSameDay(currentMessage, previousMessage),
    [currentMessage, previousMessage]
  );

  const messageHeader = useMemo(() => {
    if (isSameThread) return null;

    return (
      <View style={styles.headerView}>
        {renderUsername()}
        {renderTime()}
        {renderTicks()}
      </View>
    );
  }, [isSameThread, renderUsername, renderTime, renderTicks]);

  return (
    <View style={[styles.container, containerStyle?.[position]]}>
      <TouchableOpacity
        onPress={handlePress}
        onLongPress={handleLongPress}
        accessibilityRole="button"
        {...touchableProps}
      >
        <View style={[styles.wrapper, wrapperStyle?.[position]]}>
          <View>
            {renderCustomView?.(props)}
            {messageHeader}
            {renderMessageImage()}
            {renderMessageText()}
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

// Note: Everything is forced to be "left" positioned with this component.
// The "right" position is only used in the default Bubble.
const styles = StyleSheet.create({
  standardFont: {
    fontSize: 15,
  },
  messageText: {
    marginLeft: 0,
    marginRight: 0,
  },
  container: {
    flex: 1,
    alignItems: 'flex-start',
  },
  wrapper: {
    marginRight: 60,
    minHeight: 20,
    justifyContent: 'flex-end',
  },
  username: {
    fontWeight: 'bold',
    color: COLORS.gray[700],
  },
  time: {
    textAlign: 'left',
    fontSize: 12,
    color: COLORS.gray[500],
  },
  timeContainer: {
    marginLeft: 0,
    marginRight: 0,
    marginBottom: 0,
  },
  headerItem: {
    marginRight: 10,
  },
  headerView: {
    // Try to align it better with the avatar on Android.
    marginTop: Platform.OS === 'android' ? -2 : 0,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  tick: {
    backgroundColor: 'transparent',
    color: COLORS.primary[400],
  },
  tickView: {
    flexDirection: 'row',
  },
  image: {
    borderRadius: 3,
    marginLeft: 0,
    marginRight: 0,
  },
});

export default ChatBubble;
