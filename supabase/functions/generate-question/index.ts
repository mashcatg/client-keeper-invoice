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
    const { imageUrl } = await req.json()

    if (!imageUrl) {
      return new Response(
        JSON.stringify({ error: 'No image URL provided' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    console.log('Calling OpenAI API with image URL:', imageUrl)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Generate a multiple choice question based on this image. Return the response in JSON format with the following structure: { questionText: string, options: Array<{ text: string, isCorrect: boolean }>, referenceText: string, solutionText: string }. Make sure exactly one option is correct."
              },
              {
                type: "image_url",
                image_url: imageUrl
              }
            ]
          }
        ],
        max_tokens: 1000
      })
    })

    console.log('OpenAI API response status:', response.status)

    if (!response.ok) {
      const errorData = await response.text()
      console.error('OpenAI API error:', errorData)
      throw new Error(`OpenAI API error: ${errorData}`)
    }

    const data = await response.json()
    console.log('OpenAI API response data:', data)

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response format from OpenAI API')
    }

    const questionData = JSON.parse(data.choices[0].message.content)
    console.log('Parsed question data:', questionData)

    // Validate the question data structure
    if (!questionData.questionText || !Array.isArray(questionData.options)) {
      throw new Error('Invalid question data format')
    }

    return new Response(
      JSON.stringify(questionData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Error in generate-question function:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to generate question', 
        details: error.message,
        stack: error.stack 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})