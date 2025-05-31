export interface EventCategory {
  categoryId: string; // e.g. "florist", "caterer" or a generated ID for custom ones
  name: string;       // Display name
  assignedUserId: string | null; // UserId assigned to this category, or null if unassigned
  displayName?: string;          // Optional, e.g. "@BestFlorals"
  createdBy: "system" | string;  // "system" for default, or userId for custom
}
