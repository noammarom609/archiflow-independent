// Generate Moodboard Edge Function
// Uses AI to generate a moodboard layout with images

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Generate a simple UUID
function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get the authorization header to verify the user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get the current user from the JWT token
    const token = authHeader.replace('Bearer ', '')
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !authUser) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { prompt } = await req.json()

    if (!prompt) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Call the invoke-llm function to generate the layout plan
    const llmResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/invoke-llm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: `
          You are a professional interior designer. Create a moodboard layout for the concept: "${prompt}".
          
          The canvas size is effectively 1000x800.
          
          Please generate a JSON object representing the moodboard with the following structure:
          {
              "name": "string (creative title for the board)",
              "settings": {
                  "backgroundColor": "string (hex color matching the theme)"
              },
              "items": [
                  {
                      "type": "string (enum: image, text, color, note)",
                      "content": "string (For 'image': a highly detailed DALL-E prompt for the image. For 'text'/'note': the text content. For 'color': hex code)",
                      "position": { "x": number, "y": number },
                      "size": { "width": number, "height": number },
                      "style": { "fontSize": number (for text), "color": "string (hex)" }
                  }
              ]
          }

          Guidelines:
          - Generate 5-8 items total.
          - Include at least 3 'image' items (e.g., main furniture piece, texture detail, atmospheric shot).
          - Include 1-2 'color' swatches (type: color).
          - Include 1 'text' item (title) and maybe 1 'note' (concept description).
          - Position items artistically to form a balanced composition (collage style). Do not overlap them completely.
          - Keep 'x' between 0 and 800, 'y' between 0 and 600.
          - Default size for images: ~250x250. Colors: ~100x100. Text: ~300x50.
        `,
        response_json_schema: {
          type: "object",
          properties: {
            name: { type: "string" },
            settings: {
              type: "object",
              properties: {
                backgroundColor: { type: "string" }
              }
            },
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  type: { type: "string", enum: ["image", "text", "color", "note"] },
                  content: { type: "string" },
                  position: {
                    type: "object",
                    properties: {
                      x: { type: "number" },
                      y: { type: "number" }
                    }
                  },
                  size: {
                    type: "object",
                    properties: {
                      width: { type: "number" },
                      height: { type: "number" }
                    }
                  },
                  style: {
                    type: "object",
                    properties: {
                      fontSize: { type: "number" },
                      color: { type: "string" },
                      backgroundColor: { type: "string" }
                    }
                  }
                }
              }
            }
          },
          required: ["name", "items"]
        }
      })
    })

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text()
      throw new Error(`LLM error: ${errorText}`)
    }

    const layoutPlan = await llmResponse.json()

    // Generate images for image items in parallel
    const itemsWithContent = await Promise.all(layoutPlan.items.map(async (item: any) => {
      const newItem = {
        ...item,
        id: generateId(),
        position: { ...item.position, z: 1 },
        locked: false,
        metadata: { ai_generated: true }
      }

      if (item.type === 'image') {
        try {
          // Call image generation
          const imageRes = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/generate-image`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              prompt: item.content
            })
          })
          
          if (imageRes.ok) {
            const imageData = await imageRes.json()
            if (imageData && imageData.url) {
              newItem.content = imageData.url
              newItem.metadata.original_prompt = item.content
            }
          } else {
            // Fallback if image generation fails
            newItem.type = 'note'
            newItem.content = `Image generation pending: ${item.content}`
          }
        } catch (error) {
          console.error("Failed to generate image item", error)
          newItem.type = 'note'
          newItem.content = `Image generation failed: ${item.content}`
        }
      }
      
      return newItem
    }))

    return new Response(
      JSON.stringify({
        name: layoutPlan.name,
        settings: layoutPlan.settings,
        items: itemsWithContent
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in generateMoodboard:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
