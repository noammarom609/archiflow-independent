import React, { useState, useRef, useEffect, useCallback } from 'react';
import { archiflow } from '@/api/archiflow';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Save, 
  ArrowRight, 
  ImageIcon, 
  Type, 
  Palette, 
  StickyNote, 
  ZoomIn, 
  ZoomOut,
  Grid,
  Download,
  Layout,
  Undo,
  Redo,
  MousePointer2,
  Hand,
  Square,
  Circle as CircleIcon,
  Minus,
  Box,
  ShoppingBag,
  Layers,
  Lock,
  Unlock,
  Copy,
  Trash2,
  Group
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from '@/components/ui/dropdown-menu';
import { showSuccess, showError } from '@/components/utils/notifications';
import MoodboardItem from './MoodboardItem';
import PropertiesPanel from './PropertiesPanel';
import LayersPanel from './LayersPanel';
import AIToolsPanel from './AIToolsPanel';
import { debounce, cloneDeep } from 'lodash';

// Safe ID generator that works in all environments
const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

// Tool Components
const ToolButton = ({ icon: Icon, label, onClick, isActive }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all w-full ${
      isActive 
        ? 'bg-indigo-100 text-indigo-700' 
        : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
    }`}
    title={label}
  >
    <Icon className="w-6 h-6 mb-1.5" strokeWidth={1.5} />
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

export default function MoodboardEditor({ moodboardId: propMoodboardId, onClose, initialData }) {
  const queryClient = useQueryClient();
  const canvasRef = useRef(null);
  
  // Internal ID State (handles creation flow)
  const [currentMoodboardId, setCurrentMoodboardId] = useState(propMoodboardId);

  // View State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [interactionMode, setInteractionMode] = useState('select'); // 'select' | 'pan'
  const [showGrid, setShowGrid] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [settings, setSettings] = useState({ backgroundColor: '#f1f5f9', backgroundImage: null });
  const GRID_SIZE = 20;
  
  // Data State
  const [items, setItems] = useState(initialData?.items || []);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [boardName, setBoardName] = useState(initialData?.name || 'לוח השראה חדש');
  const [rightSidebarTab, setRightSidebarTab] = useState('tools'); // tools, furniture, references
  const [customColor, setCustomColor] = useState('#000000');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [clipboard, setClipboard] = useState(null);
  const [activeSidebarTab, setActiveSidebarTab] = useState('properties');
  
  // Selection Box State
  const [selectionBox, setSelectionBox] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const selectionStartRef = useRef(null);
  
  // History State
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Fetch moodboard data
  const { data: moodboardData, isLoading: isLoadingBoard } = useQuery({
    queryKey: ['moodboard', currentMoodboardId],
    queryFn: () => archiflow.entities.Moodboard.get(currentMoodboardId),
    enabled: !!currentMoodboardId, 
    refetchOnWindowFocus: false,
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent excessive refetching
  });

  // Sync fetched data to local state
  useEffect(() => {
    if (moodboardData) {
      setItems(moodboardData.items || []);
      setBoardName(moodboardData.name);
      if (moodboardData.settings) {
          setSettings(prev => ({ ...prev, ...moodboardData.settings }));
          if (moodboardData.settings.grid_enabled !== undefined) setShowGrid(moodboardData.settings.grid_enabled);
          if (moodboardData.settings.snap_enabled !== undefined) setSnapEnabled(moodboardData.settings.snap_enabled);
      }
      // Only set history if it's the first load to avoid clearing undo stack on background refetch
      // But since we disable refetchOnWindowFocus, this mainly happens on mount.
      setHistory([JSON.stringify(moodboardData.items || [])]);
      setHistoryIndex(0);
    }
  }, [moodboardData]);

  // Fetch Assets - Optimized specific queries
  const { data: furnitureAssets = [], isLoading: loadingFurniture } = useQuery({
    queryKey: ['assets', 'furniture'],
    queryFn: () => archiflow.entities.DesignAsset.filter({ category: 'furniture' }, '-created_date', 50),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  const { data: referenceAssets = [], isLoading: loadingReferences } = useQuery({
    queryKey: ['assets', 'references'],
    queryFn: () => archiflow.entities.DesignAsset.filter({ category: 'references' }, '-created_date', 50),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  // --- Auto Save Logic ---
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (currentMoodboardId) {
        return archiflow.entities.Moodboard.update(currentMoodboardId, data);
      } else {
        return archiflow.entities.Moodboard.create(data);
      }
    },
    onSuccess: (data) => {
      setLastSaved(new Date());
      setIsSaving(false);
      
      // Update internal ID if this was a create operation
      if (!currentMoodboardId && data?.id) {
          setCurrentMoodboardId(data.id);
          // Optional: Update URL without reload if possible, or just rely on internal state
          window.history.replaceState(null, '', `?moodboardId=${data.id}`); 
      }

      queryClient.invalidateQueries(['designAssets']);
      queryClient.invalidateQueries(['moodboards']);
    },
    onError: () => {
      setIsSaving(false);
      showError('שגיאה בשמירת הלוח');
    }
  });

  const debouncedSave = useCallback(
    debounce((data) => {
      // We allow auto-save even if no ID (it will create one)
      // BUT we want to avoid creating multiple drafts before the first one is confirmed?
      // Actually, auto-saving a new board is fine, it just becomes a real board.
      // To be safe, we only auto-save if we have an ID OR if there are items/name change.
      if (data.items.length > 0 || data.name !== 'לוח השראה חדש') {
          setIsSaving(true);
          saveMutation.mutate(data);
      }
    }, 2000),
    [currentMoodboardId] // Dependency on currentMoodboardId is key
  );

  useEffect(() => {
    if (isLoadingBoard) return; // Prevent saving while loading to avoid overwriting with empty state

    debouncedSave({
      name: boardName,
      items: items,
      thumbnail_url: items.find(i => i.type === 'image')?.content || '',
      updated_date: new Date().toISOString(),
      settings: { 
          grid_enabled: showGrid, 
          snap_enabled: snapEnabled, 
          grid_size: GRID_SIZE,
          backgroundColor: settings.backgroundColor,
          backgroundImage: settings.backgroundImage
      }
    });
  }, [items, boardName, showGrid, snapEnabled, settings, debouncedSave, currentMoodboardId, isLoadingBoard]);

  // --- History Management ---
  const addToHistory = (newItems) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(JSON.stringify(newItems));
    if (newHistory.length > 30) newHistory.shift(); 
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const prevItems = JSON.parse(history[historyIndex - 1]);
      setItems(prevItems);
      setHistoryIndex(prevItems.length > 0 ? historyIndex - 1 : 0);
      setSelectedItemIds([]);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextItems = JSON.parse(history[historyIndex + 1]);
      setItems(nextItems);
      setHistoryIndex(historyIndex + 1);
      setSelectedItemIds([]);
    }
  }, [history, historyIndex]);

  useEffect(() => {
    if (history.length === 0 && !currentMoodboardId) {
      setHistory([JSON.stringify([])]);
      setHistoryIndex(0);
    }
  }, []);

  // --- Keyboard Shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if input focused
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      // Arrow Keys Movement
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
          e.preventDefault();
          if (selectedItemIds.length === 0) return;

          const step = e.shiftKey ? 10 : 1;
          const changes = {};

          if (e.key === 'ArrowUp') changes.y = -step;
          if (e.key === 'ArrowDown') changes.y = step;
          if (e.key === 'ArrowLeft') changes.x = -step;
          if (e.key === 'ArrowRight') changes.x = step;

          // Update items directly
          const newItems = items.map(item => {
              if (selectedItemIds.includes(item.id)) {
                  return {
                      ...item,
                      position: {
                          ...item.position,
                          x: item.position.x + (changes.x || 0),
                          y: item.position.y + (changes.y || 0)
                      }
                  };
              }
              return item;
          });

          setItems(newItems);
          // We don't add to history on every key press to avoid spamming history
          // Ideally we debounce history add, but for now strict implementation:
          // Only add to history on keyUp? Or just accept it fills history.
          // Let's add to history for correctness.
          // To optimize: simple debounce could be added here or in the future.
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        handleDeleteSelected();
      } else if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) handleRedo();
            else handleUndo();
            break;
          case 'y':
            e.preventDefault();
            handleRedo();
            break;
          case 'a':
            e.preventDefault();
            setSelectedItemIds(items.map(i => i.id));
            break;
          case 'c':
            e.preventDefault();
            handleCopy();
            break;
          case 'v':
            e.preventDefault();
            handlePaste();
            break;
          case 'g':
            e.preventDefault();
            handleGroup();
            break;
          case 's':
            e.preventDefault();
            handleManualSave();
            break;
        }
      } else if (e.key === ' ') { // Space for pan
         setInteractionMode('pan');
      }
    };

    const handleKeyUp = (e) => {
        if (e.key === ' ') setInteractionMode('select');
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [items, selectedItemIds, historyIndex, clipboard]);

  // --- Item Operations ---
  const handleUpdateItem = (id, changes, commit = true) => {
    const newItems = items.map(item => 
      item.id === id ? { ...item, ...changes } : item
    );
    setItems(newItems);
    if (commit) addToHistory(newItems);
  };

  const handleUpdateSelected = (changes, commit = true) => {
    const newItems = items.map(item => 
      selectedItemIds.includes(item.id) ? { ...item, ...changes } : item
    );
    setItems(newItems);
    if (commit) addToHistory(newItems);
  };

  const addItem = (type, content, extra = {}) => {
    if (!canvasRef.current) return;
    
    const { offsetWidth, offsetHeight } = canvasRef.current;
    
    // Calculate center relative to the viewport center (adjusted for 0.5 scale factor)
    const effectiveZoom = zoom * 0.5;
    const centerX = (offsetWidth / 2) - (pan.x / effectiveZoom);
    const centerY = (offsetHeight / 2) - (pan.y / effectiveZoom);

    // Determine dimensions
    let width = 200;
    let height = 200;
    let style = {};

    if (extra.size) {
        width = extra.size.width;
        height = extra.size.height;
    } else if (type === 'text') {
      width = 300; height = 60;
      style = { fontSize: 24, textAlign: 'center' };
    } else if (type === 'color') {
      width = 100; height = 100;
    } else if (type === 'shape') {
      width = 150; height = 150;
      if (extra.metadata?.shape_type === 'line') {
         width = 200; height = 4;
      }
    }

    const newItem = {
      id: generateId(),
      type,
      content,
      position: { 
        x: centerX - width / 2, 
        y: centerY - height / 2, 
        z: items.length + 1 
      },
      size: { width, height },
      rotation: 0,
      locked: false,
      metadata: { approval_status: 'draft' },
      ...extra,
      style: { ...style, ...(extra.style || {}) },
    };

    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    addToHistory(updatedItems);
    setSelectedItemIds([newItem.id]);
  };

  const handleDeleteSelected = () => {
    if (selectedItemIds.length === 0) return;
    const newItems = items.filter(i => !selectedItemIds.includes(i.id));
    setItems(newItems);
    addToHistory(newItems);
    setSelectedItemIds([]);
  };

  const handleCopy = () => {
    const selected = items.filter(i => selectedItemIds.includes(i.id));
    if (selected.length > 0) {
      setClipboard(cloneDeep(selected));
      showSuccess('הועתק ללוח');
    }
  };

  const handlePaste = () => {
    if (!clipboard) return;
    const newItems = clipboard.map(item => ({
      ...item,
      id: generateId(),
      position: { x: item.position.x + 20, y: item.position.y + 20, z: items.length + 10 }
    }));
    const updatedItems = [...items, ...newItems];
    setItems(updatedItems);
    addToHistory(updatedItems);
    setSelectedItemIds(newItems.map(i => i.id));
  };

  const handleDuplicateSelected = () => {
    const selected = items.filter(i => selectedItemIds.includes(i.id));
    const newItems = selected.map(item => ({
      ...item,
      id: generateId(),
      position: { x: item.position.x + 20, y: item.position.y + 20, z: items.length + 10 }
    }));
    const updatedItems = [...items, ...newItems];
    setItems(updatedItems);
    addToHistory(updatedItems);
    setSelectedItemIds(newItems.map(i => i.id));
  };

  const handleGroup = () => {
    if (selectedItemIds.length < 2) return;
    const groupId = generateId();
    handleUpdateSelected({ group_id: groupId });
    showSuccess('קבוצה נוצרה');
  };

  const handleUngroup = () => {
    const selected = items.filter(i => selectedItemIds.includes(i.id));
    const groupIds = selected.map(i => i.group_id).filter(Boolean);
    if (groupIds.length === 0) return;
    
    // Ungroup ALL items in the groups of selected items
    const newItems = items.map(item => 
      groupIds.includes(item.group_id) ? { ...item, group_id: null } : item
    );
    setItems(newItems);
    addToHistory(newItems);
    showSuccess('קבוצה פורקה');
  };

  const handleBringToFront = () => {
    if (selectedItemIds.length === 0) return;

    const maxZ = Math.max(...items.map(i => i.position.z || 0), 0);

    // Identify selected items and sort them by current Z to keep relative order
    const selectedItems = items.filter(i => selectedItemIds.includes(i.id))
                               .sort((a, b) => (a.position.z || 0) - (b.position.z || 0));

    const newZMap = {};
    selectedItems.forEach((item, index) => {
        newZMap[item.id] = maxZ + 1 + index;
    });

    const newItems = items.map(item => 
      selectedItemIds.includes(item.id)
        ? { ...item, position: { ...item.position, z: newZMap[item.id] } }
        : item
    );

    setItems(newItems);
    addToHistory(newItems);
  };

  const handleSendToBack = () => {
    if (selectedItemIds.length === 0) return;

    const minZ = Math.min(...items.map(i => i.position.z || 0), 0);

    const selectedItems = items.filter(i => selectedItemIds.includes(i.id))
                               .sort((a, b) => (a.position.z || 0) - (b.position.z || 0));

    // Place items before minZ
    const startZ = minZ - selectedItems.length;

    const newZMap = {};
    selectedItems.forEach((item, index) => {
        newZMap[item.id] = startZ + index;
    });

    const newItems = items.map(item => 
      selectedItemIds.includes(item.id)
        ? { ...item, position: { ...item.position, z: newZMap[item.id] } }
        : item
    );

    setItems(newItems);
    addToHistory(newItems);
  };

  // --- Mouse Interactions ---
  const handleWheel = (e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomSensitivity = 0.001;
      const delta = -e.deltaY * zoomSensitivity;
      const newZoom = Math.min(Math.max(0.1, zoom + delta), 5);
      setZoom(newZoom);
    } else {
      // Pan
      setPan(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  };

  const handleMouseDown = (e) => {
    // Middle mouse or pan mode
    if (interactionMode === 'pan' || e.button === 1) { 
      setIsPanning(true);
      return;
    }

    // Selection Box Logic (only if clicking on canvas directly)
    if (e.target === e.currentTarget && interactionMode === 'select') {
        setIsSelecting(true);
        const effectiveZoom = zoom * 0.5;
        const startX = (e.clientX - canvasRef.current.getBoundingClientRect().left) / effectiveZoom;
        const startY = (e.clientY - canvasRef.current.getBoundingClientRect().top) / effectiveZoom;
        selectionStartRef.current = { x: startX, y: startY };
        setSelectionBox({ x: startX, y: startY, width: 0, height: 0 });
        // Clear selection if no modifier key is pressed
        if (!e.shiftKey && !e.ctrlKey && !e.metaKey) setSelectedItemIds([]);
    }
  };

  const handleMouseMove = (e) => {
    if (isPanning) {
      setPan(prev => ({
        x: prev.x + e.movementX,
        y: prev.y + e.movementY
      }));
    }

    if (isSelecting && selectionStartRef.current) {
        const effectiveZoom = zoom * 0.5;
        const currentX = (e.clientX - canvasRef.current.getBoundingClientRect().left) / effectiveZoom;
        const currentY = (e.clientY - canvasRef.current.getBoundingClientRect().top) / effectiveZoom;
        
        const x = Math.min(selectionStartRef.current.x, currentX);
        const y = Math.min(selectionStartRef.current.y, currentY);
        const width = Math.abs(currentX - selectionStartRef.current.x);
        const height = Math.abs(currentY - selectionStartRef.current.y);
        
        setSelectionBox({ x, y, width, height });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
    
    if (isSelecting && selectionBox) {
        // Calculate selection intersection
        const selected = items.filter(item => {
            if (item.locked) return false;
            // Simple bounding box intersection
            return (
                item.position.x < selectionBox.x + selectionBox.width &&
                item.position.x + item.size.width > selectionBox.x &&
                item.position.y < selectionBox.y + selectionBox.height &&
                item.position.y + item.size.height > selectionBox.y
            );
        });
        
        if (selected.length > 0) {
            setSelectedItemIds(prev => [...new Set([...prev, ...selected.map(i => i.id)])]);
        }
    }
    
    setIsSelecting(false);
    setSelectionBox(null);
    selectionStartRef.current = null;
  };

  // File Upload
  const handleFileUpload = async (e, isBackground = false) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      showSuccess('מעלה תמונה...');
      const { file_url } = await archiflow.integrations.Core.UploadFile({ file });
      
      if (isBackground) {
          setSettings(prev => ({ ...prev, backgroundImage: file_url }));
          showSuccess('רקע עודכן');
      } else {
          const img = new Image();
          img.onload = () => {
            const aspectRatio = img.width / img.height;
            const width = 300;
            const height = width / aspectRatio;
            addItem('image', file_url, { size: { width, height } });
          };
          img.src = file_url;
      }
      
    } catch (error) {
      showError('שגיאה בהעלאת התמונה');
    }
  };

  const handleExportImage = async () => {
    // Export functionality temporarily disabled for stability check
    showSuccess('פונקציית הייצוא תהיה זמינה בקרוב');
    // If we need html2canvas, we should use a dynamic import to prevent loading crashes
    /*
    if (!canvasRef.current) return;
    try {
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        ignoreElements: (element) => element.classList.contains('canvas-controls')
      });
      const link = document.createElement('a');
      link.download = `${boardName}.png`;
      link.href = canvas.toDataURL();
      link.click();
      showSuccess('תמונה הורדה בהצלחה');
    } catch (err) {
      console.error(err);
      showError('שגיאה בייצוא התמונה');
    }
    */
  };

  const handleManualSave = () => {
    debouncedSave.cancel(); // Cancel any pending autosave
    
    saveMutation.mutate({
        name: boardName,
        items: items,
        thumbnail_url: items.find(i => i.type === 'image')?.content || '',
        updated_date: new Date().toISOString(),
        settings: { 
            grid_enabled: showGrid, 
            snap_enabled: snapEnabled, 
            grid_size: GRID_SIZE,
            backgroundColor: settings.backgroundColor
        }
    }, {
      onSuccess: () => {
          showSuccess('נשמר בהצלחה');
          onClose();
      }
    });
  };

  const handleReorderItems = (updates) => {
    const newItems = items.map(item => {
      const update = updates.find(u => u.id === item.id);
      return update ? { ...item, position: { ...item.position, z: update.z } } : item;
    });
    setItems(newItems);
    addToHistory(newItems);
  };

  const handleToggleVisibility = (item) => {
    handleUpdateItem(item.id, { hidden: !item.hidden }, true);
  };

  return (
    <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col overflow-hidden" dir="rtl">
      {/* Top Header */}
      <div className="bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between shadow-sm z-30">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose}>
            <ArrowRight className="w-5 h-5 text-slate-500" />
          </Button>
          <div className="group relative">
            <Input 
              value={boardName}
              onChange={(e) => setBoardName(e.target.value)}
              className="border-transparent hover:border-slate-300 focus:border-indigo-500 shadow-none text-lg font-bold px-2 h-9 bg-transparent transition-all border rounded-md min-w-[200px]"
              placeholder="שם הלוח..."
            />
            <Type className="w-3 h-3 text-slate-400 absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            <p className="text-xs text-slate-500 flex items-center gap-1 px-2 mt-0.5">
              {isSaving ? (
                <span className="flex items-center gap-1 text-amber-600"><span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span> שומר...</span>
              ) : lastSaved ? (
                <span className="flex items-center gap-1 text-green-600"><span className="w-2 h-2 rounded-full bg-green-500"></span> נשמר {lastSaved.toLocaleTimeString()}</span>
              ) : (
                <span className="text-slate-400">טיוטה</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom & Mode Controls */}
          <div className="flex items-center bg-slate-100 rounded-lg p-1 mr-4">
             <Button 
                variant={interactionMode === 'select' ? 'white' : 'ghost'} 
                size="icon" 
                className="h-8 w-8 shadow-sm"
                onClick={() => setInteractionMode('select')}
                title="מצב בחירה (V)"
             >
               <MousePointer2 className="w-4 h-4" />
             </Button>
             <Button 
                variant={interactionMode === 'pan' ? 'white' : 'ghost'} 
                size="icon" 
                className="h-8 w-8 shadow-sm"
                onClick={() => setInteractionMode('pan')}
                title="מצב גרירה (H)"
             >
               <Hand className="w-4 h-4" />
             </Button>
          </div>

          <div className="h-6 w-px bg-slate-200 mx-2"></div>

          <Button variant="ghost" size="icon" onClick={handleUndo} disabled={historyIndex <= 0} title="בטל (Ctrl+Z)">
            <Undo className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={handleRedo} disabled={historyIndex >= history.length - 1} title="בצע שוב (Ctrl+Y)">
            <Redo className="w-4 h-4" />
          </Button>
          
          <div className="h-6 w-px bg-slate-200 mx-2"></div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Download className="w-4 h-4" />
                ייצוא
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleExportImage}>
                <ImageIcon className="w-4 h-4 ml-2" />
                שמור כתמונה (PNG)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            onClick={handleManualSave} 
            className="bg-indigo-600 hover:bg-indigo-700 gap-2"
            disabled={isSaving}
          >
            <Save className="w-4 h-4" />
            שמור וסגור
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Right Sidebar: Tools & Assets */}
        <div className="w-72 bg-white border-l border-slate-200 flex flex-col z-20 shadow-sm">
          {/* Sidebar Tabs */}
          <div className="flex border-b border-slate-100">
              <button 
                  onClick={() => setRightSidebarTab('tools')} 
                  className={`flex-1 py-3 text-xs font-medium ${rightSidebarTab === 'tools' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
              >
                  כלים
              </button>
              <button 
                  onClick={() => setRightSidebarTab('furniture')} 
                  className={`flex-1 py-3 text-xs font-medium ${rightSidebarTab === 'furniture' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
              >
                  רהיטים
              </button>
              <button 
                  onClick={() => setRightSidebarTab('references')} 
                  className={`flex-1 py-3 text-xs font-medium ${rightSidebarTab === 'references' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
              >
                  רפרנסים
              </button>
              <button 
                  onClick={() => setRightSidebarTab('ai')} 
                  className={`flex-1 py-3 text-xs font-medium ${rightSidebarTab === 'ai' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500'}`}
              >
                  AI
              </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-0">
              {rightSidebarTab === 'tools' && (
                  <div className="grid grid-cols-2 gap-2">
                      {/* Upload Image */}
                      <div className="col-span-2">
                          <input 
                              type="file" 
                              id="moodboard-upload" 
                              className="hidden" 
                              accept="image/*"
                              onChange={handleFileUpload}
                          />
                          <label htmlFor="moodboard-upload" className="w-full cursor-pointer block">
                              <div className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-300 hover:bg-slate-50 text-slate-600 transition-all">
                                  <ImageIcon className="w-5 h-5" />
                                  <span className="text-sm font-medium">העלאת תמונה</span>
                              </div>
                          </label>
                      </div>

                      <ToolButton icon={Type} label="טקסט" onClick={() => addItem('text', 'טקסט')} />
                      <ToolButton icon={StickyNote} label="פתקית" onClick={() => addItem('note', 'הערה חדשה...')} />

                      {/* Shapes */}
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <div className="cursor-pointer">
                                  <div className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all">
                                      <Square className="w-6 h-6 mb-1.5" />
                                      <span className="text-[10px] font-medium">צורות</span>
                                  </div>
                              </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="left" align="start">
                              <DropdownMenuItem onClick={() => addItem('shape', '', { metadata: { shape_type: 'rectangle' } })}><Square className="w-4 h-4 ml-2" /> מלבן</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => addItem('shape', '', { metadata: { shape_type: 'circle' } })}><CircleIcon className="w-4 h-4 ml-2" /> עיגול</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => addItem('shape', '', { metadata: { shape_type: 'line' } })}><Minus className="w-4 h-4 ml-2" /> קו</DropdownMenuItem>
                          </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Colors with Custom Picker */}
                      <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                              <div className="cursor-pointer">
                                  <div className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all">
                                      <Palette className="w-6 h-6 mb-1.5" />
                                      <span className="text-[10px] font-medium">צבע</span>
                                  </div>
                              </div>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent side="left" align="start" className="w-56 p-3">
                              <DropdownMenuLabel>בחר צבע</DropdownMenuLabel>
                              <div className="grid grid-cols-5 gap-2 mb-3">
                                  {['#000000', '#FFFFFF', '#808080', '#D3D3D3', '#8B4513', '#D2691E', '#CD853F', '#F4A460', '#191970', '#000080', '#4169E1', '#87CEEB', '#006400', '#228B22', '#32CD32', '#90EE90', '#8B0000', '#B22222', '#FF0000', '#FF6347'].map(color => (
                                      <button
                                          key={color}
                                          className="w-6 h-6 rounded-full border border-slate-200 shadow-sm hover:scale-110 transition-transform"
                                          style={{ backgroundColor: color }}
                                          onClick={() => addItem('color', color)}
                                      />
                                  ))}
                              </div>
                              <div className="flex items-center gap-2 border-t pt-2">
                                  <div className="w-8 h-8 rounded-full border border-slate-300 overflow-hidden relative">
                                      <input 
                                          type="color" 
                                          value={customColor} 
                                          onChange={(e) => setCustomColor(e.target.value)} 
                                          className="absolute -top-2 -left-2 w-12 h-12 cursor-pointer p-0 border-0"
                                      />
                                  </div>
                                  <Input 
                                      value={customColor} 
                                      onChange={(e) => setCustomColor(e.target.value)} 
                                      className="h-8 text-xs font-mono" 
                                  />
                                  <Button size="sm" onClick={() => addItem('color', customColor)} className="h-8 w-8 p-0"><ArrowRight className="w-3 h-3" /></Button>
                              </div>
                          </DropdownMenuContent>
                      </DropdownMenu>

                      {/* Background Settings */}
                      <div className="col-span-2 mt-4 pt-4 border-t border-slate-100 space-y-3">
                          <div>
                              <label className="text-xs font-semibold text-slate-500 block mb-2">רקע ללוח</label>
                              <div className="flex gap-2">
                                  <div className="flex-1">
                                      <input 
                                          type="color" 
                                          value={settings.backgroundColor} 
                                          onChange={(e) => setSettings(prev => ({ ...prev, backgroundColor: e.target.value, backgroundImage: null }))}
                                          className="w-full h-9 rounded cursor-pointer border border-slate-200"
                                          title="צבע רקע"
                                      />
                                  </div>
                                  <div className="flex-1">
                                      <input 
                                          type="file" 
                                          id="bg-upload" 
                                          className="hidden" 
                                          accept="image/*"
                                          onChange={(e) => handleFileUpload(e, true)}
                                      />
                                      <label htmlFor="bg-upload" className="w-full h-9 flex items-center justify-center bg-slate-50 border border-slate-200 rounded cursor-pointer hover:bg-slate-100 transition-colors text-slate-600">
                                          <ImageIcon className="w-4 h-4" />
                                      </label>
                                  </div>
                                  {settings.backgroundImage && (
                                      <Button 
                                          variant="outline" 
                                          size="icon" 
                                          className="h-9 w-9 text-red-500 hover:text-red-700"
                                          onClick={() => setSettings(prev => ({ ...prev, backgroundImage: null }))}
                                          title="הסר תמונת רקע"
                                      >
                                          <Minus className="w-4 h-4" />
                                      </Button>
                                  )}
                              </div>
                          </div>
                      </div>

                      <div className="col-span-2 mt-auto pt-4 space-y-2">
                          <Button variant={showGrid ? "secondary" : "outline"} className="w-full justify-start" onClick={() => setShowGrid(!showGrid)}>
                              <Grid className="w-4 h-4 ml-2" /> {showGrid ? "הסתר גריד" : "הצג גריד"}
                          </Button>
                          <Button variant={snapEnabled ? "secondary" : "outline"} className="w-full justify-start" onClick={() => setSnapEnabled(!snapEnabled)}>
                              <Layout className="w-4 h-4 ml-2" /> {snapEnabled ? "Snap On" : "Snap Off"}
                          </Button>
                      </div>
                  </div>
              )}

              {rightSidebarTab === 'furniture' && (
                  <div className="space-y-3">
                      {loadingFurniture ? (
                          <div className="space-y-3">
                              {[1, 2, 3].map(i => (
                                  <div key={i} className="aspect-square bg-slate-100 rounded-lg animate-pulse" />
                              ))}
                          </div>
                      ) : (
                          <>
                              {furnitureAssets.length === 0 && <p className="text-center text-slate-400 text-xs mt-10">אין רהיטים בספרייה</p>}
                              {furnitureAssets.map(asset => (
                                  <div 
                                      key={asset.id} 
                                      className="group relative aspect-square bg-slate-50 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all border border-slate-100"
                                      onClick={() => {
                                          // Immediate visual feedback or placeholder could go here
                                          const img = new Image();
                                          img.onload = () => {
                                              const aspectRatio = img.width / img.height;
                                              addItem('image', asset.file_url, { 
                                                  size: { width: 200, height: 200 / aspectRatio },
                                                  metadata: { linked_entity_id: asset.id, linked_entity_type: 'asset' }
                                              });
                                          };
                                          img.src = asset.file_url;
                                      }}
                                  >
                                      <img 
                                          src={asset.file_url} 
                                          alt={asset.name} 
                                          className="w-full h-full object-cover transition-opacity duration-300" 
                                          loading="lazy" 
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                          <p className="text-white text-[10px] truncate">{asset.name}</p>
                                      </div>
                                  </div>
                              ))}
                          </>
                      )}
                  </div>
              )}

              {rightSidebarTab === 'references' && (
                  <div className="space-y-3 p-2">
                      {loadingReferences ? (
                          <div className="space-y-3">
                              {[1, 2, 3].map(i => (
                                  <div key={i} className="aspect-video bg-slate-100 rounded-lg animate-pulse" />
                              ))}
                          </div>
                      ) : (
                          <>
                              {referenceAssets.length === 0 && <p className="text-center text-slate-400 text-xs mt-10">אין רפרנסים בספרייה</p>}
                              {referenceAssets.map(asset => (
                                  <div 
                                      key={asset.id} 
                                      className="group relative aspect-video bg-slate-50 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-indigo-500 transition-all border border-slate-100"
                                      onClick={() => {
                                          const img = new Image();
                                          img.onload = () => {
                                              const aspectRatio = img.width / img.height;
                                              addItem('image', asset.file_url, { 
                                                  size: { width: 300, height: 300 / aspectRatio },
                                                  metadata: { linked_entity_id: asset.id, linked_entity_type: 'asset' }
                                              });
                                          };
                                          img.src = asset.file_url;
                                      }}
                                  >
                                      <img 
                                          src={asset.file_url} 
                                          alt={asset.name} 
                                          className="w-full h-full object-cover transition-opacity duration-300" 
                                          loading="lazy" 
                                      />
                                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                                          <p className="text-white text-[10px] truncate">{asset.name}</p>
                                      </div>
                                  </div>
                              ))}
                          </>
                      )}
                  </div>
              )}

              {rightSidebarTab === 'ai' && (
                  <AIToolsPanel 
                      onAddItem={addItem} 
                      selectedItems={items.filter(i => selectedItemIds.includes(i.id))}
                      onUpdateItem={(id, changes) => handleUpdateItem(id, changes, true)}
                      onLoadBoard={(newItems, newSettings, newName) => {
                          setItems(newItems);
                          if (newSettings) {
                              setSettings(prev => ({ ...prev, ...newSettings }));
                              if (newSettings.grid_enabled !== undefined) setShowGrid(newSettings.grid_enabled);
                              if (newSettings.snap_enabled !== undefined) setSnapEnabled(newSettings.snap_enabled);
                          }
                          if (newName) setBoardName(newName);
                          setSelectedItemIds([]);
                          addToHistory(newItems);
                          showSuccess('לוח חדש נוצר בהצלחה');
                      }}
                  />
              )}
          </div>
        </div>

        {/* Main Canvas Area */}
        <div 
          className={`flex-1 bg-slate-100 relative overflow-hidden flex items-center justify-center ${interactionMode === 'pan' || isPanning ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={(e) => {
             if (e.target === e.currentTarget && !isPanning && !isSelecting) {
                 if (!e.shiftKey && !e.ctrlKey && !e.metaKey) setSelectedItemIds([]);
             }
          }}
        >
          {/* Zoom Indicator */}
          <div className="absolute bottom-6 left-6 flex items-center gap-2 bg-white/90 backdrop-blur p-2 rounded-lg shadow-md z-30 border border-slate-200 canvas-controls">
            <Button variant="ghost" size="icon" onClick={() => setZoom(Math.max(0.1, zoom - 0.1))}>
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs font-mono w-12 text-center">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" onClick={() => setZoom(Math.min(5, zoom + 0.1))}>
              <ZoomIn className="w-4 h-4" />
            </Button>
            <div className="w-px h-4 bg-slate-200 mx-1"></div>
            <Button variant="ghost" size="sm" onClick={() => { setZoom(1); setPan({x:0, y:0}); }} className="text-xs">
              אפס
            </Button>
          </div>

          {/* Selection Stats */}
          {selectedItemIds.length > 1 && (
             <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg z-30 text-sm font-medium animate-in fade-in zoom-in slide-in-from-top-4 canvas-controls flex items-center gap-3">
                <span>{selectedItemIds.length} פריטים נבחרו</span>
                <div className="h-4 w-px bg-indigo-400"></div>
                <button onClick={handleGroup} className="hover:text-indigo-200" title="קבץ (Ctrl+G)"><Group className="w-4 h-4" /></button>
                <button onClick={handleDeleteSelected} className="hover:text-red-200" title="מחק (Del)"><Trash2 className="w-4 h-4" /></button>
             </div>
          )}

          {/* Infinite Canvas Simulation */}
          <div 
            ref={canvasRef}
            className="absolute origin-center will-change-transform"
            style={{
              width: '100%',
              height: '100%',
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom * 0.5})`,
              backgroundImage: settings.backgroundImage 
                ? `url(${settings.backgroundImage})` 
                : showGrid ? 'radial-gradient(#cbd5e1 1.5px, transparent 1.5px)' : 'none',
              backgroundSize: settings.backgroundImage ? 'cover' : `${GRID_SIZE}px ${GRID_SIZE}px`,
              backgroundPosition: 'center',
              backgroundColor: settings.backgroundColor || '#f1f5f9' 
            }}
          >
            {/* Center Reference Cross */}
            {showGrid && (
              <div className="absolute top-1/2 left-1/2 w-4 h-4 -mt-2 -ml-2 pointer-events-none opacity-20">
                <div className="absolute top-1/2 left-0 w-full h-px bg-red-500"></div>
                <div className="absolute left-1/2 top-0 h-full w-px bg-red-500"></div>
              </div>
            )}

            {items.map(item => (
              <MoodboardItem
                key={item.id}
                item={item}
                isSelected={selectedItemIds.includes(item.id)}
                snapEnabled={snapEnabled}
                gridSize={GRID_SIZE}
                onSelect={(id, isMultiSelect) => {
                  if (interactionMode === 'select') {
                      if (isMultiSelect) {
                          setSelectedItemIds(prev => 
                              prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
                          );
                      } else {
                          if (!selectedItemIds.includes(id)) {
                              setSelectedItemIds([id]);
                          }
                      }
                  }
                }}
                onUpdate={(id, changes, commit = true) => {
                  handleUpdateItem(id, changes, commit);
                }}
                zoom={zoom * 0.5}
              />
            ))}

            {/* Selection Box Visual */}
            {selectionBox && (
                <div 
                    className="absolute border-2 border-indigo-500 bg-indigo-100/30 z-50 pointer-events-none"
                    style={{
                        left: selectionBox.x,
                        top: selectionBox.y,
                        width: selectionBox.width,
                        height: selectionBox.height
                    }}
                />
            )}
          </div>
        </div>

        {/* Left Sidebar: Properties & Layers */}
        <div className="w-80 bg-white border-r border-slate-200 flex flex-col h-full z-20 shadow-lg">
            {/* Sidebar Tabs */}
            <div className="flex border-b border-slate-100 bg-white shrink-0">
                <button 
                    onClick={() => setActiveSidebarTab('properties')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeSidebarTab === 'properties' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                    מאפיינים
                </button>
                <button 
                    onClick={() => setActiveSidebarTab('layers')}
                    className={`flex-1 py-3 text-sm font-medium transition-colors ${activeSidebarTab === 'layers' ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                >
                    שכבות
                </button>
            </div>

            <div className="flex-1 overflow-hidden relative">
                {activeSidebarTab === 'properties' ? (
                    <div className="absolute inset-0 overflow-y-auto">
                        <PropertiesPanel 
                        selectedItems={items.filter(i => selectedItemIds.includes(i.id))}
                        onUpdate={(id, changes) => handleUpdateItem(id, changes, true)}
                        onUpdateBatch={(changes) => handleUpdateSelected(changes, true)}
                        onDelete={handleDeleteSelected}
                        onDuplicate={handleDuplicateSelected}
                        onGroup={handleGroup}
                        onUngroup={handleUngroup}
                        onBringToFront={handleBringToFront}
                        onSendToBack={handleSendToBack}
                        />
                    </div>
                ) : (
                    <LayersPanel 
                        items={items}
                        selectedIds={selectedItemIds}
                        onSelect={(id, shift) => {
                            if (shift) {
                                setSelectedItemIds(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
                            } else {
                                setSelectedItemIds([id]);
                            }
                        }}
                        onToggleLock={(item) => handleUpdateItem(item.id, { locked: !item.locked }, true)}
                        onToggleVisibility={handleToggleVisibility}
                        onReorder={handleReorderItems}
                    />
                )}
            </div>
        </div>
      </div>
    </div>
  );
}