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
              text: `Analyze this image and extract multiple choice questions. For each question:
              1. Keep the original language (do not translate)
              2. Extract reference text if it's inside square brackets [], otherwise set as null
              3. Extract solution text if there's any explanation marked with ব্যাখ্যা/solution/solve, otherwise set as null
              4. Identify the correct answer by looking for ticks, filled options, or answers written beside questions
              5. Return a JSON array with this exact structure, no markdown formatting:
              {
                "questions": [
                  {
                    "questionText": "string",
                    "referenceText": "string or null",
                    "solutionText": "string or null",
                    "options": [
                      {
                        "text": "string",
                        "isCorrect": boolean
                      }
                    ]
                  }
                ]
              }`
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

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
      throw new Error('Invalid response format from Gemini API');
    }

    const textContent = data.candidates[0].content.parts[0].text;
    console.log('Raw text content:', textContent);

    // Try to find and extract JSON from the response
    const jsonMatch = textContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    let parsedData;
    try {
      parsedData = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      throw new Error('Failed to parse response as JSON');
    }

    if (!parsedData.questions || !Array.isArray(parsedData.questions)) {
      throw new Error('Invalid questions data format');
    }

    // Validate each question
    parsedData.questions.forEach((question, index) => {
      if (!question.questionText || !Array.isArray(question.options)) {
        throw new Error(`Invalid format for question ${index + 1}`);
      }
      
      // Ensure exactly one correct answer
      const correctAnswers = question.options.filter(opt => opt.isCorrect).length;
      if (correctAnswers !== 1) {
        question.options[0].isCorrect = true;
        for (let i = 1; i < question.options.length; i++) {
          question.options[i].isCorrect = false;
        }
      }
    });

    console.log('Processed questions:', parsedData.questions);

    return new Response(
      JSON.stringify(parsedData.questions),
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