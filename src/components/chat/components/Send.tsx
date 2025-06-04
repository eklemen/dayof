import { StyleSheet, View } from 'react-native';
import { Send as SendIcon } from 'lucide-react-native';
import { Send as GCSend } from '@/src/lib/react-native-gifted-chat/src';
import { COLORS } from '@/src/lib/constants';

export const Send = (props: any) => {
  return (
    <GCSend {...props} containerStyle={styles.sendContainer}>
      <View style={styles.sendButton}>
        <SendIcon size={20} color="white" />
      </View>
    </GCSend>
  );
};

const styles = StyleSheet.create({
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
});
