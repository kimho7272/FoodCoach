import { supabase } from '../lib/supabase';

// Supabase Edge Function handles the API key securely.
// Ensure you have deployed the function: `supabase functions deploy analyze-meal`
// And set the secret: `supabase secrets set GEMINI_API_KEY=...`

export type AnalysisResult = {
    food_name: string;
    calories: number;
    macros: {
        protein: string;
        fat: string;
        carbs: string;
        sugar?: string;
        fiber?: string;
    };
    score: number;
    category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
    is_food: boolean;
    health_score: number; // 0-10
    description: string;
};

export type UserProfile = {
    height?: number;
    weight?: number;
    target_calories?: number;
    healthContext?: {
        readinessScore: number;
        steps: number;
        sleepMinutes: number;
    };
};

export const analyzeMealImage = async (base64Image: string, userProfile?: UserProfile): Promise<AnalysisResult> => {
    try {
        console.log(`Invoking Supabase Edge Function: analyze-meal (Payload: ${Math.round(base64Image.length / 1024)}KB)`);
        const { data, error } = await supabase.functions.invoke('analyze-meal', {
            body: { base64Image, userProfile }
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

        // Merge server response with local category
        return {
            is_food: !!data.is_food,
            food_name: data.food_name || "Unknown",
            calories: typeof data.calories === 'number' ? data.calories : 0,
            macros: {
                protein: data.macros?.protein || "0g",
                fat: data.macros?.fat || "0g",
                carbs: data.macros?.carbs || "0g",
                sugar: data.macros?.sugar || "0g",
                fiber: data.macros?.fiber || "0g"
            },
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
