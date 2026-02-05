import { supabase } from './supabase';
import { decode } from 'base64-arraybuffer';

export type MealLog = {
    user_id: string;
    food_name: string;
    calories: number;
    protein: string;
    fat: string;
    carbs: string;
    meal_type: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
    image_url?: string;
    health_score?: number;
    description?: string;
};

export const uploadMealImage = async (userId: string, base64Data: string) => {
    try {
        console.log('Starting image upload for user:', userId);

        // Clean base64 data if it contains metadata prefix
        const cleanBase64 = base64Data.includes('base64,')
            ? base64Data.split('base64,')[1]
            : base64Data;

        const fileName = `${userId}/${Date.now()}.jpg`;
        const { data, error } = await supabase.storage
            .from('meal-images')
            .upload(fileName, decode(cleanBase64), {
                contentType: 'image/jpeg',
                upsert: true
            });

        if (error) {
            console.error('Supabase Storage Error:', error.message);
            throw error;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('meal-images')
            .getPublicUrl(fileName);

        console.log('Upload successful! Public URL:', publicUrl);
        return publicUrl;
    } catch (error: any) {
        console.error('Image upload failed details:', error);
        return null;
    }
};

export const saveMealLog = async (mealLog: MealLog) => {
    try {
        const { data, error } = await supabase
            .from('food_logs')
            .insert([mealLog])
            .select();

        if (error) throw error;
        return { data: null, error };
    } catch (error) {
        console.error('Save meal log failed:', error);
        return { data: null, error };
    }
};

export const getMealLogs = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('food_logs')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { data, error: null };
    } catch (error) {
        console.error('Get meal logs failed:', error);
        return { data: [], error };
    }
};

export const deleteMealLog = async (id: string) => {
    try {
        const { error } = await supabase
            .from('food_logs')
            .delete()
            .eq('id', id);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Delete meal log failed:', error);
        return { error };
    }
};

export const updateMealLogCategory = async (id: string, category: string) => {
    try {
        const { error } = await supabase
            .from('food_logs')
            .update({ meal_type: category })
            .eq('id', id);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Update meal log category failed:', error);
        return { error };
    }
};

export const updateMealLogName = async (id: string, name: string) => {
    try {
        const { error } = await supabase
            .from('food_logs')
            .update({ food_name: name })
            .eq('id', id);

        if (error) throw error;
        return { error: null };
    } catch (error) {
        console.error('Update meal log name failed:', error);
        return { error };
    }
};
