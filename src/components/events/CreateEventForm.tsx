import { useState } from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { COLORS, SPACING } from '@/src/lib/constants';
import { useAuth } from '@/src/hooks/useAuth';
import { useEvents } from '@/src/hooks/useEvents';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';

interface EventFormValues {
  eventName: string;
  startDate: string;
  endDate: string;
  venueName: string;
  address: string;
  venuePhone: string;
}

export function CreateEventForm() {
  const { user } = useAuth();
  const { createEvent } = useEvents(user?.id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<EventFormValues>({
    defaultValues: {
      eventName: '',
      startDate: '',
      endDate: '',
      venueName: '',
      address: '',
      venuePhone: ''
    },
    mode: 'onSubmit'
  });

  const onSubmit: SubmitHandler<EventFormValues> = async (data) => {
    if (!user) {
      setError('You must be logged in to create an event');
      return;
    }

    // Simple date validation
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

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
      event_name: data.eventName,
      start_date: data.startDate,
      end_date: data.endDate,
      venue_name: data.venueName || null,
      address: data.address || null,
      venue_phone: data.venuePhone || null,
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

        <Controller
          control={control}
          name="eventName"
          rules={{ required: 'Event name is required' }}
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <Input
              label="Event Name *"
              placeholder="Wedding, Conference, etc."
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="startDate"
          rules={{ required: 'Start date is required' }}
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <Input
              label="Start Date *"
              placeholder="YYYY-MM-DD"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="endDate"
          rules={{ required: 'End date is required' }}
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <Input
              label="End Date *"
              placeholder="YYYY-MM-DD"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={error?.message}
            />
          )}
        />

        <Controller
          control={control}
          name="venueName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Venue Name"
              placeholder="Grand Hotel"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />

        <Controller
          control={control}
          name="address"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Venue Address"
              placeholder="123 Main Street, City, State"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
            />
          )}
        />

        <Controller
          control={control}
          name="venuePhone"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Venue Phone"
              placeholder="(123) 456-7890"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="phone-pad"
            />
          )}
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
            onPress={handleSubmit(onSubmit)}
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
