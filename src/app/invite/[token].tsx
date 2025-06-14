import { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft } from 'lucide-react-native';
import { COLORS, SPACING } from '@/src/lib/constants';
import { formatDate } from '@/src/lib/utils';
import { useAuth } from '@/src/hooks/useAuth';
import type { InviteValidationResult } from '@/src/models/Invite';

export default function InviteScreen() {
  const { token } = useLocalSearchParams();
  const { user, signInWithFacebook } = useAuth();
  const [invite, setInvite] = useState<InviteValidationResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);

  const inviteToken = Array.isArray(token) ? token[0] : token || '';

  useEffect(() => {
    validateInvite();
  }, [inviteToken]);

  const validateInvite = async () => {
    try {
      setLoading(true);
      // TODO: Call validateInviteToken Cloud Function
      // For now, simulate validation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data for development
      setInvite({
        valid: true,
        invite: {
          inviteId: 'test-invite',
          eventId: 'test-event',
          inviterUserId: 'test-user',
          inviteeEmail: 'test@example.com',
          status: 'pending',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          token: inviteToken,
          event: {
            eventId: 'test-event',
            eventName: 'Test Event',
            startDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
            location: 'Test Location',
            ownerId: 'test-owner'
          },
          inviter: {
            id: 'test-user',
            displayName: 'Test User',
            email: 'inviter@example.com'
          }
        }
      });
    } catch (error) {
      console.error('Error validating invite:', error);
      setInvite({
        valid: false,
        error: 'not-found'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!user) {
      try {
        await signInWithFacebook();
        // After successful login, the user will be set and this function can continue
        return;
      } catch (error) {
        Alert.alert('Login Required', 'Please log in with Facebook to accept this invite.');
        return;
      }
    }

    try {
      setAccepting(true);
      // TODO: Call acceptInvite Cloud Function
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      Alert.alert(
        'Invite Accepted!', 
        'You have successfully joined the event.',
        [
          {
            text: 'Go to Event',
            onPress: () => router.replace(`/events/${invite?.invite?.eventId}`)
          }
        ]
      );
    } catch (error) {
      console.error('Error accepting invite:', error);
      Alert.alert('Error', 'Failed to accept invite. Please try again.');
    } finally {
      setAccepting(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary[700]} />
          <Text style={styles.loadingText}>Validating invite...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!invite?.valid) {
    const errorMessage = invite?.error === 'expired' 
      ? 'This invite has expired.'
      : invite?.error === 'already-used'
      ? 'This invite has already been used.'
      : 'This invite is not valid.';

    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ArrowLeft size={24} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Invite</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
            <TouchableOpacity 
              style={styles.secondaryButton} 
              onPress={() => router.replace('/')}
            >
              <Text style={styles.secondaryButtonText}>Go to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const { invite: inviteData } = invite;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <ArrowLeft size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>You're Invited!</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.inviteCard}>
          <Text style={styles.inviterText}>
            {inviteData?.inviter?.displayName || 'Someone'} invited you to:
          </Text>
          
          <View style={styles.eventDetails}>
            <Text style={styles.eventName}>{inviteData?.event?.eventName}</Text>
            {inviteData?.event?.startDate && (
              <Text style={styles.eventDate}>
                📅 {formatDate(inviteData.event.startDate)}
              </Text>
            )}
            {inviteData?.event?.location && (
              <Text style={styles.eventLocation}>
                📍 {inviteData.event.location}
              </Text>
            )}
          </View>

          <View style={styles.expiryInfo}>
            <Text style={styles.expiryText}>
              Expires on {formatDate(inviteData?.expiresAt || '')}
            </Text>
          </View>
        </View>

        <View style={styles.actionSection}>
          {!user && (
            <Text style={styles.loginPrompt}>
              Please log in with Facebook to accept this invite
            </Text>
          )}
          
          <TouchableOpacity 
            style={[styles.acceptButton, accepting && styles.acceptButtonDisabled]} 
            onPress={handleAcceptInvite}
            disabled={accepting}
          >
            {accepting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Text style={styles.acceptButtonText}>
                {user ? 'Accept Invite' : 'Login & Accept'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.m,
    fontSize: 16,
    color: COLORS.gray[600],
  },
  inviteCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: SPACING.l,
    marginBottom: SPACING.l,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  inviterText: {
    fontSize: 16,
    color: COLORS.gray[700],
    marginBottom: SPACING.m,
    textAlign: 'center',
  },
  eventDetails: {
    alignItems: 'center',
    marginBottom: SPACING.m,
  },
  eventName: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.gray[900],
    marginBottom: SPACING.s,
    textAlign: 'center',
  },
  eventDate: {
    fontSize: 16,
    color: COLORS.gray[600],
    marginBottom: SPACING.xs,
  },
  eventLocation: {
    fontSize: 16,
    color: COLORS.gray[600],
  },
  expiryInfo: {
    backgroundColor: COLORS.yellow[50],
    padding: SPACING.m,
    borderRadius: 8,
    borderLeft: 4,
    borderLeftColor: COLORS.yellow[400],
  },
  expiryText: {
    fontSize: 14,
    color: COLORS.yellow[800],
    textAlign: 'center',
  },
  actionSection: {
    alignItems: 'center',
  },
  loginPrompt: {
    fontSize: 14,
    color: COLORS.gray[600],
    textAlign: 'center',
    marginBottom: SPACING.m,
  },
  acceptButton: {
    backgroundColor: COLORS.primary[700],
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.m,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  acceptButtonDisabled: {
    opacity: 0.7,
  },
  acceptButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 18,
    color: COLORS.red[600],
    textAlign: 'center',
    marginBottom: SPACING.l,
  },
  secondaryButton: {
    backgroundColor: COLORS.gray[200],
    paddingHorizontal: SPACING.l,
    paddingVertical: SPACING.m,
    borderRadius: 8,
  },
  secondaryButtonText: {
    color: COLORS.gray[700],
    fontSize: 16,
    fontWeight: '600',
  },
});