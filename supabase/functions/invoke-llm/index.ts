// Invoke LLM Edge Function
// Calls OpenAI API for text generation with JSON mode support

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { 
      prompt, 
      system_prompt, 
      model = 'gpt-4o-mini', 
      max_tokens = 4000,  // ✅ Increased for JSON responses
      temperature = 0.7,
      response_json_schema  // ✅ NEW: Support JSON schema
    } = await req.json()

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: prompt' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const openaiApiKey = Deno.env.get('OPENAI_API_KEY')
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: 'OpenAI API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const messages = []
    
    // ✅ If JSON schema is provided, add instruction to system prompt
    let effectiveSystemPrompt = system_prompt || ''
    if (response_json_schema) {
      const jsonInstruction = `\n\nIMPORTANT: You MUST respond with a valid JSON object that matches this schema. Do NOT include any markdown formatting, code blocks, or explanatory text. Return ONLY the JSON object.\n\nRequired JSON Schema:\n${JSON.stringify(response_json_schema, null, 2)}`
      effectiveSystemPrompt = effectiveSystemPrompt 
        ? effectiveSystemPrompt + jsonInstruction 
        : jsonInstruction
    }
    
    if (effectiveSystemPrompt) {
      messages.push({ role: 'system', content: effectiveSystemPrompt })
    }
    
    messages.push({ role: 'user', content: prompt })

    // ✅ Build request body with optional JSON mode
    const requestBody: Record<string, unknown> = {
      model,
      messages,
      max_tokens,
      temperature
    }
    
    // ✅ Enable JSON mode when schema is provided (for compatible models)
    if (response_json_schema) {
      requestBody.response_format = { type: 'json_object' }
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI API error: ${error}`)
    }

    const data = await response.json()
    const content = data.choices[0]?.message?.content || ''

    // ✅ If JSON schema was requested, try to parse and return as object
    let parsedContent = content
    if (response_json_schema && content) {
      try {
        // Try to parse JSON directly
        parsedContent = JSON.parse(content)
        console.log('✅ Successfully parsed JSON response')
      } catch (parseError) {
        // If parsing fails, try to extract JSON from markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
        if (jsonMatch) {
          try {
            parsedContent = JSON.parse(jsonMatch[1].trim())
            console.log('✅ Extracted and parsed JSON from code block')
          } catch {
            console.warn('⚠️ Could not parse JSON from code block, returning raw content')
            parsedContent = content
          }
        } else {
          console.warn('⚠️ Could not parse JSON response, returning raw content')
          parsedContent = content
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        response: parsedContent,  // ✅ Return parsed object or raw string
        usage: data.usage,
        model: data.model
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error invoking LLM:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
