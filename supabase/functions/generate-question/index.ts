import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'No image URL provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log('Processing image URL:', imageUrl);

    // Convert image URL to base64
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();
    const imageBase64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(imageBlob);
    });

    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey,
      },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `Analyze this image and create multiple choice question(s) that is/are exactly given in the image. Return a JSON array with this exact structure:
              [
                {
                  "questionText": "string",
                  "referenceText": "",
                  "solutionText": "",
                  "options": [
                    {
                      "text": "string",
                      "isCorrect": boolean
                    }
                  ]
                }
              ]
              Important: 
              1. Keep the original language (do not translate)
              2. Return only raw JSON, no markdown or code blocks
              3. Ensure exactly one option is marked as correct per question
              4. Create as many questions as you can find in the image
              5. Return empty string for referenceText and solutionText if not applicable
              6. Reference text can be inside []/(). Also, solutionText can be inside ব্যাখ্যা/Solution/Solve or any similar part
              7. Create EXACT clones of question(s). Do not change anything`
            },
            {
              inline_data: {
                mime_type: "image/jpeg",
                data: imageBase64.split(',')[1]
              }
            }
          ]
        }]
      })
    });

    console.log('Gemini API response status:', response.status);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Gemini API error:', errorData);
      throw new Error(`Gemini API error: ${errorData}`);
    }

    const data = await response.json();
    console.log('Gemini API raw response:', data);

    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini API');
    }

    const textContent = data.candidates[0].content.parts[0].text;
    console.log('Raw text content:', textContent);

    // Clean and parse the response
    const cleanedContent = textContent
      .replace(/```json\s*/g, '')
      .replace(/```\s*/g, '')
      .replace(/^\s*\[\s*/, '[')
      .replace(/\s*\]\s*$/, ']')
      .trim();

    console.log('Cleaned content:', cleanedContent);

    let parsedData;
    try {
      parsedData = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('Initial JSON parse error:', parseError);
      
      // Try to extract JSON if initial parse fails
      const jsonMatch = cleanedContent.match(/\[\s*\{[\s\S]*\}\s*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON found in response');
      }
      
      try {
        parsedData = JSON.parse(jsonMatch[0]);
      } catch (secondaryParseError) {
        console.error('Secondary JSON parse error:', secondaryParseError);
        throw new Error('Failed to parse response as JSON');
      }
    }

    // Validate the questions structure
    if (!Array.isArray(parsedData)) {
      parsedData = [parsedData];
    }

    // Ensure each question has the correct structure
    parsedData = parsedData.map(question => ({
      ...question,
      referenceText: question.referenceText || '',
      solutionText: question.solutionText || '',
      options: question.options.map((opt, index, arr) => ({
        ...opt,
        isCorrect: arr.filter(o => o.isCorrect).length === 0 && index === 0 ? true : opt.isCorrect
      }))
    }));

    console.log('Formatted response:', parsedData);

    return new Response(
      JSON.stringify(parsedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in generate-question function:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate question', 
        details: error.message,
        stack: error.stack 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
