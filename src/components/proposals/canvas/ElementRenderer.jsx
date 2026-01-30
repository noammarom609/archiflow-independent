import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { archiflow } from '@/api/archiflow';
import { 
  Upload, 
  Loader2, 
  Sparkles, 
  Check, 
  X,
  Plus,
  Trash2,
  GripVertical
} from 'lucide-react';

/**
 * ElementRenderer - מרנדר אלמנטים לפי סוג
 */
export default function ElementRenderer({ element, styling: globalStyling, isEditing = true }) {
  const { type, content = {}, styling = {} } = element;

  switch (type) {
    case 'heading':
      return <HeadingElement content={content} styling={styling} isEditing={isEditing} />;
    
    case 'subheading':
      return <SubheadingElement content={content} styling={styling} isEditing={isEditing} />;
    
    case 'paragraph':
      return <ParagraphElement content={content} styling={styling} isEditing={isEditing} />;
    
    case 'list':
      return <ListElement content={content} styling={styling} isEditing={isEditing} />;
    
    case 'quote':
      return <QuoteElement content={content} styling={styling} isEditing={isEditing} />;
    
    case 'image':
    case 'logo':
      return <ImageElement content={content} styling={styling} isEditing={isEditing} type={type} />;
    
    case 'rectangle':
      return <RectangleElement content={content} styling={styling} />;
    
    case 'circle':
      return <CircleElement content={content} styling={styling} />;
    
    case 'line':
    case 'divider':
      return <LineElement content={content} styling={styling} />;
    
    case 'pricing_table':
      return <PricingTableElement content={content} styling={styling} globalStyling={globalStyling} isEditing={isEditing} />;
    
    case 'signature':
      return <SignatureElement content={content} styling={styling} isEditing={isEditing} />;
    
    case 'checklist':
      return <ChecklistElement content={content} styling={styling} isEditing={isEditing} />;
    
    case 'ai_text':
      return <AITextElement content={content} styling={styling} isEditing={isEditing} />;
    
    case 'ai_image':
      return <AIImageElement content={content} styling={styling} isEditing={isEditing} />;
    
    default:
      return (
        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-sm">
          אלמנט לא מוכר: {type}
        </div>
      );
  }
}

// Heading Element
function HeadingElement({ content, styling, isEditing }) {
  const [text, setText] = useState(content.text || '');
  
  // Sync with content prop
  React.useEffect(() => {
    setText(content.text || '');
  }, [content.text]);
  
  return (
    <div 
      className="w-full h-full flex items-center p-2"
      style={{ 
        textAlign: styling.textAlign || 'right',
        color: styling.color || '#1e293b'
      }}
    >
      {isEditing ? (
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full bg-transparent border-0 outline-none font-bold"
          style={{ fontSize: content.fontSize || 32 }}
          placeholder="כותרת..."
        />
      ) : (
        <h1 style={{ fontSize: content.fontSize || 32, fontWeight: content.fontWeight || 'bold' }}>
          {text || content.text}
        </h1>
      )}
    </div>
  );
}

// Subheading Element
function SubheadingElement({ content, styling, isEditing }) {
  const [text, setText] = useState(content.text || '');
  
  React.useEffect(() => {
    setText(content.text || '');
  }, [content.text]);
  
  return (
    <div 
      className="w-full h-full flex items-center p-2"
      style={{ 
        textAlign: styling.textAlign || 'right',
        color: styling.color || '#334155'
      }}
    >
      {isEditing ? (
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full bg-transparent border-0 outline-none font-semibold"
          style={{ fontSize: content.fontSize || 24 }}
          placeholder="כותרת משנית..."
        />
      ) : (
        <h2 style={{ fontSize: content.fontSize || 24, fontWeight: content.fontWeight || 'semibold' }}>
          {text || content.text}
        </h2>
      )}
    </div>
  );
}

// Paragraph Element
function ParagraphElement({ content, styling, isEditing }) {
  const [text, setText] = useState(content.text || '');
  
  React.useEffect(() => {
    setText(content.text || '');
  }, [content.text]);
  
  return (
    <div 
      className="w-full h-full p-2"
      style={{ 
        textAlign: styling.textAlign || 'right',
        color: styling.color || '#475569',
        lineHeight: styling.lineHeight || 1.6
      }}
    >
      {isEditing ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full h-full bg-transparent border-0 outline-none resize-none"
          style={{ fontSize: content.fontSize || 14 }}
          placeholder="הקלד טקסט..."
        />
      ) : (
        <p style={{ fontSize: content.fontSize || 14 }} className="whitespace-pre-wrap">
          {text || content.text}
        </p>
      )}
    </div>
  );
}

