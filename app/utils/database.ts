/**
 * Shared database utilities and error handling
 */

/**
 * Logs a database error with context
 * @param context Description of what was being done when the error occurred
 * @param error The error object
 * @returns A user-friendly error message
 */
export const logDatabaseError = (context: string, error: unknown): string => {
  console.log(`An error occurred ${context}`);
  console.log(error);
  return 'A database error occurred';
};

/**
 * Safely extracts the first result from a database query
 * @param result The result array from a database query
 * @returns The first result or undefined
 */
export const getFirstResult = <T>(result: T[] | undefined): T | undefined => {
  return result?.[0];
};

/**
 * Checks if a database query returned any results
 * @param result The result from a database query
 * @returns true if result exists and has items, false otherwise
 */
export const hasResults = (result: unknown): boolean => {
  return Array.isArray(result) && result.length > 0;
};

/**
 * Pagination helper to calculate offset
 * @param page Current page number (1-based)
 * @param pageSize Number of items per page
 * @returns Offset for database query
 */
export const calculatePaginationOffset = (page: number, pageSize: number = 50): number => {
  const pageNum = Math.max(1, Number.isNaN(page) ? 1 : page);
  return (pageNum - 1) * pageSize;
};

/**
 * Builds pagination metadata
 * @param page Current page number
 * @param pageSize Number of items per page
 * @param total Total number of items
 * @returns Pagination object
 */
export const buildPaginationMetadata = (
  page: number,
  pageSize: number,
  total: number
): { page: number; hasMore: boolean; total: number } => {
  const pageNum = Math.max(1, Number.isNaN(page) ? 1 : page);
  const hasMore = pageNum * pageSize < total;
  return {
    page: pageNum,
    hasMore,
    total,
  };
};

/**
 * Combines database results with pagination metadata
 * @param results Array of results
 * @param page Current page
 * @param pageSize Items per page
 * @param total Total items
 * @returns Object with results and pagination
 */
export const addPaginationToResults = <T>(
  results: T[],
  page: number,
  pageSize: number,
  total: number
) => {
  return {
    results,
    ...buildPaginationMetadata(page, pageSize, total),
  };
};
