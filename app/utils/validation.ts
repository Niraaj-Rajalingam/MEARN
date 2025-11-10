/**
 * Validation utilities for common patterns
 * Consolidates UUID and email validation across the application
 */

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const EMAIL_REGEX = /\S+@\S+\.\S+/;

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
 * @returns true if valid email, false otherwise
 */
export const isEmail = (value: string): boolean => {
  return EMAIL_REGEX.test(value);
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
 * Validates a date string
 * @param dateString The date string to validate
 * @returns true if valid date, false otherwise
 */
export const isValidDate = (dateString: string): boolean => {
  return !Number.isNaN(new Date(dateString).getTime());
};
