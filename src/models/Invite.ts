import { Timestamp } from '@react-native-firebase/firestore';
import type { Event } from './Event';
import type { UserProfile } from './User';

export type InviteStatus = 'pending' | 'accepted' | 'declined' | 'expired';

export interface Invite {
  inviteId: string;
  eventId: string;
  inviterUserId: string;
  inviteeEmail: string;
  status: InviteStatus;
  createdAt: string; // ISO date string
  expiresAt: string; // ISO date string
  acceptedAt?: string; // Combined acceptedAt/usedAt into single field
  token: string; // 256-bit entropy token
  // Populated fields (not stored in Firestore)
  event?: Event;
  inviter?: UserProfile;
}

export interface InviteValidationResult {
  valid: boolean;
  invite?: Invite;
  error?: 'expired' | 'not-found' | 'already-used' | 'invalid-token';
}

export interface InviteStats {
  userId: string;
  invitesSentToday: number;
  invitesSentThisHour: number;
  lastInviteTimestamp: string;
  lastResetDate: string; // YYYY-MM-DD format
}

export interface BlockedEmail {
  emailHash: string; // SHA256 hash of email
  reason: 'bounce' | 'spam' | 'invalid';
  blockedAt: string;
  bounceCount: number;
}

export interface SendInviteRequest {
  eventId: string;
  emails: string[];
}

export interface SendInviteResponse {
  success: boolean;
  invitesSent: number;
  errors?: string[];
  rateLimitInfo?: {
    remainingToday: number;
    remainingThisHour: number;
    resetTime: string;
  };
}

export interface EmailTemplateVars {
  inviterName: string;
  inviterAvatar?: string;
  eventName: string;
  eventDate: string;
  eventLocation: string;
  eventDescription?: string;
  eventImageUrl?: string;
  inviteLink: string;
  expirationDate: string;
  appStoreLink: string;
}

// Rate limiting constants
export const INVITE_RATE_LIMITS = {
  MAX_INVITES_PER_HOUR: 20,
  MAX_INVITES_PER_DAY: 100,
  COOLDOWN_MINUTES: 60,
  INVITE_EXPIRY_DAYS: 7,
} as const;