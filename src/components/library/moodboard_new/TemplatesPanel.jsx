import React from 'react';
import { motion } from 'framer-motion';
import { LayoutTemplate, Plus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * TemplatesPanel - Quick-start templates for moodboards
 */

// Template definitions with pre-configured items
const TEMPLATES = [
  {
    id: 'blank',
    name: 'לוח ריק',
    description: 'התחל מאפס',
    thumbnail: null,
    items: [],
    settings: { backgroundColor: '#f1f5f9' }
  },
  {
    id: 'living-room',
    name: 'סלון מודרני',
    description: '4 תמונות + פלטת צבעים',
    thumbnail: '🛋️',
    items: [
      { id: '1', type: 'text', content: 'סלון מודרני', position: { x: 50, y: 50, z: 1 }, size: { width: 300, height: 60 }, rotation: 0, style: { fontSize: 32, fontWeight: 'bold', color: '#1e293b' } },
      { id: '2', type: 'shape', content: '', position: { x: 50, y: 130, z: 2 }, size: { width: 250, height: 250 }, rotation: 0, style: { borderRadius: '12px', color: '#e2e8f0' }, metadata: { shape_type: 'rectangle' } },
      { id: '3', type: 'shape', content: '', position: { x: 320, y: 130, z: 3 }, size: { width: 250, height: 250 }, rotation: 0, style: { borderRadius: '12px', color: '#e2e8f0' }, metadata: { shape_type: 'rectangle' } },
      { id: '4', type: 'shape', content: '', position: { x: 50, y: 400, z: 4 }, size: { width: 520, height: 200 }, rotation: 0, style: { borderRadius: '12px', color: '#e2e8f0' }, metadata: { shape_type: 'rectangle' } },
      { id: '5', type: 'color', content: '#984E39', position: { x: 600, y: 130, z: 5 }, size: { width: 60, height: 60 }, rotation: 0 },
      { id: '6', type: 'color', content: '#354231', position: { x: 600, y: 210, z: 6 }, size: { width: 60, height: 60 }, rotation: 0 },
      { id: '7', type: 'color', content: '#8C7D70', position: { x: 600, y: 290, z: 7 }, size: { width: 60, height: 60 }, rotation: 0 },
      { id: '8', type: 'note', content: 'רעיונות לריהוט...', position: { x: 600, y: 400, z: 8 }, size: { width: 200, height: 150 }, rotation: 0 },
    ],
    settings: { backgroundColor: '#F7F5F2' }
  },
  {
    id: 'minimalist',
    name: 'מינימליסטי',
    description: 'עיצוב נקי וחד',
    thumbnail: '⬜',
    items: [
      { id: '1', type: 'text', content: 'MINIMAL', position: { x: 200, y: 100, z: 1 }, size: { width: 400, height: 80 }, rotation: 0, style: { fontSize: 48, fontWeight: 'bold', color: '#000000', textAlign: 'center' } },
      { id: '2', type: 'shape', content: '', position: { x: 200, y: 200, z: 2 }, size: { width: 400, height: 2 }, rotation: 0, style: { color: '#000000' }, metadata: { shape_type: 'line' } },
      { id: '3', type: 'shape', content: '', position: { x: 150, y: 250, z: 3 }, size: { width: 200, height: 200 }, rotation: 0, style: { borderRadius: '4px', color: '#f8fafc' }, metadata: { shape_type: 'rectangle' } },
      { id: '4', type: 'shape', content: '', position: { x: 380, y: 250, z: 4 }, size: { width: 200, height: 200 }, rotation: 0, style: { borderRadius: '4px', color: '#e2e8f0' }, metadata: { shape_type: 'rectangle' } },
      { id: '5', type: 'color', content: '#FFFFFF', position: { x: 150, y: 480, z: 5 }, size: { width: 50, height: 50 }, rotation: 0 },
      { id: '6', type: 'color', content: '#000000', position: { x: 220, y: 480, z: 6 }, size: { width: 50, height: 50 }, rotation: 0 },
      { id: '7', type: 'color', content: '#9ca3af', position: { x: 290, y: 480, z: 7 }, size: { width: 50, height: 50 }, rotation: 0 },
    ],
    settings: { backgroundColor: '#FFFFFF' }
  },
  {
    id: 'warm-natural',
    name: 'חמים וטבעי',
    description: 'גווני עץ ואדמה',
    thumbnail: '🪵',
    items: [
      { id: '1', type: 'text', content: 'אווירה טבעית', position: { x: 80, y: 60, z: 1 }, size: { width: 300, height: 50 }, rotation: 0, style: { fontSize: 28, fontWeight: 'bold', color: '#4A3B32' } },
      { id: '2', type: 'shape', content: '', position: { x: 80, y: 130, z: 2 }, size: { width: 180, height: 180 }, rotation: 0, style: { borderRadius: '8px', color: '#D2B48C' }, metadata: { shape_type: 'rectangle' } },
      { id: '3', type: 'shape', content: '', position: { x: 280, y: 130, z: 3 }, size: { width: 180, height: 180 }, rotation: 0, style: { borderRadius: '8px', color: '#C4A574' }, metadata: { shape_type: 'rectangle' } },
      { id: '4', type: 'shape', content: '', position: { x: 480, y: 130, z: 4 }, size: { width: 180, height: 180 }, rotation: 0, style: { borderRadius: '8px', color: '#8B7355' }, metadata: { shape_type: 'rectangle' } },
      { id: '5', type: 'color', content: '#984E39', position: { x: 80, y: 340, z: 5 }, size: { width: 70, height: 70 }, rotation: 0 },
      { id: '6', type: 'color', content: '#D2B48C', position: { x: 170, y: 340, z: 6 }, size: { width: 70, height: 70 }, rotation: 0 },
      { id: '7', type: 'color', content: '#354231', position: { x: 260, y: 340, z: 7 }, size: { width: 70, height: 70 }, rotation: 0 },
      { id: '8', type: 'color', content: '#F5F0E8', position: { x: 350, y: 340, z: 8 }, size: { width: 70, height: 70 }, rotation: 0 },
      { id: '9', type: 'note', content: 'חומרים: עץ אלון, קש, פשתן', position: { x: 480, y: 340, z: 9 }, size: { width: 180, height: 100 }, rotation: 0 },
    ],
    settings: { backgroundColor: '#FAF8F5' }
  },
  {
    id: 'grid-layout',
    name: 'גריד 2x3',
    description: '6 תמונות מסודרות',
    thumbnail: '⊞',
    items: [
      { id: '1', type: 'shape', content: '', position: { x: 50, y: 50, z: 1 }, size: { width: 200, height: 200 }, rotation: 0, style: { borderRadius: '8px', color: '#e2e8f0' }, metadata: { shape_type: 'rectangle' } },
      { id: '2', type: 'shape', content: '', position: { x: 270, y: 50, z: 2 }, size: { width: 200, height: 200 }, rotation: 0, style: { borderRadius: '8px', color: '#e2e8f0' }, metadata: { shape_type: 'rectangle' } },
      { id: '3', type: 'shape', content: '', position: { x: 490, y: 50, z: 3 }, size: { width: 200, height: 200 }, rotation: 0, style: { borderRadius: '8px', color: '#e2e8f0' }, metadata: { shape_type: 'rectangle' } },
      { id: '4', type: 'shape', content: '', position: { x: 50, y: 270, z: 4 }, size: { width: 200, height: 200 }, rotation: 0, style: { borderRadius: '8px', color: '#e2e8f0' }, metadata: { shape_type: 'rectangle' } },
      { id: '5', type: 'shape', content: '', position: { x: 270, y: 270, z: 5 }, size: { width: 200, height: 200 }, rotation: 0, style: { borderRadius: '8px', color: '#e2e8f0' }, metadata: { shape_type: 'rectangle' } },
      { id: '6', type: 'shape', content: '', position: { x: 490, y: 270, z: 6 }, size: { width: 200, height: 200 }, rotation: 0, style: { borderRadius: '8px', color: '#e2e8f0' }, metadata: { shape_type: 'rectangle' } },
    ],
    settings: { backgroundColor: '#f8fafc' }
  },
];

export default function TemplatesPanel({ onSelectTemplate, currentItemsCount }) {
  const handleSelectTemplate = (template) => {
    if (currentItemsCount > 0) {
      const confirmed = window.confirm('האם להחליף את הלוח הנוכחי? כל התוכן הקיים יימחק.');
      if (!confirmed) return;
    }
    
    // Generate new IDs for items to avoid conflicts
    const itemsWithNewIds = template.items.map(item => ({
      ...item,
      id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
    }));
    
    onSelectTemplate(itemsWithNewIds, template.settings, template.name);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <LayoutTemplate className="w-4 h-4" />
        תבניות מוכנות
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {TEMPLATES.map((template) => (
          <motion.button
            key={template.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectTemplate(template)}
            className="group relative p-3 bg-white rounded-xl border border-slate-200 hover:border-primary hover:shadow-md transition-all text-right"
          >
            {/* Thumbnail */}
            <div className="w-full aspect-video rounded-lg bg-gradient-to-br from-slate-100 to-slate-50 flex items-center justify-center text-3xl mb-2">
              {template.thumbnail || <Plus className="w-6 h-6 text-slate-300" />}
            </div>
            
            {/* Info */}
            <h4 className="text-xs font-semibold text-slate-700 truncate">
              {template.name}
            </h4>
            <p className="text-[10px] text-slate-400 truncate">
              {template.description}
            </p>
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-primary/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </motion.button>
        ))}
      </div>
      
      {/* AI Generate Template */}
      <Button
        variant="outline"
        className="w-full gap-2 border-dashed"
        onClick={() => {
          // This would trigger AI generation
        }}
      >
        <Sparkles className="w-4 h-4 text-purple-500" />
        צור תבנית עם AI
      </Button>
    </div>
  );
}

