import React, { useState } from 'react';
import { 
  Sparkles, 
  Image as ImageIcon, 
  Type, 
  Wand2, 
  Loader2, 
  RefreshCw,
  Check,
  LayoutTemplate
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
import { base44 } from '@/api/base44Client';
import { showSuccess, showError } from '@/components/utils/notifications';

export default function AIToolsPanel({ onAddItem, selectedItems, onUpdateItem, onLoadBoard }) {
  const [activeMode, setActiveMode] = useState('board'); // 'board' | 'image' | 'text'
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState([]);
  const [textAction, setTextAction] = useState('professional');
  const [boardTheme, setBoardTheme] = useState('');

  const selectedTextItem = selectedItems.find(i => i.type === 'text' || i.type === 'note');

  const handleGenerateImage = async () => {
    if (!prompt) return;

    setIsGenerating(true);
    try {
      const res = await base44.integrations.Core.GenerateImage({
        prompt: prompt,
        // You can add style modifiers here if needed
      });

      if (res && res.url) {
        // In a real app, you might want to upload this URL to your storage
        // to ensure it persists, as some AI generated URLs expire.
        // For now, we'll use it directly or assume the integration handles it.
        // Let's try to upload it to be safe if we can, otherwise just add.
        
        // Quick fetch and upload pattern
        try {
            const imageRes = await fetch(res.url);
            const blob = await imageRes.blob();
            const file = new File([blob], "ai-generated.png", { type: "image/png" });
            const uploadRes = await base44.integrations.Core.UploadFile({ file });
            
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

  const handleGenerateBoard = async () => {
    if (!boardTheme) return;

    setIsGenerating(true);
    try {
        const { data } = await base44.functions.invoke('generateMoodboard', { prompt: boardTheme });
        
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

  const handleTextAI = async () => {
    if (!selectedTextItem && activeMode === 'text_edit') return;
    
    setIsGenerating(true);
    try {
      let systemPrompt = "You are a helpful design assistant.";
      let userPrompt = "";

      if (selectedTextItem) {
        // Modify existing text
        userPrompt = `Rewrite the following text to be more ${textAction} in Hebrew: "${selectedTextItem.content}"`;
      } else {
        // Generate new text
        userPrompt = `Generate a ${textAction} for an interior design moodboard in Hebrew.`;
      }

      const res = await base44.integrations.Core.InvokeLLM({
        prompt: userPrompt,
        add_context_from_internet: false
      });

      if (res) {
        // The response is a string
        const newText = res.replace(/^"|"$/g, ''); // Remove quotes if present
        
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

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      {/* Mode Switcher */}
      <div className="flex p-2 gap-2 border-b border-slate-200 bg-white">
        <Button 
          variant={activeMode === 'board' ? 'secondary' : 'ghost'} 
          className="flex-1 gap-2 px-2"
          onClick={() => setActiveMode('board')}
          title="יצירת לוח שלם"
        >
          <LayoutTemplate className="w-4 h-4" />
          <span className="hidden sm:inline">לוח</span>
        </Button>
        <Button 
          variant={activeMode === 'image' ? 'secondary' : 'ghost'} 
          className="flex-1 gap-2 px-2"
          onClick={() => setActiveMode('image')}
          title="יצירת תמונה"
        >
          <ImageIcon className="w-4 h-4" />
          <span className="hidden sm:inline">תמונה</span>
        </Button>
        <Button 
          variant={activeMode === 'text' ? 'secondary' : 'ghost'} 
          className="flex-1 gap-2 px-2"
          onClick={() => setActiveMode('text')}
          title="עריכת טקסט"
        >
          <Type className="w-4 h-4" />
          <span className="hidden sm:inline">טקסט</span>
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">

        {activeMode === 'board' && (
            <div className="space-y-4">
                <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                    <h4 className="font-semibold text-indigo-900 mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        יצירת לוח אוטומטית
                    </h4>
                    <p className="text-xs text-indigo-700 leading-relaxed opacity-80">
                        הזן קונספט עיצובי וה-AI ייצור עבורך לוח השראה שלם עם תמונות, צבעים, טקסט וסידור על הדף.
                    </p>
                </div>

                <div className="space-y-2">
                    <Label>קונספט / נושא הלוח</Label>
                    <Textarea 
                        placeholder="למשל: סלון נורדי מינימליסטי עם גווני עץ בהיר וירוק מרווה, אווירה רגועה ומוארת..."
                        value={boardTheme}
                        onChange={(e) => setBoardTheme(e.target.value)}
                        className="h-32 resize-none text-base"
                    />
                </div>

                <Button 
                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg h-12 text-lg"
                    onClick={handleGenerateBoard}
                    disabled={isGenerating || !boardTheme}
                >
                    {isGenerating ? (
                        <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        מעבד לוח (כ-20 שניות)...
                        </>
                    ) : (
                        <>
                        <Wand2 className="w-5 h-5 mr-2" />
                        צור לוח השראה
                        </>
                    )}
                </Button>
                
                {isGenerating && (
                    <p className="text-center text-xs text-slate-400 animate-pulse">
                        ה-AI מייצר תמונות ומסדר את האלמנטים...
                    </p>
                )}
            </div>
        )}
        
        {activeMode === 'image' && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>תיאור התמונה (Prompt)</Label>
              <Textarea 
                placeholder="תאר את התמונה שברצונך ליצור... (למשל: סלון מודרני עם ספה ירוקה וקיר בטון)"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="h-24 resize-none"
              />
            </div>

            <Button 
              className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-md"
              onClick={handleGenerateImage}
              disabled={isGenerating || !prompt}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  יוצר...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  צור תמונה
                </>
              )}
            </Button>

            {generatedImages.length > 0 && (
              <div className="space-y-2 pt-4 border-t border-slate-200">
                <Label className="text-xs text-slate-500">נוצרו לאחרונה</Label>
                <div className="grid grid-cols-2 gap-2">
                  {generatedImages.map((url, idx) => (
                    <div 
                      key={idx} 
                      className="group relative aspect-square bg-slate-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500"
                      onClick={() => {
                        const img = new Image();
                        img.onload = () => {
                            const aspectRatio = img.width / img.height;
                            onAddItem('image', url, { size: { width: 300, height: 300 / aspectRatio } });
                        };
                        img.src = url;
                      }}
                    >
                      <img src={url} alt="Generated" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <Check className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeMode === 'text' && (
          <div className="space-y-4">
            {selectedTextItem ? (
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-sm text-indigo-800 mb-4">
                <p className="font-medium mb-1">טקסט נבחר לעריכה:</p>
                <p className="opacity-80 truncate">"{selectedTextItem.content}"</p>
              </div>
            ) : (
              <div className="bg-slate-100 border border-slate-200 rounded-lg p-3 text-sm text-slate-600 mb-4">
                <p>לא נבחר טקסט. המערכת תיצור טקסט חדש.</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>פעולה רצויה</Label>
              <Select value={textAction} onValueChange={setTextAction}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">ניסוח מקצועי ורשמי</SelectItem>
                  <SelectItem value="creative">ניסוח יצירתי ומושך</SelectItem>
                  <SelectItem value="minimal">ניסוח מינימליסטי וקצר</SelectItem>
                  <SelectItem value="title">כותרת לקונספט עיצובי</SelectItem>
                  <SelectItem value="description">תיאור אווירה (Mood)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              onClick={handleTextAI}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  מעבד...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  {selectedTextItem ? 'שפר טקסט' : 'צור טקסט'}
                </>
              )}
            </Button>
          </div>
        )}

      </div>
    </div>
  );
}