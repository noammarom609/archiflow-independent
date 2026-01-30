import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Type,
  Image,
  Square,
  Circle,
  Minus,
  Table,
  FileText,
  Heading1,
  Heading2,
  List,
  CheckSquare,
  Quote,
  Code,
  Sparkles,
  ChevronUp,
  LayoutGrid
} from 'lucide-react';

const elementTypes = [
  { 
    category: 'טקסט',
    items: [
      { type: 'heading', label: 'כותרת ראשית', icon: Heading1, defaultWidth: 400, defaultHeight: 60 },
      { type: 'subheading', label: 'כותרת משנית', icon: Heading2, defaultWidth: 350, defaultHeight: 45 },
      { type: 'paragraph', label: 'פסקה', icon: Type, defaultWidth: 400, defaultHeight: 120 },
      { type: 'list', label: 'רשימה', icon: List, defaultWidth: 350, defaultHeight: 150 },
      { type: 'quote', label: 'ציטוט', icon: Quote, defaultWidth: 400, defaultHeight: 100 },
    ]
  },
  {
    category: 'מדיה',
    items: [
      { type: 'image', label: 'תמונה', icon: Image, defaultWidth: 300, defaultHeight: 200 },
      { type: 'logo', label: 'לוגו', icon: Image, defaultWidth: 150, defaultHeight: 80 },
    ]
  },
  {
    category: 'צורות',
    items: [
      { type: 'rectangle', label: 'מלבן', icon: Square, defaultWidth: 200, defaultHeight: 100 },
      { type: 'circle', label: 'עיגול', icon: Circle, defaultWidth: 100, defaultHeight: 100 },
      { type: 'line', label: 'קו', icon: Minus, defaultWidth: 200, defaultHeight: 4 },
      { type: 'divider', label: 'קו מפריד', icon: Minus, defaultWidth: 600, defaultHeight: 2 },
    ]
  },
  {
    category: 'תוכן',
    items: [
      { type: 'pricing_table', label: 'טבלת מחירים', icon: Table, defaultWidth: 600, defaultHeight: 300 },
      { type: 'signature', label: 'חתימה', icon: FileText, defaultWidth: 300, defaultHeight: 100 },
      { type: 'checklist', label: 'צ׳קליסט', icon: CheckSquare, defaultWidth: 350, defaultHeight: 200 },
    ]
  },
  {
    category: 'AI',
    items: [
      { type: 'ai_text', label: 'טקסט AI', icon: Sparkles, defaultWidth: 400, defaultHeight: 150 },
      { type: 'ai_image', label: 'תמונה AI', icon: Sparkles, defaultWidth: 300, defaultHeight: 200 },
    ]
  }
];

export default function CanvasToolbar({ onAddElement }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeCategory, setActiveCategory] = useState(null);

  const handleAddElement = (elementType) => {
    const config = elementTypes
      .flatMap(cat => cat.items)
      .find(item => item.type === elementType);

    if (!config) return;

    const newElement = {
      id: `element_${Date.now()}`,
      type: elementType,
      x: 100 + Math.random() * 100,
      y: 100 + Math.random() * 100,
      width: config.defaultWidth,
      height: config.defaultHeight,
      rotation: 0,
      locked: false,
      zIndex: 1,
      content: getDefaultContent(elementType),
      styling: getDefaultStyling(elementType),
    };

    onAddElement(newElement);
    setIsExpanded(false);
  };

  return (
    <div className="bg-white border-t border-slate-200">
      {/* Expanded Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-slate-200"
          >
            <div className="p-4">
              <div className="flex gap-6">
                {/* Categories */}
                <div className="w-32 space-y-1">
                  {elementTypes.map((category) => (
                    <button
                      key={category.category}
                      onClick={() => setActiveCategory(category.category)}
                      className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeCategory === category.category
                          ? 'bg-indigo-100 text-indigo-700 font-medium'
                          : 'text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {category.category}
                    </button>
                  ))}
                </div>

                {/* Items */}
                <div className="flex-1">
                  <div className="grid grid-cols-4 gap-2">
                    {(activeCategory 
                      ? elementTypes.find(c => c.category === activeCategory)?.items 
                      : elementTypes.flatMap(c => c.items)
                    )?.map((item) => {
                      const Icon = item.icon;
                      return (
                        <button
                          key={item.type}
                          onClick={() => handleAddElement(item.type)}
                          className="flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                        >
                          <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                            <Icon className="w-5 h-5 text-slate-600" />
                          </div>
                          <span className="text-xs text-slate-700">{item.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button */}
      <div className="flex items-center justify-center py-2">
        <Button
          variant="ghost"
          onClick={() => {
            setIsExpanded(!isExpanded);
            if (!activeCategory) setActiveCategory('טקסט');
          }}
          className="gap-2"
        >
          <LayoutGrid className="w-4 h-4" />
          הוסף אלמנט
          <ChevronUp className={`w-4 h-4 transition-transform ${isExpanded ? '' : 'rotate-180'}`} />
        </Button>
      </div>
    </div>
  );
}

// Default content for each element type
function getDefaultContent(type) {
  const defaults = {
    heading: { text: 'כותרת ראשית', fontSize: 32, fontWeight: 'bold' },
    subheading: { text: 'כותרת משנית', fontSize: 24, fontWeight: 'semibold' },
    paragraph: { text: 'הקלד כאן את הטקסט שלך...', fontSize: 14 },
    list: { items: ['פריט ראשון', 'פריט שני', 'פריט שלישי'], listStyle: 'bullet' },
    quote: { text: 'ציטוט מעורר השראה', author: '' },
    image: { url: '', alt: '', objectFit: 'cover' },
    logo: { url: '', alt: 'לוגו' },
    rectangle: { fill: '#f1f5f9', stroke: '#e2e8f0', strokeWidth: 1, cornerRadius: 8 },
    circle: { fill: '#f1f5f9', stroke: '#e2e8f0', strokeWidth: 1 },
    line: { stroke: '#cbd5e1', strokeWidth: 2 },
    divider: { stroke: '#e2e8f0', strokeWidth: 1, style: 'solid' },
    pricing_table: { 
      items: [{ description: 'שירות', quantity: 1, price: 0 }],
      showSubtotal: true, showVat: true, vatPercent: 17
    },
    signature: { label: 'חתימת הלקוח', showDate: true },
    checklist: { items: [{ text: 'משימה', checked: false }] },
    ai_text: { prompt: '', generatedText: '' },
    ai_image: { prompt: '', generatedUrl: '' },
  };
  return defaults[type] || {};
}

// Default styling for each element type
function getDefaultStyling(type) {
  const defaults = {
    heading: { textAlign: 'right', color: '#1e293b' },
    subheading: { textAlign: 'right', color: '#334155' },
    paragraph: { textAlign: 'right', color: '#475569', lineHeight: 1.6 },
    list: { textAlign: 'right', color: '#475569' },
    quote: { textAlign: 'center', color: '#64748b', fontStyle: 'italic', borderColor: '#4338ca' },
    image: { borderRadius: 8, shadow: false },
    logo: { borderRadius: 0 },
    rectangle: { opacity: 1 },
    circle: { opacity: 1 },
    line: { opacity: 1 },
    divider: { opacity: 1 },
    pricing_table: { headerBg: '#4338ca', headerColor: '#ffffff' },
    signature: { lineColor: '#cbd5e1' },
    checklist: { checkColor: '#4338ca' },
    ai_text: { textAlign: 'right', color: '#475569' },
    ai_image: { borderRadius: 8 },
  };
  return defaults[type] || {};
}