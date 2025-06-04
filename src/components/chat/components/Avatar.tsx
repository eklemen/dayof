import { Avatar as GCAvatar } from '@/src/lib/react-native-gifted-chat/src';
import { View } from 'react-native';

export const Avatar = (props: any) => {
  const hasPhoto = props.currentMessage?.user?.avatar;

  console.log('hasPhoto---------->', hasPhoto);
  if (!hasPhoto) {
    return (
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: 4,
          backgroundColor: props.currentMessage?.user?.avatarColor || '#gray',
          marginRight: props.position === 'left' ? 8 : 0,
        }}
      />
    );
  }

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
