import { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { router } from 'expo-router';
import { Input } from '@/src/components/ui/Input';
import { Button } from '@/src/components/ui/Button';
import { Card } from '@/src/components/ui/Card';
import { COLORS, SPACING } from '@/src/lib/constants';
import { useAuth } from '@/src/hooks/useAuth';
import { useJoinEvent } from '@/src/services/service-hooks/useJoinEvent';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';

interface JoinEventFormValues {
  groupCode: string;
}

export function JoinEventForm() {
  const { user } = useAuth();
  const joinEventMutation = useJoinEvent();
  const [error, setError] = useState<string | null>(null);

  const { control, handleSubmit, formState: { errors } } = useForm<JoinEventFormValues>({
    defaultValues: {
      groupCode: ''
    },
    mode: 'onSubmit'
  });

  const onSubmit: SubmitHandler<JoinEventFormValues> = async (data) => {
    if (!user) {
      setError('You must be logged in to join an event');
      return;
    }

    setError(null);

    try {
      await joinEventMutation.mutateAsync({ groupCode: data.groupCode, userId: user.id });
      // Navigate to events list
      router.replace('/');
    } catch (joinError: any) {
      setError(joinError?.message || 'Failed to join event');
    }
  };

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Text style={styles.title}>Join an Event</Text>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Controller
          control={control}
          name="groupCode"
          rules={{ required: 'Event code is required' }}
          render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
            <Input
              label="Event Code"
              placeholder="Enter the event code"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="characters"
              error={error?.message}
            />
          )}
        />

        <Text style={styles.infoText}>
          Enter the event code provided by the event planner to join their event.
        </Text>

        <View style={styles.buttonContainer}>
          <Button
            title="Cancel"
            onPress={() => router.back()}
            variant="outline"
            style={styles.cancelButton}
          />
          <Button
            title="Join Event"
            onPress={handleSubmit(onSubmit)}
            loading={joinEventMutation.isPending}
            style={styles.joinButton}
          />
        </View>
      </Card>
    </View>
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
  infoText: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginTop: SPACING.xs,
    marginBottom: SPACING.m,
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
  joinButton: {
    flex: 1,
    marginLeft: SPACING.s,
  },
});
