import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  X,
  Settings,
  Paintbrush,
  Move,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Lock,
  Unlock,
  Layers,
  Trash2,
  Copy
} from 'lucide-react';

/**
 * ElementPropertiesPanel - פאנל עריכת מאפייני אלמנט
 */
export default function ElementPropertiesPanel({
  element,
  onUpdate,
  onDelete,
  onDuplicate,
  onClose
}) {
  if (!element) return null;

  const { type, content = {}, styling = {}, x = 0, y = 0, width = 200, height = 100, rotation = 0, locked = false, zIndex = 1 } = element;

  const handleContentChange = (key, value) => {
    onUpdate(element.id, { content: { ...content, [key]: value } });
  };

  const handleStylingChange = (key, value) => {
    onUpdate(element.id, { styling: { ...styling, [key]: value } });
  };

  const handlePositionChange = (key, value) => {
    onUpdate(element.id, { [key]: value });
  };

  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="w-80 bg-white border-r border-slate-200 flex flex-col h-full"
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-slate-900">מאפייני אלמנט</h3>
          <p className="text-xs text-slate-500">{getElementTypeName(type)}</p>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <Tabs defaultValue="content" className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-2">
          <TabsTrigger value="content" className="flex-1 text-xs">
            <Settings className="w-3.5 h-3.5 ml-1" />
            תוכן
          </TabsTrigger>
          <TabsTrigger value="style" className="flex-1 text-xs">
            <Paintbrush className="w-3.5 h-3.5 ml-1" />
            עיצוב
          </TabsTrigger>
          <TabsTrigger value="position" className="flex-1 text-xs">
            <Move className="w-3.5 h-3.5 ml-1" />
            מיקום
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {/* Content Tab */}
          <TabsContent value="content" className="p-4 space-y-4 mt-0">
            {renderContentEditor(type, content, handleContentChange)}
          </TabsContent>

          {/* Style Tab */}
          <TabsContent value="style" className="p-4 space-y-4 mt-0">
            {renderStyleEditor(type, styling, handleStylingChange)}
          </TabsContent>

          {/* Position Tab */}
          <TabsContent value="position" className="p-4 space-y-4 mt-0">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">X</Label>
                <Input
                  type="number"
                  value={Math.round(x)}
                  onChange={(e) => handlePositionChange('x', parseInt(e.target.value) || 0)}
                  className="h-8 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Y</Label>
                <Input
                  type="number"
                  value={Math.round(y)}
                  onChange={(e) => handlePositionChange('y', parseInt(e.target.value) || 0)}
                  className="h-8 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">רוחב</Label>
                <Input
                  type="number"
                  value={Math.round(width)}
                  onChange={(e) => handlePositionChange('width', parseInt(e.target.value) || 50)}
                  className="h-8 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">גובה</Label>
                <Input
                  type="number"
                  value={Math.round(height)}
                  onChange={(e) => handlePositionChange('height', parseInt(e.target.value) || 30)}
                  className="h-8 mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">סיבוב (מעלות)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Slider
                  value={[rotation]}
                  onValueChange={([val]) => handlePositionChange('rotation', val)}
                  min={-180}
                  max={180}
                  step={1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={rotation}
                  onChange={(e) => handlePositionChange('rotation', parseInt(e.target.value) || 0)}
                  className="w-16 h-8"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">שכבה (Z-Index)</Label>
              <div className="flex items-center gap-2 mt-1">
                <Slider
                  value={[zIndex]}
                  onValueChange={([val]) => handlePositionChange('zIndex', val)}
                  min={1}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={zIndex}
                  onChange={(e) => handlePositionChange('zIndex', parseInt(e.target.value) || 1)}
                  className="w-16 h-8"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <Label className="text-xs flex items-center gap-2">
                {locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                נעול
              </Label>
              <Switch
                checked={locked}
                onCheckedChange={(checked) => handlePositionChange('locked', checked)}
              />
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Actions */}
      <div className="p-4 border-t border-slate-200 flex gap-2">
        <Button
          variant="outline"
          className="flex-1 h-9 text-xs"
          onClick={() => onDuplicate(element.id)}
        >
          <Copy className="w-3.5 h-3.5 ml-1" />
          שכפל
        </Button>
        <Button
          variant="outline"
          className="flex-1 h-9 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => onDelete(element.id)}
        >
          <Trash2 className="w-3.5 h-3.5 ml-1" />
          מחק
        </Button>
      </div>
    </motion.div>
  );
}

function getElementTypeName(type) {
  const names = {
    heading: 'כותרת ראשית',
    subheading: 'כותרת משנית',
    paragraph: 'פסקה',
    list: 'רשימה',
    quote: 'ציטוט',
    image: 'תמונה',
    logo: 'לוגו',
    rectangle: 'מלבן',
    circle: 'עיגול',
    line: 'קו',
    divider: 'קו מפריד',
    pricing_table: 'טבלת מחירים',
    signature: 'חתימה',
    checklist: 'צ׳קליסט',
    ai_text: 'טקסט AI',
    ai_image: 'תמונה AI',
  };
  return names[type] || type;
}

