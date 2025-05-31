export type MemberRole = "planner" | "vendor" | "owner";

export interface EventMember {
  userId: string;
  role: MemberRole;
  joinedAt: string; // ISO date string
}
