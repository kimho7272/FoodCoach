
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
        let { base64Image, userProfile, location } = body;

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
        if (userProfile) {
            const parts = [];
            if (userProfile.gender) parts.push(`Gender: ${userProfile.gender}`);
            if (userProfile.height) parts.push(`Height: ${userProfile.height}cm`);
            if (userProfile.weight) parts.push(`Weight: ${userProfile.weight}kg`);
            if (userProfile.target_calories) parts.push(`Target Daily Calories: ${userProfile.target_calories}kcal`);
            userInfoPrompt = `User Profile: ${parts.join(', ')}.`;
        }

        if (userProfile?.healthContext) {
            const { readinessScore, steps, sleepMinutes } = userProfile.healthContext;
            userInfoPrompt += ` Current State: Readiness ${readinessScore}/100, Steps ${steps}.`;
        }

        let locationContext = '';
        if (location) {
            const { lat, lng, name, address } = location;
            locationContext = `User Location: Lat ${lat}, Lng ${lng}.`;
            if (name) locationContext += ` Place Name: "${name}".`;
            if (address) locationContext += ` Address: "${address}".`;
            locationContext += " If the Place Name suggests a restaurant or food establishment, and the image looks like food served there, please confirm the restaurant name in the 'restaurant_name' field. If the Place Name is just a street address or seemingly unrelated, ignore it for naming.";
        }

        const promptText = `Analyze this image. ${userInfoPrompt} ${locationContext}
    1. Determine if this image contains primarily edible food or drinks.
    2. If NOT food, set "is_food": false.
    3. If IS food, provide TWO sets of nutritional data:
       A. "total": The estimated nutrition for the Entire visible portion in the image (assuming user eats everything).
       B. "recommended": The estimated nutrition for an "Ideal/Average Portion" suitable for a person with the provided Gender/Height/Weight profile. (e.g., if the image shows a huge pizza, recommended might be 2 slices).
    
    Required JSON Structure:
    {
      "is_food": boolean,
      "food_name": "short name",
      "restaurant_name": "Optional: Name of restaurant if identified using location/image",
      "total": {
        "calories": number,
        "macros": { "protein": "10g", "fat": "5g", "carbs": "20g", "sugar": "2g", "fiber": "1g" }
      },
      "recommended": {
        "calories": number,
        "macros": { "protein": "...", ... },
        "reason": "Brief explanation of why this portion is recommended (e.g. 'Standard serving size for your profile')"
      },
      "score": number (0-100 confidence),
      "health_score": number (0-10),
      "description": "1-sentence health insight"
    }
    
    Return ONLY valid JSON.`;

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
