import { StyleSheet, View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '@/src/lib/constants';
import { JoinEventForm } from '@/src/components/events/JoinEventForm';
import { BackButton } from '@/src/components/ui/BackButton';

export default function JoinEventScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton color={COLORS.primary[700]} />
        <Text style={styles.title}>Join Event</Text>
      </View>
      <JoinEventForm />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.m,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[800],
    fontFamily: 'Inter-SemiBold',
  },
});
