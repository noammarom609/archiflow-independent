import React, { useRef, useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  GripVertical, 
  Trash2, 
  Copy, 
  Lock, 
  Unlock,
  Maximize2,
  RotateCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * CanvasElement - אלמנט בודד על הקנבס עם גרירה חופשית
 * תומך ב: גרירה, שינוי גודל, סיבוב, נעילה
 */
export default function CanvasElement({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  scale = 1,
  canvasRef,
  children
}) {
  const elementRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementStart, setElementStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const { x = 0, y = 0, width = 200, height = 100, rotation = 0, locked = false, zIndex = 1 } = element;

  // Handle mouse down for dragging
  const handleMouseDown = useCallback((e) => {
    if (locked || e.target.closest('.resize-handle') || e.target.closest('.element-toolbar')) return;
    
    e.stopPropagation();
    onSelect(element.id);
    
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setElementStart({ x, y, width, height });
  }, [locked, element.id, onSelect, x, y, width, height]);

  // Handle mouse down for resizing
  const handleResizeMouseDown = useCallback((e, handle) => {
    if (locked) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    setIsResizing(true);
    setResizeHandle(handle);
    setDragStart({ x: e.clientX, y: e.clientY });
    setElementStart({ x, y, width, height });
  }, [locked, x, y, width, height]);

  // Handle mouse move
  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e) => {
      const deltaX = (e.clientX - dragStart.x) / scale;
      const deltaY = (e.clientY - dragStart.y) / scale;

      if (isDragging) {
        onUpdate(element.id, {
          x: Math.max(0, elementStart.x + deltaX),
          y: Math.max(0, elementStart.y + deltaY)
        });
      } else if (isResizing) {
        let newWidth = elementStart.width;
        let newHeight = elementStart.height;
        let newX = elementStart.x;
        let newY = elementStart.y;

        // Handle different resize handles
        if (resizeHandle.includes('e')) {
          newWidth = Math.max(50, elementStart.width + deltaX);
        }
        if (resizeHandle.includes('w')) {
          newWidth = Math.max(50, elementStart.width - deltaX);
          newX = elementStart.x + deltaX;
        }
        if (resizeHandle.includes('s')) {
          newHeight = Math.max(30, elementStart.height + deltaY);
        }
        if (resizeHandle.includes('n')) {
          newHeight = Math.max(30, elementStart.height - deltaY);
          newY = elementStart.y + deltaY;
        }

        onUpdate(element.id, { x: newX, y: newY, width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle(null);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, elementStart, resizeHandle, scale, element.id, onUpdate]);

  // Resize handles positions
  const resizeHandles = [
    { position: 'nw', cursor: 'nwse-resize', style: { top: -4, left: -4 } },
    { position: 'n', cursor: 'ns-resize', style: { top: -4, left: '50%', transform: 'translateX(-50%)' } },
    { position: 'ne', cursor: 'nesw-resize', style: { top: -4, right: -4 } },
    { position: 'w', cursor: 'ew-resize', style: { top: '50%', left: -4, transform: 'translateY(-50%)' } },
    { position: 'e', cursor: 'ew-resize', style: { top: '50%', right: -4, transform: 'translateY(-50%)' } },
    { position: 'sw', cursor: 'nesw-resize', style: { bottom: -4, left: -4 } },
    { position: 's', cursor: 'ns-resize', style: { bottom: -4, left: '50%', transform: 'translateX(-50%)' } },
    { position: 'se', cursor: 'nwse-resize', style: { bottom: -4, right: -4 } },
  ];

  return (
    <div
      ref={elementRef}
      className={`absolute group ${isDragging ? 'cursor-grabbing' : locked ? 'cursor-not-allowed' : 'cursor-grab'}`}
      style={{
        left: x,
        top: y,
        width,
        height,
        zIndex: isSelected ? 1000 : zIndex,
        transform: `rotate(${rotation}deg)`,
        transformOrigin: 'center center',
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(element.id);
      }}
    >
      {/* Element Content */}
      <div 
        className={`w-full h-full overflow-hidden rounded-lg transition-shadow ${
          isSelected 
            ? 'ring-2 ring-indigo-500 ring-offset-2 shadow-lg' 
            : 'hover:ring-1 hover:ring-indigo-300'
        }`}
      >
        {children}
      </div>

      {/* Selection UI */}
      {isSelected && !locked && (
        <>
          {/* Resize Handles */}
          {resizeHandles.map((handle) => (
            <div
              key={handle.position}
              className="resize-handle absolute w-3 h-3 bg-white border-2 border-indigo-500 rounded-full hover:bg-indigo-100 transition-colors"
              style={{ ...handle.style, cursor: handle.cursor }}
              onMouseDown={(e) => handleResizeMouseDown(e, handle.position)}
            />
          ))}

          {/* Toolbar */}
          <div className="element-toolbar absolute -top-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white rounded-lg shadow-lg border border-slate-200 px-1 py-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(element.id, { locked: !locked });
              }}
            >
              {locked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate(element.id);
              }}
            >
              <Copy className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(element.id);
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Size indicator */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-slate-500 bg-white px-2 py-0.5 rounded shadow-sm">
            {Math.round(width)} × {Math.round(height)}
          </div>
        </>
      )}

      {/* Lock indicator */}
      {locked && (
        <div className="absolute top-2 right-2 bg-slate-800/70 text-white rounded p-1">
          <Lock className="w-3 h-3" />
        </div>
      )}
    </div>
  );
}