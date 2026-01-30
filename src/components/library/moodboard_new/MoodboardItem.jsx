import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Lock, RotateCw } from 'lucide-react';

/**
 * MoodboardItem - Advanced Canvas Item Component
 * Features:
 * - 8 resize handles (corners + edges)
 * - Rotation handle with visual feedback
 * - Inline text editing
 * - Smooth animations
 * - Snap to grid support
 */
export default function MoodboardItem({ 
  item, 
  isSelected, 
  selectedItemIds = [],
  onSelect, 
  onUpdate,
  onUpdateMultiple,
  zoom = 1, 
  snapEnabled = true, 
  gridSize = 20,
  allItems = [],
  onShowGuides,
  boardSize = { width: 1920, height: 1080 },
  constrainToBounds = true
}) {
  const [isResizing, setIsResizing] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(item.content);
  const [resizeDirection, setResizeDirection] = useState(null);
  const itemRef = useRef(null);
  const textInputRef = useRef(null);

  const isLocked = item.locked;
  
  if (item.hidden) return null;

  // Snap Utility
  const snap = (value) => {
    if (!snapEnabled) return value;
    return Math.round(value / gridSize) * gridSize;
  };

  // Constrain position to board bounds
  const constrainPosition = (x, y, width, height) => {
    if (!constrainToBounds) return { x, y };
    
    // Allow a small margin outside (10% of item size) for better UX
    const margin = 0;
    
    const constrainedX = Math.max(-margin, Math.min(x, boardSize.width - width + margin));
    const constrainedY = Math.max(-margin, Math.min(y, boardSize.height - height + margin));
    
    return { x: constrainedX, y: constrainedY };
  };

  // Manual Drag Handler (replaces framer-motion drag for zoom compatibility)
  const handleManualDragStart = (e) => {
    if (isLocked || isEditing || isResizing || isRotating) return;
    if (e.button !== 0) return; // Only left mouse button
    
    e.stopPropagation();
    e.preventDefault();
    setIsDragging(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    
    // Check if we're dragging multiple items
    const isMultiDrag = isSelected && selectedItemIds.length > 1;
    const draggedItems = isMultiDrag 
      ? allItems.filter(i => selectedItemIds.includes(i.id) && !i.locked)
      : [item];
    
    // Store initial positions of all dragged items
    const initialPositions = draggedItems.map(i => ({
      id: i.id,
      x: i.position.x,
      y: i.position.y,
      width: i.size.width,
      height: i.size.height
    }));
    
    // Track current positions during drag
    let currentPositions = [...initialPositions];

    const handleMouseMove = (moveEvent) => {
      // Calculate delta from drag start in screen pixels
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      // Convert to canvas coordinates (divide by zoom)
      const deltaCanvasX = deltaX / zoom;
      const deltaCanvasY = deltaY / zoom;
      
      // Update all dragged items
      currentPositions = initialPositions.map(initial => {
        let newX = initial.x + deltaCanvasX;
        let newY = initial.y + deltaCanvasY;
        
        // Constrain to board bounds
        const constrained = constrainPosition(newX, newY, initial.width, initial.height);
        return { ...initial, x: constrained.x, y: constrained.y };
      });
      
      if (isMultiDrag && onUpdateMultiple) {
        // Update multiple items at once
        const updates = currentPositions.map(pos => ({
          id: pos.id,
          changes: { position: { x: pos.x, y: pos.y, z: allItems.find(i => i.id === pos.id)?.position.z || 1 } }
        }));
        onUpdateMultiple(updates, false);
      } else {
        // Single item drag
        onUpdate(item.id, {
          position: { ...item.position, x: currentPositions[0].x, y: currentPositions[0].y }
        }, false);
      }
      
      // Find alignment guides with other items (only for primary item)
      if (onShowGuides && allItems.length > 1) {
        const primaryPos = currentPositions[0];
        const nonDraggedItems = allItems.filter(i => !selectedItemIds.includes(i.id));
        const guides = calculateSmartGuides(primaryPos.x, primaryPos.y, item.size, nonDraggedItems);
        onShowGuides(guides);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      
      // Apply snap and final constrain to all items
      const finalPositions = currentPositions.map(pos => {
        let finalX = pos.x;
        let finalY = pos.y;
        
        if (snapEnabled) {
          finalX = snap(finalX);
          finalY = snap(finalY);
        }
        
        const constrained = constrainPosition(finalX, finalY, pos.width, pos.height);
        return { ...pos, x: constrained.x, y: constrained.y };
      });

      if (isMultiDrag && onUpdateMultiple) {
        const updates = finalPositions.map(pos => ({
          id: pos.id,
          changes: { position: { x: pos.x, y: pos.y, z: allItems.find(i => i.id === pos.id)?.position.z || 1 } }
        }));
        onUpdateMultiple(updates, true);
      } else {
        onUpdate(item.id, {
          position: { ...item.position, x: finalPositions[0].x, y: finalPositions[0].y }
        }, true);
      }
      
      if (onShowGuides) onShowGuides(null);
      
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Calculate smart guides for alignment
  const calculateSmartGuides = (x, y, size, otherItems) => {
    const threshold = 5;
    const guides = { vertical: [], horizontal: [] };
    
    const itemCenter = { x: x + size.width / 2, y: y + size.height / 2 };
    const itemEdges = {
      left: x,
      right: x + size.width,
      top: y,
      bottom: y + size.height
    };
    
    otherItems.forEach(other => {
      const otherCenter = { 
        x: other.position.x + other.size.width / 2, 
        y: other.position.y + other.size.height / 2 
      };
      const otherEdges = {
        left: other.position.x,
        right: other.position.x + other.size.width,
        top: other.position.y,
        bottom: other.position.y + other.size.height
      };
      
      // Vertical guides (left, center, right alignment)
      if (Math.abs(itemEdges.left - otherEdges.left) < threshold) {
        guides.vertical.push({ x: otherEdges.left, type: 'edge' });
      }
      if (Math.abs(itemEdges.right - otherEdges.right) < threshold) {
        guides.vertical.push({ x: otherEdges.right, type: 'edge' });
      }
      if (Math.abs(itemCenter.x - otherCenter.x) < threshold) {
        guides.vertical.push({ x: otherCenter.x, type: 'center' });
      }
      
      // Horizontal guides (top, center, bottom alignment)
      if (Math.abs(itemEdges.top - otherEdges.top) < threshold) {
        guides.horizontal.push({ y: otherEdges.top, type: 'edge' });
      }
      if (Math.abs(itemEdges.bottom - otherEdges.bottom) < threshold) {
        guides.horizontal.push({ y: otherEdges.bottom, type: 'edge' });
      }
      if (Math.abs(itemCenter.y - otherCenter.y) < threshold) {
        guides.horizontal.push({ y: otherCenter.y, type: 'center' });
      }
    });
    
    return guides;
  };

  // Advanced Resize Handler with 8 directions
  const handleResizeStart = (e, direction) => {
    if (isLocked) return;
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    setResizeDirection(direction);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = item.size.width;
    const startHeight = item.size.height;
    const startPosX = item.position.x;
    const startPosY = item.position.y;
    const aspectRatio = startWidth / startHeight;

    const handleMouseMove = (moveEvent) => {
      requestAnimationFrame(() => {
        const deltaX = (moveEvent.clientX - startX) / zoom;
        const deltaY = (moveEvent.clientY - startY) / zoom;
        
        let newWidth = startWidth;
        let newHeight = startHeight;
        let newX = startPosX;
        let newY = startPosY;

        // Handle different resize directions
        switch (direction) {
          case 'se': // Bottom-right
            newWidth = Math.max(40, startWidth + deltaX);
            newHeight = Math.max(40, startHeight + deltaY);
            break;
          case 'sw': // Bottom-left
            newWidth = Math.max(40, startWidth - deltaX);
            newHeight = Math.max(40, startHeight + deltaY);
            newX = startPosX + (startWidth - newWidth);
            break;
          case 'ne': // Top-right
            newWidth = Math.max(40, startWidth + deltaX);
            newHeight = Math.max(40, startHeight - deltaY);
            newY = startPosY + (startHeight - newHeight);
            break;
          case 'nw': // Top-left
            newWidth = Math.max(40, startWidth - deltaX);
            newHeight = Math.max(40, startHeight - deltaY);
            newX = startPosX + (startWidth - newWidth);
            newY = startPosY + (startHeight - newHeight);
            break;
          case 'n': // Top
            newHeight = Math.max(40, startHeight - deltaY);
            newY = startPosY + (startHeight - newHeight);
            break;
          case 's': // Bottom
            newHeight = Math.max(40, startHeight + deltaY);
            break;
          case 'e': // Right
            newWidth = Math.max(40, startWidth + deltaX);
            break;
          case 'w': // Left
            newWidth = Math.max(40, startWidth - deltaX);
            newX = startPosX + (startWidth - newWidth);
            break;
        }

        // Shift key = maintain aspect ratio
        if (moveEvent.shiftKey && ['se', 'sw', 'ne', 'nw'].includes(direction)) {
          if (direction === 'se' || direction === 'nw') {
            newHeight = newWidth / aspectRatio;
          } else {
            newWidth = newHeight * aspectRatio;
          }
        }

        if (snapEnabled) {
          newWidth = snap(newWidth);
          newHeight = snap(newHeight);
          newX = snap(newX);
          newY = snap(newY);
        }

        // Constrain to board bounds
        if (constrainToBounds) {
          // Ensure item doesn't go outside board
          if (newX < 0) {
            newWidth = newWidth + newX;
            newX = 0;
          }
          if (newY < 0) {
            newHeight = newHeight + newY;
            newY = 0;
          }
          if (newX + newWidth > boardSize.width) {
            newWidth = boardSize.width - newX;
          }
          if (newY + newHeight > boardSize.height) {
            newHeight = boardSize.height - newY;
          }
          // Ensure minimum size
          newWidth = Math.max(40, newWidth);
          newHeight = Math.max(40, newHeight);
        }

        onUpdate(item.id, {
          size: { width: newWidth, height: newHeight },
          position: { ...item.position, x: newX, y: newY }
        }, false);
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      onUpdate(item.id, item, true); // Commit to history
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Rotation Handler
  const handleRotateStart = (e) => {
    if (isLocked) return;
    e.stopPropagation();
    e.preventDefault();
    setIsRotating(true);
    
    const rect = itemRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
    const startRotation = item.rotation || 0;

    const handleMouseMove = (moveEvent) => {
      requestAnimationFrame(() => {
        const currentAngle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX);
        let newRotation = startRotation + (currentAngle - startAngle) * (180 / Math.PI);
        
        // Snap to 15 degree increments when holding Shift
        if (moveEvent.shiftKey) {
          newRotation = Math.round(newRotation / 15) * 15;
        }
        
        onUpdate(item.id, { rotation: newRotation }, false);
      });
    };

    const handleMouseUp = () => {
      setIsRotating(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      onUpdate(item.id, item, true); // Commit to history
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  // Double-click to edit text
  const handleDoubleClick = (e) => {
    if (isLocked) return;
    if (item.type === 'text' || item.type === 'note') {
      e.stopPropagation();
      setIsEditing(true);
      setEditText(item.content);
    }
  };

  // Handle text editing
  useEffect(() => {
    if (isEditing && textInputRef.current) {
      textInputRef.current.focus();
      textInputRef.current.select();
    }
  }, [isEditing]);

  const handleTextBlur = () => {
    setIsEditing(false);
    if (editText !== item.content) {
      onUpdate(item.id, { content: editText }, true);
    }
  };

  const handleTextKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextBlur();
    }
    if (e.key === 'Escape') {
      setEditText(item.content);
      setIsEditing(false);
    }
  };

  // Render resize handles
  const renderResizeHandles = () => {
    if (!isSelected || isLocked) return null;
    
    const handlePositions = [
      { dir: 'nw', className: '-top-1.5 -left-1.5 cursor-nw-resize' },
      { dir: 'n', className: '-top-1.5 left-1/2 -translate-x-1/2 cursor-n-resize' },
      { dir: 'ne', className: '-top-1.5 -right-1.5 cursor-ne-resize' },
      { dir: 'w', className: 'top-1/2 -left-1.5 -translate-y-1/2 cursor-w-resize' },
      { dir: 'e', className: 'top-1/2 -right-1.5 -translate-y-1/2 cursor-e-resize' },
      { dir: 'sw', className: '-bottom-1.5 -left-1.5 cursor-sw-resize' },
      { dir: 's', className: '-bottom-1.5 left-1/2 -translate-x-1/2 cursor-s-resize' },
      { dir: 'se', className: '-bottom-1.5 -right-1.5 cursor-se-resize' },
    ];

    return handlePositions.map(({ dir, className }) => (
      <div
        key={dir}
        className={`absolute w-3 h-3 bg-white border-2 border-primary rounded-sm shadow-sm z-50 hover:scale-125 transition-transform ${className}`}
        onMouseDown={(e) => handleResizeStart(e, dir)}
      />
    ));
  };

  // Render rotation handle
  const renderRotationHandle = () => {
    if (!isSelected || isLocked) return null;
    
    return (
      <div 
        className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center z-50"
        onMouseDown={handleRotateStart}
      >
        <div className="w-6 h-6 bg-white border-2 border-primary rounded-full shadow-md cursor-grab active:cursor-grabbing flex items-center justify-center hover:scale-110 transition-transform">
          <RotateCw className="w-3 h-3 text-primary" />
        </div>
        <div className="w-0.5 h-4 bg-primary/50" />
      </div>
    );
  };

  const renderContent = () => {
    const commonStyle = {
      opacity: item.style?.opacity !== undefined ? item.style.opacity : 1,
      borderRadius: item.style?.borderRadius || '8px',
      boxShadow: item.style?.boxShadow || 'none',
      filter: item.style?.blur ? `blur(${item.style.blur}px)` : 'none',
    };

    switch (item.type) {
      case 'image':
        return (
          <div className="w-full h-full overflow-hidden" style={commonStyle}>
            <img 
              src={item.content} 
              alt="Moodboard item" 
              className="w-full h-full object-cover pointer-events-none select-none"
              draggable={false}
            />
          </div>
        );
      
      case 'text':
        if (isEditing) {
          return (
            <textarea
              ref={textInputRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleTextBlur}
              onKeyDown={handleTextKeyDown}
              className="w-full h-full p-2 border-2 border-primary rounded-lg resize-none focus:outline-none bg-white/90"
              style={{
                color: item.style?.color || '#000000',
                fontSize: `${item.style?.fontSize || 16}px`,
                fontFamily: item.style?.fontFamily || 'Heebo, sans-serif',
                fontWeight: item.style?.fontWeight || 'normal',
                textAlign: item.style?.textAlign || 'center',
              }}
            />
          );
        }
        return (
          <div 
            className="w-full h-full flex items-center justify-center p-2 cursor-text"
            style={{ 
              ...commonStyle,
              color: item.style?.color || '#000000',
              fontSize: `${item.style?.fontSize || 16}px`,
              fontFamily: item.style?.fontFamily || 'Heebo, sans-serif',
              fontWeight: item.style?.fontWeight || 'normal',
              fontStyle: item.style?.fontStyle || 'normal',
              textDecoration: item.style?.textDecoration || 'none',
              textAlign: item.style?.textAlign || 'center',
              backgroundColor: item.style?.backgroundColor || 'transparent',
              border: item.style?.borderWidth ? `${item.style.borderWidth}px solid ${item.style.borderColor || '#000'}` : 'none',
            }}
            onDoubleClick={handleDoubleClick}
          >
            {item.content}
          </div>
        );
      
      case 'color':
        return (
          <div 
            className="w-full h-full rounded-full shadow-lg border-4 border-white/80 transition-transform hover:scale-105"
            style={{ ...commonStyle, backgroundColor: item.content, borderRadius: '9999px' }}
          />
        );
      
      case 'note':
        if (isEditing) {
          return (
            <textarea
              ref={textInputRef}
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              onBlur={handleTextBlur}
              onKeyDown={handleTextKeyDown}
              className="w-full h-full p-4 resize-none focus:outline-none bg-yellow-100 rounded-lg"
              style={{ fontFamily: "'Caveat', cursive" }}
            />
          );
        }
        return (
          <div 
            className="w-full h-full bg-yellow-100 p-4 shadow-md rounded-lg flex items-center justify-center text-center cursor-text"
            style={{ ...commonStyle, fontFamily: "'Caveat', cursive", fontSize: '18px' }}
            onDoubleClick={handleDoubleClick}
          >
            <span className="select-none pointer-events-none text-slate-800">{item.content}</span>
          </div>
        );
      
      case 'shape':
        const shapeType = item.metadata?.shape_type || 'rectangle';
        const shapeColor = item.style?.color || '#984E39';
        return (
          <div className="w-full h-full flex items-center justify-center" style={commonStyle}>
            {shapeType === 'rectangle' && (
              <div 
                className="w-full h-full" 
                style={{ 
                  backgroundColor: shapeColor, 
                  borderRadius: item.style?.borderRadius || '4px',
                  border: item.style?.borderWidth ? `${item.style.borderWidth}px solid ${item.style.borderColor || '#000'}` : 'none'
                }} 
              />
            )}
            {shapeType === 'circle' && (
              <div 
                className="w-full h-full rounded-full" 
                style={{ 
                  backgroundColor: shapeColor,
                  border: item.style?.borderWidth ? `${item.style.borderWidth}px solid ${item.style.borderColor || '#000'}` : 'none'
                }} 
              />
            )}
            {shapeType === 'line' && (
              <div 
                className="w-full" 
                style={{ 
                  height: item.style?.borderWidth || 4, 
                  backgroundColor: shapeColor 
                }} 
              />
            )}
          </div>
        );
      
      default:
        return (
          <div className="w-full h-full bg-slate-200 flex items-center justify-center text-xs text-slate-500 rounded-lg">
            Unknown Type
          </div>
        );
    }
  };

  return (
    <motion.div
      ref={itemRef}
      onMouseDown={handleManualDragStart}
      onClick={(e) => { 
        e.stopPropagation(); 
        if (!isEditing && !isDragging) onSelect(item.id, e.shiftKey || e.ctrlKey || e.metaKey); 
      }}
      onDoubleClick={handleDoubleClick}
      initial={false}
      animate={{ 
        x: item.position.x, 
        y: item.position.y, 
        rotate: item.rotation || 0,
        width: item.size.width,
        height: item.size.height,
        zIndex: isSelected ? 999 : item.position.z || 1
      }}
      transition={{ 
        type: 'tween',
        duration: isDragging || isResizing || isRotating ? 0 : 0.15,
        ease: 'easeOut'
      }}
      data-moodboard-item="true"
      className={`absolute group pointer-events-auto ${!isLocked && !isEditing ? 'cursor-move' : 'cursor-default'}`}
      style={{
        left: 0,
        top: 0,
        width: item.size.width,
        height: item.size.height,
        touchAction: 'none',
        userSelect: 'none'
      }}
    >
      {/* Selection Ring */}
      <div className={`relative w-full h-full rounded-lg transition-all duration-150 ${
        isSelected 
          ? 'ring-2 ring-primary ring-offset-2 shadow-lg' 
          : 'hover:ring-1 hover:ring-primary/30'
      }`}>
        {renderContent()}

        {/* Lock Indicator */}
        {isLocked && (
          <div className="absolute top-2 left-2 z-10">
            <Lock className="w-4 h-4 text-slate-400 bg-white/90 rounded-full p-0.5 shadow-sm" />
          </div>
        )}

        {/* Rotation Handle */}
        {renderRotationHandle()}

        {/* Resize Handles */}
        {renderResizeHandles()}
      </div>
    </motion.div>
  );
}
