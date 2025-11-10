/**
 * Validation utilities for common patterns
 * Consolidates UUID and email validation across the application
 */

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const EMAIL_REGEX = /\S+@\S+\.\S+/;
export const STRICT_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates if a string is a valid UUID
 * @param value The string to validate
 * @returns true if valid UUID, false otherwise
 */
export const isUUID = (value: string): boolean => {
  return UUID_REGEX.test(value);
};

/**
 * Validates if a string is a valid email
 * @param value The string to validate
 * @param strict If true, uses stricter email validation
 * @returns true if valid email, false otherwise
 */
export const isEmail = (value: string, strict = false): boolean => {
  const regex = strict ? STRICT_EMAIL_REGEX : EMAIL_REGEX;
  return regex.test(value);
};

/**
 * Validates and parses priority level
 * @param value The priority value (number or string)
 * @returns Priority as number (1, 2, or 3), defaults to 2
 */
export const parsePriority = (value?: number | string): 1 | 2 | 3 => {
  const num = typeof value === 'string' ? Number.parseInt(value, 10) : value;
  if (num === 1 || num === 2 || num === 3) {
    return num;
  }
  return 2;
};

/**
 * Validates task status
 * @param status The status to validate
 * @returns true if valid status, false otherwise
 */
export const isValidTaskStatus = (status: string): status is 'draft' | 'pending' | 'in_progress' | 'completed' | 'cancelled' => {
  return ['draft', 'pending', 'in_progress', 'completed', 'cancelled'].includes(status);
};

/**
 * Validates that a status is in the allowed set
 * @param status The status to check
 * @param allowedStatuses Array of allowed statuses
 * @returns true if status is in allowed set, false otherwise
 */
export const isStatusAllowed = (status: string, allowedStatuses: string[]): boolean => {
  return allowedStatuses.includes(status);
};

/**
 * Validates a date string
 * @param dateString The date string to validate
 * @returns true if valid date, false otherwise
 */
export const isValidDate = (dateString: string): boolean => {
  return !Number.isNaN(new Date(dateString).getTime());
};

/**
 * Validates form input for tasks
 * @param title Task title
 * @param email Optional email to validate
 * @param dueDate Optional due date to validate
 * @returns Object with validation errors (empty if all valid)
 */
export const validateTaskForm = (
  title: string,
  email?: string,
  dueDate?: string
): Record<string, string> => {
  const errors: Record<string, string> = {};

  if (!title.trim()) {
    errors.title = 'Please enter a task title.';
  }

  if (email && email.trim() && !isEmail(email.trim())) {
    errors.assigneeEmail = 'Enter a valid email address.';
  }

  if (dueDate && !isValidDate(dueDate)) {
    errors.dueDate = 'Enter a valid date.';
  }

  return errors;
};
