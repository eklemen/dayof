import { useState } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { COLORS, SPACING } from '@/src/lib/constants';
import { useAuth } from '@/src/hooks/useAuth';
import { useCreateEvent } from '@/src/services/service-hooks/useCreateEvent';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';

interface EventFormValues {
  eventName: string;
  startDate: string;
  endDate: string;
  venueName: string;
  address: string;
  venuePhone: string;
}

interface CreateEventFormProps {
  onSuccess?: (eventId: string) => void;
  onError?: (error: string) => void;
}

export function CreateEventForm({ onSuccess, onError }: CreateEventFormProps = {}) {
  const { user } = useAuth();
  const createEventMutation = useCreateEvent();
  const [error, setError] = useState<string | null>(null);
  const [isMultiDay, setIsMultiDay] = useState(false);

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

    if (isNaN(start.getTime())) {
      setError('Please enter a valid start date in YYYY-MM-DD format');
      return;
    }

    if (isMultiDay) {
      const end = new Date(data.endDate);

      if (isNaN(end.getTime())) {
        setError('Please enter a valid end date in YYYY-MM-DD format');
        return;
      }

      if (end < start) {
        setError('End date cannot be before start date');
        return;
      }
    }

    setError(null);

    const eventData = {
      eventName: data.eventName,
      startDate: data.startDate,
      endDate: isMultiDay ? data.endDate : null,
      venueName: data.venueName || null,
      address: data.address || null,
      venuePhone: data.venuePhone || null,
    };

    try {
      await createEventMutation.mutateAsync({ eventData, ownerId: user.id });
      // Navigate to events list
      router.replace('/');
    } catch (createError: any) {
      setError(createError?.message || 'Failed to create event');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.title}>Event Details</Text>

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
              label={isMultiDay ? "Start Date *" : "Event Date *"}
              placeholder="YYYY-MM-DD"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              error={error?.message}
            />
          )}
        />

        <TouchableOpacity
          style={styles.checkboxContainer}
          onPress={() => setIsMultiDay(!isMultiDay)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, isMultiDay && styles.checkboxChecked]}>
            {isMultiDay && <View style={styles.checkboxInner} />}
          </View>
          <Text style={styles.checkboxLabel}>This event spans multiple days</Text>
        </TouchableOpacity>

        {isMultiDay && (
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
        )}

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
            loading={createEventMutation.isPending}
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.m,
    marginTop: -SPACING.s,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.primary[500],
    marginRight: SPACING.s,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary[500],
  },
  checkboxInner: {
    width: 10,
    height: 10,
    backgroundColor: 'white',
    borderRadius: 2,
  },
  checkboxLabel: {
    fontSize: 14,
    color: COLORS.gray[700],
  },
});
