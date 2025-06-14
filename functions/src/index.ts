import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin SDK
admin.initializeApp();

// Regional functions for us-central1
const regionalFunctions = functions.region('us-central1');

// Import invite functions
import { 
  sendEventInvite, 
  validateInviteToken, 
  acceptInvite, 
  getInviteStats,
  cleanupExpiredInvites,
  resetInviteStats,
  updateEventInviteStats,
  handleSendGridWebhook
} from './invites';

// Export invite functions
export const sendEventInviteFunction = sendEventInvite;
export const validateInviteTokenFunction = validateInviteToken;
export const acceptInviteFunction = acceptInvite;
export const getInviteStatsFunction = getInviteStats;
export const cleanupExpiredInvitesFunction = cleanupExpiredInvites;
export const resetInviteStatsFunction = resetInviteStats;
export const updateEventInviteStatsFunction = updateEventInviteStats;
export const handleSendGridWebhookFunction = handleSendGridWebhook;

// Health check function
export const healthCheck = regionalFunctions.https.onRequest((req, res) => {
  res.status(200).send({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    region: 'us-central1'
  });
});