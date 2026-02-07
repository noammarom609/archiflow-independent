import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy, Trash2, Lock, Unlock, Layers, ArrowUp, ArrowDown,
  AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyCenter,
  AlignHorizontalJustifyCenter, AlignVerticalDistributeCenter,
  AlignHorizontalDistributeCenter, Palette, Type, Bold, Italic,
  Underline, Image as ImageIcon, Square, Circle, Minus, StickyNote,
  RotateCcw, FlipHorizontal, FlipVertical, ChevronDown, Sparkles,
  Group, Ungroup, MoreHorizontal, Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useLanguage } from '@/components/providers/LanguageProvider';

/**
 * PropertiesPanelNew - Advanced properties panel with effects and alignment
 * Sections:
 * - Transform (position, size, rotation)
 * - Appearance (opacity, border radius)
 * - Fill & Stroke
 * - Effects (shadow, blur)
 * - Text (for text items)
 * - Alignment (for multiple selection)
 */

// Section wrapper component
function Section({ title, icon: Icon, defaultOpen = true, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="w-full flex items-center justify-between px-4 py-2 hover:bg-slate-50 transition-colors border-b border-slate-100">
        <span className="flex items-center gap-2 text-xs font-semibold text-slate-600">
          {Icon && <Icon className="w-4 h-4" />}
          {title}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? '' : '-rotate-90'}`} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="p-4 space-y-3">
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// Input row component
function InputRow({ label, children }) {
  return (
    <div className="flex items-center gap-2">
      <Label className="w-16 text-xs text-slate-500 shrink-0">{label}</Label>
      {children}
    </div>
  );
}

export default function PropertiesPanelNew({
  selectedItems,
  onUpdate,
  onUpdateBatch,
  onDelete,
  onDuplicate,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  onGroup,
  onUngroup,
  onToggleLock,
  onAlignItems,
  onDistributeItems,
}) {
  const { t } = useLanguage();
  const hasSelection = selectedItems.length > 0;
  const isMultiSelect = selectedItems.length > 1;
  const singleItem = !isMultiSelect ? selectedItems[0] : null;
  const isTextItem = singleItem?.type === 'text' || singleItem?.type === 'note';
  const isImageItem = singleItem?.type === 'image';
  const isShapeItem = singleItem?.type === 'shape';
  const hasGroup = selectedItems.some(item => item.group_id);
  const isLocked = selectedItems.every(item => item.locked);

  // Update single item style
  const updateStyle = (property, value) => {
    if (singleItem) {
      onUpdate(singleItem.id, { 
        style: { ...singleItem.style, [property]: value } 
      });
    }
  };

  // Update position/size
  const updateTransform = (property, value) => {
    if (singleItem) {
      if (property === 'x' || property === 'y' || property === 'z') {
        onUpdate(singleItem.id, {
          position: { ...singleItem.position, [property]: parseFloat(value) || 0 }
        });
      } else if (property === 'width' || property === 'height') {
        onUpdate(singleItem.id, {
          size: { ...singleItem.size, [property]: parseFloat(value) || 40 }
        });
      } else if (property === 'rotation') {
        onUpdate(singleItem.id, { rotation: parseFloat(value) || 0 });
      }
    }
  };

  if (!hasSelection) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
          <Layers className="w-8 h-8 text-slate-300" />
        </div>
        <h3 className="text-sm font-medium text-slate-600 mb-1">אין פריט נבחר</h3>
        <p className="text-xs text-slate-400">בחר פריט בלוח כדי לערוך את המאפיינים שלו</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 bg-white shrink-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">
            {isMultiSelect ? `${selectedItems.length} פריטים` : getItemTypeName(singleItem)}
          </span>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onDuplicate}
              title="שכפל"
            >
              <Copy className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={onToggleLock}
              title={isLocked ? 'בטל נעילה' : 'נעל'}
            >
              {isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={onDelete}
              aria-label={t('a11y.delete')} title={t('a11y.delete')}
            >
              <Trash2 className="w-4 h-4" aria-hidden />
            </Button>
          </div>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {/* Alignment Section (Multi-select) */}
        {isMultiSelect && (
          <Section title="יישור" icon={AlignCenter} defaultOpen={true}>
            <div className="space-y-3">
              <div className="flex justify-between gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onAlignItems('left')}
                  title="יישר שמאלה"
                >
                  <AlignLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onAlignItems('center')}
                  title="מרכז אופקי"
                >
                  <AlignCenter className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onAlignItems('right')}
                  title="יישר ימינה"
                >
                  <AlignRight className="w-4 h-4" />
                </Button>
                <div className="w-px bg-slate-200" />
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onAlignItems('top')}
                  title="יישר למעלה"
                >
                  <AlignHorizontalJustifyCenter className="w-4 h-4 rotate-90" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onAlignItems('middle')}
                  title="מרכז אנכי"
                >
                  <AlignVerticalJustifyCenter className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onAlignItems('bottom')}
                  title="יישר למטה"
                >
                  <AlignHorizontalJustifyCenter className="w-4 h-4 -rotate-90" />
                </Button>
              </div>
              
              {selectedItems.length > 2 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={() => onDistributeItems('horizontal')}
                  >
                    <AlignHorizontalDistributeCenter className="w-4 h-4 ml-1" />
                    פזר אופקית
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 h-8 text-xs"
                    onClick={() => onDistributeItems('vertical')}
                  >
                    <AlignVerticalDistributeCenter className="w-4 h-4 ml-1" />
                    פזר אנכית
                  </Button>
                </div>
              )}
              
              <div className="flex gap-2">
                {hasGroup ? (
                  <Button variant="outline" size="sm" className="flex-1" onClick={onUngroup}>
                    <Ungroup className="w-4 h-4 ml-1" /> פרק קבוצה
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" className="flex-1" onClick={onGroup}>
                    <Group className="w-4 h-4 ml-1" /> קבץ
                  </Button>
                )}
              </div>
            </div>
          </Section>
        )}

        {/* Transform Section */}
        {singleItem && (
          <Section title="מיקום וגודל" icon={Square} defaultOpen={true}>
            <div className="grid grid-cols-2 gap-2">
              <InputRow label="X">
                <Input
                  type="number"
                  value={Math.round(singleItem.position.x)}
                  onChange={(e) => updateTransform('x', e.target.value)}
                  className="h-8 text-xs"
                />
              </InputRow>
              <InputRow label="Y">
                <Input
                  type="number"
                  value={Math.round(singleItem.position.y)}
                  onChange={(e) => updateTransform('y', e.target.value)}
                  className="h-8 text-xs"
                />
              </InputRow>
              <InputRow label="רוחב">
                <Input
                  type="number"
                  value={Math.round(singleItem.size.width)}
                  onChange={(e) => updateTransform('width', e.target.value)}
                  className="h-8 text-xs"
                />
              </InputRow>
              <InputRow label="גובה">
                <Input
                  type="number"
                  value={Math.round(singleItem.size.height)}
                  onChange={(e) => updateTransform('height', e.target.value)}
                  className="h-8 text-xs"
                />
              </InputRow>
            </div>
            
            <InputRow label="סיבוב">
              <div className="flex items-center gap-2 flex-1">
                <Slider
                  value={[singleItem.rotation || 0]}
                  onValueChange={([v]) => updateTransform('rotation', v)}
                  min={-180}
                  max={180}
                  step={1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={Math.round(singleItem.rotation || 0)}
                  onChange={(e) => updateTransform('rotation', e.target.value)}
                  className="h-8 w-16 text-xs"
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0"
                  onClick={() => updateTransform('rotation', 0)}
                  title="אפס סיבוב"
                >
                  <RotateCcw className="w-4 h-4" />
                </Button>
              </div>
            </InputRow>
          </Section>
        )}

        {/* Appearance Section */}
        {singleItem && (
          <Section title="מראה" icon={Eye} defaultOpen={true}>
            <InputRow label="שקיפות">
              <div className="flex items-center gap-2 flex-1">
                <Slider
                  value={[(singleItem.style?.opacity ?? 1) * 100]}
                  onValueChange={([v]) => updateStyle('opacity', v / 100)}
                  min={0}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs w-10 text-left font-mono">
                  {Math.round((singleItem.style?.opacity ?? 1) * 100)}%
                </span>
              </div>
            </InputRow>
            
            <InputRow label="עיגול">
              <div className="flex items-center gap-2 flex-1">
                <Slider
                  value={[parseInt(singleItem.style?.borderRadius) || 0]}
                  onValueChange={([v]) => updateStyle('borderRadius', `${v}px`)}
                  min={0}
                  max={50}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs w-10 text-left font-mono">
                  {parseInt(singleItem.style?.borderRadius) || 0}px
                </span>
              </div>
            </InputRow>
          </Section>
        )}

        {/* Fill & Stroke Section */}
        {(isShapeItem || isTextItem) && singleItem && (
          <Section title="צבע ומסגרת" icon={Palette} defaultOpen={true}>
            <InputRow label="צבע">
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="color"
                  value={singleItem.style?.color || '#000000'}
                  onChange={(e) => updateStyle('color', e.target.value)}
                  className="h-8 w-8 rounded cursor-pointer border border-slate-200"
                />
                <Input
                  value={singleItem.style?.color || '#000000'}
                  onChange={(e) => updateStyle('color', e.target.value)}
                  className="h-8 text-xs font-mono flex-1"
                />
              </div>
            </InputRow>
            
            <InputRow label="מסגרת">
              <div className="flex items-center gap-2 flex-1">
                <Input
                  type="number"
                  value={singleItem.style?.borderWidth || 0}
                  onChange={(e) => updateStyle('borderWidth', parseInt(e.target.value) || 0)}
                  className="h-8 w-16 text-xs"
                  min={0}
                  max={20}
                />
                <input
                  type="color"
                  value={singleItem.style?.borderColor || '#000000'}
                  onChange={(e) => updateStyle('borderColor', e.target.value)}
                  className="h-8 w-8 rounded cursor-pointer border border-slate-200"
                />
              </div>
            </InputRow>
          </Section>
        )}

        {/* Effects Section */}
        {singleItem && (
          <Section title="אפקטים" icon={Sparkles} defaultOpen={false}>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Button
                  variant={singleItem.style?.boxShadow ? 'secondary' : 'outline'}
                  size="sm"
                  className="text-xs"
                  onClick={() => updateStyle('boxShadow', singleItem.style?.boxShadow ? 'none' : '0 4px 20px rgba(0,0,0,0.15)')}
                >
                  צל
                </Button>
                <Button
                  variant={singleItem.style?.boxShadow?.includes('inset') ? 'secondary' : 'outline'}
                  size="sm"
                  className="text-xs"
                  onClick={() => updateStyle('boxShadow', 'inset 0 2px 10px rgba(0,0,0,0.1)')}
                >
                  צל פנימי
                </Button>
              </div>
              
              <InputRow label="טשטוש">
                <div className="flex items-center gap-2 flex-1">
                  <Slider
                    value={[singleItem.style?.blur || 0]}
                    onValueChange={([v]) => updateStyle('blur', v)}
                    min={0}
                    max={20}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-xs w-10 text-left font-mono">
                    {singleItem.style?.blur || 0}px
                  </span>
                </div>
              </InputRow>
            </div>
          </Section>
        )}

        {/* Text Section */}
        {isTextItem && singleItem && (
          <Section title="טקסט" icon={Type} defaultOpen={true}>
            <div className="flex gap-1 mb-3">
              <Button
                variant={singleItem.style?.fontWeight === 'bold' ? 'secondary' : 'outline'}
                size="icon"
                className="h-8 w-8"
                onClick={() => updateStyle('fontWeight', singleItem.style?.fontWeight === 'bold' ? 'normal' : 'bold')}
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                variant={singleItem.style?.fontStyle === 'italic' ? 'secondary' : 'outline'}
                size="icon"
                className="h-8 w-8"
                onClick={() => updateStyle('fontStyle', singleItem.style?.fontStyle === 'italic' ? 'normal' : 'italic')}
              >
                <Italic className="w-4 h-4" />
              </Button>
              <Button
                variant={singleItem.style?.textDecoration === 'underline' ? 'secondary' : 'outline'}
                size="icon"
                className="h-8 w-8"
                onClick={() => updateStyle('textDecoration', singleItem.style?.textDecoration === 'underline' ? 'none' : 'underline')}
              >
                <Underline className="w-4 h-4" />
              </Button>
              <div className="w-px bg-slate-200 mx-1" />
              <Button
                variant={singleItem.style?.textAlign === 'left' ? 'secondary' : 'outline'}
                size="icon"
                className="h-8 w-8"
                onClick={() => updateStyle('textAlign', 'left')}
              >
                <AlignLeft className="w-4 h-4" />
              </Button>
              <Button
                variant={singleItem.style?.textAlign === 'center' || !singleItem.style?.textAlign ? 'secondary' : 'outline'}
                size="icon"
                className="h-8 w-8"
                onClick={() => updateStyle('textAlign', 'center')}
              >
                <AlignCenter className="w-4 h-4" />
              </Button>
              <Button
                variant={singleItem.style?.textAlign === 'right' ? 'secondary' : 'outline'}
                size="icon"
                className="h-8 w-8"
                onClick={() => updateStyle('textAlign', 'right')}
              >
                <AlignRight className="w-4 h-4" />
              </Button>
            </div>
            
            <InputRow label="גודל">
              <div className="flex items-center gap-2 flex-1">
                <Slider
                  value={[singleItem.style?.fontSize || 16]}
                  onValueChange={([v]) => updateStyle('fontSize', v)}
                  min={8}
                  max={120}
                  step={1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={singleItem.style?.fontSize || 16}
                  onChange={(e) => updateStyle('fontSize', parseInt(e.target.value) || 16)}
                  className="h-8 w-16 text-xs"
                />
              </div>
            </InputRow>
            
            <InputRow label="פונט">
              <Select 
                value={singleItem.style?.fontFamily || 'Heebo'} 
                onValueChange={(v) => updateStyle('fontFamily', v)}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Heebo">Heebo</SelectItem>
                  <SelectItem value="Assistant">Assistant</SelectItem>
                  <SelectItem value="Rubik">Rubik</SelectItem>
                  <SelectItem value="Open Sans">Open Sans</SelectItem>
                  <SelectItem value="David Libre">David Libre</SelectItem>
                  <SelectItem value="Caveat">Caveat (כתב יד)</SelectItem>
                </SelectContent>
              </Select>
            </InputRow>
            
            <InputRow label="רקע">
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="color"
                  value={singleItem.style?.backgroundColor || '#ffffff'}
                  onChange={(e) => updateStyle('backgroundColor', e.target.value)}
                  className="h-8 w-8 rounded cursor-pointer border border-slate-200"
                />
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs"
                  onClick={() => updateStyle('backgroundColor', 'transparent')}
                >
                  שקוף
                </Button>
              </div>
            </InputRow>
          </Section>
        )}

        {/* Layer Order */}
        {singleItem && (
          <Section title="סדר שכבות" icon={Layers} defaultOpen={false}>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" onClick={onBringToFront}>
                <ArrowUp className="w-4 h-4 ml-1" /> הבא לחזית
              </Button>
              <Button variant="outline" size="sm" onClick={onSendToBack}>
                <ArrowDown className="w-4 h-4 ml-1" /> שלח לרקע
              </Button>
              <Button variant="outline" size="sm" onClick={onBringForward}>
                קדימה
              </Button>
              <Button variant="outline" size="sm" onClick={onSendBackward}>
                אחורה
              </Button>
            </div>
          </Section>
        )}
      </div>
    </div>
  );
}

// Helper function
function getItemTypeName(item) {
  if (!item) return '';
  switch (item.type) {
    case 'image': return 'תמונה';
    case 'text': return 'טקסט';
    case 'note': return 'פתקית';
    case 'color': return 'צבע';
    case 'shape':
      const shapes = { rectangle: 'מלבן', circle: 'עיגול', line: 'קו' };
      return shapes[item.metadata?.shape_type] || 'צורה';
    default: return 'אלמנט';
  }
}

