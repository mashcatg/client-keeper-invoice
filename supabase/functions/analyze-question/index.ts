import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { questionId, analysisType } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch question and its linked questions
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select(`
        *,
        options (*)
      `)
      .eq('id', questionId)
      .single();

    if (questionError) throw questionError;

    // Prepare prompt based on analysis type
    let prompt = '';
    if (analysisType === 'importance') {
      prompt = `Analyze the importance and educational value of this question:
      Question: ${question.question_text}
      Options: ${question.options.map((opt: any) => opt.option_text).join(', ')}
      Reference: ${question.reference_text || 'None'}
      
      Provide a detailed analysis of:
      1. The key concepts being tested
      2. The difficulty level
      3. The educational value
      4. Suggestions for improvement`;
    } else if (analysisType === 'solution') {
      prompt = `Generate a detailed solution for this question:
      Question: ${question.question_text}
      Options: ${question.options.map((opt: any) => opt.option_text).join(', ')}
      Reference: ${question.reference_text || 'None'}
      
      Provide:
      1. Step-by-step solution process
      2. Key concepts involved
      3. Common mistakes to avoid
      4. Additional tips for understanding`;
    }

    // Call Gemini API for analysis
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': Deno.env.get('GEMINI_API_KEY') ?? '',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1000,
        },
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to get response from Gemini API');
    }

    const data = await response.json();
    const analysis = data.candidates[0].content.parts[0].text;

    // Save the analysis
    if (analysisType === 'importance') {
      await supabase
        .from('questions')
        .update({ ai_importance_analysis: analysis })
        .eq('id', questionId);
    } else if (analysisType === 'solution') {
      await supabase
        .from('questions')
        .update({ ai_solution_steps: analysis })
        .eq('id', questionId);
    }

    await supabase
      .from('question_analysis')
      .insert({
        question_id: questionId,
        analysis_type: analysisType,
        content: analysis
      });

    return new Response(
      JSON.stringify({ analysis }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in analyze-question function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});