import React, { useState } from 'react';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Type, 
  Wand2, 
  Loader2, 
  LayoutTemplate,
  Palette,
  Lightbulb,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { archiflow } from '@/api/archiflow';
import { showSuccess, showError } from '@/components/utils/notifications';

export default function AIToolsPanel({ onAddItem, selectedItems, onUpdateItem, onLoadBoard, allItems, boardName }) {
  const [activeMode, setActiveMode] = useState('assist'); // 'assist' | 'image' | 'text'
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [textAction, setTextAction] = useState('professional');
  const [boardTheme, setBoardTheme] = useState('');

  const selectedTextItem = selectedItems.find(i => i.type === 'text' || i.type === 'note');

  // --- 1. Image Generation ---
  const handleGenerateImage = async () => {
    if (!prompt) return;

    setIsGenerating(true);
    try {
      const res = await archiflow.integrations.Core.GenerateImage({
        prompt: prompt,
      });

      if (res && res.url) {
        try {
            // Try to upload to persistent storage
            const imageRes = await fetch(res.url);
            const blob = await imageRes.blob();
            const file = new File([blob], "ai-generated.png", { type: "image/png" });
            const uploadRes = await archiflow.integrations.Core.UploadFile({ file });
            
            const finalUrl = uploadRes.file_url;
            setGeneratedImages(prev => [finalUrl, ...prev]);
            showSuccess('תמונה נוצרה בהצלחה');
        } catch (uploadErr) {
            console.error("Upload failed, using direct url", uploadErr);
            setGeneratedImages(prev => [res.url, ...prev]);
            showSuccess('תמונה נוצרה (קישור ישיר)');
        }
      }
    } catch (error) {
      console.error(error);
      showError('שגיאה ביצירת תמונה');
    } finally {
      setIsGenerating(false);
    }
  };

  // --- 2. Full Board Generation ---
  const handleGenerateBoard = async () => {
    if (!boardTheme) return;

    setIsGenerating(true);
    try {
        const { data } = await archiflow.functions.invoke('generateMoodboard', { prompt: boardTheme });
        
        if (data && data.items) {
            if (onLoadBoard) {
                onLoadBoard(data.items, data.settings, data.name);
            }
        }
    } catch (error) {
        console.error(error);
        showError('שגיאה ביצירת הלוח');
    } finally {
        setIsGenerating(false);
    }
  };

  // --- 3. Text AI ---
  const handleTextAI = async () => {
    if (!selectedTextItem && activeMode === 'text') return;
    
    setIsGenerating(true);
    try {
      let userPrompt = "";

      if (selectedTextItem) {
        userPrompt = `Rewrite the following text to be more ${textAction} in Hebrew: "${selectedTextItem.content}"`;
      } else {
        userPrompt = `Generate a ${textAction} text for an interior design moodboard in Hebrew. Keep it concise.`;
      }

      const res = await archiflow.integrations.Core.InvokeLLM({
        prompt: userPrompt,
        add_context_from_internet: false
      });

      if (res) {
        const newText = typeof res === 'string' ? res.replace(/^"|"$/g, '') : JSON.stringify(res);
        
        if (selectedTextItem) {
            onUpdateItem(selectedTextItem.id, { content: newText });
            showSuccess('טקסט עודכן');
        } else {
            onAddItem('text', newText);
            showSuccess('טקסט נוצר');
        }
      }
    } catch (error) {
      console.error(error);
      showError('שגיאה בעיבוד טקסט');
    } finally {
      setIsGenerating(false);
    }
  };

  // --- 4. Magic Palette (New) ---
  const handleMagicPalette = async () => {
    setIsGenerating(true);
    try {
        const context = boardName || "interior design";
        const prompt = `Generate a harmonious color palette of 5 hex codes for a "${context}" interior design moodboard. Return ONLY a JSON array of strings, e.g. ["#ffffff", "#000000"].`;
        
        const res = await archiflow.integrations.Core.InvokeLLM({
            prompt: prompt,
            response_json_schema: { type: "object", properties: { colors: { type: "array", items: { type: "string" } } } }
        });

        if (res && res.colors) {
            let xOffset = 0;
            res.colors.forEach((color, i) => {
                onAddItem('color', color, { 
                    position: { x: 100 + (i * 60), y: 100, z: 100 },
                    size: { width: 50, height: 50 }
                });
            });
            showSuccess('פלטת צבעים נוספה');
        }
    } catch (error) {
        console.error(error);
        showError('שגיאה ביצירת פלטה');
    } finally {
        setIsGenerating(false);
    }
  };

  // --- 5. Smart Suggestions (New) ---
  const handleSmartSuggestions = async () => {
    setIsGenerating(true);
    try {
        const context = boardName || "living room";
        const prompt = `Suggest 3 specific furniture or decor items for a "${context}" style. Return JSON with 'items' array containing 'name' and 'visual_description'.`;
        
        const res = await archiflow.integrations.Core.InvokeLLM({
            prompt: prompt,
            response_json_schema: { 
                type: "object", 
                properties: { 
                    items: { 
                        type: "array", 
                        items: { 
                            type: "object", 
                            properties: { 
                                name: { type: "string" }, 
                                visual_description: { type: "string" } 
                            } 
                        } 
                    } 
                } 
            }
        });

        if (res && res.items) {
            // Trigger image generation for the first item automatically, or show list?
            // Let's generate the first one to be impressive.
            const item = res.items[0];
            const imageRes = await archiflow.integrations.Core.GenerateImage({
                prompt: `Professional photography of ${item.visual_description}, isolated on white background, interior design product shot`,
            });
            
            if (imageRes?.url) {
                 onAddItem('image', imageRes.url, { size: { width: 250, height: 250 } });
                 showSuccess(`הוספתי ${item.name} ללוח`);
            }
        }
    } catch (error) {
        console.error(error);
        showError('שגיאה בקבלת הצעות');
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Mode Switcher */}
      <div className="grid grid-cols-4 p-2 gap-1 border-b border-slate-200 bg-white">
        <Button variant={activeMode === 'assist' ? 'secondary' : 'ghost'} size="sm" className="px-0" onClick={() => setActiveMode('assist')} title="עוזר חכם">
          <Sparkles className="w-4 h-4" />
        </Button>
        <Button variant={activeMode === 'board' ? 'secondary' : 'ghost'} size="sm" className="px-0" onClick={() => setActiveMode('board')} title="לוח">
          <LayoutTemplate className="w-4 h-4" />
        </Button>
        <Button variant={activeMode === 'image' ? 'secondary' : 'ghost'} size="sm" className="px-0" onClick={() => setActiveMode('image')} title="תמונה">
          <ImageIcon className="w-4 h-4" />
        </Button>
        <Button variant={activeMode === 'text' ? 'secondary' : 'ghost'} size="sm" className="px-0" onClick={() => setActiveMode('text')} title="טקסט">
          <Type className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {/* --- ASSIST MODE --- */}
        {activeMode === 'assist' && (
            <div className="space-y-4">
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-100">
                    <h4 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-indigo-600" />
                        העוזר של ArchiFlow
                    </h4>
                    <p className="text-xs text-indigo-700 leading-relaxed opacity-80 mb-4">
                        אני יכול לעזור לך להשלים את הלוח עם צבעים, פריטים ורעיונות.
                    </p>
                    
                    <div className="space-y-2">
                        <Button 
                            variant="white" 
                            className="w-full justify-start text-xs h-9 shadow-sm"
                            onClick={handleMagicPalette}
                            disabled={isGenerating}
                        >
                            <Palette className="w-3.5 h-3.5 mr-2 text-pink-500" />
                            צור פלטת צבעים אוטומטית
                        </Button>
                        <Button 
                            variant="white" 
                            className="w-full justify-start text-xs h-9 shadow-sm"
                            onClick={handleSmartSuggestions}
                            disabled={isGenerating}
                        >
                            <Plus className="w-3.5 h-3.5 mr-2 text-green-500" />
                            הצע והוסף פריט מתאים
                        </Button>
                    </div>
                </div>
                
                {isGenerating && (
                    <div className="flex flex-col items-center justify-center p-4 text-slate-400">
                        <Loader2 className="w-6 h-6 animate-spin mb-2" />
                        <span className="text-xs">ה-AI חושב...</span>
                    </div>
                )}
            </div>
        )}

        {/* --- BOARD MODE --- */}
        {activeMode === 'board' && (
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>נושא הלוח</Label>
                    <Textarea 
                        placeholder="סלון נורדי מינימליסטי עם גווני עץ..."
                        value={boardTheme}
                        onChange={(e) => setBoardTheme(e.target.value)}
                        className="h-32 resize-none text-sm"
                    />
                </div>
                <Button 
                    className="w-full bg-indigo-600 hover:bg-indigo-700"
                    onClick={handleGenerateBoard}
                    disabled={isGenerating || !boardTheme}
                >
                    {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4 mr-2" />}
                    צור לוח מלא
                </Button>
            </div>
        )}
        
        {/* --- IMAGE MODE --- */}
        {activeMode === 'image' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>תיאור התמונה</Label>
              <Textarea 
                placeholder="כורסה צהובה מודרנית..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="h-24 resize-none text-sm"
              />
            </div>
            <Button 
              className="w-full"
              onClick={handleGenerateImage}
              disabled={isGenerating || !prompt}
            >
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'צור תמונה'}
            </Button>

            {generatedImages.length > 0 && (
              <div className="grid grid-cols-2 gap-2 pt-2">
                {generatedImages.map((url, idx) => (
                  <img 
                    key={idx} 
                    src={url} 
                    className="rounded-md border cursor-pointer hover:opacity-80"
                    onClick={() => onAddItem('image', url, { size: { width: 250, height: 250 } })} 
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* --- TEXT MODE --- */}
        {activeMode === 'text' && (
          <div className="space-y-4">
            {selectedTextItem && (
              <div className="bg-slate-100 p-2 rounded text-xs truncate">
                נבחר: {selectedTextItem.content}
              </div>
            )}
            <div className="space-y-2">
              <Label>סגנון כתיבה</Label>
              <Select value={textAction} onValueChange={setTextAction}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">מקצועי</SelectItem>
                  <SelectItem value="creative">יצירתי</SelectItem>
                  <SelectItem value="minimal">מינימליסטי</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button 
              className="w-full"
              onClick={handleTextAI}
              disabled={isGenerating}
            >
              {selectedTextItem ? 'שפר טקסט' : 'צור טקסט'}
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}