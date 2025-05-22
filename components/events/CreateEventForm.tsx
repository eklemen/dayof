import { useState } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { COLORS, SPACING } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { useEvents } from '@/hooks/useEvents';

export function CreateEventForm() {
  const { user } = useAuth();
  const { createEvent } = useEvents(user?.id);
  
  const [eventName, setEventName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [venueName, setVenueName] = useState('');
  const [address, setAddress] = useState('');
  const [venuePhone, setVenuePhone] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateEvent = async () => {
    if (!user) {
      setError('You must be logged in to create an event');
      return;
    }

    if (!eventName || !startDate || !endDate) {
      setError('Event name, start date and end date are required');
      return;
    }

    // Simple date validation
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      setError('Please enter valid dates in YYYY-MM-DD format');
      return;
    }

    if (end < start) {
      setError('End date cannot be before start date');
      return;
    }

    setLoading(true);
    setError(null);

    const eventData = {
      event_name: eventName,
      start_date: startDate,
      end_date: endDate,
      venue_name: venueName || null,
      address: address || null,
      venue_phone: venuePhone || null,
    };

    const { success, error: createError } = await createEvent(eventData, user.id);

    setLoading(false);

    if (!success) {
      setError(createError || 'Failed to create event');
    } else {
      // Navigate to events list
      router.replace('/');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.title}>Create New Event</Text>
        
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}
        
        <Input
          label="Event Name *"
          placeholder="Wedding, Conference, etc."
          value={eventName}
          onChangeText={setEventName}
        />
        
        <Input
          label="Start Date *"
          placeholder="YYYY-MM-DD"
          value={startDate}
          onChangeText={setStartDate}
        />
        
        <Input
          label="End Date *"
          placeholder="YYYY-MM-DD"
          value={endDate}
          onChangeText={setEndDate}
        />
        
        <Input
          label="Venue Name"
          placeholder="Grand Hotel"
          value={venueName}
          onChangeText={setVenueName}
        />
        
        <Input
          label="Venue Address"
          placeholder="123 Main Street, City, State"
          value={address}
          onChangeText={setAddress}
        />
        
        <Input
          label="Venue Phone"
          placeholder="(123) 456-7890"
          value={venuePhone}
          onChangeText={setVenuePhone}
          keyboardType="phone-pad"
        />
        
        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            onPress={() => router.back()}
            variant="outline"
            style={styles.cancelButton}
          />
          <Button
            title="Create Event"
            onPress={handleCreateEvent}
            loading={loading}
            style={styles.createButton}
          />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: SPACING.m,
  },
  card: {
    padding: SPACING.l,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.gray[800],
    marginBottom: SPACING.l,
  },
  errorContainer: {
    backgroundColor: COLORS.error[500] + '15',
    padding: SPACING.m,
    borderRadius: 8,
    marginBottom: SPACING.m,
  },
  errorText: {
    color: COLORS.error[600],
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.m,
  },
  cancelButton: {
    flex: 1,
    marginRight: SPACING.s,
  },
  createButton: {
    flex: 1,
    marginLeft: SPACING.s,
  },
});