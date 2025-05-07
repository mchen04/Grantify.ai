import { useState, useCallback } from 'react';
import apiClient from '@/lib/apiClient';
import { Grant } from '@/types/grant';
import { UserInteraction } from '@/types/user';
import { useAuth } from '@/contexts/AuthContext';

interface UseGrantInteractionsProps {
  onError?: (message: string) => void;
}

interface UseGrantInteractionsReturn {
  interactionLoading: boolean;
  handleSaveGrant: (grantId: string, removeFromUI?: boolean) => Promise<void>;
  handleApplyGrant: (grantId: string, removeFromUI?: boolean) => Promise<void>;
  handleIgnoreGrant: (grantId: string, removeFromUI?: boolean) => Promise<void>;
  handleShareGrant: (grantId: string) => Promise<void>;
  handleUndoInteraction: (grantId: string, action: 'saved' | 'applied' | 'ignored') => Promise<void>;
  isCurrentInteraction: (grantId: string, action: 'saved' | 'applied' | 'ignored', interactions: UserInteraction[]) => boolean;
  getLatestInteraction: (interactions: UserInteraction[]) => UserInteraction | null;
}

/**
 * Custom hook for managing grant interactions (save, apply, ignore, share)
 */
export function useGrantInteractions({
  onError = () => {}
}: UseGrantInteractionsProps): UseGrantInteractionsReturn {
  const [interactionLoading, setInteractionLoading] = useState(false);
  const { user, session } = useAuth();

  /**
   * Check if the specified action is the current interaction for the grant
   */
  const isCurrentInteraction = useCallback(
    (grantId: string, action: 'saved' | 'applied' | 'ignored', interactions: UserInteraction[]): boolean => {
      if (!interactions || interactions.length === 0) return false;
      
      // Find the latest interaction for this grant
      const latestInteraction = getLatestInteraction(
        interactions.filter(interaction => interaction.grant_id === grantId)
      );
      
      return latestInteraction?.action === action;
    },
    []
  );

  /**
   * Get the latest interaction from a list of interactions
   */
  const getLatestInteraction = useCallback((interactions: UserInteraction[]): UserInteraction | null => {
    if (!interactions || interactions.length === 0) return null;
    
    // Sort by timestamp (descending) and return the first one
    return [...interactions].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];
  }, []);

  /**
   * Handle grant interaction (save, apply, ignore)
   */
  const handleInteraction = useCallback(
    async (grantId: string, action: 'saved' | 'applied' | 'ignored', removeFromUI: boolean = false): Promise<void> => {
      if (!user || !session) {
        onError('You must be logged in to perform this action');
        return;
      }

      setInteractionLoading(true);

      try {
        console.log('User object before interaction:', user);
        console.log('Session object before interaction:', session);
        console.log('Access token before interaction:', session?.access_token);
        console.log('User object before interaction:', user);
        console.log('Session object before interaction:', session);
        console.log('Access token before interaction:', session?.access_token);
        // Record the interaction using apiClient
        const { error } = await apiClient.users.recordInteraction(
          user.id,
          grantId,
          action,
          session.access_token
        );

        if (error) throw new Error(error);

      } catch (error: any) {
        console.error(`Error ${action} grant:`, error.message || error);
        onError(`Failed to ${action.replace('ed', '')} grant: ${error.message || 'Please try again.'}`);
      } finally {
        setInteractionLoading(false);
      }
    },
    [user, session, onError]
  );

  /**
   * Undo a specific interaction
   */
  const handleUndoInteraction = useCallback(
    async (grantId: string, action: 'saved' | 'applied' | 'ignored'): Promise<void> => {
      if (!user || !session) {
        onError('You must be logged in to perform this action');
        return;
      }

      setInteractionLoading(true);

      try {
        // Delete the interaction using apiClient
        const { error } = await apiClient.users.deleteInteraction(
          user.id,
          grantId,
          action,
          session.access_token
        );

        if (error) throw new Error(error);
      } catch (error: any) {
        console.error(`Error undoing ${action} grant:`, error.message || error);
        onError(`Failed to undo ${action.replace('ed', '')}: ${error.message || 'Please try again.'}`);
      } finally {
        setInteractionLoading(false);
      }
    },
    [user, session, onError] // Keep user in dependency array
  );

  /**
   * Handle saving a grant
   */
  const handleSaveGrant = useCallback(
    async (grantId: string, removeFromUI: boolean = false): Promise<void> => {
      await handleInteraction(grantId, 'saved', removeFromUI);
    },
    [handleInteraction]
  );

  /**
   * Handle applying for a grant
   */
  const handleApplyGrant = useCallback(
    async (grantId: string, removeFromUI: boolean = false): Promise<void> => {
      await handleInteraction(grantId, 'applied', removeFromUI);
    },
    [handleInteraction]
  );

  /**
   * Handle ignoring a grant
   */
  const handleIgnoreGrant = useCallback(
    async (grantId: string, removeFromUI: boolean = false): Promise<void> => {
      await handleInteraction(grantId, 'ignored', removeFromUI);
    },
    [handleInteraction]
  );

  /**
   * Handle sharing a grant
   */
  const handleShareGrant = useCallback(async (grantId: string): Promise<void> => {
    const shareUrl = `${window.location.origin}/grants/${grantId}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Check out this grant',
          text: 'I found this interesting grant opportunity',
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        // Could add a toast notification here
      }
    } catch (error: any) {
      // Don't log errors if the user canceled the share
      if (error.name !== 'AbortError') {
        // Only copy to clipboard if it's not a cancel action
        await navigator.clipboard.writeText(shareUrl);
      }
    }
  }, []);

  return {
    interactionLoading,
    handleSaveGrant,
    handleApplyGrant,
    handleIgnoreGrant,
    handleShareGrant,
    handleUndoInteraction,
    isCurrentInteraction,
    getLatestInteraction
  };
}