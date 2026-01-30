// Transcribe Large Audio Edge Function
// Uses OpenAI Whisper API to transcribe audio files

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
    const { audio_url, language = 'he' } = await req.json()

    if (!audio_url) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: audio_url' }),
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

    // Download the audio file
    console.log('Downloading audio from:', audio_url)
    const audioResponse = await fetch(audio_url)
    if (!audioResponse.ok) {
      throw new Error(`Failed to download audio: ${audioResponse.status}`)
    }

    const audioBlob = await audioResponse.blob()
    const audioSize = audioBlob.size
    console.log('Audio file size:', audioSize, 'bytes')

    // Check file size (Whisper has a 25MB limit)
    const maxSize = 25 * 1024 * 1024 // 25MB
    if (audioSize > maxSize) {
      return new Response(
        JSON.stringify({ 
          error: 'Audio file too large. Maximum size is 25MB.',
          size: audioSize,
          maxSize
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Prepare form data for Whisper API
    const formData = new FormData()
    formData.append('file', audioBlob, 'audio.mp3')
    formData.append('model', 'whisper-1')
    formData.append('language', language)
    formData.append('response_format', 'verbose_json')

    console.log('Sending to Whisper API...')
    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
      },
      body: formData
    })

    if (!whisperResponse.ok) {
      const error = await whisperResponse.text()
      throw new Error(`Whisper API error: ${error}`)
    }

    const result = await whisperResponse.json()
    console.log('Transcription complete. Duration:', result.duration, 'seconds')

    return new Response(
      JSON.stringify({ 
        success: true,
        transcription: result.text,
        duration: result.duration,
        language: result.language,
        segments: result.segments
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error transcribing audio:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
