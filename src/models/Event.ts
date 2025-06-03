import type { Venue } from '@/src/models/Venue';

export interface Event {
  eventId: string;
  eventName: string;
  ownerId: string;
  venueId: string;
  startDate?: string | Date; // ISO date
  endDate?: string | Date;   // ISO date
  venue?: Venue;
}
