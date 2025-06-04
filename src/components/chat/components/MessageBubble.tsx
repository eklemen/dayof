import { Bubble } from '@/src/lib/react-native-gifted-chat/src';
import { COLORS } from '@/src/lib/constants';

export const MessageBubble = (props: any) => {
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
