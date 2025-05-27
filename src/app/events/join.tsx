import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '@/src/lib/constants';
import { JoinEventForm } from '@/src/components/events/JoinEventForm';

export default function JoinEventScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <JoinEventForm />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
});
