import { Avatar as GCAvatar} from '@/src/lib/react-native-gifted-chat/src';

export const Avatar = (props: any) => {
  return (
    <GCAvatar
      {...props}
      imageStyle={{
        left: {
          width: 36,
          height: 36,
          borderRadius: 4,
          marginRight: 8,
        },
        right: {
          width: 36,
          height: 36,
          borderRadius: 4,
        },
      }}
      renderAvatarOnTop
    />
  );
};
