import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { CharacterCounter } from "./CharacterCounter";

describe("CharacterCounter", () => {
  const MIN = 1000;
  const MAX = 10000;

  describe("color coding based on character count", () => {
    it("shows red color when count is below minimum", () => {
      const { container } = render(<CharacterCounter count={999} min={MIN} max={MAX} />);
      const span = container.querySelector("span");

      expect(span).toHaveClass("text-red-600", "dark:text-red-400");
    });

    it("shows red color when count exceeds maximum", () => {
      const { container } = render(<CharacterCounter count={10001} min={MIN} max={MAX} />);
      const span = container.querySelector("span");

      expect(span).toHaveClass("text-red-600", "dark:text-red-400");
    });

    it("shows yellow color when count is at minimum threshold (min to min+500)", () => {
      const { container } = render(<CharacterCounter count={1000} min={MIN} max={MAX} />);
      const span = container.querySelector("span");

      expect(span).toHaveClass("text-yellow-600", "dark:text-yellow-400");
    });

    it("shows yellow color when count is just above minimum", () => {
      const { container } = render(<CharacterCounter count={1250} min={MIN} max={MAX} />);
      const span = container.querySelector("span");

      expect(span).toHaveClass("text-yellow-600", "dark:text-yellow-400");
    });

    it("shows yellow color at upper bound of warning zone (min+500)", () => {
      const { container } = render(<CharacterCounter count={1500} min={MIN} max={MAX} />);
      const span = container.querySelector("span");

      expect(span).toHaveClass("text-yellow-600", "dark:text-yellow-400");
    });

    it("shows green color when count is in optimal range (above min+500)", () => {
      const { container } = render(<CharacterCounter count={1501} min={MIN} max={MAX} />);
      const span = container.querySelector("span");

      expect(span).toHaveClass("text-green-600", "dark:text-green-400");
    });

    it("shows green color when count is at maximum", () => {
      const { container } = render(<CharacterCounter count={10000} min={MIN} max={MAX} />);
      const span = container.querySelector("span");

      expect(span).toHaveClass("text-green-600", "dark:text-green-400");
    });
  });

  describe("number formatting", () => {
    it("formats numbers with thousand separators", () => {
      render(<CharacterCounter count={5000} min={MIN} max={MAX} />);

      expect(screen.getByText(/5,000/)).toBeInTheDocument();
    });

    it("formats maximum value with thousand separators", () => {
      render(<CharacterCounter count={0} min={MIN} max={MAX} />);

      expect(screen.getByText(/10,000/)).toBeInTheDocument();
    });

    it("formats minimum value with thousand separators", () => {
      render(<CharacterCounter count={0} min={MIN} max={MAX} />);

      expect(screen.getByText(/min: 1,000/)).toBeInTheDocument();
    });
  });

  describe("edge cases", () => {
    it("handles zero count", () => {
      const { container } = render(<CharacterCounter count={0} min={MIN} max={MAX} />);
      const span = container.querySelector("span");

      expect(span).toHaveClass("text-red-600");
      expect(screen.getByText(/0 \/ 10,000/)).toBeInTheDocument();
    });

    it("handles exactly at minimum boundary", () => {
      const { container } = render(<CharacterCounter count={MIN} min={MIN} max={MAX} />);
      const span = container.querySelector("span");

      expect(span).toHaveClass("text-yellow-600");
    });

    it("handles exactly at maximum boundary", () => {
      const { container } = render(<CharacterCounter count={MAX} min={MIN} max={MAX} />);
      const span = container.querySelector("span");

      expect(span).toHaveClass("text-green-600");
    });
  });
});
