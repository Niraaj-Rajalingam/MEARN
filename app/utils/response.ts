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

