import { supabase } from '../lib/supabase';

export interface MealMessage {
    id: string;
    meal_id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
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
     * Send a message related to a specific meal.
     */
    async sendMessage(mealId: string, receiverId: string, content: string): Promise<{ data: any; error: any }> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { data: null, error: new Error('User not authenticated') };

        const { data, error } = await supabase
            .from('meal_messages' as any)
            .insert([
                {
                    meal_id: mealId,
                    sender_id: user.id,
                    receiver_id: receiverId,
                    content: content
                }
            ] as any)
            .select()
            .single();

        return { data, error };
    },

    /**
     * Fetch all messages for a specific meal, including sender profile info.
     */
    async getMealMessages(mealId: string): Promise<{ data: MealMessage[] | null; error: any }> {
        const { data, error } = await supabase
            .from('meal_messages' as any)
            .select(`
                *,
                sender:profiles!sender_id (
                    full_name,
                    avatar_url,
                    nickname
                )
            `)
            .eq('meal_id', mealId)
            .order('created_at', { ascending: true });

        return { data: data as any, error };
    },

    /**
     * Mark all unread messages for a specific meal as read for the current user.
     */
    async markAsRead(mealId: string): Promise<{ error: any }> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { error: new Error('User not authenticated') };

        const { error } = await supabase
            .from('meal_messages' as any)
            .update({ is_read: true } as any)
            .eq('meal_id', mealId)
            .eq('receiver_id', user.id)
            .eq('is_read', false);

        return { error };
    },

    /**
     * Get unread message counts grouped by meal_id for the current user.
     */
    async getUnreadCounts(): Promise<{ data: Record<string, number> | null; error: any }> {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { data: null, error: new Error('User not authenticated') };

        const { data, error } = await supabase
            .from('meal_messages')
            .select('meal_id')
            .eq('receiver_id', user.id)
            .eq('is_read', false);

        if (error) return { data: null, error };

        const counts: Record<string, number> = {};
        data?.forEach((msg: any) => {
            counts[msg.meal_id] = (counts[msg.meal_id] || 0) + 1;
        });

        return { data: counts, error: null };
    }
};
