import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as crypto from 'crypto';

// Regional functions for us-central1
const regionalFunctions = functions.region('us-central1');
const db = admin.firestore();

// Rate limiting constants
const RATE_LIMITS = {
  MAX_INVITES_PER_HOUR: 20,
  MAX_INVITES_PER_DAY: 100,
  INVITE_EXPIRY_DAYS: 7,
};

// Interfaces
interface SendInviteRequest {
  eventId: string;
  emails: string[];
}

interface InviteData {
  inviteId: string;
  eventId: string;
  inviterUserId: string;
  inviteeEmail: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: admin.firestore.Timestamp;
  expiresAt: admin.firestore.Timestamp;
  token: string;
}

/**
 * Generate a secure 256-bit token
 */
function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Check rate limits for a user
 */
async function checkRateLimit(userId: string): Promise<{ allowed: boolean; stats: any }> {
  const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const now = admin.firestore.Timestamp.now();
  const oneHourAgo = admin.firestore.Timestamp.fromMillis(now.toMillis() - 60 * 60 * 1000);

  const statsRef = db.collection('users').doc(userId).collection('inviteStats').doc('current');
  const statsDoc = await statsRef.get();

  let stats = {
    invitesSentToday: 0,
    invitesSentThisHour: 0,
    lastResetDate: today,
    lastInviteTimestamp: now,
  };

  if (statsDoc.exists) {
    const data = statsDoc.data()!;
    
    // Reset daily counter if new day
    if (data.lastResetDate !== today) {
      stats.invitesSentToday = 0;
      stats.invitesSentThisHour = 0;
    } else {
      stats.invitesSentToday = data.invitesSentToday || 0;
      
      // Reset hourly counter if more than an hour has passed
      const lastInvite = data.lastInviteTimestamp as admin.firestore.Timestamp;
      if (lastInvite && lastInvite.toMillis() < oneHourAgo.toMillis()) {
        stats.invitesSentThisHour = 0;
      } else {
        stats.invitesSentThisHour = data.invitesSentThisHour || 0;
      }
    }
  }

  const allowed = stats.invitesSentThisHour < RATE_LIMITS.MAX_INVITES_PER_HOUR &&
                  stats.invitesSentToday < RATE_LIMITS.MAX_INVITES_PER_DAY;

  return { allowed, stats };
}

/**
 * Update invite statistics
 */
async function updateInviteStats(userId: string, inviteCount: number) {
  const today = new Date().toISOString().split('T')[0];
  const statsRef = db.collection('users').doc(userId).collection('inviteStats').doc('current');

  await statsRef.set({
    invitesSentToday: admin.firestore.FieldValue.increment(inviteCount),
    invitesSentThisHour: admin.firestore.FieldValue.increment(inviteCount),
    lastResetDate: today,
    lastInviteTimestamp: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });
}

/**
 * Send event invites
 */
