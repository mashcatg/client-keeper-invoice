import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { responseId } = await req.json();
    
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_ANON_KEY!
    );

    // Get response details
    const { data: response, error: responseError } = await supabase
      .from('responses')
      .select(`
        *,
        quiz:quizzes (
          title,
          marks_per_question,
          negative_marks
        ),
        response_details:response_details (
          is_correct,
          marks_obtained
        )
      `)
      .eq('id', responseId)
      .single();

    if (responseError) throw responseError;

    // Calculate total score
    const totalQuestions = response.response_details.length;
    const correctAnswers = response.response_details.filter((d: any) => d.is_correct).length;
    const score = response.score || 0;

    // Send email using Resend
    const emailResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'EnnoQuiz <quiz@enno.dev>',
        to: [response.user_email],
        subject: `Your Quiz Results - ${response.quiz.title}`,
        html: `
          <h1>Quiz Results</h1>
          <p>Dear ${response.user_name},</p>
          <p>Here are your results for the quiz "${response.quiz.title}":</p>
          <ul>
            <li>Total Questions: ${totalQuestions}</li>
            <li>Correct Answers: ${correctAnswers}</li>
            <li>Final Score: ${score}</li>
          </ul>
          <p>Thank you for taking the quiz!</p>
        `,
      }),
    });

    if (!emailResponse.ok) {
      throw new Error('Failed to send email');
    }

    // Update response to mark email as sent
    await supabase
      .from('responses')
      .update({ email_sent: true })
      .eq('id', responseId);

    return new Response(
      JSON.stringify({ message: 'Email sent successfully' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});