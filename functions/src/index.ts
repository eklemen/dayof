import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Import invite functions
import {
  sendEventInvite,
  validateInviteToken,
  acceptInvite,
  getInviteStats,
  cleanupExpiredInvites,
  resetInviteStats,
  updateEventInviteStats,
  handleSendGridWebhook,
} from "./invites";

// Export invite functions
export const sendEventInviteFunction = sendEventInvite;
export const validateInviteTokenFunction = validateInviteToken;
export const acceptInviteFunction = acceptInvite;
export const getInviteStatsFunction = getInviteStats;
export const cleanupExpiredInvitesFunction = cleanupExpiredInvites;
export const resetInviteStatsFunction = resetInviteStats;
export const updateEventInviteStatsFunction = updateEventInviteStats;
export const handleSendGridWebhookFunction = handleSendGridWebhook;
