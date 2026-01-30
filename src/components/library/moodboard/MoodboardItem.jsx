import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Maximize2, RotateCw, Lock, Link as LinkIcon, Box, ShoppingBag } from 'lucide-react';

export default function MoodboardItem({ item, isSelected, onSelect, onUpdate, zoom, snapEnabled, gridSize = 20, readOnly = false }) {
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const itemRef = useRef(null);

  const isLocked = item.locked;
  
  if (item.hidden) return null;

  // Snap Utility
  const snap = (value) => {
    if (!snapEnabled) return value;
    return Math.round(value / gridSize) * gridSize;
  };

  // Handle Drag End
  const handleDragEnd = (event, info) => {
    if (isLocked) return;
    
    // Calculate new position based on drag delta adjusted by zoom
    let newX = item.position.x + (info.offset.x / zoom);
    let newY = item.position.y + (info.offset.y / zoom);
    
    if (snapEnabled) {
        newX = snap(newX);
        newY = snap(newY);
    }

    onUpdate(item.id, {
      position: { ...item.position, x: newX, y: newY }
    }, true);
  };

  // Resize Handlers
  const handleResizeStart = (e) => {
    if (isLocked) return;
    e.stopPropagation();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = item.size.width;
    const startHeight = item.size.height;

    const handleMouseMove = (moveEvent) => {
      const deltaX = (moveEvent.clientX - startX) / zoom;
      const deltaY = (moveEvent.clientY - startY) / zoom;
      
      let newWidth = Math.max(20, startWidth + deltaX);
      let newHeight = Math.max(20, startHeight + deltaY);

      if (snapEnabled) {
          newWidth = snap(newWidth);
          newHeight = snap(newHeight);
      }

      onUpdate(item.id, {
        size: { width: newWidth, height: newHeight }
      }, false);
    };

    const handleMouseUp = (upEvent) => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      
      // Final commit logic matches move logic
      const deltaX = (upEvent.clientX - startX) / zoom;
      const deltaY = (upEvent.clientY - startY) / zoom;
      let newWidth = Math.max(20, startWidth + deltaX);
      let newHeight = Math.max(20, startHeight + deltaY);
      if (snapEnabled) {
          newWidth = snap(newWidth);
          newHeight = snap(newHeight);
      }

      onUpdate(item.id, {
        size: { width: newWidth, height: newHeight }
      }, true);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Rotation Handlers
  const handleRotateStart = (e) => {
    if (isLocked) return;
    e.stopPropagation();
    setIsRotating(true);
    
    const rect = itemRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const handleMouseMove = (moveEvent) => {
      const radians = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
      const degrees = radians * (180 / Math.PI);
      const adjustedDegrees = degrees + 90; 
      
      onUpdate(item.id, { rotation: adjustedDegrees }, false);
    };

    const handleMouseUp = (upEvent) => {
      setIsRotating(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      
      const radians = Math.atan2(upEvent.clientY - centerY, upEvent.clientX - centerX);
      const degrees = radians * (180 / Math.PI);
      const adjustedDegrees = degrees + 90;

      onUpdate(item.id, { rotation: adjustedDegrees }, true);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const renderContent = () => {
    const commonStyle = {
      opacity: item.style?.opacity !== undefined ? item.style.opacity : 1,
    };

    switch (item.type) {
      case 'image':
        return (
          <div className="w-full h-full overflow-hidden rounded-lg shadow-sm bg-white" style={commonStyle}>
            <img 
              src={item.content} 
              alt="Moodboard item" 
              loading="lazy"
              className="w-full h-full object-cover pointer-events-none select-none" 
            />
          </div>
        );
      case 'text':
        return (
          <div 
            className="w-full h-full flex items-center justify-center p-2 rounded-lg border border-transparent hover:border-slate-200/50"
            style={{ 
              ...commonStyle,
              color: item.style?.color || '#000000',
              fontSize: `${item.style?.fontSize || 16}px`,
              fontFamily: item.style?.fontFamily || 'Heebo',
              fontWeight: item.style?.fontWeight || 'normal',
              fontStyle: item.style?.fontStyle || 'normal',
              textDecoration: item.style?.textDecoration || 'none',
              textAlign: item.style?.textAlign || 'center',
              backgroundColor: item.style?.backgroundColor || 'transparent'
              }}
              >
              {item.content}
              </div>
        );
      case 'color':
        return (
          <div 
            className="w-full h-full rounded-full shadow-md border-4 border-white"
            style={{ ...commonStyle, backgroundColor: item.content }}
          >
            <div className="absolute bottom-[-25px] left-1/2 transform -translate-x-1/2 bg-white px-2 py-0.5 rounded text-xs shadow-sm whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
              {item.content}
            </div>
          </div>
        );
      case 'note':
        return (
          <div className="w-full h-full bg-yellow-100 p-4 rounded-lg shadow-md" style={commonStyle}>
            <p className="text-sm font-handwriting text-slate-800 whitespace-pre-wrap select-none">{item.content}</p>
          </div>
        );
      case 'shape':
        const shapeType = item.metadata?.shape_type || 'rectangle';
        return (
            <div className="w-full h-full" style={commonStyle}>
                {shapeType === 'rectangle' && <div className="w-full h-full bg-indigo-500 rounded-md" style={{ backgroundColor: item.style?.color || '#6366f1' }}></div>}
                {shapeType === 'circle' && <div className="w-full h-full bg-indigo-500 rounded-full" style={{ backgroundColor: item.style?.color || '#6366f1' }}></div>}
                {shapeType === 'line' && <div className="w-full h-1 bg-slate-900 absolute top-1/2 -translate-y-1/2" style={{ backgroundColor: item.style?.color || '#0f172a' }}></div>}
            </div>
        );
      case 'material_card':
        return (
            <div className="w-full h-full bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col overflow-hidden" style={commonStyle}>
                <div className="h-2/3 bg-slate-100 flex items-center justify-center">
                    <Box className="w-8 h-8 text-slate-400" />
                </div>
                <div className="p-2 bg-white flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.content}</p>
                    <p className="text-[10px] text-slate-500">חומר</p>
                </div>
            </div>
        );
      case 'item_card':
        return (
            <div className="w-full h-full bg-white rounded-xl shadow-lg border border-slate-200 flex flex-col overflow-hidden" style={commonStyle}>
                <div className="h-2/3 bg-slate-100 flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8 text-slate-400" />
                </div>
                <div className="p-2 bg-white flex-1">
                    <p className="text-xs font-bold text-slate-900 truncate">{item.content}</p>
                    <p className="text-[10px] text-slate-500">פריט</p>
                </div>
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      ref={itemRef}
      drag={!readOnly && !isResizing && !isRotating && !isLocked}
      dragMomentum={false}
      onDragEnd={readOnly ? undefined : handleDragEnd}
      onClick={(e) => { 
          e.stopPropagation(); 
          // Support Shift, Ctrl, and Command (Meta) keys for multiple selection
          if (!readOnly) onSelect(item.id, e.shiftKey || e.ctrlKey || e.metaKey); 
      }}
      initial={{ x: item.position.x, y: item.position.y, opacity: 0, scale: 0.8 }}
      animate={{ 
        x: item.position.x, 
        y: item.position.y, 
        rotate: item.rotation || 0,
        opacity: 1, 
        scale: 1,
        width: item.size.width,
        height: item.size.height,
        zIndex: isSelected ? 999 : item.position.z || 1
      }}
      className={`absolute group ${!isLocked ? 'cursor-move' : 'cursor-default'} ${isSelected ? 'z-[999]' : ''}`}
      style={{
        width: item.size.width,
        height: item.size.height,
      }}
    >
      <div className={`relative w-full h-full transition-shadow duration-200 ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-4' : ''}`}>
        {renderContent()}

        {/* Indicators */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
          {isLocked && <Lock className="w-4 h-4 text-slate-400 bg-white/80 rounded-full p-0.5 shadow-sm" />}
          {item.metadata?.linked_entity_id && <LinkIcon className="w-4 h-4 text-indigo-500 bg-white/80 rounded-full p-0.5 shadow-sm" />}
          {item.metadata?.approval_status === 'approved' && <div className="w-3 h-3 bg-green-500 rounded-full border border-white shadow-sm" title="מאושר" />}
          {item.metadata?.approval_status === 'rejected' && <div className="w-3 h-3 bg-red-500 rounded-full border border-white shadow-sm" title="נדחה" />}
        </div>

        {/* Controls - Only show when selected and NOT locked */}
        {isSelected && !isLocked && !readOnly && (
          <>
            <div 
              className="absolute -bottom-2 -right-2 w-5 h-5 bg-white border-2 border-indigo-500 rounded-full cursor-se-resize shadow-md z-50 flex items-center justify-center hover:scale-110 transition-transform"
              onMouseDown={handleResizeStart}
            >
              <Maximize2 className="w-2.5 h-2.5 text-indigo-500" />
            </div>

            <div 
              className="absolute -top-8 left-1/2 transform -translate-x-1/2 w-7 h-7 bg-white border border-slate-200 rounded-full cursor-grab shadow-sm flex items-center justify-center hover:bg-indigo-50 z-50"
              onMouseDown={handleRotateStart}
            >
              <RotateCw className="w-3.5 h-3.5 text-slate-500" />
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}