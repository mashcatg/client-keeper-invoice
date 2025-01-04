import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  responseId: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { responseId } = await req.json() as EmailRequest;

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get response details with quiz and user info
    const { data: response, error: responseError } = await supabaseClient
      .from("responses")
      .select(`
        *,
        quiz:quizzes (
          title
        )
      `)
      .eq("id", responseId)
      .single();

    if (responseError) throw responseError;

    // Send email using Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("RESEND_API_KEY")}`,
      },
      body: JSON.stringify({
        from: "Quiz System <quiz@yourdomain.com>",
        to: [response.user_email],
        subject: `Quiz Completed: ${response.quiz.title}`,
        html: `
          <h1>Quiz Completion Confirmation</h1>
          <p>Dear ${response.user_name},</p>
          <p>Thank you for completing the quiz "${response.quiz.title}".</p>
          <p>Your score: ${response.score}</p>
          <p>Time taken: ${new Date(response.completed_at).getTime() - new Date(response.started_at).getTime()} seconds</p>
        `,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to send email");
    }

    // Mark email as sent
    await supabaseClient
      .from("responses")
      .update({ email_sent: true })
      .eq("id", responseId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error in send-quiz-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
};

serve(handler);