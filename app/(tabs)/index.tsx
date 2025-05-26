import { useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, LogIn } from 'lucide-react-native';
import { COLORS, SPACING, APP_NAME } from '@/lib/constants';
import { EventCard } from '@/components/ui/EventCard';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/hooks/useAuth';
import { useEvents } from '@/hooks/useEvents';

export default function EventsScreen() {
  const { user, loading: authLoading } = useAuth();
  const { userEvents, loading: eventsLoading, refreshEvents } = useEvents(user?.id);

  useEffect(() => {
    // console.log('user---------->', user);
    // console.log('authLoading---------->', authLoading);
    if (!user && !authLoading) {
      router.replace('/login');
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (user?.id) {
      refreshEvents(user.id);
    }
  }, [user]);

  const navigateToCreateEvent = () => {
    router.push('/events/create');
  };

  const navigateToJoinEvent = () => {
    router.push('/events/join');
  };

  // Show loading or redirect to login if no user
  if (authLoading || !user) {
    return null;
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

      <ScrollView style={styles.scrollView}>
        <Text style={styles.sectionTitle}>Your Events</Text>

        {eventsLoading ? (
          <Text style={styles.loadingText}>Loading events...</Text>
        ) : userEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptyDescription}>
              Create a new event or join an existing one to get started.
            </Text>
          </View>
        ) : (
          <View style={styles.eventsContainer}>
            {userEvents.map(event => (
              <EventCard
                key={event.id}
                event={event}
                isOwner={event.owner_id === user.id}
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