export const sendEventInvite = regionalFunctions.https.onCall(async (data: SendInviteRequest, context) => {
  // Validate authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { eventId, emails } = data;
  const userId = context.auth.uid;

  // Validate input
  if (!eventId || !emails || !Array.isArray(emails) || emails.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid eventId or emails');
  }

  // Validate emails
  const validEmails = emails.filter(email => isValidEmail(email));
  if (validEmails.length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'No valid emails provided');
  }

  // Check if user owns the event
  const eventDoc = await db.collection('events').doc(eventId).get();
  if (!eventDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'Event not found');
  }

  const eventData = eventDoc.data()!;
  if (eventData.ownerId !== userId) {
    throw new functions.https.HttpsError('permission-denied', 'Only event owner can send invites');
  }

  // Check rate limits
  const { allowed, stats } = await checkRateLimit(userId);
  if (!allowed) {
    throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded');
  }

  if (validEmails.length > (RATE_LIMITS.MAX_INVITES_PER_HOUR - stats.invitesSentThisHour)) {
    throw new functions.https.HttpsError('resource-exhausted', 'Would exceed hourly rate limit');
  }

  // Create invites
  const batch = db.batch();
  const invitePromises: Promise<any>[] = [];
  const now = admin.firestore.Timestamp.now();
  const expiresAt = admin.firestore.Timestamp.fromMillis(
    now.toMillis() + (RATE_LIMITS.INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000)
  );

  for (const email of validEmails) {
    const inviteId = db.collection('events').doc(eventId).collection('invites').doc().id;
    const token = generateSecureToken();

    const inviteData: InviteData = {
      inviteId,
      eventId,
      inviterUserId: userId,
      inviteeEmail: email.trim().toLowerCase(),
      status: 'pending',
      createdAt: now,
      expiresAt,
      token,
    };

    const inviteRef = db.collection('events').doc(eventId).collection('invites').doc(inviteId);
    batch.set(inviteRef, inviteData);

    // TODO: Send email via SendGrid
    // invitePromises.push(sendInviteEmail(inviteData, eventData));
  }

  // Update invite stats
  await updateInviteStats(userId, validEmails.length);

  // Commit batch
  await batch.commit();

  // Wait for email sending (when implemented)
  await Promise.all(invitePromises);

  return {
    success: true,
    invitesSent: validEmails.length,
    rateLimitInfo: {
      remainingToday: RATE_LIMITS.MAX_INVITES_PER_DAY - stats.invitesSentToday - validEmails.length,
      remainingThisHour: RATE_LIMITS.MAX_INVITES_PER_HOUR - stats.invitesSentThisHour - validEmails.length,
    },
  };
});

/**
 * Validate invite token
 */
export const validateInviteToken = regionalFunctions.https.onCall(async (data: { token: string }, context) => {
  const { token } = data;

  if (!token || typeof token !== 'string' || token.length !== 64) {
    return { valid: false, error: 'invalid-token' };
  }

  try {
    // Query for invite with this token
    const invitesQuery = await db.collectionGroup('invites')
      .where('token', '==', token)
      .limit(1)
      .get();

    if (invitesQuery.empty) {
      return { valid: false, error: 'not-found' };
    }

    const inviteDoc = invitesQuery.docs[0];
    const invite = inviteDoc.data();
    const now = admin.firestore.Timestamp.now();

    // Check if expired
    if (invite.expiresAt.toMillis() < now.toMillis()) {
      return { valid: false, error: 'expired' };
    }

    // Check if already used
    if (invite.status === 'accepted') {
      return { valid: false, error: 'already-used' };
    }

    // Get event and inviter details
    const [eventDoc, inviterDoc] = await Promise.all([
      db.collection('events').doc(invite.eventId).get(),
      db.collection('users').doc(invite.inviterUserId).get(),
    ]);

    return {
      valid: true,
      invite: {
        ...invite,
        createdAt: invite.createdAt.toDate().toISOString(),
        expiresAt: invite.expiresAt.toDate().toISOString(),
        event: eventDoc.exists ? eventDoc.data() : null,
        inviter: inviterDoc.exists ? inviterDoc.data() : null,
      },
    };
  } catch (error) {
    console.error('Error validating invite:', error);
    return { valid: false, error: 'not-found' };
  }
});

/**
 * Accept invite
 */
