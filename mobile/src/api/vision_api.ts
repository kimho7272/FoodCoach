import { supabase } from '../lib/supabase';

// Supabase Edge Function handles the API key securely.
// Ensure you have deployed the function: `supabase functions deploy analyze-meal`
// And set the secret: `supabase secrets set GEMINI_API_KEY=...`

export type NutritionData = {
    calories: number;
    macros: {
        protein: string;
        fat: string;
        carbs: string;
        sugar?: string;
        fiber?: string;
    };
    reason?: string;
};

export type AnalysisResult = {
    food_name: string;
    restaurant_name?: string;

    // Dual Analysis Data
    total: NutritionData;
    recommended: NutritionData;

    score: number;
    category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
    is_food: boolean;
    health_score: number; // 0-10
    description: string;
};

export type UserProfile = {
    gender?: string; // 'Male' | 'Female'
    height?: number;
    weight?: number;
    target_calories?: number;
    healthContext?: {
        readinessScore: number;
        steps: number;
        sleepMinutes: number;
    };
};

export type LocationContext = {
    lat: number;
    lng: number;
    name?: string | null;
    address?: string | null;
};

export const analyzeMealImage = async (base64Image: string, userProfile?: UserProfile, location?: LocationContext): Promise<AnalysisResult> => {
    try {
        console.log(`Invoking Supabase Edge Function: analyze-meal (Payload: ${Math.round(base64Image.length / 1024)}KB)`);
        const { data, error } = await supabase.functions.invoke('analyze-meal', {
            body: { base64Image, userProfile, location }
        });

        if (error) {
            console.error('Supabase Function Invocation Error Object:', error);
            let errMsg = 'Server Analysis Failed';
            if (error instanceof Error) errMsg = error.message;
            else if (typeof error === 'string') errMsg = error;
            else if (typeof error === 'object' && error !== null) errMsg = (error as any).message || JSON.stringify(error);

            throw new Error(`Server Analysis Failed: ${errMsg}`);
        }

        if (!data) {
            throw new Error('No data returned from analysis server.');
        }

        // Auto-categorize based on current local time
        const hour = new Date().getHours();
        let category: AnalysisResult['category'] = 'Snack';
        if (hour >= 5 && hour < 11) category = 'Breakfast';
        else if (hour >= 11 && hour < 16) category = 'Lunch';
        else if (hour >= 16 && hour < 22) category = 'Dinner';

        // Helper to safe parse nutrition
        const safeNutrition = (src: any): NutritionData => ({
            calories: typeof src?.calories === 'number' ? src.calories : 0,
            macros: {
                protein: src?.macros?.protein || "0g",
                fat: src?.macros?.fat || "0g",
                carbs: src?.macros?.carbs || "0g",
                sugar: src?.macros?.sugar || "0g",
                fiber: src?.macros?.fiber || "0g"
            },
            reason: src?.reason
        });

        // Handle both old and new format if needed, but primarily new
        const total = data.total ? safeNutrition(data.total) : safeNutrition(data); // Fallback to root if total missing
        const recommended = data.recommended ? safeNutrition(data.recommended) : total; // Fallback to total if recommended missing

        return {
            is_food: !!data.is_food,
            food_name: data.food_name || "Unknown",
            restaurant_name: data.restaurant_name,
            total,
            recommended,
            score: data.score || 0,
            health_score: data.health_score || 0,
            description: data.description || "No description provided.",
            category
        };

    } catch (error: any) {
        console.error('Vision API / Edge Function Error:', error);
        throw error;
    }
};
