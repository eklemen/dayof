import { type JSX } from 'react';
import { StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThreadChat } from '@/src/components/chat/ThreadChat';

export default function ThreadScreen(): JSX.Element {
  const params = useLocalSearchParams();
  
  // Parse the message object from params
  const eventId = Array.isArray(params.eventId) ? params.eventId[0] : params.eventId || '';
  const messageData = params.message ? JSON.parse(params.message as string) : null;

  const handleClose = (): void => {
    router.back();
  };

  if (!eventId || !messageData) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Could add error state here */}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ThreadChat
        eventId={eventId}
        parentMessage={messageData}
        onClose={handleClose}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
});