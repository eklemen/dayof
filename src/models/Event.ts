export interface Event {
  eventId: string;
  eventName: string;
  ownerId: string;
  venueId?: string;
  startDate?: string; // ISO date
  endDate?: string;   // ISO date
}
