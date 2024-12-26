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
              1. Keep the original language (don't translate)
              2. Extract reference text if it's inside square brackets [], otherwise set as null
              3. Extract solution text if there's any explanation marked with ব্যাখ্যা/solution/solve, otherwise set as null
              4. Identify the correct answer by looking for ticks, filled options, or answers written beside questions
              5. Return ONLY a JSON array of questions with this structure:
              [{
                questionText: string,
                options: Array<{ text: string, isCorrect: boolean }>,
                referenceText: string | null,
                solutionText: string | null
              }]
              Make sure exactly one option is correct for each question.`
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
    console.log('Gemini API response data:', data);

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
      throw new Error('Invalid response format from Gemini API');
    }

    // Extract the text content and parse it as JSON
    const textContent = data.candidates[0].content.parts[0].text;
    console.log('Raw text content:', textContent);

    // Try to parse the response as JSON, with error handling
    let questionsData;
    try {
      questionsData = JSON.parse(textContent);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      // If JSON parsing fails, try to extract JSON from the text
      const jsonMatch = textContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        try {
          questionsData = JSON.parse(jsonMatch[0]);
        } catch (secondaryParseError) {
          console.error('Secondary JSON parse error:', secondaryParseError);
          throw new Error('Failed to parse questions data from response');
        }
      } else {
        throw new Error('No valid JSON found in response');
      }
    }

    // Ensure we have an array of questions
    if (!Array.isArray(questionsData)) {
      questionsData = [questionsData];
    }

    // Validate each question's data structure
    questionsData.forEach((question, index) => {
      if (!question.questionText || !Array.isArray(question.options)) {
        throw new Error(`Invalid question data format for question ${index + 1}`);
      }
      // Ensure exactly one correct answer
      const correctAnswers = question.options.filter(opt => opt.isCorrect).length;
      if (correctAnswers !== 1) {
        throw new Error(`Question ${index + 1} must have exactly one correct answer`);
      }
    });

    return new Response(
      JSON.stringify(questionsData),
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