// List Element
function ListElement({ content, styling, isEditing }) {
  const [items, setItems] = useState(content.items || []);
  
  return (
    <div 
      className="w-full h-full p-2 overflow-auto"
      style={{ textAlign: styling.textAlign || 'right', color: styling.color || '#475569' }}
    >
      <ul className={`space-y-1 ${content.listStyle === 'numbered' ? 'list-decimal' : 'list-disc'} mr-4`}>
        {items.map((item, idx) => (
          <li key={idx} className="text-sm">{item}</li>
        ))}
      </ul>
    </div>
  );
}

// Quote Element
function QuoteElement({ content, styling, isEditing }) {
  const [text, setText] = useState(content.text || '');
  
  React.useEffect(() => {
    setText(content.text || '');
  }, [content.text]);
  
  return (
    <div 
      className="w-full h-full p-4 flex flex-col justify-center"
      style={{ 
        textAlign: styling.textAlign || 'center',
        color: styling.color || '#64748b',
        borderRight: `4px solid ${styling.borderColor || '#4338ca'}`,
        fontStyle: styling.fontStyle || 'italic'
      }}
    >
      {isEditing ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full bg-transparent border-0 outline-none resize-none text-center"
          placeholder="ציטוט..."
        />
      ) : (
        <blockquote className="text-lg">"{text || content.text}"</blockquote>
      )}
      {content.author && (
        <p className="text-sm mt-2 opacity-70">— {content.author}</p>
      )}
    </div>
  );
}

// Image Element
function ImageElement({ content, styling, isEditing, type }) {
  const [isUploading, setIsUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState(content.url || '');

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await archiflow.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div 
      className="w-full h-full flex items-center justify-center overflow-hidden"
      style={{ borderRadius: styling.borderRadius || 8 }}
    >
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={content.alt || ''} 
          className="w-full h-full"
          style={{ 
            objectFit: content.objectFit || 'cover',
            borderRadius: styling.borderRadius || 8,
            boxShadow: styling.shadow ? '0 10px 25px rgba(0,0,0,0.1)' : 'none'
          }}
        />
      ) : isEditing ? (
        <label className="w-full h-full bg-slate-100 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-200 transition-colors">
          <input type="file" accept="image/*" onChange={handleUpload} className="hidden" />
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-slate-400 animate-spin" />
          ) : (
            <>
              <Upload className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-sm text-slate-500">
                {type === 'logo' ? 'העלה לוגו' : 'העלה תמונה'}
              </span>
            </>
          )}
        </label>
      ) : (
        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
          <span className="text-slate-400">אין תמונה</span>
        </div>
      )}
    </div>
  );
}

// Rectangle Element
function RectangleElement({ content, styling }) {
  return (
    <div 
      className="w-full h-full"
      style={{
        backgroundColor: content.fill || '#f1f5f9',
        border: `${content.strokeWidth || 1}px solid ${content.stroke || '#e2e8f0'}`,
        borderRadius: content.cornerRadius || 8,
        opacity: styling.opacity || 1,
      }}
    />
  );
}

// Circle Element
function CircleElement({ content, styling }) {
  return (
    <div 
      className="w-full h-full rounded-full"
      style={{
        backgroundColor: content.fill || '#f1f5f9',
        border: `${content.strokeWidth || 1}px solid ${content.stroke || '#e2e8f0'}`,
        opacity: styling.opacity || 1,
      }}
    />
  );
}

// Line Element
function LineElement({ content, styling }) {
  return (
    <div className="w-full h-full flex items-center">
      <div 
        className="w-full"
        style={{
          height: content.strokeWidth || 2,
          backgroundColor: content.stroke || '#cbd5e1',
          borderStyle: content.style || 'solid',
          opacity: styling.opacity || 1,
        }}
      />
    </div>
  );
}

