import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';

import { Avatar, Day, utils } from '@/src/lib/react-native-gifted-chat/src';
import ChatBubble from './ChatBubble';
import { ThreadReplies } from './ThreadReplies';

const { isSameUser, isSameDay } = utils;

const SquareMessage = (props: any) => {
  const { currentMessage, nextMessage, previousMessage } = props;
  const getInnerComponentProps = useCallback(() => {
    return {
      ...props,
      position: 'left',
      isSameUser,
      isSameDay,
      containerStyle: props.containerStyle?.left,
    };
  }, [props]);

  const renderDay = useCallback(() => {
    if (currentMessage.createdAt) {
      const dayProps = getInnerComponentProps();

      if (props.renderDay) return props.renderDay(dayProps);

      return <Day {...dayProps} />;
    }

    return null;
  }, [currentMessage, getInnerComponentProps, props]);

  const renderBubble = useCallback(() => {
    const bubbleProps = getInnerComponentProps();

    if (props.renderBubble) return props.renderBubble(bubbleProps);

    return <ChatBubble {...bubbleProps} />;
  }, [getInnerComponentProps, props]);

  const renderAvatar = useCallback(() => {
    let extraStyle;
    if (isSameUser(currentMessage, previousMessage) && isSameDay(currentMessage, previousMessage))
      // Set the invisible avatar height to 0, but keep the width, padding, etc.
      extraStyle = { height: 0 };

    const avatarProps = getInnerComponentProps();

    if (props.renderAvatar) return props.renderAvatar(avatarProps);

    return (
      <Avatar
        {...avatarProps}
        onPress={(e: any) => console.log('onPress------->', e)}
        imageStyle={{
          left: [styles.avatar, avatarProps.imageStyle, extraStyle],
        }}
      />
    );
  }, [currentMessage, previousMessage, getInnerComponentProps, props]);

  const marginBottom = useMemo(
    () => (isSameUser(currentMessage, nextMessage) ? 2 : 5),
    [currentMessage, nextMessage]
  );

  const renderThreadReplies = useCallback(() => {
    const replyCount = currentMessage.replyCount || 0;
    console.log('SquareMessage renderThreadReplies:', {
      messageId: currentMessage._id,
      replyCount,
      currentMessage,
    });

    if (replyCount === 0) return null;

    return (
      <ThreadReplies
        replyCount={replyCount}
        onPress={() => {
          if (props.onPress) {
            props.onPress(null, currentMessage);
          }
        }}
      />
    );
  }, [currentMessage, props]);

  return (
    <View style={{ marginBottom: 10 }}>
      {renderDay()}
      <View style={[styles.container, { marginBottom }]}>
        {renderAvatar()}
        {renderBubble()}
      </View>
      {renderThreadReplies()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    marginLeft: 8,
    marginRight: 0,
  },
  avatar: {
    // The bottom should roughly line up with the first line of message text.
    height: 36,
    width: 36,
    borderRadius: 18,
    marginRight: 8,
  },
});

export default SquareMessage;
