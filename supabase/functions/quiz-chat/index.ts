import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { message, quizId, history } = await req.json()

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch quiz questions
    const { data: questions, error: questionsError } = await supabase
      .from('questions')
      .select(`
        *,
        options (*)
      `)
      .eq('quiz_id', quizId)

    if (questionsError) throw questionsError

    // Format questions for context
    const questionsContext = questions.map((q: any) => ({
      question: q.question_text,
      reference: q.reference_text,
      solution: q.solution_text,
      correctAnswer: q.options.find((o: any) => o.is_correct)?.option_text,
    }))

    const response = await fetch('https://api.gemini.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('GEMINI_API_KEY')}`,
      },
      body: JSON.stringify({
        model: 'gemini-pro',
        messages: [
          {
            role: 'system',
            content: `You are a helpful AI tutor that assists with questions from a quiz. You have access to these questions and their answers: ${JSON.stringify(questionsContext)}. Be concise, use emojis, and maintain a friendly tone. Use the chat history to provide context-aware responses.`
          },
          ...history,
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.7,
        max_tokens: 150,
      }),
    })

    const data = await response.json()
    return new Response(
      JSON.stringify({ response: data.choices[0].message.content }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})