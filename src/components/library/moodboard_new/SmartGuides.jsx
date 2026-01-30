import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * SmartGuides - Visual alignment guides that appear when dragging items
 * Shows lines when items align with other items (edges or centers)
 */
export default function SmartGuides({ guides, zoom, pan, containerSize }) {
  if (!guides) return null;
  
  const effectiveZoom = zoom * 0.5;
  
  const { vertical = [], horizontal = [] } = guides;
  
  if (vertical.length === 0 && horizontal.length === 0) return null;

  // Convert canvas coordinates to screen coordinates
  // With origin top-left: screenX = canvasX * zoom + pan.x
  const canvasToScreenX = (canvasX) => canvasX * effectiveZoom + pan.x;
  const canvasToScreenY = (canvasY) => canvasY * effectiveZoom + pan.y;

  return (
    <AnimatePresence>
      <div className="pointer-events-none absolute inset-0 overflow-hidden z-[100]">
        {/* Vertical Guides (run top to bottom) */}
        {vertical.map((guide, index) => (
          <motion.div
            key={`v-${index}-${guide.x}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute h-[200vh] w-px"
            style={{
              left: canvasToScreenX(guide.x),
              top: '-50vh',
              background: guide.type === 'center' 
                ? 'linear-gradient(180deg, transparent, #984E39, transparent)'
                : 'linear-gradient(180deg, transparent, #354231, transparent)',
            }}
          >
            {/* Guide indicator dot */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full"
              style={{ 
                backgroundColor: guide.type === 'center' ? '#984E39' : '#354231',
              }}
            />
          </motion.div>
        ))}
        
        {/* Horizontal Guides (run left to right) */}
        {horizontal.map((guide, index) => (
          <motion.div
            key={`h-${index}-${guide.y}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute w-[200vw] h-px"
            style={{
              top: canvasToScreenY(guide.y),
              left: '-50vw',
              background: guide.type === 'center' 
                ? 'linear-gradient(90deg, transparent, #984E39, transparent)'
                : 'linear-gradient(90deg, transparent, #354231, transparent)',
            }}
          >
            {/* Guide indicator dot */}
            <div 
              className="absolute left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
              style={{ 
                backgroundColor: guide.type === 'center' ? '#984E39' : '#354231',
              }}
            />
          </motion.div>
        ))}
      </div>
    </AnimatePresence>
  );
}

