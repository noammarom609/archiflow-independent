import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy, Trash2, Lock, Unlock, Layers, ArrowUp, ArrowDown,
  AlignLeft, AlignCenter, AlignRight, AlignVerticalJustifyCenter,
  AlignHorizontalJustifyCenter, Palette, Type, Bold, Italic,
  Underline, MoreHorizontal, Group, Ungroup, FlipHorizontal,
  FlipVertical, Eye, EyeOff, Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';

/**
 * FloatingToolbar - Appears above selected items
 * Provides quick actions like copy, delete, lock, layer order, etc.
 */
export default function FloatingToolbar({
  selectedItems,
  canvasRef,
  zoom,
  pan,
  onCopy,
  onDelete,
  onDuplicate,
  onToggleLock,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  onGroup,
  onUngroup,
  onUpdateItems,
  onAlignItems,
  onDistributeItems,
  onToggleVisibility,
}) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const toolbarRef = useRef(null);

  // Calculate toolbar position based on selected items
  useEffect(() => {
    if (selectedItems.length === 0 || !canvasRef?.current) return;
    
    // Find bounding box of all selected items
    const bounds = selectedItems.reduce((acc, item) => ({
      minX: Math.min(acc.minX, item.position.x),
      minY: Math.min(acc.minY, item.position.y),
      maxX: Math.max(acc.maxX, item.position.x + item.size.width),
      maxY: Math.max(acc.maxY, item.position.y + item.size.height),
    }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
    
    const effectiveZoom = zoom * 0.5;
    
    // canvasRef is the canvas container (the visible area between sidebars)
    const container = canvasRef.current;
    const containerRect = container.getBoundingClientRect();
    
    // Convert canvas coordinates to screen coordinates
    // With origin top-left: screenX = canvasX * zoom + pan.x
    const itemCenterX = (bounds.minX + bounds.maxX) / 2;
    const itemTopY = bounds.minY;
    
    // Position relative to the canvas container
    const relativeX = itemCenterX * effectiveZoom + pan.x;
    const relativeY = itemTopY * effectiveZoom + pan.y - 60; // 60px above the item
    
    // Convert to absolute screen position (add container's left offset)
    const screenX = relativeX + containerRect.left;
    const screenY = relativeY + containerRect.top;
    
    // Clamp to viewport with proper bounds
    const clampedX = Math.max(containerRect.left + 100, Math.min(screenX, containerRect.right - 100));
    const clampedY = Math.max(containerRect.top + 60, screenY);
    
    setPosition({ x: clampedX, y: clampedY });
  }, [selectedItems, zoom, pan, canvasRef]);

  if (selectedItems.length === 0) return null;

  const isSingleItem = selectedItems.length === 1;
  const singleItem = isSingleItem ? selectedItems[0] : null;
  const isLocked = selectedItems.every(item => item.locked);
  const hasGroup = selectedItems.some(item => item.group_id);
  const isTextItem = singleItem?.type === 'text' || singleItem?.type === 'note';

  // Quick style change for text
  const handleTextStyleChange = (property, value) => {
    if (!singleItem) return;
    onUpdateItems(singleItem.id, {
      style: { ...singleItem.style, [property]: value }
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        ref={toolbarRef}
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
        className="fixed z-[1000] pointer-events-auto"
        style={{
          left: position.x,
          top: position.y,
          transform: 'translateX(-50%)',
        }}
      >
        <div className="bg-white rounded-xl shadow-xl border border-slate-200/50 px-2 py-1.5 flex items-center gap-1 backdrop-blur-sm">
          {/* Text Formatting (only for text items) */}
          {isTextItem && (
            <>
              <Button
                variant={singleItem?.style?.fontWeight === 'bold' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => handleTextStyleChange('fontWeight', singleItem?.style?.fontWeight === 'bold' ? 'normal' : 'bold')}
                title="מודגש"
              >
                <Bold className="w-4 h-4" />
              </Button>
              <Button
                variant={singleItem?.style?.fontStyle === 'italic' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => handleTextStyleChange('fontStyle', singleItem?.style?.fontStyle === 'italic' ? 'normal' : 'italic')}
                title="נטוי"
              >
                <Italic className="w-4 h-4" />
              </Button>
              <Button
                variant={singleItem?.style?.textDecoration === 'underline' ? 'secondary' : 'ghost'}
                size="icon"
                className="h-8 w-8"
                onClick={() => handleTextStyleChange('textDecoration', singleItem?.style?.textDecoration === 'underline' ? 'none' : 'underline')}
                title="קו תחתון"
              >
                <Underline className="w-4 h-4" />
              </Button>
              
              {/* Text Color */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 relative" title="צבע טקסט">
                    <Type className="w-4 h-4" />
                    <div 
                      className="absolute bottom-1 left-1/2 -translate-x-1/2 w-4 h-1 rounded-full" 
                      style={{ backgroundColor: singleItem?.style?.color || '#000' }}
                    />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-48 p-2">
                  <div className="grid grid-cols-6 gap-1">
                    {['#000000', '#FFFFFF', '#984E39', '#354231', '#8C7D70', '#ef4444', '#f97316', '#eab308', '#22c55e', '#0ea5e9', '#6366f1', '#a855f7'].map(color => (
                      <button
                        key={color}
                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${singleItem?.style?.color === color ? 'border-primary' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => handleTextStyleChange('color', color)}
                      />
                    ))}
                  </div>
                  <Input
                    type="color"
                    value={singleItem?.style?.color || '#000000'}
                    onChange={(e) => handleTextStyleChange('color', e.target.value)}
                    className="mt-2 h-8 w-full cursor-pointer"
                  />
                </PopoverContent>
              </Popover>
              
              <div className="w-px h-6 bg-slate-200 mx-1" />
            </>
          )}

          {/* Opacity Control */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="שקיפות">
                <Eye className="w-4 h-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48 p-3">
              <label className="text-xs font-medium text-slate-600 mb-2 block">שקיפות</label>
              <div className="flex items-center gap-2">
                <Slider
                  value={[singleItem?.style?.opacity !== undefined ? singleItem.style.opacity * 100 : 100]}
                  onValueChange={([value]) => {
                    selectedItems.forEach(item => {
                      onUpdateItems(item.id, { style: { ...item.style, opacity: value / 100 } });
                    });
                  }}
                  min={0}
                  max={100}
                  step={1}
                  className="flex-1"
                />
                <span className="text-xs font-mono w-8 text-right">
                  {Math.round((singleItem?.style?.opacity ?? 1) * 100)}%
                </span>
              </div>
            </PopoverContent>
          </Popover>

          <div className="w-px h-6 bg-slate-200 mx-1" />

          {/* Layer Controls */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="סדר שכבות">
                <Layers className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center">
              <DropdownMenuItem onClick={onBringToFront}>
                <ArrowUp className="w-4 h-4 ml-2" /> הבא לחזית
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onBringForward}>
                <ArrowUp className="w-4 h-4 ml-2 opacity-50" /> הזז קדימה
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSendBackward}>
                <ArrowDown className="w-4 h-4 ml-2 opacity-50" /> הזז אחורה
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onSendToBack}>
                <ArrowDown className="w-4 h-4 ml-2" /> שלח לרקע
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Alignment (for multiple selection) */}
          {selectedItems.length > 1 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" title="יישור">
                  <AlignCenter className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem onClick={() => onAlignItems('left')}>
                  <AlignLeft className="w-4 h-4 ml-2" /> יישר שמאלה
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAlignItems('center')}>
                  <AlignCenter className="w-4 h-4 ml-2" /> מרכז אופקי
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAlignItems('right')}>
                  <AlignRight className="w-4 h-4 ml-2" /> יישר ימינה
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onAlignItems('top')}>
                  <AlignHorizontalJustifyCenter className="w-4 h-4 ml-2 rotate-90" /> יישר למעלה
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAlignItems('middle')}>
                  <AlignVerticalJustifyCenter className="w-4 h-4 ml-2" /> מרכז אנכי
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAlignItems('bottom')}>
                  <AlignHorizontalJustifyCenter className="w-4 h-4 ml-2 -rotate-90" /> יישר למטה
                </DropdownMenuItem>
                {selectedItems.length > 2 && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => onDistributeItems('horizontal')}>
                      פזר אופקית
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onDistributeItems('vertical')}>
                      פזר אנכית
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Group/Ungroup */}
          {selectedItems.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={hasGroup ? onUngroup : onGroup}
              title={hasGroup ? 'פרק קבוצה' : 'קבץ'}
            >
              {hasGroup ? <Ungroup className="w-4 h-4" /> : <Group className="w-4 h-4" />}
            </Button>
          )}

          <div className="w-px h-6 bg-slate-200 mx-1" />

          {/* Copy */}
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onDuplicate} title="שכפל">
            <Copy className="w-4 h-4" />
          </Button>

          {/* Lock/Unlock */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onToggleLock}
            title={isLocked ? 'בטל נעילה' : 'נעל'}
          >
            {isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
          </Button>

          {/* Delete */}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
            onClick={onDelete}
            title="מחק"
          >
            <Trash2 className="w-4 h-4" />
          </Button>

          {/* More Options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" title="אפשרויות נוספות">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onToggleVisibility}>
                <EyeOff className="w-4 h-4 ml-2" /> הסתר
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                selectedItems.forEach(item => {
                  onUpdateItems(item.id, { 
                    size: { 
                      width: item.size.height, 
                      height: item.size.width 
                    } 
                  });
                });
              }}>
                <FlipHorizontal className="w-4 h-4 ml-2" /> סובב 90°
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Sparkles className="w-4 h-4 ml-2" /> אפקטים
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => {
                    selectedItems.forEach(item => {
                      onUpdateItems(item.id, { 
                        style: { ...item.style, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' } 
                      });
                    });
                  }}>
                    הוסף צל
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    selectedItems.forEach(item => {
                      onUpdateItems(item.id, { 
                        style: { ...item.style, boxShadow: 'none' } 
                      });
                    });
                  }}>
                    הסר צל
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => {
                    selectedItems.forEach(item => {
                      onUpdateItems(item.id, { 
                        style: { ...item.style, borderRadius: '16px' } 
                      });
                    });
                  }}>
                    פינות מעוגלות
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    selectedItems.forEach(item => {
                      onUpdateItems(item.id, { 
                        style: { ...item.style, borderRadius: '0px' } 
                      });
                    });
                  }}>
                    פינות חדות
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

