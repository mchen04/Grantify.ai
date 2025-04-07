import { useState, useCallback } from 'react';

interface UseCardFadingProps {
  onFadeComplete?: (id: string) => void;
  fadeDuration?: number;
}

interface UseCardFadingReturn {
  fadingIds: Set<string>;
  startFading: (id: string) => Promise<void>;
  isFading: (id: string) => boolean;
}

/**
 * Custom hook for managing card fading animations
 * This decouples the fading state from the card components
 */
export function useCardFading({
  onFadeComplete,
  fadeDuration = 500 // Default fade duration in ms
}: UseCardFadingProps = {}): UseCardFadingReturn {
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set());

  /**
   * Start fading a card by ID
   * Returns a promise that resolves when the fade is complete
   */
  const startFading = useCallback(
    (id: string): Promise<void> => {
      return new Promise<void>((resolve) => {
        // Add the ID to the set of fading IDs
        setFadingIds((prev) => {
          const newSet = new Set(prev);
          newSet.add(id);
          return newSet;
        });

        // Wait for the fade animation to complete
        setTimeout(() => {
          // Remove the ID from the set of fading IDs
          setFadingIds((prev) => {
            const newSet = new Set(prev);
            newSet.delete(id);
            return newSet;
          });

          // Call the onFadeComplete callback if provided
          if (onFadeComplete) {
            onFadeComplete(id);
          }

          // Resolve the promise
          resolve();
        }, fadeDuration);
      });
    },
    [fadeDuration, onFadeComplete]
  );

  /**
   * Check if a card is currently fading
   */
  const isFading = useCallback(
    (id: string): boolean => {
      return fadingIds.has(id);
    },
    [fadingIds]
  );

  return {
    fadingIds,
    startFading,
    isFading
  };
}