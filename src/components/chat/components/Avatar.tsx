import { Avatar as GCAvatar} from '@/src/lib/react-native-gifted-chat/src';

const Avatar = (props: any) => {
  return (
    <GCAvatar
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
