/**
 * Rate limiting service for generation requests
 * Tracks user generation attempts in memory with a sliding window
 */
class RateLimitService {
  private requests = new Map<string, number[]>();
  private readonly maxRequests = 10;
  private readonly windowMs = 60 * 60 * 1000; // 1 hour in milliseconds

  /**
   * Checks if a user has exceeded their generation quota
   * Uses a sliding window approach to track requests
   *
   * @param userId - The authenticated user's ID
   * @returns true if the request is allowed, false if rate limit exceeded
   */
  checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userRequests = this.requests.get(userId) || [];

    // Remove timestamps older than the time window
    const validRequests = userRequests.filter((timestamp) => now - timestamp < this.windowMs);

    // Check if user has exceeded the limit
    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    // Add current timestamp and update the map
    validRequests.push(now);
    this.requests.set(userId, validRequests);

    return true;
  }

  /**
   * Clears rate limit data for a specific user
   * Useful for testing or administrative purposes
   *
   * @param userId - The user's ID to clear
   */
  clearUserLimit(userId: string): void {
    this.requests.delete(userId);
  }

  /**
   * Clears all rate limit data
   * Useful for testing purposes
   */
  clearAllLimits(): void {
    this.requests.clear();
  }
}

// Export singleton instance
export const rateLimitService = new RateLimitService();