function renderContentEditor(type, content, onChange) {
  switch (type) {
    case 'heading':
    case 'subheading':
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">טקסט</Label>
            <Input
              value={content.text || ''}
              onChange={(e) => onChange('text', e.target.value)}
              className="h-8 mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">גודל פונט</Label>
            <div className="flex items-center gap-2 mt-1">
              <Slider
                value={[content.fontSize || (type === 'heading' ? 32 : 24)]}
                onValueChange={([val]) => onChange('fontSize', val)}
                min={12}
                max={72}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-slate-600 w-8">{content.fontSize || (type === 'heading' ? 32 : 24)}</span>
            </div>
          </div>
        </div>
      );

    case 'paragraph':
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">טקסט</Label>
            <Textarea
              value={content.text || ''}
              onChange={(e) => onChange('text', e.target.value)}
              className="mt-1 min-h-[100px]"
            />
          </div>
          <div>
            <Label className="text-xs">גודל פונט</Label>
            <div className="flex items-center gap-2 mt-1">
              <Slider
                value={[content.fontSize || 14]}
                onValueChange={([val]) => onChange('fontSize', val)}
                min={10}
                max={24}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-slate-600 w-8">{content.fontSize || 14}</span>
            </div>
          </div>
        </div>
      );

    case 'quote':
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">ציטוט</Label>
            <Textarea
              value={content.text || ''}
              onChange={(e) => onChange('text', e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">מחבר (אופציונלי)</Label>
            <Input
              value={content.author || ''}
              onChange={(e) => onChange('author', e.target.value)}
              className="h-8 mt-1"
            />
          </div>
        </div>
      );

    case 'rectangle':
    case 'circle':
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">צבע מילוי</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="color"
                value={content.fill || '#f1f5f9'}
                onChange={(e) => onChange('fill', e.target.value)}
                className="w-12 h-8 p-1"
              />
              <Input
                value={content.fill || '#f1f5f9'}
                onChange={(e) => onChange('fill', e.target.value)}
                className="flex-1 h-8"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">צבע מסגרת</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="color"
                value={content.stroke || '#e2e8f0'}
                onChange={(e) => onChange('stroke', e.target.value)}
                className="w-12 h-8 p-1"
              />
              <Input
                value={content.stroke || '#e2e8f0'}
                onChange={(e) => onChange('stroke', e.target.value)}
                className="flex-1 h-8"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">עובי מסגרת</Label>
            <div className="flex items-center gap-2 mt-1">
              <Slider
                value={[content.strokeWidth || 1]}
                onValueChange={([val]) => onChange('strokeWidth', val)}
                min={0}
                max={10}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-slate-600 w-8">{content.strokeWidth || 1}px</span>
            </div>
          </div>
          {type === 'rectangle' && (
            <div>
              <Label className="text-xs">עיגול פינות</Label>
              <div className="flex items-center gap-2 mt-1">
                <Slider
                  value={[content.cornerRadius || 8]}
                  onValueChange={([val]) => onChange('cornerRadius', val)}
                  min={0}
                  max={50}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs text-slate-600 w-8">{content.cornerRadius || 8}px</span>
              </div>
            </div>
          )}
        </div>
      );

    case 'signature':
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">תווית</Label>
            <Input
              value={content.label || 'חתימת הלקוח'}
              onChange={(e) => onChange('label', e.target.value)}
              className="h-8 mt-1"
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">הצג תאריך</Label>
            <Switch
              checked={content.showDate !== false}
              onCheckedChange={(checked) => onChange('showDate', checked)}
            />
          </div>
        </div>
      );

    default:
      return (
        <p className="text-sm text-slate-500">אין אפשרויות תוכן לאלמנט זה</p>
      );
  }
}

function renderStyleEditor(type, styling, onChange) {
  const isTextElement = ['heading', 'subheading', 'paragraph', 'list', 'quote'].includes(type);

  return (
    <div className="space-y-3">
      {isTextElement && (
        <>
          <div>
            <Label className="text-xs">צבע טקסט</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="color"
                value={styling.color || '#1e293b'}
                onChange={(e) => onChange('color', e.target.value)}
                className="w-12 h-8 p-1"
              />
              <Input
                value={styling.color || '#1e293b'}
                onChange={(e) => onChange('color', e.target.value)}
                className="flex-1 h-8"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">יישור טקסט</Label>
            <div className="flex gap-1 mt-1">
              {[
                { value: 'right', icon: AlignRight },
                { value: 'center', icon: AlignCenter },
                { value: 'left', icon: AlignLeft },
              ].map(({ value, icon: Icon }) => (
                <Button
                  key={value}
                  size="sm"
                  variant={styling.textAlign === value ? 'default' : 'outline'}
                  onClick={() => onChange('textAlign', value)}
                  className="flex-1 h-8"
                >
                  <Icon className="w-4 h-4" />
                </Button>
              ))}
            </div>
          </div>
        </>
      )}

      {['image', 'logo', 'ai_image'].includes(type) && (
        <>
          <div>
            <Label className="text-xs">עיגול פינות</Label>
            <div className="flex items-center gap-2 mt-1">
              <Slider
                value={[styling.borderRadius || 8]}
                onValueChange={([val]) => onChange('borderRadius', val)}
                min={0}
                max={50}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-slate-600 w-8">{styling.borderRadius || 8}px</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">צל</Label>
            <Switch
              checked={styling.shadow || false}
              onCheckedChange={(checked) => onChange('shadow', checked)}
            />
          </div>
        </>
      )}

      <div>
        <Label className="text-xs">שקיפות</Label>
        <div className="flex items-center gap-2 mt-1">
          <Slider
            value={[(styling.opacity || 1) * 100]}
            onValueChange={([val]) => onChange('opacity', val / 100)}
            min={0}
            max={100}
            step={5}
            className="flex-1"
          />
          <span className="text-xs text-slate-600 w-10">{Math.round((styling.opacity || 1) * 100)}%</span>
        </div>
      </div>
    </div>
  );
}