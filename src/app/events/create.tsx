import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/src/lib/constants';
import { CreateEventForm } from '@/src/components/events/CreateEventForm';

export default function CreateEventScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <CreateEventForm />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
});
