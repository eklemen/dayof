import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, LogIn } from 'lucide-react-native';
import { COLORS, SPACING, APP_NAME } from '@/src/lib/constants';
import { EventCard } from '@/src/components/ui/EventCard';
import { Button } from '@/src/components/ui/Button';
import { useAuth } from '@/src/hooks/useAuth';
import { useGetEventsForUser } from '@/src/services/service-hooks/useGetEventsForUser';

export default function EventsScreen() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: events, isLoading: eventsLoading, error } = useGetEventsForUser();
  const navigateToCreateEvent = () => {
    router.push('/events/create');
  };

  const navigateToJoinEvent = () => {
    router.push('/events/join');
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  }
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{APP_NAME}</Text>
      </View>

      <View style={styles.actionsContainer}>
        <Button
          title="Create Event"
          onPress={navigateToCreateEvent}
          icon={<Plus size={18} color="white" style={styles.buttonIcon} />}
          iconPosition="left"
          style={styles.createButton}
        />
        <Button
          title="Join Event"
          onPress={navigateToJoinEvent}
          variant="outline"
          icon={<LogIn size={18} color={COLORS.primary[700]} style={styles.buttonIcon} />}
          iconPosition="left"
          style={styles.joinButton}
        />
      </View>

      <View>
        <Button
          title="Logout"
          onPress={handleLogout}
          icon={<Plus size={18} color="white" style={styles.buttonIcon} />}
          iconPosition="left"
          style={styles.joinButton}
        />
      </View>
      <ScrollView style={styles.scrollView}>
        <Text style={styles.sectionTitle}>Your Events</Text>

        {eventsLoading ? (
          <Text style={styles.loadingText}>Loading events...</Text>
        ) : events?.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptyDescription}>
              Create a new event or join an existing one to get started.
            </Text>
          </View>
        ) : (
          <View style={styles.eventsContainer}>
            {(events ?? []).map(event => (
              <EventCard
                key={event?.eventId}
                event={event}
                isOwner={event?.ownerId === user?.id}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.gray[50],
  },
  header: {
    backgroundColor: COLORS.primary[700],
    padding: SPACING.m,
    paddingBottom: SPACING.l,
  },
  title: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    padding: SPACING.m,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray[200],
  },
  buttonIcon: {
    marginRight: SPACING.xs,
  },
  createButton: {
    flex: 1,
    marginRight: SPACING.s,
  },
  joinButton: {
    flex: 1,
    marginLeft: SPACING.s,
  },
  scrollView: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginVertical: SPACING.m,
    marginHorizontal: SPACING.m,
    fontFamily: 'Inter-SemiBold',
  },
  loadingText: {
    textAlign: 'center',
    color: COLORS.gray[600],
    marginTop: SPACING.xl,
  },
  eventsContainer: {
    padding: SPACING.m,
    paddingTop: 0,
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginBottom: SPACING.s,
    textAlign: 'center',
    fontFamily: 'Inter-SemiBold',
  },
  emptyDescription: {
    fontSize: 16,
    color: COLORS.gray[600],
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
});
