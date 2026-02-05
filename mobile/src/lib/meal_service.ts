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
        const fileName = `${userId}/${Date.now()}.jpg`;
        const { data, error } = await supabase.storage
            .from('meal-images')
            .upload(fileName, decode(base64Data), {
                contentType: 'image/jpeg'
            });

        if (error) throw error;

        const { data: { publicUrl } } = supabase.storage
            .from('meal-images')
            .getPublicUrl(fileName);

        return publicUrl;
    } catch (error) {
        console.error('Image upload failed:', error);
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
