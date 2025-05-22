import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/supabase';

export type Message = Database['public']['Tables']['messages']['Row'];

export function useMessages(eventId?: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (eventId) {
      fetchMessages(eventId);
      subscribeToMessages(eventId);
    }

    return () => {
      if (eventId) {
        unsubscribeFromMessages();
      }
    };
  }, [eventId]);

  const fetchMessages = async (eventId: string, parentId: string | null = null) => {
    try {
      setLoading(true);
      let query = supabase
        .from('messages')
        .select('*, users:author_id(display_name, instagram_handle)')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });
      
      if (parentId === null) {
        query = query.is('parent_id', null);
      } else {
        query = query.eq('parent_id', parentId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching messages:', error);
        return [];
      }

      setMessages(data || []);
      return data || [];
    } catch (error) {
      console.error('Error in fetchMessages:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (
    eventId: string, 
    authorId: string, 
    body: string, 
    parentId: string | null = null
  ) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          event_id: eventId,
          author_id: authorId,
          body,
          parent_id: parentId,
          reactions: {},
        })
        .select();

      if (error) throw error;

      return { success: true, data, error: null };
    } catch (error: any) {
      console.error('Error sending message:', error);
      return { success: false, data: null, error: error.message };
    }
  };

  const addReaction = async (messageId: string, emoji: string) => {
    try {
      // First, get the current reactions
      const { data: message, error: fetchError } = await supabase
        .from('messages')
        .select('reactions')
        .eq('id', messageId)
        .single();

      if (fetchError) throw fetchError;

      // Update the reactions
      const currentReactions = message.reactions as Record<string, number> || {};
      const updatedReactions = {
        ...currentReactions,
        [emoji]: (currentReactions[emoji] || 0) + 1,
      };

      // Save the updated reactions
      const { error: updateError } = await supabase
        .from('messages')
        .update({ reactions: updatedReactions })
        .eq('id', messageId);

      if (updateError) throw updateError;

      return { success: true, error: null };
    } catch (error: any) {
      console.error('Error adding reaction:', error);
      return { success: false, error: error.message };
    }
  };

  // Realtime subscriptions
  const subscribeToMessages = (eventId: string) => {
    return supabase
      .channel(`messages:${eventId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `event_id=eq.${eventId}`,
        },
        (payload) => {
          console.log('Change received!', payload);
          fetchMessages(eventId);
        }
      )
      .subscribe();
  };

  const unsubscribeFromMessages = () => {
    supabase.removeAllChannels();
  };

  return {
    messages,
    loading,
    fetchMessages,
    sendMessage,
    addReaction,
  };
}