// Pricing Table Element
function PricingTableElement({ content, styling, globalStyling, isEditing }) {
  const primaryColor = globalStyling?.primary_color || styling.headerBg || '#4338ca';
  
  return (
    <div className="w-full h-full p-2 overflow-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr style={{ backgroundColor: primaryColor }}>
            <th className="text-right py-2 px-3 text-white font-medium rounded-tr-lg">תיאור</th>
            <th className="text-center py-2 px-2 text-white font-medium">כמות</th>
            <th className="text-center py-2 px-2 text-white font-medium">מחיר</th>
            <th className="text-left py-2 px-3 text-white font-medium rounded-tl-lg">סה"כ</th>
          </tr>
        </thead>
        <tbody>
          {(content.items || []).map((item, idx) => (
            <tr key={idx} className="border-b border-slate-100">
              <td className="py-2 px-3 text-slate-700">{item.description}</td>
              <td className="py-2 px-2 text-center text-slate-600">{item.quantity}</td>
              <td className="py-2 px-2 text-center text-slate-600">₪{item.price}</td>
              <td className="py-2 px-3 text-left font-medium">₪{item.quantity * item.price}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {content.showSubtotal && (
        <div className="flex justify-between mt-3 pt-3 border-t text-sm">
          <span className="text-slate-600">סכום ביניים</span>
          <span className="font-medium">₪{(content.items || []).reduce((sum, item) => sum + item.quantity * item.price, 0)}</span>
        </div>
      )}
    </div>
  );
}

// Signature Element
function SignatureElement({ content, styling, isEditing }) {
  return (
    <div className="w-full h-full p-4 flex flex-col justify-end">
      {content.showDate && (
        <div className="mb-4">
          <p className="text-xs text-slate-500 mb-1">תאריך</p>
          <p className="text-sm text-slate-700">{new Date().toLocaleDateString('he-IL')}</p>
        </div>
      )}
      <div>
        <div 
          className="w-full border-b-2 mb-2"
          style={{ borderColor: styling.lineColor || '#cbd5e1' }}
        />
        <p className="text-xs text-slate-500">{content.label || 'חתימה'}</p>
      </div>
    </div>
  );
}

// Checklist Element
function ChecklistElement({ content, styling, isEditing }) {
  const [items, setItems] = useState(content.items || []);
  
  return (
    <div className="w-full h-full p-2 overflow-auto">
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div 
              className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                item.checked ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300'
              }`}
              style={{ borderColor: item.checked ? styling.checkColor : undefined, backgroundColor: item.checked ? styling.checkColor : undefined }}
            >
              {item.checked && <Check className="w-3 h-3 text-white" />}
            </div>
            <span className={`text-sm ${item.checked ? 'line-through text-slate-400' : 'text-slate-700'}`}>
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// AI Text Element
function AITextElement({ content, styling, isEditing }) {
  const [prompt, setPrompt] = useState(content.prompt || '');
  const [generatedText, setGeneratedText] = useState(content.generatedText || '');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) return;
    
    setIsGenerating(true);
    try {
      const result = await archiflow.integrations.Core.InvokeLLM({
        prompt: `צור טקסט מקצועי להצעת מחיר בעברית. הנחיות: ${prompt}`,
        response_json_schema: {
          type: 'object',
          properties: {
            text: { type: 'string' }
          }
        }
      });
      setGeneratedText(result.text || '');
    } catch (error) {
      console.error('AI generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full h-full p-3 flex flex-col">
      {isEditing && !generatedText ? (
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-slate-700">יצירת טקסט עם AI</span>
          </div>
          <Textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="תאר מה אתה רוצה שה-AI יכתוב..."
            className="flex-1 text-sm resize-none"
          />
          <Button
            onClick={handleGenerate}
            disabled={!prompt || isGenerating}
            className="mt-2 gap-2"
            size="sm"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            צור טקסט
          </Button>
        </div>
      ) : (
        <div 
          className="w-full h-full overflow-auto"
          style={{ 
            textAlign: styling.textAlign || 'right',
            color: styling.color || '#475569'
          }}
        >
          <p className="text-sm whitespace-pre-wrap">{generatedText}</p>
        </div>
      )}
    </div>
  );
}

// AI Image Element
function AIImageElement({ content, styling, isEditing }) {
  const [prompt, setPrompt] = useState(content.prompt || '');
  const [generatedUrl, setGeneratedUrl] = useState(content.generatedUrl || '');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) return;
    
    setIsGenerating(true);
    try {
      const result = await archiflow.integrations.Core.GenerateImage({
        prompt: `Professional business image for a proposal document: ${prompt}`
      });
      setGeneratedUrl(result.url || '');
    } catch (error) {
      console.error('AI image generation error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full h-full overflow-hidden" style={{ borderRadius: styling.borderRadius || 8 }}>
      {generatedUrl ? (
        <img 
          src={generatedUrl} 
          alt="AI Generated" 
          className="w-full h-full object-cover"
          style={{ borderRadius: styling.borderRadius || 8 }}
        />
      ) : isEditing ? (
        <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-purple-50 flex flex-col items-center justify-center p-4">
          <Sparkles className="w-8 h-8 text-indigo-400 mb-3" />
          <Input
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="תאר את התמונה..."
            className="mb-2 text-sm"
          />
          <Button
            onClick={handleGenerate}
            disabled={!prompt || isGenerating}
            size="sm"
            className="gap-2"
          >
            {isGenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            צור תמונה
          </Button>
        </div>
      ) : (
        <div className="w-full h-full bg-slate-100 flex items-center justify-center">
          <span className="text-slate-400">אין תמונה</span>
        </div>
      )}
    </div>
  );
}