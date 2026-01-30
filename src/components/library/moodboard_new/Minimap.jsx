import React, { useMemo } from 'react';
import { motion } from 'framer-motion';

/**
 * Minimap - Shows overview of the canvas with all items
 * Allows quick navigation by clicking
 */
export default function Minimap({ 
  items, 
  zoom, 
  pan, 
  containerSize,
  onNavigate,
  settings
}) {
  const MINIMAP_WIDTH = 160;
  const MINIMAP_HEIGHT = 100;
  
  // Calculate bounds of all items
  const bounds = useMemo(() => {
    if (items.length === 0) {
      return { minX: 0, minY: 0, maxX: 1000, maxY: 1000 };
    }
    
    const padding = 100;
    return items.reduce((acc, item) => ({
      minX: Math.min(acc.minX, item.position.x) - padding,
      minY: Math.min(acc.minY, item.position.y) - padding,
      maxX: Math.max(acc.maxX, item.position.x + item.size.width) + padding,
      maxY: Math.max(acc.maxY, item.position.y + item.size.height) + padding,
    }), { 
      minX: Infinity, 
      minY: Infinity, 
      maxX: -Infinity, 
      maxY: -Infinity 
    });
  }, [items]);
  
  // Calculate scale to fit content in minimap
  const contentWidth = bounds.maxX - bounds.minX;
  const contentHeight = bounds.maxY - bounds.minY;
  const scale = Math.min(
    MINIMAP_WIDTH / contentWidth,
    MINIMAP_HEIGHT / contentHeight,
    1
  );
  
  // Calculate viewport rectangle
  // With origin top-left: screenX = canvasX * zoom + pan.x
  // Solving for canvasX: canvasX = (screenX - pan.x) / zoom
  const effectiveZoom = zoom * 0.5;
  const visibleWidth = containerSize.width / effectiveZoom;
  const visibleHeight = containerSize.height / effectiveZoom;
  
  // Top-left of visible area in canvas coordinates
  const visibleLeft = -pan.x / effectiveZoom;
  const visibleTop = -pan.y / effectiveZoom;
  
  const viewportWidth = visibleWidth * scale;
  const viewportHeight = visibleHeight * scale;
  const viewportX = (visibleLeft - bounds.minX) * scale;
  const viewportY = (visibleTop - bounds.minY) * scale;

  // Handle click to navigate
  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;
    
    // Convert click position to canvas coordinates
    const canvasX = (clickX / scale) + bounds.minX;
    const canvasY = (clickY / scale) + bounds.minY;
    
    // Calculate new pan to center on clicked position
    // We want the clicked canvas point to appear at screen center
    // screenCenter = canvasPoint * zoom + pan.x
    // Solving for pan: pan.x = screenCenter - canvasPoint * zoom
    const screenCenterX = containerSize.width / 2;
    const screenCenterY = containerSize.height / 2;
    const newPanX = screenCenterX - canvasX * effectiveZoom;
    const newPanY = screenCenterY - canvasY * effectiveZoom;
    
    onNavigate({ x: newPanX, y: newPanY });
  };

  // Get color for item type
  const getItemColor = (item) => {
    switch (item.type) {
      case 'image': return '#3b82f6';
      case 'text': return '#8b5cf6';
      case 'note': return '#eab308';
      case 'color': return item.content;
      case 'shape': return item.style?.color || '#984E39';
      default: return '#94a3b8';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="absolute bottom-20 left-6 z-30"
    >
      <div 
        className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-slate-200 p-2 cursor-crosshair"
        onClick={handleClick}
      >
        {/* Mini Canvas */}
        <div 
          className="relative overflow-hidden rounded"
          style={{ 
            width: MINIMAP_WIDTH, 
            height: MINIMAP_HEIGHT,
            backgroundColor: settings?.backgroundColor || '#f1f5f9',
          }}
        >
          {/* Items */}
          {items.filter(item => !item.hidden).map(item => (
            <div
              key={item.id}
              className="absolute rounded-sm"
              style={{
                left: (item.position.x - bounds.minX) * scale,
                top: (item.position.y - bounds.minY) * scale,
                width: Math.max(2, item.size.width * scale),
                height: Math.max(2, item.size.height * scale),
                backgroundColor: getItemColor(item),
                opacity: item.style?.opacity ?? 0.8,
                transform: `rotate(${item.rotation || 0}deg)`,
              }}
            />
          ))}
          
          {/* Viewport Rectangle */}
          <div
            className="absolute border-2 border-primary/70 bg-primary/10 rounded-sm pointer-events-none"
            style={{
              left: Math.max(0, viewportX),
              top: Math.max(0, viewportY),
              width: Math.min(viewportWidth, MINIMAP_WIDTH - viewportX),
              height: Math.min(viewportHeight, MINIMAP_HEIGHT - viewportY),
            }}
          />
        </div>
        
        {/* Zoom Level */}
        <div className="text-[10px] text-center text-slate-500 mt-1 font-mono">
          {Math.round(zoom * 100)}%
        </div>
      </div>
    </motion.div>
  );
}

