import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { useEvents } from '@/hooks/useEvents';
import { formatDate } from '@/lib/utils';
import { Calendar as CalendarIcon } from 'lucide-react-native';
import { Card } from '@/components/ui/Card';

export default function CalendarScreen() {
  const { user } = useAuth();
  const { userEvents } = useEvents(user?.id);

  // Group events by month
  const groupedEvents = userEvents.reduce((acc: Record<string, any[]>, event) => {
    const monthYear = new Date(event.start_date).toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    
    if (!acc[monthYear]) {
      acc[monthYear] = [];
    }
    
    acc[monthYear].push(event);
    return acc;
  }, {});

  // Sort months chronologically
  const sortedMonths = Object.keys(groupedEvents).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA.getTime() - dateB.getTime();
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Calendar</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {sortedMonths.length === 0 ? (
          <View style={styles.emptyState}>
            <CalendarIcon size={48} color={COLORS.gray[400]} />
            <Text style={styles.emptyTitle}>No events scheduled</Text>
            <Text style={styles.emptyDescription}>
              Your upcoming events will appear here
            </Text>
          </View>
        ) : (
          sortedMonths.map(month => (
            <View key={month} style={styles.monthContainer}>
              <Text style={styles.monthTitle}>{month}</Text>
              
              {groupedEvents[month].map(event => (
                <Card key={event.id} style={styles.eventCard} variant="elevated">
                  <Text style={styles.eventName}>{event.event_name}</Text>
                  <View style={styles.dateContainer}>
                    <Text style={styles.eventDate}>
                      {formatDate(event.start_date)}
                      {event.start_date !== event.end_date ? ` - ${formatDate(event.end_date)}` : ''}
                    </Text>
                  </View>
                  {event.venue_name && (
                    <Text style={styles.venueName}>{event.venue_name}</Text>
                  )}
                </Card>
              ))}
            </View>
          ))
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
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  scrollView: {
    flex: 1,
    padding: SPACING.m,
  },
  monthContainer: {
    marginBottom: SPACING.l,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginBottom: SPACING.m,
    fontFamily: 'Inter-SemiBold',
  },
  eventCard: {
    marginBottom: SPACING.m,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginBottom: 4,
    fontFamily: 'Inter-SemiBold',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  eventDate: {
    fontSize: 14,
    color: COLORS.gray[600],
    fontFamily: 'Inter-Regular',
  },
  venueName: {
    fontSize: 14,
    color: COLORS.gray[600],
    fontFamily: 'Inter-Regular',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xxl,
    padding: SPACING.l,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[800],
    marginTop: SPACING.m,
    marginBottom: SPACING.s,
    fontFamily: 'Inter-SemiBold',
  },
  emptyDescription: {
    fontSize: 16,
    color: COLORS.gray[600],
    textAlign: 'center',
    fontFamily: 'Inter-Regular',
  },
});