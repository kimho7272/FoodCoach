// Google Gemini API Integration for Food & Nutrient Analysis
const GEMINI_API_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
const GEMINI_MODEL = 'gemini-2.0-flash';

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
};

export const analyzeMealImage = async (base64Image: string, userProfile?: UserProfile): Promise<AnalysisResult> => {
    try {
        const userInfoPrompt = userProfile?.height && userProfile?.weight
            ? `Considering the user's physical profile (Height: ${userProfile.height}cm, Weight: ${userProfile.weight}kg), estimate the portion size relative to a standard 1-person serving for their size.`
            : "Estimate the portion size based on a standard 1-person serving.";

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
        console.log('Gemini Request URL:', url.replace(GEMINI_API_KEY || '', 'HIDDEN_KEY'));

        const response = await fetch(
            url,
            {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [
                        {
                            parts: [
                                {
                                    text: `Analyze this image. ${userInfoPrompt}
                                    1. Determine if this image contains primarily edible food or drinks.
                                    2. If it IS NOT food (e.g., a person, building, car, text-only document), set "is_food": false.
                                    3. If it IS food:
                                       - "food_name": short name.
                                       - "calories": estimated total based on the quantity shown and the user's 1-person serving size.
                                       - "macros": {protein, fat, carbs, sugar, fiber in grams, e.g., "15g"}.
                                       - "score": confidence (0-100).
                                       - "health_score": 0 (unhealthy) to 10 (superfood).
                                       - "description": 1-sentence health insight.
                                       - "is_food": true.
                                    Format the output as raw JSON only: {"is_food": boolean, "food_name": "...", "calories": 0, "macros": {"protein": "...", "fat": "...", "carbs": "...", "sugar": "...", "fiber": "..."}, "score": 0, "health_score": 5, "description": "..."}`,
                                },
                                {
                                    inline_data: {
                                        mime_type: 'image/jpeg',
                                        data: base64Image,
                                    },
                                },
                            ],
                        },
                    ],
                }),
            }
        );

        const responseText = await response.text();
        console.log('Gemini raw response:', responseText);

        let data: any;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            throw new Error(`Failed to parse Gemini response: ${responseText}`);
        }

        if (data.error) {
            console.error('Gemini API Error Response:', data.error);
            throw new Error(`Gemini API Error: ${data.error.message}`);
        }

        if (!data.candidates || data.candidates.length === 0) {
            console.error('Gemini No Candidates:', data);
            throw new Error('No analysis results returned from AI. This may be due to safety filters or an invalid image.');
        }

        const resultText = data.candidates[0].content?.parts?.[0]?.text || '{}';

        // Robust JSON extraction using regex
        let parsed: any = { is_food: false, food_name: "Unknown", calories: 0, macros: { protein: "0g", fat: "0g", carbs: "0g", sugar: "0g", fiber: "0g" }, score: 0, health_score: 0, description: "Could not identify content." };
        try {
            const jsonMatch = resultText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.error('Failed to parse Gemini JSON:', e);
        }

        // Auto-categorize based on current time
        const hour = new Date().getHours();
        let category: AnalysisResult['category'] = 'Snack';
        if (hour >= 5 && hour < 11) category = 'Breakfast';
        else if (hour >= 11 && hour < 16) category = 'Lunch';
        else if (hour >= 16 && hour < 22) category = 'Dinner';

        return {
            is_food: !!parsed.is_food,
            food_name: parsed.food_name || "Unknown",
            calories: typeof parsed.calories === 'number' ? parsed.calories : 0,
            macros: {
                protein: parsed.macros?.protein || "0g",
                fat: parsed.macros?.fat || "0g",
                carbs: parsed.macros?.carbs || "0g",
                sugar: parsed.macros?.sugar || "0g",
                fiber: parsed.macros?.fiber || "0g"
            },
            score: parsed.score || 0,
            health_score: parsed.health_score || 0,
            description: parsed.description || "No description provided.",
            category
        };
    } catch (error) {
        console.error('Gemini Vision Error:', error);
        throw error;
    }
};
