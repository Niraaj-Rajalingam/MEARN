/**
 * Formatting utilities for consistent data presentation
 */

/**
 * Formats a user's full name from first and last name
 * Falls back to email if no name is provided
 * @param firstName User's first name
 * @param lastName User's last name
 * @param email Fallback email if no name
 * @returns Formatted full name or email
 */
export const formatUserName = (
  firstName?: string | null,
  lastName?: string | null,
  email?: string
): string => {
  const name = [firstName, lastName].filter(Boolean).join(' ').trim();
  return name || email || 'Unknown User';
};

/**
 * Formats a date to ISO string date format (YYYY-MM-DD)
 * Useful for input[type="date"] fields
 * @param date The date to format
 * @returns Formatted date string (YYYY-MM-DD) or empty string if invalid
 */
export const formatDateForInput = (date: string | Date | null | undefined): string => {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toISOString().split('T')[0];
  } catch {
    return '';
  }
};

/**
 * Formats a date for display
 * @param date The date to format
 * @param options Intl.DateTimeFormat options
 * @returns Formatted date string
 */
export const formatDateForDisplay = (
  date: string | Date | null | undefined,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }
): string => {
  if (!date) return '';
  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', options);
  } catch {
    return '';
  }
};

/**
 * Formats a time ago string (e.g., "2 hours ago")
 * @param date The date to format
 * @returns Time ago string
 */
export const formatTimeAgo = (date: string | Date | null | undefined): string => {
  if (!date) return '';

  try {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const seconds = Math.floor((now.getTime() - d.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)} days ago`;
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)} months ago`;
    return `${Math.floor(seconds / 31536000)} years ago`;
  } catch {
    return '';
  }
};

/**
 * Formats a priority level to a readable string
 * @param priority Priority level (1, 2, or 3)
 * @returns Priority label
 */
export const formatPriority = (priority: number | null | undefined): string => {
  switch (priority) {
    case 1:
      return 'Low';
    case 2:
      return 'Medium';
    case 3:
      return 'High';
    default:
      return 'Medium';
  }
};

/**
 * Formats a task status to a readable string
 * @param status Task status
 * @returns Status label
 */
export const formatTaskStatus = (status: string | null | undefined): string => {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'pending':
      return 'Pending';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status || 'Unknown';
  }
};

/**
 * Truncates a string to a maximum length with ellipsis
 * @param text The text to truncate
 * @param maxLength Maximum length
 * @returns Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number = 50): string => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Capitalizes the first letter of a string
 * @param text The text to capitalize
 * @returns Capitalized text
 */
export const capitalize = (text: string): string => {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
};

/**
 * Converts a string to a URL-friendly slug
 * @param text The text to convert
 * @returns URL slug
 */
export const toSlug = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
};
