import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { 
  sendEventInvite, 
  validateInviteToken, 
  acceptInvite, 
  getInviteStats 
} from '@/src/services/inviteQueries';
import type { 
  InviteValidationResult, 
  SendInviteResponse,
  InviteStats 
} from '@/src/models/Invite';

/**
 * Hook for sending event invites
 */
export const useSendInvite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, emails }: { eventId: string; emails: string[] }) => 
      sendEventInvite(eventId, emails),
    onSuccess: (data: SendInviteResponse, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['inviteStats'] });
      queryClient.invalidateQueries({ queryKey: ['eventInvites', variables.eventId] });
    },
    onError: (error) => {
      console.error('Failed to send invites:', error);
    }
  });
};

/**
 * Hook for validating invite tokens
 */
export const useInviteValidation = (token: string) => {
  return useQuery({
    queryKey: ['inviteValidation', token],
    queryFn: () => validateInviteToken(token),
    enabled: !!token && token.length === 64, // Only run if token is valid format
    staleTime: 0, // Always fresh check
    retry: false, // Don't retry failed validations
  });
};

/**
 * Hook for accepting invites
 */
export const useAcceptInvite = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (token: string) => acceptInvite(token),
    onSuccess: (data, token) => {
      // Invalidate invite validation to reflect accepted status
      queryClient.invalidateQueries({ queryKey: ['inviteValidation', token] });
      
      // Invalidate event data if we have the eventId
      if (data.eventId) {
        queryClient.invalidateQueries({ queryKey: ['event', data.eventId] });
        queryClient.invalidateQueries({ queryKey: ['eventMembers', data.eventId] });
      }
    },
    onError: (error) => {
      console.error('Failed to accept invite:', error);
    }
  });
};

/**
 * Hook for getting user invite statistics
 */
export const useInviteStats = (userId: string) => {
  return useQuery({
    queryKey: ['inviteStats', userId],
    queryFn: () => getInviteStats(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
};

/**
 * Hook for managing invite flow state
 */
export const useInviteFlow = (token?: string) => {
  const [currentStep, setCurrentStep] = useState<'validating' | 'login' | 'accept' | 'success' | 'error'>('validating');
  const [invite, setInvite] = useState<InviteValidationResult | null>(null);

  const validation = useInviteValidation(token || '');
  const acceptMutation = useAcceptInvite();

  useEffect(() => {
    if (validation.data) {
      setInvite(validation.data);
      
      if (validation.data.valid) {
        setCurrentStep('accept');
      } else {
        setCurrentStep('error');
      }
    } else if (validation.error) {
      setCurrentStep('error');
    }
  }, [validation.data, validation.error]);

  const acceptInvite = async (userToken: string) => {
    try {
      setCurrentStep('accept');
      await acceptMutation.mutateAsync(userToken);
      setCurrentStep('success');
    } catch (error) {
      setCurrentStep('error');
      throw error;
    }
  };

  return {
    currentStep,
    invite: invite?.invite,
    isValid: invite?.valid || false,
    error: invite?.error,
    isLoading: validation.isLoading,
    isAccepting: acceptMutation.isPending,
    acceptInvite,
    setCurrentStep
  };
};

/**
 * Hook for batch email management
 */
export const useEmailList = (initialEmails: string[] = ['']) => {
  const [emails, setEmails] = useState<string[]>(initialEmails);

  const addEmail = () => {
    setEmails([...emails, '']);
  };

  const removeEmail = (index: number) => {
    if (emails.length > 1) {
      setEmails(emails.filter((_, i) => i !== index));
    }
  };

  const updateEmail = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const getValidEmails = () => {
    return emails.filter(email => {
      const trimmed = email.trim();
      return trimmed && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    });
  };

  const getInvalidEmails = () => {
    return emails.filter(email => {
      const trimmed = email.trim();
      return trimmed && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
    });
  };

  const clearEmails = () => {
    setEmails(['']);
  };

  return {
    emails,
    addEmail,
    removeEmail,
    updateEmail,
    getValidEmails,
    getInvalidEmails,
    clearEmails,
    hasValidEmails: getValidEmails().length > 0,
    hasInvalidEmails: getInvalidEmails().length > 0,
  };
};