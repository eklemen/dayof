import { Platform } from 'react-native';
import 'react-native-get-random-values';
import { nanoid } from 'nanoid';
import { format } from 'date-fns';

// Generate a random group code
export function generateGroupCode(length = 8): string {
  return nanoid(length).toUpperCase();
}

// Format date for display
export function formatDate(date: string | Date): string {
  if (!date) return '';
  return format(new Date(date), 'MMM d, yyyy');
}

// Format time for display
export function formatTime(date: string | Date): string {
  return format(new Date(date), 'h:mm a');
}

// Format date and time for display
export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'MMM d, yyyy h:mm a');
}

// Check if a date is in the past
export function isPastDate(date: string | Date): boolean {
  if (!date) { return false; }
  return new Date(date) < new Date();
}

// Check if an event is active
export function isEventActive(endDate: string | Date): boolean {
  if (!endDate) { return false; }
  const end = new Date(endDate);
  end.setDate(end.getDate() + 14); // Active until 14 days after end date
  return new Date() < end;
}

// Check if platform is web
export function isWeb(): boolean {
  return Platform.OS === 'web';
}

// Parse mentions from a message
export function parseMentions(text: string): string[] {
  const regex = /@(\w+)/g;
  const mentions = [];
  let match;

  while ((match = regex.exec(text)) !== null) {
    mentions.push(match[1]);
  }

  return mentions;
}

// Format Instagram handles for copying
export function formatInstagramHandles(handles: string[]): string {
  if (!handles) return '';
  return handles
    .filter(handle => handle && handle.trim() !== '')
    .map(handle => handle.startsWith('@') ? handle : `@${handle}`)
    .join(' ');
}