export const acceptInvite = regionalFunctions.https.onCall(async (data: { token: string }, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { token } = data;
  const userId = context.auth.uid;

  if (!token || typeof token !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid token');
  }

  try {
    // Find invite
    const invitesQuery = await db.collectionGroup('invites')
      .where('token', '==', token)
      .limit(1)
      .get();

    if (invitesQuery.empty) {
      throw new functions.https.HttpsError('not-found', 'Invite not found');
    }

    const inviteDoc = invitesQuery.docs[0];
    const invite = inviteDoc.data();
    const now = admin.firestore.Timestamp.now();

    // Validate invite
    if (invite.expiresAt.toMillis() < now.toMillis()) {
      throw new functions.https.HttpsError('failed-precondition', 'Invite expired');
    }

    if (invite.status === 'accepted') {
      throw new functions.https.HttpsError('failed-precondition', 'Invite already used');
    }

    // Update invite status and add user to event
    const batch = db.batch();

    // Mark invite as accepted
    batch.update(inviteDoc.ref, {
      status: 'accepted',
      acceptedAt: now,
    });

    // Add user as event member
    const memberRef = db.collection('events').doc(invite.eventId).collection('members').doc(userId);
    batch.set(memberRef, {
      userId,
      joinedAt: now,
      role: 'member',
      invitedBy: invite.inviterUserId,
    });

    await batch.commit();

    return {
      success: true,
      eventId: invite.eventId,
    };
  } catch (error) {
    console.error('Error accepting invite:', error);
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    throw new functions.https.HttpsError('internal', 'Failed to accept invite');
  }
});

/**
 * Get invite statistics
 */
export const getInviteStats = regionalFunctions.https.onCall(async (data: { userId: string }, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const { userId } = data;
  
  if (context.auth.uid !== userId) {
    throw new functions.https.HttpsError('permission-denied', 'Can only get own stats');
  }

  const { stats } = await checkRateLimit(userId);
  
  return {
    ...stats,
    maxPerHour: RATE_LIMITS.MAX_INVITES_PER_HOUR,
    maxPerDay: RATE_LIMITS.MAX_INVITES_PER_DAY,
  };
});

/**
 * Cleanup expired invites (scheduled function)
 */
export const cleanupExpiredInvites = regionalFunctions.pubsub
  .schedule('0 2 * * *') // Daily at 2 AM
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    
    // Find expired invites
    const expiredQuery = await db.collectionGroup('invites')
      .where('expiresAt', '<', now)
      .where('status', '==', 'pending')
      .get();

    if (expiredQuery.empty) {
      console.log('No expired invites to clean up');
      return null;
    }

    // Update expired invites
    const batch = db.batch();
    expiredQuery.docs.forEach(doc => {
      batch.update(doc.ref, { status: 'expired' });
    });

    await batch.commit();
    console.log(`Marked ${expiredQuery.size} invites as expired`);
    
    return null;
  });

/**
 * Reset invite stats (scheduled function)
 */
export const resetInviteStats = regionalFunctions.pubsub
  .schedule('0 0 * * *') // Daily at midnight
  .onRun(async (context) => {
    // This is handled automatically by checkRateLimit logic
    console.log('Daily invite stats reset completed');
    return null;
  });

/**
 * Update event invite statistics (Firestore trigger)
 */
export const updateEventInviteStats = regionalFunctions.firestore
  .document('/events/{eventId}/invites/{inviteId}')
  .onWrite(async (change, context) => {
    const eventId = context.params.eventId;
    
    // Count pending invites
    const pendingQuery = await db.collection('events').doc(eventId).collection('invites')
      .where('status', '==', 'pending')
      .get();

    // Get all invited emails
    const allInvitesQuery = await db.collection('events').doc(eventId).collection('invites').get();
    const invitedEmails = allInvitesQuery.docs.map(doc => doc.data().inviteeEmail);

    // Update event document
    await db.collection('events').doc(eventId).update({
      pendingInvites: pendingQuery.size,
      invitedEmails: invitedEmails,
    });

    console.log(`Updated event ${eventId} invite stats: ${pendingQuery.size} pending`);
    return null;
  });

/**
 * Handle SendGrid webhook (placeholder)
 */
export const handleSendGridWebhook = regionalFunctions.https.onRequest(async (req, res) => {
  // TODO: Implement SendGrid webhook handling
  // Handle bounce/spam reports and update blockedEmails collection
  
  console.log('SendGrid webhook received:', req.body);
  res.status(200).send('OK');
});