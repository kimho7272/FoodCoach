// Google Gemini API Integration for Food & Nutrient Analysis
const GEMINI_API_KEY = 'AIzaSyAfzKzZzWSwW0xbzJe9aHpyyBoEewq8zjs';
const GEMINI_MODEL = 'gemini-2.5-flash';

export type AnalysisResult = {
    food_name: string;
    calories: number;
    macros: {
        protein: string;
        fat: string;
        carbs: string;
    };
    score: number;
    category: 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';
};

export const analyzeMealImage = async (base64Image: string): Promise<AnalysisResult> => {
    try {
        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
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
                                    text: "Analyze this food image. Provide: 1. Food Name, 2. Estimated total calories, 3. Macros (Protein, Fat, Carbs in grams), 4. Confidence score (0-100). Format the output as raw JSON only: {\"food_name\": \"...\", \"calories\": 0, \"macros\": {\"protein\": \"...\", \"fat\": \"...\", \"carbs\": \"...\"}, \"score\": 0}",
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

        const data = await response.json();

        if (data.error) {
            console.error('Gemini API Error Response:', data.error);
            throw new Error(`Gemini API Error: ${data.error.message}`);
        }

        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

        // Robust JSON extraction using regex
        let parsed = { food_name: "Unknown Food", calories: 0, macros: { protein: "0g", fat: "0g", carbs: "0g" }, score: 0 };
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
            food_name: parsed.food_name || "Unknown Food",
            calories: parsed.calories || 0,
            macros: {
                protein: parsed.macros?.protein || "0g",
                fat: parsed.macros?.fat || "0g",
                carbs: parsed.macros?.carbs || "0g"
            },
            score: parsed.score || 0,
            category
        };
    } catch (error) {
        console.error('Gemini Vision Error:', error);
        throw error;
    }
};
