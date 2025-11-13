/**
 * Standardized response builders for server actions
 * Provides consistent response patterns across all action files
 */

export type SuccessResponse<T = any> = {
  readonly success: true;
} & T;

export type ErrorResponse = {
  readonly success: false;
  readonly error: string;
};

export type ActionResponse<T = any> = SuccessResponse<T> | ErrorResponse;

/**
 * Creates a standardized success response
 * @param data Additional data to include in the response
 * @returns Success response object
 */
export const successResponse = <T extends Record<string, any>>(data: T): SuccessResponse<T> => {
  return {
    success: true,
    ...data,
  } as SuccessResponse<T>;
};

/**
 * Creates a standardized error response
 * @param error The error message
 * @returns Error response object
 */
export const errorResponse = (error: string): ErrorResponse => {
  return {
    success: false,
    error,
  };
};

/**
 * Creates a task success response
 * @param task The task object to include
 * @returns Success response with task
 */
export const taskSuccessResponse = (task: any) => {
  return successResponse({ task });
};

/**
 * Creates a tasks success response (array)
 * @param tasks Array of task objects
 * @param pagination Optional pagination info
 * @returns Success response with tasks and pagination
 */
export const tasksSuccessResponse = (
  tasks: any[],
  pagination?: { page: number; hasMore: boolean; total: number }
) => {
  return successResponse({
    tasks,
    ...(pagination && pagination),
  });
};

/**
 * Creates a user success response
 * @param user The user object
 * @returns Success response with user
 */
export const userSuccessResponse = (user: any) => {
  return successResponse({ user });
};

/**
 * Creates a list success response
 * @param key The key name for the list (e.g., 'friends', 'groups')
 * @param data The list data
 * @returns Success response with list
 */
export const listSuccessResponse = <T extends Record<string, any>>(key: string, data: any[]) => {
  return successResponse({ [key]: data } as T);
};

/**
 * Validates input and returns error if invalid
 * @param condition The condition to check (should be true if valid)
 * @param errorMessage The error message if invalid
 * @returns Error response if invalid, null if valid
 */
export const validateInput = (
  condition: boolean,
  errorMessage: string
): ErrorResponse | null => {
  return condition ? null : errorResponse(errorMessage);
};

/**
 * Creates a response with a custom key
 * @param key The key name
 * @param value The value
 * @returns Success response with custom key
 */
export const customResponse = <T extends Record<string, any>>(
  key: string,
  value: any
): SuccessResponse<T> => {
  return successResponse({ [key]: value } as T);
};
