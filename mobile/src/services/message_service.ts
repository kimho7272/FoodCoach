import { supabase } from '../lib/supabase';

export interface SocialMessage {
    id: string;
    sender_id: string;
    receiver_id: string;
    type: 'text' | 'image' | 'gif' | 'meal';
    content: string;
    media_url?: string;
    metadata: {
        meal_id?: string | number;
        [key: string]: any;
    };
    is_read: boolean;
    created_at: string;
    sender?: {
        full_name: string | null;
        avatar_url: string | null;
        nickname: string | null;
    };
}

export const messageService = {
    /**
     * Send a general message between people.
     */
    async sendMessage(
        receiverId: string,
        content: string,
        type: 'text' | 'image' | 'gif' | 'meal' = 'text',
        options?: {
            mediaUrl?: string,
            mealId?: string | number,
            metadata?: any
        }
    ): Promise<{ data: SocialMessage | null; error: any }> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { data: null, error: new Error('User not authenticated') };

        const insertData = {
            sender_id: user.id,
            receiver_id: receiverId,
            type: type,
            content: content,
            media_url: options?.mediaUrl,
            metadata: {
                ...(options?.metadata || {}),
                ...(options?.mealId ? { meal_id: options.mealId } : {})
            }
        };

        console.log('[MESSAGE_SERVICE] Sending message:', insertData);

        const { data, error } = await supabase
            .from('social_messages' as any)
            .insert([insertData] as any)
            .select(`
                *,
                sender:profiles!sender_id (
                    full_name,
                    avatar_url,
                    nickname
                )
            `)
            .single();

        return { data: data as any, error };
    },

    /**
     * Fetch unread message counts grouped by sender.
     * Now returns counts per sender_id instead of meal_id.
     */
    async getUnreadCounts(): Promise<{ data: Record<string, number> | null; error: any }> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { data: null, error: new Error('Not authenticated') };

        const { data, error } = await supabase
            .from('social_messages' as any)
            .select('sender_id')
            .eq('receiver_id', user.id)
            .eq('is_read', false);

        if (error) return { data: null, error };

        const counts: Record<string, number> = {};
        (data as any[]).forEach(msg => {
            counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1;
        });

        return { data: counts, error: null };
    },

    /**
     * Fetch unread count for a specific friend.
     */
    async getUnreadCountForFriend(friendId: string): Promise<number> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return 0;

        const { count } = await supabase
            .from('social_messages' as any)
            .select('*', { count: 'exact', head: true } as any)
            .eq('receiver_id', user.id)
            .eq('sender_id', friendId)
            .eq('is_read', false);

        return count || 0;
    },

    /**
     * Mark all messages from a friend as read.
     */
    async markAsRead(friendId: string): Promise<{ error: any }> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: new Error('User not authenticated') };

        const { error } = await supabase
            .from('social_messages' as any)
            .update({ is_read: true } as any)
            .eq('receiver_id', user.id)
            .eq('sender_id', friendId)
            .eq('is_read', false);

        return { error };
    },

    /**
     * Fetch chat history with pagination.
     */
    async getMessages(friendId: string, offset: number = 0, limit: number = 100): Promise<{ data: SocialMessage[] | null; error: any }> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { data: null, error: new Error('Not authenticated') };

        console.log(`[MESSAGE_SERVICE] MyID: ${user.id}, FriendID: ${friendId}`);

        // Simplified query for testing
        const { data, error } = await supabase
            .from('social_messages' as any)
            .select(`
                *,
                sender:profiles!sender_id (
                    full_name,
                    avatar_url,
                    nickname
                )
            `)
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .or(`sender_id.eq.${friendId},receiver_id.eq.${friendId}`)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('[MESSAGE_SERVICE] Query error:', error);
        } else {
            console.log(`[MESSAGE_SERVICE] Found ${data?.length || 0} messages`);
            if (data && data.length > 0) {
                console.log('[MESSAGE_SERVICE] First message sample:', JSON.stringify(data[0], null, 2));
            }
        }

        return { data: (data ? (data as any[]).reverse() : null) as any, error };
    },

    /**
     * Upload chat media (base64).
     */
    async uploadMedia(userId: string, base64Data: string): Promise<{ url: string | null; error: any }> {
        try {
            const fileName = `${userId}/${Date.now()}.jpg`;
            const { decode } = require('base64-arraybuffer');

            const { error: uploadError } = await supabase.storage
                .from('chat_assets')
                .upload(fileName, decode(base64Data), {
                    contentType: 'image/jpeg'
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('chat_assets')
                .getPublicUrl(fileName);

            return { url: publicUrl, error: null };
        } catch (error) {
            return { url: null, error };
        }
    }
};
