import React, { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CanvasElement from './CanvasElement';
import CanvasToolbar from './CanvasToolbar';
import ElementRenderer from './ElementRenderer';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize, 
  Grid3X3,
  MousePointer,
  Hand
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';

/**
 * FreeformCanvas - קנבס עם גרירה חופשית כמו Canva/Figma
 */
export default function FreeformCanvas({
  elements = [],
  onElementsChange,
  pageWidth = 800,
  pageHeight = 1100,
  styling = {},
  onAddElement,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  
  const [scale, setScale] = useState(0.8);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [showGrid, setShowGrid] = useState(true);
  const [tool, setTool] = useState('select'); // 'select' | 'pan'
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Handle element update
  const handleElementUpdate = useCallback((elementId, updates) => {
    const newElements = elements.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    );
    onElementsChange(newElements);
  }, [elements, onElementsChange]);

  // Handle element delete
  const handleElementDelete = useCallback((elementId) => {
    const newElements = elements.filter(el => el.id !== elementId);
    onElementsChange(newElements);
    setSelectedElementId(null);
  }, [elements, onElementsChange]);

  // Handle element duplicate
  const handleElementDuplicate = useCallback((elementId) => {
    const elementToDuplicate = elements.find(el => el.id === elementId);
    if (!elementToDuplicate) return;

    const newElement = {
      ...elementToDuplicate,
      id: `element_${Date.now()}`,
      x: (elementToDuplicate.x || 0) + 20,
      y: (elementToDuplicate.y || 0) + 20,
      zIndex: elements.length + 1,
    };
    
    onElementsChange([...elements, newElement]);
    setSelectedElementId(newElement.id);
  }, [elements, onElementsChange]);

  // Handle canvas click (deselect)
  const handleCanvasClick = useCallback((e) => {
    if (e.target === canvasRef.current || e.target.classList.contains('canvas-background')) {
      setSelectedElementId(null);
    }
  }, []);

  // Handle panning
  const handleMouseDown = useCallback((e) => {
    if (tool === 'pan' || e.button === 1) { // Middle mouse button or pan tool
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  }, [tool, panOffset]);

  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y
      });
    }
  }, [isPanning, panStart]);

  const handleMouseUp = useCallback(() => {
    setIsPanning(false);
  }, []);

  // Zoom controls
  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.1, 2));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.1, 0.3));
  const handleZoomFit = () => {
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth - 100;
      const containerHeight = containerRef.current.clientHeight - 100;
      const fitScale = Math.min(containerWidth / pageWidth, containerHeight / pageHeight);
      setScale(Math.min(fitScale, 1));
      setPanOffset({ x: 0, y: 0 });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) {
          handleElementDelete(selectedElementId);
        }
      }
      if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (selectedElementId) {
          handleElementDuplicate(selectedElementId);
        }
      }
      if (e.key === 'Escape') {
        setSelectedElementId(null);
      }
      if (e.key === ' ') {
        e.preventDefault();
        setTool(prev => prev === 'pan' ? 'select' : 'pan');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedElementId, handleElementDelete, handleElementDuplicate]);

  // Wheel zoom
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        setScale(prev => Math.min(Math.max(prev + delta, 0.3), 2));
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, []);

  return (
    <div className="h-full flex flex-col bg-slate-200">
      {/* Top Toolbar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Tool Selection */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5">
            <Button
              variant={tool === 'select' ? 'default' : 'ghost'}
              size="sm"
              className={`h-8 px-3 ${tool === 'select' ? 'bg-white shadow-sm' : ''}`}
              onClick={() => setTool('select')}
            >
              <MousePointer className="w-4 h-4 ml-1" />
              בחירה
            </Button>
            <Button
              variant={tool === 'pan' ? 'default' : 'ghost'}
              size="sm"
              className={`h-8 px-3 ${tool === 'pan' ? 'bg-white shadow-sm' : ''}`}
              onClick={() => setTool('pan')}
            >
              <Hand className="w-4 h-4 ml-1" />
              גרירה
            </Button>
          </div>

          <div className="h-6 w-px bg-slate-200" />

          {/* Grid Toggle */}
          <Button
            variant={showGrid ? 'default' : 'outline'}
            size="sm"
            className="h-8"
            onClick={() => setShowGrid(!showGrid)}
          >
            <Grid3X3 className="w-4 h-4" />
          </Button>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <div className="w-32">
            <Slider
              value={[scale * 100]}
              onValueChange={([val]) => setScale(val / 100)}
              min={30}
              max={200}
              step={5}
            />
          </div>
          <span className="text-sm text-slate-600 w-12 text-center">{Math.round(scale * 100)}%</span>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8" onClick={handleZoomFit}>
            <Maximize className="w-4 h-4 ml-1" />
            התאם
          </Button>
        </div>
      </div>

      {/* Canvas Area */}
      <div 
        ref={containerRef}
        className="flex-1 overflow-hidden relative"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        style={{ cursor: tool === 'pan' ? (isPanning ? 'grabbing' : 'grab') : 'default' }}
      >
        <div
          className="absolute"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
            left: '50%',
            top: '50%',
          }}
        >
          {/* Canvas/Page */}
          <div
            ref={canvasRef}
            className="relative bg-white shadow-2xl rounded-sm"
            style={{
              width: pageWidth,
              height: pageHeight,
              transform: `translate(-50%, -50%) scale(${scale})`,
              transformOrigin: 'center center',
              backgroundColor: styling.background_color || '#ffffff',
            }}
            onClick={handleCanvasClick}
          >
            {/* Grid Overlay */}
            {showGrid && (
              <div 
                className="canvas-background absolute inset-0 pointer-events-none opacity-30"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #e2e8f0 1px, transparent 1px),
                    linear-gradient(to bottom, #e2e8f0 1px, transparent 1px)
                  `,
                  backgroundSize: '20px 20px',
                }}
              />
            )}

            {/* Page margins indicator */}
            <div className="absolute inset-8 border border-dashed border-slate-200 pointer-events-none rounded" />

            {/* Elements */}
            {elements.map((element) => (
              <CanvasElement
                key={element.id}
                element={element}
                isSelected={selectedElementId === element.id}
                onSelect={setSelectedElementId}
                onUpdate={handleElementUpdate}
                onDelete={handleElementDelete}
                onDuplicate={handleElementDuplicate}
                scale={scale}
                canvasRef={canvasRef}
              >
                <ElementRenderer element={element} styling={styling} />
              </CanvasElement>
            ))}
          </div>
        </div>
      </div>

      {/* Add Element Toolbar */}
      <CanvasToolbar onAddElement={onAddElement} />
    </div>
  );
}