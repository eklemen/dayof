// Event-related type definitions

export interface Event {
  eventId: string;
  eventName: string;
  ownerId: string;
  venueId: string | null;
  startDate: Date | null;
  endDate: Date | null;
  venue?: Venue | null;
  groupCode?: string;
  isArchived?: boolean;
  createdAt?: Date;
}

export interface Venue {
  id: string;
  name: string;
  address?: string | null;
  phone?: string | null;
}

export interface SocialHandles {
  facebook?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
}

export interface VendorData {
  userId: string;
  displayName: string;
  companyName?: string;
  phone?: string;
  email?: string;
  website?: string;
  photoURL?: string;
  social?: SocialHandles;
  categories: string[];
  role?: 'owner' | 'member' | 'planner';
  joinedAt?: Date;
}

export interface EventMember {
  userId: string;
  role: 'owner' | 'member' | 'planner';
  joinedAt: Date;
}

export interface EventCategory {
  id: string;
  name: string;
  assignedUserId?: string | null;
}

// Toast notification types
export type ToastType = 'success' | 'info' | 'error' | 'warning';

// Menu action types
export type MenuAction = 'viewVendors' | 'inviteUsers' | 'eventSettings';

// Modal visibility state
export interface ModalState {
  showMenu: boolean;
  showVendors: boolean;
  showThread: boolean;
}

// Event loading states
export interface EventLoadingState {
  isLoading: boolean;
  error?: string | null;
  data?: Event | null;
}