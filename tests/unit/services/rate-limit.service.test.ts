import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { rateLimitService } from "@/lib/services/rate-limit.service";

describe("RateLimitService", () => {
  let mockTime = 1000000000;

  beforeEach(() => {
    // Mock Date.now for deterministic time-based tests
    vi.spyOn(Date, "now").mockImplementation(() => mockTime);
    // Clear all limits before each test
    rateLimitService.clearAllLimits();
  });

  afterEach(() => {
    // Restore original Date.now
    vi.spyOn(Date, "now").mockRestore();
  });

  describe("checkRateLimit", () => {
    describe("within limit scenarios", () => {
      it("should allow first request for new user", () => {
        // Arrange
        const userId = "user-1";

        // Act
        const result = rateLimitService.checkRateLimit(userId);

        // Assert
        expect(result).toBe(true);
      });

      it("should allow requests up to the limit (10 requests)", () => {
        // Arrange
        const userId = "user-2";

        // Act & Assert - First 10 requests should succeed
        for (let i = 0; i < 10; i++) {
          const result = rateLimitService.checkRateLimit(userId);
          expect(result).toBe(true);
        }
      });

      it("should allow new requests after old ones expire from sliding window", () => {
        // Arrange
        const userId = "user-3";
        const oneHourMs = 60 * 60 * 1000;

        // Fill up the limit
        for (let i = 0; i < 10; i++) {
          rateLimitService.checkRateLimit(userId);
        }

        // Act - Move time forward past the window
        mockTime += oneHourMs + 1000; // 1 hour + 1 second

        const result = rateLimitService.checkRateLimit(userId);

        // Assert
        expect(result).toBe(true);
      });

      it("should allow requests as old ones gradually expire", () => {
        // Arrange
        const userId = "user-4";
        const thirtyMinutesMs = 30 * 60 * 1000;

        // Make 10 requests at time T
        for (let i = 0; i < 10; i++) {
          rateLimitService.checkRateLimit(userId);
        }

        // Act - Move time forward 30 minutes (still within 1 hour window)
        mockTime += thirtyMinutesMs;

        // Should be blocked (old requests still in window)
        expect(rateLimitService.checkRateLimit(userId)).toBe(false);

        // Move time forward another 31 minutes (past 1 hour from first requests)
        mockTime += 31 * 60 * 1000;

        // Should be allowed (old requests expired)
        const result = rateLimitService.checkRateLimit(userId);

        // Assert
        expect(result).toBe(true);
      });
    });

    describe("limit exceeded scenarios", () => {
      it("should block 11th request within time window", () => {
        // Arrange
        const userId = "user-5";

        // Fill up the limit
        for (let i = 0; i < 10; i++) {
          rateLimitService.checkRateLimit(userId);
        }

        // Act - 11th request
        const result = rateLimitService.checkRateLimit(userId);

        // Assert
        expect(result).toBe(false);
      });

      it("should continue blocking requests until window expires", () => {
        // Arrange
        const userId = "user-6";

        // Fill up the limit
        for (let i = 0; i < 10; i++) {
          rateLimitService.checkRateLimit(userId);
        }

        // Act & Assert - Multiple blocked requests
        expect(rateLimitService.checkRateLimit(userId)).toBe(false);
        expect(rateLimitService.checkRateLimit(userId)).toBe(false);
        expect(rateLimitService.checkRateLimit(userId)).toBe(false);
      });

      it("should not increment counter when request is blocked", () => {
        // Arrange
        const userId = "user-7";

        // Fill up the limit
        for (let i = 0; i < 10; i++) {
          rateLimitService.checkRateLimit(userId);
        }

        // Act - Make blocked requests
        rateLimitService.checkRateLimit(userId);
        rateLimitService.checkRateLimit(userId);

        // Move time forward to expire all requests
        mockTime += 60 * 60 * 1000 + 1000;

        // Should allow exactly 10 new requests (blocked requests weren't counted)
        for (let i = 0; i < 10; i++) {
          const result = rateLimitService.checkRateLimit(userId);
          expect(result).toBe(true);
        }

        // Assert - 11th should be blocked
        expect(rateLimitService.checkRateLimit(userId)).toBe(false);
      });
    });

    describe("edge cases", () => {
      it("should handle request exactly at limit boundary", () => {
        // Arrange
        const userId = "user-8";

        // Make exactly 10 requests
        for (let i = 0; i < 10; i++) {
          expect(rateLimitService.checkRateLimit(userId)).toBe(true);
        }

        // Act & Assert - Next request should be blocked
        expect(rateLimitService.checkRateLimit(userId)).toBe(false);
      });

      it("should handle request exactly at time window boundary", () => {
        // Arrange
        const userId = "user-9";
        const oneHourMs = 60 * 60 * 1000;

        rateLimitService.checkRateLimit(userId);

        // Act - Move time to exactly 1 hour
        mockTime += oneHourMs;

        // Request at exactly 1 hour should still be in window
        const resultAtBoundary = rateLimitService.checkRateLimit(userId);

        // Move time 1ms past 1 hour
        mockTime += 1;
        const resultPastBoundary = rateLimitService.checkRateLimit(userId);

        // Assert
        expect(resultAtBoundary).toBe(true);
        expect(resultPastBoundary).toBe(true);
      });

      it("should handle empty userId string", () => {
        // Arrange
        const userId = "";

        // Act
        const result = rateLimitService.checkRateLimit(userId);

        // Assert - Should still work (tracking empty string as valid key)
        expect(result).toBe(true);
      });

      it("should handle rapid sequential requests", () => {
        // Arrange
        const userId = "user-10";

        // Act - Make 10 requests in rapid succession (same timestamp)
        const results = [];
        for (let i = 0; i < 12; i++) {
          results.push(rateLimitService.checkRateLimit(userId));
        }

        // Assert
        expect(results.slice(0, 10).every((r) => r === true)).toBe(true);
        expect(results.slice(10).every((r) => r === false)).toBe(true);
      });
    });

    describe("multi-user isolation", () => {
      it("should track different users independently", () => {
        // Arrange
        const user1 = "user-11";
        const user2 = "user-12";

        // Act - Fill limit for user1
        for (let i = 0; i < 10; i++) {
          rateLimitService.checkRateLimit(user1);
        }

        // user1 should be blocked
        const user1Result = rateLimitService.checkRateLimit(user1);

        // user2 should still be allowed
        const user2Result = rateLimitService.checkRateLimit(user2);

        // Assert
        expect(user1Result).toBe(false);
        expect(user2Result).toBe(true);
      });

      it("should handle multiple users simultaneously", () => {
        // Arrange
        const users = ["user-13", "user-14", "user-15"];

        // Act - Each user makes 5 requests
        users.forEach((userId) => {
          for (let i = 0; i < 5; i++) {
            expect(rateLimitService.checkRateLimit(userId)).toBe(true);
          }
        });

        // Each user should still have quota
        users.forEach((userId) => {
          expect(rateLimitService.checkRateLimit(userId)).toBe(true);
        });
      });
    });

    describe("sliding window behavior", () => {
      it("should remove only expired requests from window", () => {
        // Arrange
        const userId = "user-16";
        const thirtyMinutesMs = 30 * 60 * 1000;

        // Make 5 requests at T=0
        for (let i = 0; i < 5; i++) {
          rateLimitService.checkRateLimit(userId);
        }

        // Move time forward 30 minutes
        mockTime += thirtyMinutesMs;

        // Make 5 more requests at T=30min
        for (let i = 0; i < 5; i++) {
          rateLimitService.checkRateLimit(userId);
        }

        // At T=30min, should have 10 requests in window (5 + 5)
        expect(rateLimitService.checkRateLimit(userId)).toBe(false);

        // Move time to T=61min (past first 5 requests)
        mockTime += 31 * 60 * 1000;

        // Should have 5 requests in window (first 5 expired, second 5 remain)
        const result = rateLimitService.checkRateLimit(userId);

        // Assert
        expect(result).toBe(true);
      });
    });
  });

  describe("clearUserLimit", () => {
    it("should remove rate limit data for specific user", () => {
      // Arrange
      const userId = "user-17";

      // Fill up the limit
      for (let i = 0; i < 10; i++) {
        rateLimitService.checkRateLimit(userId);
      }

      // Verify user is blocked
      expect(rateLimitService.checkRateLimit(userId)).toBe(false);

      // Act
      rateLimitService.clearUserLimit(userId);

      // Assert - User should be able to make requests again
      expect(rateLimitService.checkRateLimit(userId)).toBe(true);
    });

    it("should only affect specified user", () => {
      // Arrange
      const user1 = "user-18";
      const user2 = "user-19";

      // Fill limits for both users
      for (let i = 0; i < 10; i++) {
        rateLimitService.checkRateLimit(user1);
        rateLimitService.checkRateLimit(user2);
      }

      // Act
      rateLimitService.clearUserLimit(user1);

      // Assert
      expect(rateLimitService.checkRateLimit(user1)).toBe(true); // user1 cleared
      expect(rateLimitService.checkRateLimit(user2)).toBe(false); // user2 still blocked
    });

    it("should handle clearing non-existent user without error", () => {
      // Arrange
      const nonExistentUser = "user-20";

      // Act & Assert - Should not throw
      expect(() => {
        rateLimitService.clearUserLimit(nonExistentUser);
      }).not.toThrow();
    });
  });

  describe("clearAllLimits", () => {
    it("should remove rate limit data for all users", () => {
      // Arrange
      const users = ["user-21", "user-22", "user-23"];

      // Fill limits for all users
      users.forEach((userId) => {
        for (let i = 0; i < 10; i++) {
          rateLimitService.checkRateLimit(userId);
        }
      });

      // Verify all blocked
      users.forEach((userId) => {
        expect(rateLimitService.checkRateLimit(userId)).toBe(false);
      });

      // Act
      rateLimitService.clearAllLimits();

      // Assert - All users should be able to make requests again
      users.forEach((userId) => {
        expect(rateLimitService.checkRateLimit(userId)).toBe(true);
      });
    });

    it("should work when no users exist", () => {
      // Arrange - Clean state

      // Act & Assert - Should not throw
      expect(() => {
        rateLimitService.clearAllLimits();
      }).not.toThrow();
    });
  });

  describe("business rules validation", () => {
    it("should enforce maximum of 10 requests per hour", () => {
      // Arrange
      const userId = "user-24";

      // Act - Make 11 requests
      const results = [];
      for (let i = 0; i < 11; i++) {
        results.push(rateLimitService.checkRateLimit(userId));
      }

      // Assert
      const allowedRequests = results.filter((r) => r === true).length;
      const blockedRequests = results.filter((r) => r === false).length;

      expect(allowedRequests).toBe(10);
      expect(blockedRequests).toBe(1);
    });

    it("should use 1-hour sliding window (3600000ms)", () => {
      // Arrange
      const userId = "user-25";
      const oneHourMs = 60 * 60 * 1000;

      // Make first request
      rateLimitService.checkRateLimit(userId);
      const firstRequestTime = mockTime;

      // Fill up remaining quota
      for (let i = 0; i < 9; i++) {
        rateLimitService.checkRateLimit(userId);
      }

      // Act - Move to just before 1 hour expires
      mockTime = firstRequestTime + oneHourMs - 100;
      expect(rateLimitService.checkRateLimit(userId)).toBe(false);

      // Move past 1 hour
      mockTime = firstRequestTime + oneHourMs + 100;
      const result = rateLimitService.checkRateLimit(userId);

      // Assert
      expect(result).toBe(true);
    });
  });
});
