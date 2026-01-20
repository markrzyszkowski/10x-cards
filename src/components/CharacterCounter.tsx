import type { CharacterCounterProps } from "./GenerateView.types";

export function CharacterCounter({ count, min, max }: CharacterCounterProps) {
  const getColorClass = () => {
    if (count < min || count > max) {
      return "text-red-600 dark:text-red-400";
    }
    if (count >= min && count <= min + 500) {
      return "text-yellow-600 dark:text-yellow-400";
    }
    return "text-green-600 dark:text-green-400";
  };

  return (
    <span className={`text-sm font-medium ${getColorClass()}`}>
      {count} / {max} characters (min: {min})
    </span>
  );
}
