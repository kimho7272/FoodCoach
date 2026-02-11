
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')
const GEMINI_MODEL = 'gemini-2.0-flash'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    console.log(`[REQ] ${req.method} /analyze-meal`);

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const body = await req.json();
        let { base64Image, userProfile } = body;

        if (!base64Image) {
            return new Response(JSON.stringify({ error: 'Image data is missing' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 400,
            });
        }

        if (!GEMINI_API_KEY) {
            console.error('[ERROR] GEMINI_API_KEY secret not found');
            return new Response(JSON.stringify({ error: 'Server configuration error' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500,
            });
        }

        // Clean base64 prefix
        if (base64Image.includes('base64,')) {
            base64Image = base64Image.split('base64,')[1];
        }

        // --- Prompt Construction ---
        let userInfoPrompt = `User Profile: Adult.`;
        if (userProfile?.height && userProfile?.weight) {
            userInfoPrompt = `User Profile: Height ${userProfile.height}cm, Weight ${userProfile.weight}kg.`;
        }
        if (userProfile?.target_calories) {
            userInfoPrompt += ` Daily Calorie Goal: ${userProfile.target_calories}kcal.`;
        }

        if (userProfile?.healthContext) {
            const { readinessScore, steps, sleepMinutes } = userProfile.healthContext;
            userInfoPrompt += ` Current State: Readiness ${readinessScore}/100, Steps ${steps}.`;
        }

        const promptText = `Analyze this image. ${userInfoPrompt}
    1. Determine if this image contains primarily edible food or drinks.
    2. If NOT food, set "is_food": false.
    3. If IS food:
       - "food_name": short name.
       - "calories": estimated total.
       - "macros": {protein, fat, carbs, sugar, fiber in grams, e.g., "15g"}.
       - "score": confidence (0-100).
       - "health_score": 0 (unhealthy) to 10 (superfood).
       - "description": 1-sentence health insight.
       - "is_food": true.
    Format the output as raw JSON only: {"is_food": boolean, "food_name": "...", "calories": 0, "macros": {"protein": "...", "fat": "...", "carbs": "...", "sugar": "...", "fiber": "..."}, "score": 0, "health_score": 5, "description": "..."}`;

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

        const geminiRes = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [
                        { text: promptText },
                        {
                            inline_data: {
                                mime_type: 'image/jpeg',
                                data: base64Image,
                            },
                        },
                    ],
                }],
            }),
        });

        const data = await geminiRes.json();

        if (data.error) {
            return new Response(JSON.stringify({ error: data.error.message }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 502,
            });
        }

        const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

        // Simple JSON extraction
        let parsed;
        try {
            const jsonMatch = resultText.match(/\{[\s\S]*\}/);
            parsed = JSON.parse(jsonMatch ? jsonMatch[0] : resultText);
        } catch (e) {
            parsed = { is_food: false, error: 'JSON parse error', raw: resultText };
        }

        return new Response(JSON.stringify(parsed), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error) {
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
})
