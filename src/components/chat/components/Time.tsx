import { Time as GCTime } from '@/src/lib/react-native-gifted-chat/src';
import { COLORS } from '@/src/lib/constants';

export const Time = (props: any) => {
  return (
    <GCTime
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
