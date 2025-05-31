export interface SocialHandles {
  facebook?: string;
  instagram?: string;
  youtube?: string;
  tiktok?: string;
}

export interface UserProfile {
  userId: string;
  displayName: string;
  companyName?: string;
  phone?: string;
  email?: string;
  website?: string;
  photoURL?: string;
  social?: SocialHandles;
}
