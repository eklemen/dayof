import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { COLORS, SPACING } from '@/src/lib/constants';
import { formatDate, isEventActive, isPastDate } from '@/src/lib/utils';
import { Calendar, Users } from 'lucide-react-native';
import { Card } from './Card';
import { Event } from '@/src/models';

interface EventCardProps {
  event: Event;
  isOwner?: boolean;
}

export function EventCard({ event, isOwner }: EventCardProps) {
  console.log('event---------->', event);
  // const isActive = isEventActive(event.endDate);
  // const isPast = isPastDate(event.endDate);
  const isActive = true;
  const isPast = false;

  debugger
  const navigateToEvent = () => {
    router.push(`/events/${event.id}`);
  };

  return (
    <TouchableOpacity onPress={navigateToEvent} activeOpacity={0.7}>
      <Card variant="elevated" style={styles.card}>
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={1}>
            {event?.eventName}
          </Text>
          {isOwner && (
            <View style={styles.ownerBadge}>
              <Text style={styles.ownerText}>Planner</Text>
            </View>
          )}
        </View>

        <View style={styles.infoRow}>
          <Calendar size={18} color={COLORS.gray[600]} />
          <Text style={styles.infoText}>
            dates go here
            {/*{formatDate(event.startDate)} - {formatDate(event.endDate)}*/}
          </Text>
        </View>

        {event.venue.venueName && (
          <View style={styles.infoRow}>
            <Users size={18} color={COLORS.gray[600]} />
            <Text style={styles.infoText}>{event.venue.venueName}</Text>
          </View>
        )}

        <View style={styles.footer}>
          <View style={[
            styles.statusBadge,
            isPast ? styles.pastBadge : isActive ? styles.activeBadge : styles.upcomingBadge
          ]}>
            <Text style={[
              styles.statusText,
              isPast ? styles.pastText : isActive ? styles.activeText : styles.upcomingText
            ]}>
              {isPast ? 'Past' : isActive ? 'Active' : 'Upcoming'}
            </Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.m,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[800],
    flex: 1,
  },
  ownerBadge: {
    backgroundColor: COLORS.primary[100],
    paddingHorizontal: SPACING.s,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: SPACING.s,
  },
  ownerText: {
    color: COLORS.primary[700],
    fontSize: 12,
    fontWeight: '500',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.s,
  },
  infoText: {
    marginLeft: SPACING.s,
    color: COLORS.gray[600],
    fontSize: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.s,
  },
  statusBadge: {
    paddingHorizontal: SPACING.s,
    paddingVertical: 2,
    borderRadius: 4,
  },
  activeBadge: {
    backgroundColor: COLORS.success[500] + '20',
  },
  upcomingBadge: {
    backgroundColor: COLORS.primary[500] + '20',
  },
  pastBadge: {
    backgroundColor: COLORS.gray[300] + '50',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  activeText: {
    color: COLORS.success[600],
  },
  upcomingText: {
    color: COLORS.primary[700],
  },
  pastText: {
    color: COLORS.gray[600],
  },
  codeText: {
    fontSize: 13,
    color: COLORS.gray[600],
  },
  codeHighlight: {
    fontWeight: '600',
    color: COLORS.gray[800],
  },
});
