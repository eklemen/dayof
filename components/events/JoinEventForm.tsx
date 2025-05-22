import { useState } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { router } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { COLORS, SPACING } from '@/lib/constants';
import { useAuth } from '@/hooks/useAuth';
import { useEvents } from '@/hooks/useEvents';

export function JoinEventForm() {
  const { user } = useAuth();
  const { joinEventWithCode } = useEvents(user?.id);
  
  const [groupCode, setGroupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoinEvent = async () => {
    if (!user) {
      setError('You must be logged in to join an event');
      return;
    }

    if (!groupCode) {
      setError('Please enter the event code');
      return;
    }

    setLoading(true);
    setError(null);

    const { success, error: joinError, alreadyMember } = await joinEventWithCode(groupCode, user.id);

    setLoading(false);

    if (!success) {
      setError(joinError || 'Failed to join event');
    } else {
      if (alreadyMember) {
        setError('You are already a member of this event');
      } else {
        // Navigate to events list
        router.replace('/');
      }
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
        
        <Input
          label="Event Code"
          placeholder="Enter the event code"
          value={groupCode}
          onChangeText={setGroupCode}
          autoCapitalize="characters"
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
            onPress={handleJoinEvent}
            loading={loading}
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