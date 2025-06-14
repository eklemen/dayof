import { useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, X, Plus } from 'lucide-react-native';
import { COLORS, SPACING } from '@/src/lib/constants';
import { INVITE_RATE_LIMITS } from '@/src/models/Invite';

export default function InviteUsersScreen() {
  const { eventId } = useLocalSearchParams();
  const [emails, setEmails] = useState<string[]>(['']);
  const [sending, setSending] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState({
    remainingToday: INVITE_RATE_LIMITS.MAX_INVITES_PER_DAY,
    remainingThisHour: INVITE_RATE_LIMITS.MAX_INVITES_PER_HOUR,
  });

  const eventIdString = Array.isArray(eventId) ? eventId[0] : eventId || '';

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const addEmailField = () => {
    setEmails([...emails, '']);
  };

  const removeEmailField = (index: number) => {
    if (emails.length > 1) {
      const newEmails = emails.filter((_, i) => i !== index);
      setEmails(newEmails);
    }
  };

  const handleSendInvites = async () => {
    const validEmails = emails.filter(email => email.trim() && validateEmail(email.trim()));
    
    if (validEmails.length === 0) {
      Alert.alert('No Valid Emails', 'Please enter at least one valid email address.');
      return;
    }

    const invalidEmails = emails.filter(email => email.trim() && !validateEmail(email.trim()));
    if (invalidEmails.length > 0) {
      Alert.alert(
        'Invalid Emails', 
        `The following emails are invalid: ${invalidEmails.join(', ')}`
      );
      return;
    }

    if (validEmails.length > rateLimitInfo.remainingThisHour) {
      Alert.alert(
        'Rate Limit Exceeded', 
        `You can only send ${rateLimitInfo.remainingThisHour} more invites this hour.`
      );
      return;
    }

    try {
      setSending(true);
      
      // TODO: Call sendEventInvite Cloud Function
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Invites Sent!', 
        `Successfully sent ${validEmails.length} invite${validEmails.length === 1 ? '' : 's'}.`,
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );

      // Update rate limit info (mock)
      setRateLimitInfo(prev => ({
        remainingToday: prev.remainingToday - validEmails.length,
        remainingThisHour: prev.remainingThisHour - validEmails.length,
      }));

    } catch (error) {
      console.error('Error sending invites:', error);
      Alert.alert('Error', 'Failed to send invites. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invite Users</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.rateLimitCard}>
          <Text style={styles.rateLimitTitle}>Invite Limits</Text>
          <View style={styles.rateLimitRow}>
            <Text style={styles.rateLimitLabel}>Remaining this hour:</Text>
            <Text style={styles.rateLimitValue}>{rateLimitInfo.remainingThisHour}</Text>
          </View>
          <View style={styles.rateLimitRow}>
            <Text style={styles.rateLimitLabel}>Remaining today:</Text>
            <Text style={styles.rateLimitValue}>{rateLimitInfo.remainingToday}</Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>Email Addresses</Text>
          <Text style={styles.sectionDescription}>
            Enter the email addresses of people you'd like to invite to this event.
          </Text>

          {emails.map((email, index) => (
            <View key={index} style={styles.emailRow}>
              <TextInput
                style={[
                  styles.emailInput,
                  email.trim() && !validateEmail(email.trim()) && styles.emailInputError
                ]}
                placeholder="Enter email address"
                value={email}
                onChangeText={(value) => updateEmail(index, value)}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {emails.length > 1 && (
                <TouchableOpacity 
                  style={styles.removeButton}
                  onPress={() => removeEmailField(index)}
                >
                  <X size={20} color={COLORS.red[600]} />
                </TouchableOpacity>
              )}
            </View>
          ))}

          <TouchableOpacity style={styles.addButton} onPress={addEmailField}>
            <Plus size={20} color={COLORS.primary[700]} />
            <Text style={styles.addButtonText}>Add another email</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[styles.sendButton, sending && styles.sendButtonDisabled]} 
            onPress={handleSendInvites}
            disabled={sending}
          >
            {sending ? (
              <View style={styles.sendingContent}>
                <ActivityIndicator size="small" color="white" />
                <Text style={styles.sendButtonText}>Sending Invites...</Text>
              </View>
            ) : (
              <Text style={styles.sendButtonText}>Send Invites</Text>
            )}
          </TouchableOpacity>

          <Text style={styles.helpText}>
            Invites will expire in 7 days. Recipients will receive an email with a link to join the event.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    backgroundColor: COLORS.primary[700],
    padding: SPACING.m,
    paddingBottom: SPACING.l,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: SPACING.m,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter-Bold',
  },
  content: {
    flex: 1,
    padding: SPACING.l,
  },
  rateLimitCard: {
    backgroundColor: COLORS.blue[50],
    borderRadius: 12,
    padding: SPACING.m,
    marginBottom: SPACING.l,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.blue[500],
  },
  rateLimitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.blue[800],
    marginBottom: SPACING.s,
  },
  rateLimitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  rateLimitLabel: {
    fontSize: 14,
    color: COLORS.blue[700],
  },
  rateLimitValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.blue[800],
  },
  formSection: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.gray[900],
    marginBottom: SPACING.s,
  },
  sectionDescription: {
    fontSize: 14,
    color: COLORS.gray[600],
    marginBottom: SPACING.l,
    lineHeight: 20,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  emailInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.gray[300],
    borderRadius: 8,
    paddingHorizontal: SPACING.m,
    paddingVertical: SPACING.m,
    fontSize: 16,
    backgroundColor: 'white',
  },
  emailInputError: {
    borderColor: COLORS.red[500],
  },
  removeButton: {
    marginLeft: SPACING.s,
    padding: SPACING.s,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.m,
  },
  addButtonText: {
    marginLeft: SPACING.s,
    fontSize: 16,
    color: COLORS.primary[700],
    fontWeight: '600',
  },
  actionSection: {
    alignItems: 'center',
  },
  sendButton: {
    backgroundColor: COLORS.primary[700],
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.m,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  sendButtonDisabled: {
    opacity: 0.7,
  },
  sendingContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sendButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: SPACING.s,
  },
  helpText: {
    fontSize: 12,
    color: COLORS.gray[500],
    textAlign: 'center',
    lineHeight: 16,
    maxWidth: 300,
  },
});