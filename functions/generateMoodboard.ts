import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { v4 as uuidv4 } from 'npm:uuid';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { prompt } = await req.json();

        if (!prompt) {
            return Response.json({ error: 'Prompt is required' }, { status: 400 });
        }

        // 1. Generate the Layout Plan using LLM
        const layoutResponse = await base44.integrations.Core.InvokeLLM({
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
        });

        const layoutPlan = layoutResponse; // InvokeLLM returns the object directly when schema is provided

        // 2. Generate Images in Parallel
        const itemsWithContent = await Promise.all(layoutPlan.items.map(async (item) => {
            const newItem = {
                ...item,
                id: uuidv4(),
                position: { ...item.position, z: 1 }, // Ensure z-index
                locked: false,
                metadata: { ai_generated: true }
            };

            if (item.type === 'image') {
                try {
                    // Call image generation with the prompt in 'content'
                    const imageRes = await base44.integrations.Core.GenerateImage({
                        prompt: item.content
                    });
                    
                    if (imageRes && imageRes.url) {
                         // Upload to ensure persistence
                         try {
                            const fetchRes = await fetch(imageRes.url);
                            const blob = await fetchRes.blob();
                            const file = new File([blob], `ai-gen-${uuidv4()}.png`, { type: "image/png" });
                            
                            // UploadFile integration expects 'file' parameter.
                            // However, in backend functions, we can't pass File object directly to this integration wrapper easily 
                            // if it expects form data style. 
                            // The SDK wrapper for UploadFile handles File objects if running in browser, 
                            // but in Deno it might be different. 
                            // Let's use the direct URL for now to be safe and fast, 
                            // or assume GenerateImage returns a URL we can use directly.
                            // The GenerateImage integration returns a URL.
                            
                            // Optimization: Just use the URL returned by GenerateImage.
                            // Ideally we upload it, but for this specific "generateMoodboard" function context, 
                            // passing the URL back to frontend is standard.
                            
                            newItem.content = imageRes.url;
                            newItem.metadata.original_prompt = item.content;
                        } catch (e) {
                            console.error("Failed to process image blob", e);
                            newItem.content = imageRes.url;
                        }
                    }
                } catch (error) {
                    console.error("Failed to generate image item", error);
                    // Fallback or remove item? Let's keep it with error text or placeholder
                    newItem.type = 'note';
                    newItem.content = `Image generation failed: ${item.content}`;
                }
            }
            
            return newItem;
        }));

        return Response.json({
            name: layoutPlan.name,
            settings: layoutPlan.settings,
            items: itemsWithContent
        });

    } catch (error) {
        return Response.json({ error: error.message }, { status: 500 });
    }
});