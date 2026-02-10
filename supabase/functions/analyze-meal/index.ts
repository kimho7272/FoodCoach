
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Configure your Gemini API Key in Supabase Dashboard -> Edge Functions -> Secrets
// or via CLI: supabase secrets set GEMINI_API_KEY=AIzaSy...
const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_MODEL = 'gemini-2.0-flash'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { base64Image, userProfile } = await req.json()

        if (!base64Image) {
            throw new Error('Image data is missing')
        }

        if (!GEMINI_API_KEY) {
            throw new Error('Server configuration error: Gemini API Key not set')
        }

        // --- Prompt Construction Logic ---
        let userInfoPrompt = userProfile?.height && userProfile?.weight
            ? `User Profile: Height ${userProfile.height}cm, Weight ${userProfile.weight}kg.`
            : "User Profile: Standard adult.";

        if (userProfile?.healthContext) {
            const { readinessScore, steps, sleepMinutes } = userProfile.healthContext;
            userInfoPrompt += `
        Current Health State:
        - Readiness Score: ${readinessScore}/100 (${readinessScore > 80 ? 'High/Peak' : readinessScore > 50 ? 'Moderate' : 'Low/Recovery'}).
        - Sleep: ${Math.floor(sleepMinutes / 60)}h ${sleepMinutes % 60}m.
        - Activity: ${steps} steps today.
        CRITICAL: Tailor the "description" field to this state.
        If readiness is LOW (<50), recommend if this food aids recovery (e.g. good carbs/protein) or worsens stress (sugar/alcohol).
        If readiness is HIGH, mention how this fuels performance.`;
        } else {
            userInfoPrompt += " Estimate portion size based on standard serving.";
        }

        const promptText = `Analyze this image. ${userInfoPrompt}
    1. Determine if this image contains primarily edible food or drinks.
    2. If it IS NOT food (e.g., a person, building, car, text-only document), set "is_food": false.
    3. If it IS food:
       - "food_name": short name.
       - "calories": estimated total based on the quantity shown and user profile.
       - "macros": {protein, fat, carbs, sugar, fiber in grams, e.g., "15g"}.
       - "score": confidence (0-100).
       - "health_score": 0 (unhealthy) to 10 (superfood).
       - "description": 1-sentence health insight personalized to the user's readiness/sleep state if provided.
       - "is_food": true.
    Format the output as raw JSON only: {"is_food": boolean, "food_name": "...", "calories": 0, "macros": {"protein": "...", "fat": "...", "carbs": "...", "sugar": "...", "fiber": "..."}, "score": 0, "health_score": 5, "description": "..."}`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            { text: promptText },
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
        })

        const data = await response.json()

        if (data.error) {
            console.error('Gemini API Error:', data.error);
            throw new Error(data.error.message || 'Gemini API Error')
        }

        if (!data.candidates || data.candidates.length === 0) {
            throw new Error('No analysis results returned from AI.')
        }

        const resultText = data.candidates[0].content?.parts?.[0]?.text || '{}';

        // Simple JSON extraction
        let parsed = { is_food: false, food_name: "Unknown", calories: 0, macros: { protein: "0g", fat: "0g", carbs: "0g", sugar: "0g", fiber: "0g" }, score: 0, health_score: 0, description: "Could not identify content." };
        try {
            const jsonMatch = resultText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsed = JSON.parse(jsonMatch[0]);
            } else {
                parsed = JSON.parse(resultText);
            }
        } catch (e) {
            console.error('Failed to parse JSON from Gemini:', e);
            // Fallback or throw? Let's return the unparsed object or error state
        }

        return new Response(JSON.stringify(parsed), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        })

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        })
    }
})
