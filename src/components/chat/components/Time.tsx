import { Time as GCTime } from '@/src/lib/react-native-gifted-chat/src';
import { COLORS } from '@/src/lib/constants';

export const Time = (props: any) => {
  return (
    <GCTime
      {...props}
      containerStyle={{
        left: {
          marginLeft: 0,
          marginRight: 0,
          marginBottom: 0,
        },
        right: {
          marginLeft: 0,
          marginRight: 0,
          marginBottom: 0,
        },
      }}
      timeTextStyle={{
        right: {
          color: COLORS.primary[200],
          fontSize: 12,
          textAlign: 'left',
        },
        left: {
          color: COLORS.gray[500],
          fontSize: 12,
          textAlign: 'left',
        },
      }}
    />
  );
};
