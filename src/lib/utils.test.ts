import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn utility", () => {
  describe("basic class merging", () => {
    it("should merge multiple class strings", () => {
      // Arrange & Act
      const result = cn("text-base", "font-bold", "text-red-500");

      // Assert
      expect(result).toBe("text-base font-bold text-red-500");
    });

    it("should handle single class string", () => {
      // Arrange & Act
      const result = cn("text-base");

      // Assert
      expect(result).toBe("text-base");
    });

    it("should handle empty strings", () => {
      // Arrange & Act
      const result = cn("", "text-base", "");

      // Assert
      expect(result).toBe("text-base");
    });

    it("should handle no arguments", () => {
      // Arrange & Act
      const result = cn();

      // Assert
      expect(result).toBe("");
    });
  });

  describe("conditional classes with clsx", () => {
    it("should handle conditional object syntax", () => {
      // Arrange & Act
      const result = cn({
        "text-base": true,
        "font-bold": false,
        "text-red-500": true,
      });

      // Assert
      expect(result).toBe("text-base text-red-500");
    });

    it("should handle mixed strings and objects", () => {
      // Arrange & Act
      const result = cn("text-base", { "font-bold": true, hidden: false }, "text-red-500");

      // Assert
      expect(result).toBe("text-base font-bold text-red-500");
    });

    it("should handle arrays", () => {
      // Arrange & Act
      const result = cn(["text-base", "font-bold"], "text-red-500");

      // Assert
      expect(result).toBe("text-base font-bold text-red-500");
    });

    it("should handle undefined and null values", () => {
      // Arrange & Act
      const result = cn("text-base", undefined, null, "font-bold");

      // Assert
      expect(result).toBe("text-base font-bold");
    });
  });

  describe("Tailwind class conflicts (twMerge)", () => {
    it("should resolve conflicting utility classes - last wins", () => {
      // Arrange & Act
      const result = cn("text-base", "text-lg");

      // Assert
      expect(result).toBe("text-lg");
    });

    it("should resolve conflicting padding classes", () => {
      // Arrange & Act
      const result = cn("p-4", "p-8");

      // Assert
      expect(result).toBe("p-8");
    });

    it("should resolve conflicting background colors", () => {
      // Arrange & Act
      const result = cn("bg-red-500", "bg-blue-500");

      // Assert
      expect(result).toBe("bg-blue-500");
    });

    it("should keep non-conflicting classes", () => {
      // Arrange & Act
      const result = cn("p-4", "text-base", "p-8", "font-bold");

      // Assert
      expect(result).toBe("text-base p-8 font-bold");
    });

    it("should handle responsive variants", () => {
      // Arrange & Act
      const result = cn("text-sm", "md:text-base", "lg:text-lg");

      // Assert
      expect(result).toBe("text-sm md:text-base lg:text-lg");
    });

    it("should handle state variants", () => {
      // Arrange & Act
      const result = cn("text-gray-500", "hover:text-gray-700", "focus:text-gray-900");

      // Assert
      expect(result).toBe("text-gray-500 hover:text-gray-700 focus:text-gray-900");
    });
  });

  describe("real-world use cases", () => {
    it("should handle button variant pattern", () => {
      // Arrange
      const baseClasses = "px-4 py-2 rounded font-medium";
      const variant = "primary";
      const variants = {
        primary: "bg-blue-500 text-white hover:bg-blue-600",
        secondary: "bg-gray-200 text-gray-900 hover:bg-gray-300",
      };

      // Act
      const result = cn(baseClasses, variants[variant]);

      // Assert
      expect(result).toBe("px-4 py-2 rounded font-medium bg-blue-500 text-white hover:bg-blue-600");
    });

    it("should handle conditional active state", () => {
      // Arrange
      const isActive = true;

      // Act
      const result = cn("nav-item", "text-gray-600", {
        "text-blue-600 font-bold": isActive,
      });

      // Assert
      expect(result).toBe("nav-item text-blue-600 font-bold");
    });

    it("should handle disabled state override", () => {
      // Arrange
      const isDisabled = true;

      // Act
      const result = cn("bg-blue-500 text-white cursor-pointer", {
        "bg-gray-300 text-gray-500 cursor-not-allowed": isDisabled,
      });

      // Assert - Check that conflicting classes are resolved (last wins)
      expect(result).toContain("bg-gray-300");
      expect(result).toContain("text-gray-500");
      expect(result).toContain("cursor-not-allowed");
      expect(result).not.toContain("bg-blue-500");
      expect(result).not.toContain("text-white");
    });

    it("should handle component with custom classes prop", () => {
      // Arrange
      const defaultClasses = "flex items-center gap-2 p-4";
      const customClasses = "p-6 bg-red-500";

      // Act
      const result = cn(defaultClasses, customClasses);

      // Assert
      expect(result).toBe("flex items-center gap-2 p-6 bg-red-500");
    });

    it("should handle complex shadcn/ui pattern", () => {
      // Arrange
      const base = "inline-flex items-center justify-center rounded-md text-sm font-medium";
      const variant = "default";
      const size = "md";

      const variantClasses = {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      };

      const sizeClasses = {
        sm: "h-9 px-3",
        md: "h-10 px-4 py-2",
        lg: "h-11 px-8",
      };

      // Act
      const result = cn(base, variantClasses[variant], sizeClasses[size]);

      // Assert
      expect(result).toBe(
        "inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
      );
    });
  });

  describe("edge cases", () => {
    it("should handle very long class strings", () => {
      // Arrange
      const longClasses =
        "flex items-center justify-center p-4 m-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400";

      // Act
      const result = cn(longClasses);

      // Assert
      expect(result).toBe(longClasses);
    });

    it("should handle duplicate classes", () => {
      // Arrange & Act
      const result = cn("text-base", "font-bold", "text-base");

      // Assert
      expect(result).toBe("font-bold text-base");
    });

    it("should trim whitespace", () => {
      // Arrange & Act
      const result = cn("  text-base  ", "  font-bold  ");

      // Assert
      expect(result).toBe("text-base font-bold");
    });

    it("should handle multiple spaces between classes", () => {
      // Arrange & Act
      const result = cn("text-base    font-bold");

      // Assert
      expect(result).toBe("text-base font-bold");
    });
  });
});
