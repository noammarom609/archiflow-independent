import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Save, ArrowRight, ImageIcon, Type, Palette, StickyNote, 
  ZoomIn, ZoomOut, Grid, Download, Layout, Undo, Redo, 
  MousePointer2, Hand, Square, Circle as CircleIcon, Minus,
  Layers, Settings, Trash2, Copy, Check, Box, ShoppingBag,
  Sparkles, Group, Ungroup, MoreHorizontal, Eye, Map, Maximize
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { showSuccess, showError } from '@/components/utils/notifications';
import { debounce, cloneDeep } from 'lodash';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Import Components
import MoodboardItem from './MoodboardItem';
import PropertiesPanelNew from './PropertiesPanelNew';
import LayersPanelNew from './LayersPanelNew';
import AIToolsPanel from './AIToolsPanel';
import FloatingToolbar from './FloatingToolbar';
import ContextMenu from './ContextMenu';
import SmartGuides from './SmartGuides';
import Minimap from './Minimap';
import TemplatesPanel from './TemplatesPanel';
import MoodboardErrorBoundary from './MoodboardErrorBoundary';

// Safe ID generator
const generateId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

// Constants
const GRID_SIZE = 20;
const MAX_HISTORY = 50;

// Import Mock Data
import { MOODBOARD_FURNITURE, MOODBOARD_REFERENCES } from '@/data/mockDesignAssets';

// Tool Button Component
const ToolButton = ({ icon: Icon, label, onClick, isActive }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all w-full ${
      isActive 
        ? 'bg-primary/10 text-primary ring-1 ring-primary/20' 
        : 'hover:bg-slate-100 text-slate-600 hover:text-slate-900'
    }`}
    title={label}
  >
    <Icon className="w-6 h-6 mb-1.5" strokeWidth={1.5} />
    <span className="text-[10px] font-medium">{label}</span>
  </button>
);

function MoodboardEditorContent({ moodboardId: propMoodboardId, onClose, initialData }) {
  const queryClient = useQueryClient();
  const canvasRef = useRef(null);
  const canvasContainerRef = useRef(null);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // STATE MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  
  // Board Size Presets
  const BOARD_PRESETS = {
    'custom': { name: 'מותאם אישית', width: null, height: null },
    'fhd': { name: 'Full HD (1920×1080)', width: 1920, height: 1080 },
    '4k': { name: '4K (3840×2160)', width: 3840, height: 2160 },
    'a4-landscape': { name: 'A4 לרוחב', width: 1123, height: 794 },
    'a4-portrait': { name: 'A4 לאורך', width: 794, height: 1123 },
    'a3-landscape': { name: 'A3 לרוחב', width: 1587, height: 1123 },
    'a3-portrait': { name: 'A3 לאורך', width: 1123, height: 1587 },
    'instagram-square': { name: 'Instagram ריבוע', width: 1080, height: 1080 },
    'instagram-story': { name: 'Instagram Story', width: 1080, height: 1920 },
    'pinterest': { name: 'Pinterest', width: 1000, height: 1500 },
    'presentation': { name: 'מצגת (16:9)', width: 1920, height: 1080 },
  };

  // Core State
  const [currentMoodboardId, setCurrentMoodboardId] = useState(propMoodboardId);
  const [items, setItems] = useState(initialData?.items || []);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [boardName, setBoardName] = useState(initialData?.name || 'לוח השראה חדש');
  const [clipboard, setClipboard] = useState(null);
  
  // Board Size State
  const [boardPreset, setBoardPreset] = useState('fhd');
  const [boardSize, setBoardSize] = useState({ width: 1920, height: 1080 });
  const [showBoardBounds, setShowBoardBounds] = useState(true);
  
  // Viewport State
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [interactionMode, setInteractionMode] = useState('select'); // 'select' | 'pan'
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Selection Box State
  const [selectionBox, setSelectionBox] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const selectionStartRef = useRef(null);
  const wasSelectingRef = useRef(false); // Track if we just finished selecting (to prevent onClick from clearing)

  // UI State
  const [showGrid, setShowGrid] = useState(true);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const [settings, setSettings] = useState({ backgroundColor: '#f1f5f9', backgroundImage: null });
  const [rightSidebarTab, setRightSidebarTab] = useState('tools');
  const [activeSidebarTab, setActiveSidebarTab] = useState('properties');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const [customColor, setCustomColor] = useState('#984E39');

  // History State
  const [history, setHistory] = useState([JSON.stringify([])]);
  const [historyIndex, setHistoryIndex] = useState(0);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState({ isOpen: false, position: { x: 0, y: 0 }, targetItem: null });

  // Smart Guides State
  const [guides, setGuides] = useState(null);

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA FETCHING
  // ═══════════════════════════════════════════════════════════════════════════
  
  const { data: moodboardData, isLoading: isLoadingBoard } = useQuery({
    queryKey: ['moodboard_v2', currentMoodboardId],
    queryFn: () => base44.entities.Moodboard.get(currentMoodboardId),
    enabled: !!currentMoodboardId,
    staleTime: 5 * 60 * 1000, // 5 minutes - prevent excessive refetching
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  const { data: dbFurnitureAssets = [], isLoading: loadingFurniture } = useQuery({
    queryKey: ['assets', 'furniture'],
    queryFn: () => base44.entities.DesignAsset.filter({ category: 'furniture' }, '-created_date', 50),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  const { data: dbReferenceAssets = [], isLoading: loadingReferences } = useQuery({
    queryKey: ['assets', 'references'],
    queryFn: () => base44.entities.DesignAsset.filter({ category: 'references' }, '-created_date', 50),
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false,
  });

  // Merge mock data with DB data
  const furnitureAssets = useMemo(() => {
    return [...MOODBOARD_FURNITURE, ...dbFurnitureAssets];
  }, [dbFurnitureAssets]);

  const referenceAssets = useMemo(() => {
    return [...MOODBOARD_REFERENCES, ...dbReferenceAssets];
  }, [dbReferenceAssets]);

  // Initialize from fetched data
  useEffect(() => {
    if (moodboardData) {
      setItems(moodboardData.items || []);
      setBoardName(moodboardData.name || 'לוח השראה חדש');
      if (moodboardData.settings) {
        setSettings(prev => ({ ...prev, ...moodboardData.settings }));
        if (moodboardData.settings.grid_enabled !== undefined) setShowGrid(moodboardData.settings.grid_enabled);
        if (moodboardData.settings.snap_enabled !== undefined) setSnapEnabled(moodboardData.settings.snap_enabled);
      }
      // Initialize history
      setHistory([JSON.stringify(moodboardData.items || [])]);
      setHistoryIndex(0);
    }
  }, [moodboardData]);

  // Track container size for positioning calculations
  useEffect(() => {
    const updateSize = () => {
      if (canvasContainerRef.current) {
        setContainerSize({
          width: canvasContainerRef.current.clientWidth,
          height: canvasContainerRef.current.clientHeight
        });
      }
    };
    
    updateSize();
    
    // Use ResizeObserver to track container size changes (e.g., when sidebars resize)
    const resizeObserver = new ResizeObserver(updateSize);
    if (canvasContainerRef.current) {
      resizeObserver.observe(canvasContainerRef.current);
    }
    
    window.addEventListener('resize', updateSize);
    return () => {
      window.removeEventListener('resize', updateSize);
      resizeObserver.disconnect();
    };
  }, []);

  // Auto-fit to board on initial load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!canvasContainerRef.current) return;
      
      const container = canvasContainerRef.current;
      const padding = 80;
      
      const scaleX = (container.clientWidth - padding * 2) / boardSize.width;
      const scaleY = (container.clientHeight - padding * 2) / boardSize.height;
      const newZoom = Math.min(scaleX, scaleY, 2) / 0.5;
      
      const effectiveZoom = newZoom * 0.5;
      const newPanX = (container.clientWidth / 2) - (boardSize.width / 2) * effectiveZoom;
      const newPanY = (container.clientHeight / 2) - (boardSize.height / 2) * effectiveZoom;
      
      setZoom(Math.max(0.2, Math.min(newZoom, 4)));
      setPan({ x: newPanX, y: newPanY });
    }, 100);
    
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount

  // ═══════════════════════════════════════════════════════════════════════════
  // HISTORY MANAGEMENT
  // ═══════════════════════════════════════════════════════════════════════════
  
  const pushHistory = useCallback((newItems) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      newHistory.push(JSON.stringify(newItems));
      if (newHistory.length > MAX_HISTORY) newHistory.shift();
      return newHistory;
    });
    setHistoryIndex(prev => Math.min(prev + 1, MAX_HISTORY - 1));
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const prevItems = JSON.parse(history[historyIndex - 1]);
      setItems(prevItems);
      setHistoryIndex(historyIndex - 1);
      setSelectedItemIds([]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextItems = JSON.parse(history[historyIndex + 1]);
      setItems(nextItems);
      setHistoryIndex(historyIndex + 1);
      setSelectedItemIds([]);
    }
  }, [history, historyIndex]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // ═══════════════════════════════════════════════════════════════════════════
  // ITEM OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const addItem = useCallback((type, content, extra = {}) => {
    const container = canvasContainerRef.current;
    if (!container) return;
    
    const effectiveZoom = zoom * 0.5;
    
    // Calculate the center of the visible viewport in canvas coordinates
    // With origin top-left: screenX = canvasX * zoom + pan.x
    // Solving for canvasX: canvasX = (screenX - pan.x) / zoom
    const screenCenterX = container.clientWidth / 2;
    const screenCenterY = container.clientHeight / 2;
    
    const centerX = (screenCenterX - pan.x) / effectiveZoom;
    const centerY = (screenCenterY - pan.y) / effectiveZoom;

    const width = extra.size?.width || (type === 'text' ? 300 : type === 'color' ? 80 : 200);
    const height = extra.size?.height || (type === 'text' ? 60 : type === 'color' ? 80 : 200);

    // Calculate initial position, constrained to board bounds
    let initialX = centerX - width/2;
    let initialY = centerY - height/2;
    
    // Constrain to board bounds if bounds are shown
    if (showBoardBounds) {
      initialX = Math.max(0, Math.min(initialX, boardSize.width - width));
      initialY = Math.max(0, Math.min(initialY, boardSize.height - height));
    }

    const newItem = {
      id: generateId(),
      type,
      content,
      position: extra.position || { x: initialX, y: initialY, z: items.length + 1 },
      size: { width, height },
      rotation: 0,
      locked: false,
      hidden: false,
      style: { opacity: 1, borderRadius: '8px', ...extra.style },
      metadata: extra.metadata || {},
      ...extra,
    };

    const newItems = [...items, newItem];
    setItems(newItems);
    pushHistory(newItems);
    setSelectedItemIds([newItem.id]);
  }, [items, zoom, pan, pushHistory]);

  const updateItem = useCallback((id, changes, commit = true) => {
    setItems(prevItems => {
      const newItems = prevItems.map(item => 
        item.id === id ? { ...item, ...changes } : item
      );
      if (commit) {
        // Schedule history update
        setTimeout(() => pushHistory(newItems), 0);
      }
      return newItems;
    });
  }, [pushHistory]);

  const updateSelected = useCallback((changes, commit = true) => {
    setItems(prevItems => {
      const newItems = prevItems.map(item => 
        selectedItemIds.includes(item.id) ? { ...item, ...changes } : item
      );
      if (commit) {
        setTimeout(() => pushHistory(newItems), 0);
      }
      return newItems;
    });
  }, [selectedItemIds, pushHistory]);

  const deleteSelected = useCallback(() => {
    if (selectedItemIds.length === 0) return;
    const newItems = items.filter(i => !selectedItemIds.includes(i.id));
    setItems(newItems);
    pushHistory(newItems);
    setSelectedItemIds([]);
  }, [items, selectedItemIds, pushHistory]);

  const deleteItems = useCallback((ids) => {
    const newItems = items.filter(i => !ids.includes(i.id));
    setItems(newItems);
    pushHistory(newItems);
    setSelectedItemIds(prev => prev.filter(id => !ids.includes(id)));
  }, [items, pushHistory]);

  const duplicateSelected = useCallback(() => {
    if (selectedItemIds.length === 0) return;
    const selected = items.filter(i => selectedItemIds.includes(i.id));
    const newItems = selected.map(item => ({
      ...cloneDeep(item),
      id: generateId(),
      position: { ...item.position, x: item.position.x + 20, y: item.position.y + 20, z: items.length + 10 }
    }));
    const updatedItems = [...items, ...newItems];
    setItems(updatedItems);
    pushHistory(updatedItems);
    setSelectedItemIds(newItems.map(i => i.id));
    showSuccess('פריטים שוכפלו');
  }, [items, selectedItemIds, pushHistory]);

  const duplicateItem = useCallback((item) => {
    const newItem = {
      ...cloneDeep(item),
      id: generateId(),
      position: { ...item.position, x: item.position.x + 20, y: item.position.y + 20, z: items.length + 10 }
    };
    const updatedItems = [...items, newItem];
    setItems(updatedItems);
    pushHistory(updatedItems);
    setSelectedItemIds([newItem.id]);
  }, [items, pushHistory]);

  // ═══════════════════════════════════════════════════════════════════════════
  // CLIPBOARD OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handleCopy = useCallback(() => {
    const selected = items.filter(i => selectedItemIds.includes(i.id));
    if (selected.length > 0) {
      setClipboard(cloneDeep(selected));
      showSuccess('הועתק');
    }
  }, [items, selectedItemIds]);

  const handlePaste = useCallback(() => {
    if (!clipboard || clipboard.length === 0) return;
    
    const newItems = clipboard.map(item => ({
      ...cloneDeep(item),
      id: generateId(),
      position: { ...item.position, x: item.position.x + 40, y: item.position.y + 40, z: items.length + 10 }
    }));
    
    const updatedItems = [...items, ...newItems];
    setItems(updatedItems);
    pushHistory(updatedItems);
    setSelectedItemIds(newItems.map(i => i.id));
    showSuccess('הודבק');
  }, [clipboard, items, pushHistory]);

  // ═══════════════════════════════════════════════════════════════════════════
  // GROUP OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handleGroup = useCallback(() => {
    if (selectedItemIds.length < 2) return;
    const groupId = generateId();
    updateSelected({ group_id: groupId });
    showSuccess('קבוצה נוצרה');
  }, [selectedItemIds, updateSelected]);

  const handleUngroup = useCallback(() => {
    const selected = items.filter(i => selectedItemIds.includes(i.id));
    const groupIds = [...new Set(selected.map(i => i.group_id).filter(Boolean))];
    if (groupIds.length === 0) return;
    
    const newItems = items.map(item => 
      groupIds.includes(item.group_id) ? { ...item, group_id: null } : item
    );
    setItems(newItems);
    pushHistory(newItems);
    showSuccess('קבוצה פורקה');
  }, [items, selectedItemIds, pushHistory]);

  const handleUngroupItems = useCallback((groupItems) => {
    const groupIds = [...new Set(groupItems.map(i => i.group_id).filter(Boolean))];
    const newItems = items.map(item => 
      groupIds.includes(item.group_id) ? { ...item, group_id: null } : item
    );
    setItems(newItems);
    pushHistory(newItems);
    showSuccess('קבוצה פורקה');
  }, [items, pushHistory]);

  // ═══════════════════════════════════════════════════════════════════════════
  // LAYER OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const bringToFront = useCallback(() => {
    if (selectedItemIds.length === 0) return;
    const maxZ = Math.max(...items.map(i => i.position.z || 0), 0);
    const newItems = items.map((item, idx) => 
      selectedItemIds.includes(item.id) 
        ? { ...item, position: { ...item.position, z: maxZ + 1 + idx } }
        : item
    );
    setItems(newItems);
    pushHistory(newItems);
  }, [items, selectedItemIds, pushHistory]);

  const sendToBack = useCallback(() => {
    if (selectedItemIds.length === 0) return;
    const minZ = Math.min(...items.map(i => i.position.z || 0), 0);
    const newItems = items.map((item, idx) => 
      selectedItemIds.includes(item.id) 
        ? { ...item, position: { ...item.position, z: minZ - selectedItemIds.length + idx } }
        : item
    );
    setItems(newItems);
    pushHistory(newItems);
  }, [items, selectedItemIds, pushHistory]);

  const bringForward = useCallback(() => {
    if (selectedItemIds.length === 0) return;
    const newItems = items.map(item => 
      selectedItemIds.includes(item.id) 
        ? { ...item, position: { ...item.position, z: (item.position.z || 0) + 1 } }
        : item
    );
    setItems(newItems);
    pushHistory(newItems);
  }, [items, selectedItemIds, pushHistory]);

  const sendBackward = useCallback(() => {
    if (selectedItemIds.length === 0) return;
    const newItems = items.map(item => 
      selectedItemIds.includes(item.id) 
        ? { ...item, position: { ...item.position, z: (item.position.z || 0) - 1 } }
        : item
    );
    setItems(newItems);
    pushHistory(newItems);
  }, [items, selectedItemIds, pushHistory]);

  const handleReorderItems = useCallback((updates) => {
    const newItems = items.map(item => {
      const update = updates.find(u => u.id === item.id);
      return update ? { ...item, position: { ...item.position, z: update.z } } : item;
    });
    setItems(newItems);
    pushHistory(newItems);
  }, [items, pushHistory]);

  // ═══════════════════════════════════════════════════════════════════════════
  // ALIGNMENT & DISTRIBUTION
  // ═══════════════════════════════════════════════════════════════════════════
  
  const alignItems = useCallback((direction) => {
    if (selectedItemIds.length < 2) return;
    
    const selected = items.filter(i => selectedItemIds.includes(i.id));
    const bounds = selected.reduce((acc, item) => ({
      minX: Math.min(acc.minX, item.position.x),
      minY: Math.min(acc.minY, item.position.y),
      maxX: Math.max(acc.maxX, item.position.x + item.size.width),
      maxY: Math.max(acc.maxY, item.position.y + item.size.height),
    }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity });
    
    const centerX = (bounds.minX + bounds.maxX) / 2;
    const centerY = (bounds.minY + bounds.maxY) / 2;
    
    const newItems = items.map(item => {
      if (!selectedItemIds.includes(item.id)) return item;
      
      let newX = item.position.x;
      let newY = item.position.y;
      
      switch (direction) {
        case 'left':
          newX = bounds.minX;
          break;
        case 'center':
          newX = centerX - item.size.width / 2;
          break;
        case 'right':
          newX = bounds.maxX - item.size.width;
          break;
        case 'top':
          newY = bounds.minY;
          break;
        case 'middle':
          newY = centerY - item.size.height / 2;
          break;
        case 'bottom':
          newY = bounds.maxY - item.size.height;
          break;
      }
      
      return { ...item, position: { ...item.position, x: newX, y: newY } };
    });
    
    setItems(newItems);
    pushHistory(newItems);
  }, [items, selectedItemIds, pushHistory]);

  const distributeItems = useCallback((direction) => {
    if (selectedItemIds.length < 3) return;
    
    const selected = items.filter(i => selectedItemIds.includes(i.id))
      .sort((a, b) => direction === 'horizontal' 
        ? a.position.x - b.position.x 
        : a.position.y - b.position.y
      );
    
    const first = selected[0];
    const last = selected[selected.length - 1];
    
    const totalSpace = direction === 'horizontal'
      ? (last.position.x + last.size.width) - first.position.x
      : (last.position.y + last.size.height) - first.position.y;
    
    const totalItemSize = selected.reduce((sum, item) => 
      sum + (direction === 'horizontal' ? item.size.width : item.size.height), 0
    );
    
    const gap = (totalSpace - totalItemSize) / (selected.length - 1);
    
    let currentPos = direction === 'horizontal' ? first.position.x : first.position.y;
    
    const updates = {};
    selected.forEach((item, index) => {
      if (index === 0) {
        currentPos += direction === 'horizontal' ? item.size.width : item.size.height;
        currentPos += gap;
        return;
      }
      
      updates[item.id] = direction === 'horizontal'
        ? { x: currentPos, y: item.position.y }
        : { x: item.position.x, y: currentPos };
      
      currentPos += direction === 'horizontal' ? item.size.width : item.size.height;
      currentPos += gap;
    });
    
    const newItems = items.map(item => 
      updates[item.id] 
        ? { ...item, position: { ...item.position, ...updates[item.id] } }
        : item
    );
    
    setItems(newItems);
    pushHistory(newItems);
  }, [items, selectedItemIds, pushHistory]);

  // ═══════════════════════════════════════════════════════════════════════════
  // TOGGLE OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const toggleLock = useCallback(() => {
    const isAllLocked = selectedItemIds.every(id => items.find(i => i.id === id)?.locked);
    updateSelected({ locked: !isAllLocked });
  }, [selectedItemIds, items, updateSelected]);

  const toggleVisibility = useCallback(() => {
    updateSelected({ hidden: true });
    setSelectedItemIds([]);
  }, [updateSelected]);

  const toggleItemLock = useCallback((item) => {
    updateItem(item.id, { locked: !item.locked });
  }, [updateItem]);

  const toggleItemVisibility = useCallback((item) => {
    updateItem(item.id, { hidden: !item.hidden });
  }, [updateItem]);

  // ═══════════════════════════════════════════════════════════════════════════
  // SAVE OPERATIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (currentMoodboardId) {
        return base44.entities.Moodboard.update(currentMoodboardId, data);
      }
      return base44.entities.Moodboard.create(data);
    },
    onSuccess: (data) => {
      setLastSaved(new Date());
      setIsSaving(false);
      if (!currentMoodboardId && data?.id) {
        setCurrentMoodboardId(data.id);
        window.history.replaceState(null, '', `?moodboardId=${data.id}`);
      }
      queryClient.invalidateQueries({ queryKey: ['moodboards'] });
    },
    onError: () => {
      setIsSaving(false);
      showError('שגיאה בשמירה');
    }
  });

  const debouncedSave = useMemo(
    () => debounce((data) => {
      if (data.items.length > 0 || data.name !== 'לוח השראה חדש') {
        setIsSaving(true);
        saveMutation.mutate(data);
      }
    }, 2000),
    [saveMutation]
  );

  // Auto-save effect
  useEffect(() => {
    if (isLoadingBoard) return;
    
    debouncedSave({
      name: boardName,
      items,
      thumbnail_url: items.find(i => i.type === 'image')?.content || '',
      settings: { 
        grid_enabled: showGrid, 
        snap_enabled: snapEnabled, 
        backgroundColor: settings.backgroundColor,
        backgroundImage: settings.backgroundImage
      },
      updated_date: new Date().toISOString()
    });
  }, [items, boardName, showGrid, snapEnabled, settings, debouncedSave, isLoadingBoard]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => debouncedSave.cancel();
  }, [debouncedSave]);

  const handleManualSave = useCallback(() => {
    debouncedSave.cancel();
    saveMutation.mutate({
      name: boardName,
      items,
      thumbnail_url: items.find(i => i.type === 'image')?.content || '',
      settings: { 
        grid_enabled: showGrid, 
        snap_enabled: snapEnabled, 
        backgroundColor: settings.backgroundColor,
        backgroundImage: settings.backgroundImage
      },
      updated_date: new Date().toISOString()
    }, {
      onSuccess: () => {
        showSuccess('נשמר בהצלחה');
        onClose();
      }
    });
  }, [boardName, items, showGrid, snapEnabled, settings, saveMutation, debouncedSave, onClose]);

  // Change Board Size and auto-fit view
  const handleBoardPresetChange = useCallback((presetKey) => {
    setBoardPreset(presetKey);
    const preset = BOARD_PRESETS[presetKey];
    if (preset && preset.width && preset.height) {
      const newBoardSize = { width: preset.width, height: preset.height };
      setBoardSize(newBoardSize);
      
      // Constrain existing items to new board bounds
      if (showBoardBounds && items.length > 0) {
        const constrainedItems = items.map(item => {
          let newX = item.position.x;
          let newY = item.position.y;
          
          // Ensure item stays within new bounds
          if (newX + item.size.width > newBoardSize.width) {
            newX = Math.max(0, newBoardSize.width - item.size.width);
          }
          if (newY + item.size.height > newBoardSize.height) {
            newY = Math.max(0, newBoardSize.height - item.size.height);
          }
          newX = Math.max(0, newX);
          newY = Math.max(0, newY);
          
          if (newX !== item.position.x || newY !== item.position.y) {
            return { ...item, position: { ...item.position, x: newX, y: newY } };
          }
          return item;
        });
        
        setItems(constrainedItems);
        pushHistory(constrainedItems);
      }
      
      // Auto-fit to new board size after a small delay to let state update
      setTimeout(() => {
        if (!canvasContainerRef.current) return;
        
        const container = canvasContainerRef.current;
        const padding = 80;
        
        const scaleX = (container.clientWidth - padding * 2) / preset.width;
        const scaleY = (container.clientHeight - padding * 2) / preset.height;
        const newZoom = Math.min(scaleX, scaleY, 2) / 0.5;
        
        const effectiveZoom = newZoom * 0.5;
        const newPanX = (container.clientWidth / 2) - (preset.width / 2) * effectiveZoom;
        const newPanY = (container.clientHeight / 2) - (preset.height / 2) * effectiveZoom;
        
        setZoom(Math.max(0.2, Math.min(newZoom, 4)));
        setPan({ x: newPanX, y: newPanY });
      }, 50);
    }
  }, [BOARD_PRESETS, showBoardBounds, items, pushHistory]);

  // Fit view to board
  const handleFitToBoard = useCallback(() => {
    if (!canvasContainerRef.current) return;
    
    const container = canvasContainerRef.current;
    const padding = 60; // Padding around the board
    
    const scaleX = (container.clientWidth - padding * 2) / boardSize.width;
    const scaleY = (container.clientHeight - padding * 2) / boardSize.height;
    const newZoom = Math.min(scaleX, scaleY, 2) / 0.5; // Divide by 0.5 because effectiveZoom = zoom * 0.5
    
    // Center the board
    const effectiveZoom = newZoom * 0.5;
    const newPanX = (container.clientWidth / 2) - (boardSize.width / 2) * effectiveZoom;
    const newPanY = (container.clientHeight / 2) - (boardSize.height / 2) * effectiveZoom;
    
    setZoom(Math.max(0.2, Math.min(newZoom, 4)));
    setPan({ x: newPanX, y: newPanY });
  }, [boardSize]);

  // Export as Image
  const handleExportImage = useCallback(async () => {
    if (!canvasRef.current) return;
    
    try {
      showSuccess('מייצא תמונה...');
      
      // Dynamic import html2canvas
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        backgroundColor: settings.backgroundColor,
        useCORS: true,
        allowTaint: true,
        logging: false,
      });
      
      const link = document.createElement('a');
      link.download = `${boardName || 'moodboard'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      showSuccess('תמונה הורדה בהצלחה');
    } catch (err) {
      console.error('Export error:', err);
      showError('שגיאה בייצוא התמונה');
    }
  }, [boardName, settings.backgroundColor]);

  // ═══════════════════════════════════════════════════════════════════════════
  // CANVAS INTERACTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = -e.deltaY * 0.001;
      setZoom(z => Math.min(Math.max(0.1, z + delta), 5));
    } else {
      setPan(p => ({ x: p.x - e.deltaX, y: p.y - e.deltaY }));
    }
  }, []);

  // Add wheel event listener with { passive: false } to allow preventDefault
  useEffect(() => {
    const container = canvasContainerRef.current;
    if (!container) return;
    
    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleMouseDown = useCallback((e) => {
    // Close context menu if open
    if (contextMenu.isOpen) {
      setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, targetItem: null });
    }
    
    // Pan mode or middle mouse button
    if (interactionMode === 'pan' || e.button === 1) {
      setIsPanning(true);
      setPanStart({ x: e.clientX, y: e.clientY });
      return;
    }
    
    // Selection box on canvas - start selection if clicking on empty canvas
    // MoodboardItems have their own mousedown handler that calls stopPropagation()
    // So if we reach here, it means we clicked on empty canvas, not on an item
    if (interactionMode === 'select' && e.button === 0) {
      e.preventDefault();
      setIsSelecting(true);
      // Don't set wasSelectingRef here - we'll set it in handleMouseUp if items were selected
      const effectiveZoom = zoom * 0.5;
      const rect = canvasContainerRef.current.getBoundingClientRect();
      const startX = (e.clientX - rect.left - pan.x) / effectiveZoom;
      const startY = (e.clientY - rect.top - pan.y) / effectiveZoom;
      selectionStartRef.current = { x: startX, y: startY };
      setSelectionBox({ x: startX, y: startY, width: 0, height: 0 });
    }
  }, [interactionMode, zoom, pan, contextMenu.isOpen]);

  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      setPan(p => ({ x: p.x + dx, y: p.y + dy }));
      setPanStart({ x: e.clientX, y: e.clientY });
    }

    if (isSelecting && selectionStartRef.current) {
      const effectiveZoom = zoom * 0.5;
      const rect = canvasContainerRef.current.getBoundingClientRect();
      const currentX = (e.clientX - rect.left - pan.x) / effectiveZoom;
      const currentY = (e.clientY - rect.top - pan.y) / effectiveZoom;
      
      const x = Math.min(selectionStartRef.current.x, currentX);
      const y = Math.min(selectionStartRef.current.y, currentY);
      const width = Math.abs(currentX - selectionStartRef.current.x);
      const height = Math.abs(currentY - selectionStartRef.current.y);
      
      setSelectionBox({ x, y, width, height });
    }
  }, [isPanning, isSelecting, panStart, zoom, pan]);

  const handleMouseUp = useCallback(() => {
    if (isSelecting && selectionBox) {
      // Only select items if selection box has meaningful size (not just a click)
      const minSelectionSize = 5;
      if (selectionBox.width > minSelectionSize || selectionBox.height > minSelectionSize) {
        const selected = items.filter(item => {
          if (item.locked || item.hidden) return false;
          return (
            item.position.x < selectionBox.x + selectionBox.width &&
            item.position.x + item.size.width > selectionBox.x &&
            item.position.y < selectionBox.y + selectionBox.height &&
            item.position.y + item.size.height > selectionBox.y
          );
        });
        
        if (selected.length > 0) {
          setSelectedItemIds(prev => [...new Set([...prev, ...selected.map(i => i.id)])]);
          // Keep wasSelectingRef true so onClick doesn't clear selection
          wasSelectingRef.current = true;
        } else {
          // No items selected, allow onClick to clear selection
          wasSelectingRef.current = false;
        }
      } else {
        // Just a click (tiny selection box), allow onClick to handle
        wasSelectingRef.current = false;
      }
    } else {
      // Not selecting, reset the flag
      wasSelectingRef.current = false;
    }

    setIsPanning(false);
    setIsSelecting(false);
    setSelectionBox(null);
    selectionStartRef.current = null;
    setGuides(null);
  }, [isSelecting, selectionBox, items]);

  // Context Menu
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
    const targetItem = selectedItemIds.length > 0 ? items.find(i => selectedItemIds.includes(i.id)) : null;
    setContextMenu({
      isOpen: true,
      position: { x: e.clientX, y: e.clientY },
      targetItem
    });
  }, [selectedItemIds, items]);

  // ═══════════════════════════════════════════════════════════════════════════
  // KEYBOARD SHORTCUTS
  // ═══════════════════════════════════════════════════════════════════════════
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      
      // Delete
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelected();
      }
      
      // Undo/Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
      
      // Copy/Paste
      if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        e.preventDefault();
        handleCopy();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        e.preventDefault();
        handlePaste();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault();
        duplicateSelected();
      }
      
      // Select All
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        setSelectedItemIds(items.filter(i => !i.locked && !i.hidden).map(i => i.id));
      }
      
      // Group
      if ((e.ctrlKey || e.metaKey) && e.key === 'g') {
        e.preventDefault();
        if (e.shiftKey) handleUngroup();
        else handleGroup();
      }
      
      // Save
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleManualSave();
      }
      
      // Pan mode (Space)
      if (e.key === ' ' && !e.repeat) {
        e.preventDefault();
        setInteractionMode('pan');
      }
      
      // Arrow keys movement
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key) && selectedItemIds.length > 0) {
        e.preventDefault();
        const step = e.shiftKey ? 10 : 1;
        const delta = { x: 0, y: 0 };
        
        if (e.key === 'ArrowUp') delta.y = -step;
        if (e.key === 'ArrowDown') delta.y = step;
        if (e.key === 'ArrowLeft') delta.x = -step;
        if (e.key === 'ArrowRight') delta.x = step;
        
        const newItems = items.map(item => {
          if (selectedItemIds.includes(item.id) && !item.locked) {
            return {
              ...item,
              position: {
                ...item.position,
                x: item.position.x + delta.x,
                y: item.position.y + delta.y
              }
            };
          }
          return item;
        });
        setItems(newItems);
      }
      
      // Escape
      if (e.key === 'Escape') {
        setSelectedItemIds([]);
        setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, targetItem: null });
      }
    };
    
    const handleKeyUp = (e) => {
      if (e.key === ' ') {
        setInteractionMode('select');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [items, selectedItemIds, undo, redo, handleCopy, handlePaste, duplicateSelected, deleteSelected, handleGroup, handleUngroup, handleManualSave]);

  // ═══════════════════════════════════════════════════════════════════════════
  // FILE UPLOAD
  // ═══════════════════════════════════════════════════════════════════════════
  
  const handleFileUpload = async (e, isBackground = false) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      showSuccess('מעלה תמונה...');
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      if (isBackground) {
        setSettings(prev => ({ ...prev, backgroundImage: file_url }));
        showSuccess('רקע עודכן');
      } else {
        const img = new Image();
        img.onload = () => {
          const ratio = img.width / img.height;
          const width = 300;
          const height = width / ratio;
          addItem('image', file_url, { size: { width, height } });
        };
        img.src = file_url;
      }
    } catch (err) {
      console.error(err);
      showError('שגיאה בהעלאה');
    }
    
    e.target.value = '';
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED VALUES
  // ═══════════════════════════════════════════════════════════════════════════
  
  const selectedItems = useMemo(() => 
    items.filter(i => selectedItemIds.includes(i.id)),
    [items, selectedItemIds]
  );

  const effectiveZoom = zoom * 0.5;

  // ═══════════════════════════════════════════════════════════════════════════
  // LOADING STATE
  // ═══════════════════════════════════════════════════════════════════════════
  
  if (currentMoodboardId && isLoadingBoard) {
    return (
      <div className="fixed inset-0 bg-background z-50 flex items-center justify-center" dir="rtl">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">טוען לוח השראה...</p>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  
  return (
    <TooltipProvider>
      <div className="fixed inset-0 bg-slate-50 z-50 flex flex-col" dir="rtl">
        {/* ═══════════════════════════════════════════════════════════════════════
            TOP BAR
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm z-30">
          {/* Left Section - Back & Name */}
          <div className="flex items-center gap-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <ArrowRight className="w-5 h-5 text-slate-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>חזור לספרייה</TooltipContent>
            </Tooltip>
            
            <div className="flex flex-col">
              <Input 
                value={boardName} 
                onChange={e => setBoardName(e.target.value)} 
                className="border-none font-bold text-lg h-7 p-0 focus-visible:ring-0 bg-transparent"
              />
              <span className="text-[10px] text-slate-400 flex items-center gap-1 px-0.5">
                {isSaving ? (
                  <span className="flex items-center gap-1 text-amber-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    שומר...
                  </span>
                ) : lastSaved ? (
                  <span className="flex items-center gap-1 text-green-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                    נשמר {lastSaved.toLocaleTimeString()}
                  </span>
                ) : (
                  <span className="text-slate-400">טיוטה</span>
                )}
              </span>
            </div>
          </div>

          {/* Center Section - Tools */}
          <div className="flex items-center gap-2">
            {/* Mode Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={interactionMode === 'select' ? 'secondary' : 'ghost'} 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setInteractionMode('select')}
                  >
                    <MousePointer2 className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>בחירה (V)</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant={interactionMode === 'pan' ? 'secondary' : 'ghost'} 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setInteractionMode('pan')}
                  >
                    <Hand className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>גרירה (Space)</TooltipContent>
              </Tooltip>
            </div>
            
            <div className="w-px h-6 bg-slate-200" />
            
            {/* Undo/Redo */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={undo} disabled={!canUndo}>
                  <Undo className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>בטל (Ctrl+Z)</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={redo} disabled={!canRedo}>
                  <Redo className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>בצע שוב (Ctrl+Y)</TooltipContent>
            </Tooltip>
            
            <div className="w-px h-6 bg-slate-200" />
            
            {/* View Options */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <Eye className="w-4 h-4" />
                  תצוגה
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center">
                <DropdownMenuItem onClick={() => setShowGrid(!showGrid)}>
                  <Grid className="w-4 h-4 ml-2" />
                  {showGrid ? 'הסתר גריד' : 'הצג גריד'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSnapEnabled(!snapEnabled)}>
                  <Layout className="w-4 h-4 ml-2" />
                  {snapEnabled ? 'כבה Snap' : 'הפעל Snap'}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setShowBoardBounds(!showBoardBounds)}>
                  <Square className="w-4 h-4 ml-2" />
                  {showBoardBounds ? 'הסתר גבולות לוח' : 'הצג גבולות לוח'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setShowMinimap(!showMinimap)}>
                  <Map className="w-4 h-4 ml-2" />
                  {showMinimap ? 'הסתר מיניmap' : 'הצג מיניmap'}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleFitToBoard}>
                  <Maximize className="w-4 h-4 ml-2" />
                  התאם לגודל הלוח
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Board Size Selector */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 font-mono text-xs">
                  <Square className="w-4 h-4" />
                  {BOARD_PRESETS[boardPreset]?.name || 'גודל לוח'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="center" className="max-h-80 overflow-auto">
                {Object.entries(BOARD_PRESETS).filter(([key]) => key !== 'custom').map(([key, preset]) => (
                  <DropdownMenuItem 
                    key={key} 
                    onClick={() => handleBoardPresetChange(key)}
                    className={boardPreset === key ? 'bg-primary/10' : ''}
                  >
                    <div className="flex justify-between w-full gap-4">
                      <span>{preset.name}</span>
                      <span className="text-xs text-slate-400 font-mono">{preset.width}×{preset.height}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Export */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={handleExportImage}>
                  <Download className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>ייצוא כתמונה</TooltipContent>
            </Tooltip>
          </div>

          {/* Right Section - Save */}
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              onClick={handleExportImage}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              ייצוא
            </Button>
            <Button 
              onClick={handleManualSave}
              className="bg-primary hover:bg-primary/90 gap-2"
              disabled={isSaving}
            >
              <Save className="w-4 h-4" />
              שמור וסגור
            </Button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            MAIN CONTENT
            ═══════════════════════════════════════════════════════════════════════ */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* ═══════════════════════════════════════════════════════════════════
              RIGHT SIDEBAR - TOOLS
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="w-64 bg-white border-l border-slate-200 z-20 flex flex-col shadow-sm">
            {/* Tabs */}
            <div className="flex border-b border-slate-100 overflow-x-auto shrink-0">
              {[
                { id: 'tools', label: 'כלים' },
                { id: 'templates', label: 'תבניות' },
                { id: 'furniture', label: 'רהיטים' },
                { id: 'references', label: 'רפרנסים' },
                { id: 'ai', label: 'AI' },
              ].map(tab => (
                <button 
                  key={tab.id}
                  onClick={() => setRightSidebarTab(tab.id)} 
                  className={`flex-1 py-3 text-xs font-medium whitespace-nowrap px-2 transition-colors ${
                    rightSidebarTab === tab.id 
                      ? 'text-primary border-b-2 border-primary' 
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            
            {/* Tab Content */}
            <div className="flex-1 overflow-y-auto p-3">
              {rightSidebarTab === 'tools' && (
                <div className="grid grid-cols-2 gap-2">
                  {/* Upload Image */}
                  <div className="col-span-2">
                    <label className="block w-full p-4 border-2 border-dashed border-slate-200 rounded-xl hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer text-center">
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                      <ImageIcon className="w-6 h-6 mx-auto mb-2 text-slate-400" />
                      <span className="text-xs font-medium text-slate-600">העלאת תמונה</span>
                    </label>
                  </div>
                  
                  <ToolButton icon={Type} label="טקסט" onClick={() => addItem('text', 'טקסט חדש')} />
                  <ToolButton icon={StickyNote} label="פתקית" onClick={() => addItem('note', 'הערה...')} />
                  
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
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={() => addItem('shape', '', { metadata: { shape_type: 'rectangle' } })}>
                        <Square className="w-4 h-4 ml-2" /> מלבן
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => addItem('shape', '', { metadata: { shape_type: 'circle' } })}>
                        <CircleIcon className="w-4 h-4 ml-2" /> עיגול
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => addItem('shape', '', { metadata: { shape_type: 'line' }, size: { width: 200, height: 4 } })}>
                        <Minus className="w-4 h-4 ml-2" /> קו
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Colors */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="cursor-pointer">
                        <div className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-all">
                          <Palette className="w-6 h-6 mb-1.5" />
                          <span className="text-[10px] font-medium">צבע</span>
                        </div>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 p-3">
                      <DropdownMenuLabel>בחר צבע</DropdownMenuLabel>
                      <div className="grid grid-cols-6 gap-1.5 mb-3">
                        {['#984E39', '#354231', '#8C7D70', '#F7F5F2', '#000000', '#FFFFFF', 
                          '#ef4444', '#f97316', '#f59e0b', '#22c55e', '#0ea5e9', '#6366f1'].map(c => (
                          <button 
                            key={c} 
                            className="w-6 h-6 rounded-full border border-slate-200 hover:scale-110 transition-transform" 
                            style={{backgroundColor: c}} 
                            onClick={() => addItem('color', c)} 
                          />
                        ))}
                      </div>
                      <div className="flex gap-2 pt-2 border-t">
                        <input 
                          type="color" 
                          value={customColor} 
                          onChange={e => setCustomColor(e.target.value)} 
                          className="w-8 h-8 p-0 border-0 rounded cursor-pointer" 
                        />
                        <Button size="sm" className="flex-1" onClick={() => addItem('color', customColor)}>
                          הוסף
                        </Button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Settings */}
                  <div className="col-span-2 pt-4 mt-4 border-t border-slate-100 space-y-3">
                    <label className="text-xs font-semibold text-slate-600 block">רקע הלוח</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={settings.backgroundColor} 
                        onChange={e => setSettings(s => ({...s, backgroundColor: e.target.value, backgroundImage: null}))}
                        className="h-9 flex-1 cursor-pointer rounded border border-slate-200" 
                      />
                      <label className="cursor-pointer h-9 w-9 flex items-center justify-center border border-slate-200 rounded hover:bg-slate-50 transition-colors">
                        <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, true)} />
                        <ImageIcon className="w-4 h-4 text-slate-500" />
                      </label>
                      {settings.backgroundImage && (
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-9 w-9"
                          onClick={() => setSettings(s => ({...s, backgroundImage: null}))}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {rightSidebarTab === 'templates' && (
                <TemplatesPanel
                  currentItemsCount={items.length}
                  onSelectTemplate={(newItems, newSettings, newName) => {
                    setItems(newItems);
                    if (newSettings) setSettings(prev => ({ ...prev, ...newSettings }));
                    if (newName) setBoardName(newName);
                    setSelectedItemIds([]);
                    pushHistory(newItems);
                    showSuccess('תבנית נטענה');
                  }}
                />
              )}

              {rightSidebarTab === 'furniture' && (
                <div className="space-y-2">
                  {loadingFurniture ? (
                    <div className="animate-pulse space-y-2">
                      {[1,2,3].map(i => <div key={i} className="aspect-square bg-slate-100 rounded-lg" />)}
                    </div>
                  ) : furnitureAssets.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-8">אין רהיטים בספרייה</p>
                  ) : furnitureAssets.map(asset => (
                    <div 
                      key={asset.id} 
                      className="cursor-pointer group relative aspect-square bg-slate-50 rounded-lg overflow-hidden border border-slate-100 hover:border-primary hover:shadow-md transition-all"
                      onClick={() => addItem('image', asset.file_url, { size: { width: 200, height: 200 } })}
                    >
                      <img src={asset.file_url} alt={asset.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-[10px] truncate">{asset.name}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {rightSidebarTab === 'references' && (
                <div className="space-y-2">
                  {loadingReferences ? (
                    <div className="animate-pulse space-y-2">
                      {[1,2,3].map(i => <div key={i} className="aspect-video bg-slate-100 rounded-lg" />)}
                    </div>
                  ) : referenceAssets.length === 0 ? (
                    <p className="text-center text-xs text-slate-400 py-8">אין רפרנסים בספרייה</p>
                  ) : referenceAssets.map(asset => (
                    <div 
                      key={asset.id} 
                      className="cursor-pointer group relative aspect-video bg-slate-50 rounded-lg overflow-hidden border border-slate-100 hover:border-primary hover:shadow-md transition-all"
                      onClick={() => addItem('image', asset.file_url, { size: { width: 300, height: 200 } })}
                    >
                      <img src={asset.file_url} alt={asset.name} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              )}

              {rightSidebarTab === 'ai' && (
                <AIToolsPanel 
                  onAddItem={addItem} 
                  selectedItems={selectedItems}
                  onUpdateItem={updateItem}
                  allItems={items}
                  boardName={boardName}
                  onLoadBoard={(newItems, newSettings, newName) => {
                    setItems(newItems);
                    if (newSettings) setSettings(prev => ({ ...prev, ...newSettings }));
                    if (newName) setBoardName(newName);
                    setSelectedItemIds([]);
                    pushHistory(newItems);
                    showSuccess('לוח חדש נוצר');
                  }}
                />
              )}
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              MAIN CANVAS
              ═══════════════════════════════════════════════════════════════════ */}
          <div 
            ref={canvasContainerRef}
            className={`flex-1 relative overflow-hidden ${
              isPanning || interactionMode === 'pan' 
                ? 'cursor-grab active:cursor-grabbing' 
                : 'cursor-default'
            }`}
            style={{
              backgroundColor: settings.backgroundColor,
              backgroundImage: (!settings.backgroundImage && showGrid) 
                ? 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)' 
                : 'none',
              backgroundSize: `${GRID_SIZE * effectiveZoom}px ${GRID_SIZE * effectiveZoom}px`,
              backgroundPosition: `${pan.x}px ${pan.y}px`
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onContextMenu={handleContextMenu}
            onClick={(e) => {
              // MoodboardItems call stopPropagation on click
              // So if we reach here, it means we clicked on empty canvas
              // Check wasSelectingRef to avoid clearing selection right after selection box
              if (!isPanning && !wasSelectingRef.current) {
                if (!e.shiftKey && !e.ctrlKey && !e.metaKey) {
                  setSelectedItemIds([]);
                }
              }
              // Reset the flag after click is handled
              wasSelectingRef.current = false;
            }}
          >
            {/* Smart Guides */}
            <SmartGuides guides={guides} zoom={zoom} pan={pan} containerSize={containerSize} />

            {/* Canvas Content */}
            <div 
              ref={canvasRef}
              className="absolute will-change-transform pointer-events-none"
              style={{
                width: '100%',
                height: '100%',
                transform: `scale(${effectiveZoom}) translate(${pan.x / effectiveZoom}px, ${pan.y / effectiveZoom}px)`,
                transformOrigin: 'top left',
                backgroundImage: settings.backgroundImage ? `url(${settings.backgroundImage})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }}
            >
              {/* Board Bounds Frame */}
              {showBoardBounds && (
                <div 
                  className="absolute pointer-events-none"
                  style={{
                    width: boardSize.width,
                    height: boardSize.height,
                    left: 0,
                    top: 0,
                    border: '2px dashed rgba(53, 66, 49, 0.4)',
                    borderRadius: '4px',
                    boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.03)',
                    background: settings.backgroundImage ? 'transparent' : 'white',
                  }}
                >
                  {/* Board Size Label */}
                  <div className="absolute -top-6 left-0 text-xs text-slate-500 font-mono bg-white/80 px-2 py-0.5 rounded">
                    {boardSize.width} × {boardSize.height}
                  </div>
                  {/* Corner Markers */}
                  <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-primary rounded-tl" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-primary rounded-tr" />
                  <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-primary rounded-bl" />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-primary rounded-br" />
                </div>
              )}

              {items.map(item => (
                <MoodboardItem 
                  key={item.id}
                  item={item}
                  isSelected={selectedItemIds.includes(item.id)}
                  selectedItemIds={selectedItemIds}
                  onSelect={(id, multi) => {
                    if (interactionMode === 'select') {
                      if (multi) {
                        setSelectedItemIds(prev => 
                          prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                        );
                      } else {
                        setSelectedItemIds([id]);
                      }
                    }
                  }}
                  onUpdate={updateItem}
                  onUpdateMultiple={(updates, saveToHistory) => {
                    // Update multiple items at once
                    setItems(prev => prev.map(i => {
                      const update = updates.find(u => u.id === i.id);
                      return update ? { ...i, ...update.changes } : i;
                    }));
                    if (saveToHistory) {
                      pushHistory(items.map(i => {
                        const update = updates.find(u => u.id === i.id);
                        return update ? { ...i, ...update.changes } : i;
                      }));
                    }
                  }}
                  zoom={effectiveZoom}
                  snapEnabled={snapEnabled}
                  gridSize={GRID_SIZE}
                  allItems={items}
                  onShowGuides={setGuides}
                  boardSize={boardSize}
                  constrainToBounds={showBoardBounds}
                />
              ))}
              
              {/* Selection Box */}
              {selectionBox && (
                <div 
                  className="absolute border-2 border-primary bg-primary/10 z-50 pointer-events-none rounded"
                  style={{
                    left: selectionBox.x,
                    top: selectionBox.y,
                    width: selectionBox.width,
                    height: selectionBox.height
                  }}
                />
              )}
            </div>

            {/* Quick Toggle Buttons */}
            <div className="absolute bottom-20 left-6 flex flex-col gap-2 z-30">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon" 
                    variant={showGrid ? "default" : "outline"}
                    className={`shadow-lg ${showGrid ? 'bg-primary' : 'bg-white'}`}
                    onClick={() => setShowGrid(!showGrid)}
                  >
                    <Grid className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{showGrid ? 'הסתר גריד' : 'הצג גריד'}</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon" 
                    variant={snapEnabled ? "default" : "outline"}
                    className={`shadow-lg ${snapEnabled ? 'bg-primary' : 'bg-white'}`}
                    onClick={() => setSnapEnabled(!snapEnabled)}
                  >
                    <Layout className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{snapEnabled ? 'כבה Snap' : 'הפעל Snap'}</TooltipContent>
              </Tooltip>
              
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon" 
                    variant={showBoardBounds ? "default" : "outline"}
                    className={`shadow-lg ${showBoardBounds ? 'bg-primary' : 'bg-white'}`}
                    onClick={() => setShowBoardBounds(!showBoardBounds)}
                  >
                    <Square className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right">{showBoardBounds ? 'הסתר גבולות' : 'הצג גבולות'}</TooltipContent>
              </Tooltip>
            </div>

            {/* Zoom Controls */}
            <div className="absolute bottom-6 left-6 bg-white p-2 rounded-xl shadow-lg border border-slate-200 flex gap-1 z-30">
              <Button size="icon" variant="ghost" onClick={() => setZoom(z => Math.max(0.1, z - 0.1))}>
                <ZoomOut className="w-4 h-4" />
              </Button>
              <span className="w-14 text-center text-xs self-center font-mono">
                {Math.round(zoom * 100)}%
              </span>
              <Button size="icon" variant="ghost" onClick={() => setZoom(z => Math.min(5, z + 0.1))}>
                <ZoomIn className="w-4 h-4" />
              </Button>
              <div className="w-px h-6 bg-slate-200 mx-1 self-center" />
              <Button size="sm" variant="ghost" onClick={handleFitToBoard} title="התאם לגודל הלוח">
                <Maximize className="w-3 h-3 ml-1" />
                התאם
              </Button>
            </div>

            {/* Minimap */}
            {showMinimap && (
              <Minimap 
                items={items}
                zoom={zoom}
                pan={pan}
                containerSize={containerSize}
                onNavigate={setPan}
                settings={settings}
              />
            )}

            {/* Multi-Selection Info */}
            {selectedItemIds.length > 1 && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white px-4 py-2 rounded-full shadow-lg border border-slate-200 z-30 flex items-center gap-3">
                <span className="text-sm font-medium">{selectedItemIds.length} פריטים נבחרו</span>
                <div className="h-4 w-px bg-slate-200" />
                <button onClick={handleGroup} className="text-slate-500 hover:text-primary transition-colors" title="קבץ">
                  <Group className="w-4 h-4" />
                </button>
                <button onClick={duplicateSelected} className="text-slate-500 hover:text-primary transition-colors" title="שכפל">
                  <Copy className="w-4 h-4" />
                </button>
                <button onClick={deleteSelected} className="text-slate-500 hover:text-red-600 transition-colors" title="מחק">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════════════
              LEFT SIDEBAR - PROPERTIES & LAYERS
              ═══════════════════════════════════════════════════════════════════ */}
          <div className="w-80 bg-white border-r border-slate-200 z-20 flex flex-col shadow-sm">
            {/* Tabs */}
            <div className="flex border-b border-slate-100 shrink-0">
              <button 
                onClick={() => setActiveSidebarTab('properties')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeSidebarTab === 'properties' 
                    ? 'text-primary border-b-2 border-primary bg-primary/5' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                מאפיינים
              </button>
              <button 
                onClick={() => setActiveSidebarTab('layers')}
                className={`flex-1 py-3 text-sm font-medium transition-colors ${
                  activeSidebarTab === 'layers' 
                    ? 'text-primary border-b-2 border-primary bg-primary/5' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                שכבות
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {activeSidebarTab === 'properties' ? (
                <PropertiesPanelNew 
                  selectedItems={selectedItems}
                  onUpdate={updateItem}
                  onUpdateBatch={updateSelected}
                  onDelete={deleteSelected}
                  onDuplicate={duplicateSelected}
                  onBringToFront={bringToFront}
                  onSendToBack={sendToBack}
                  onBringForward={bringForward}
                  onSendBackward={sendBackward}
                  onGroup={handleGroup}
                  onUngroup={handleUngroup}
                  onToggleLock={toggleLock}
                  onAlignItems={alignItems}
                  onDistributeItems={distributeItems}
                />
              ) : (
                <LayersPanelNew 
                  items={items}
                  selectedIds={selectedItemIds}
                  onSelect={(id, multi) => {
                    if (multi) {
                      setSelectedItemIds(prev => 
                        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
                      );
                    } else {
                      setSelectedItemIds([id]);
                    }
                  }}
                  onToggleLock={toggleItemLock}
                  onToggleVisibility={toggleItemVisibility}
                  onReorder={handleReorderItems}
                  onDelete={deleteItems}
                  onDuplicate={duplicateItem}
                  onUngroup={handleUngroupItems}
                />
              )}
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════════
            FLOATING TOOLBAR
            ═══════════════════════════════════════════════════════════════════════ */}
        {selectedItems.length > 0 && (
          <FloatingToolbar
            selectedItems={selectedItems}
            canvasRef={canvasContainerRef}
            zoom={zoom}
            pan={pan}
            onCopy={handleCopy}
            onDelete={deleteSelected}
            onDuplicate={duplicateSelected}
            onToggleLock={toggleLock}
            onBringToFront={bringToFront}
            onSendToBack={sendToBack}
            onBringForward={bringForward}
            onSendBackward={sendBackward}
            onGroup={handleGroup}
            onUngroup={handleUngroup}
            onUpdateItems={updateItem}
            onAlignItems={alignItems}
            onDistributeItems={distributeItems}
            onToggleVisibility={toggleVisibility}
          />
        )}

        {/* ═══════════════════════════════════════════════════════════════════════
            CONTEXT MENU
            ═══════════════════════════════════════════════════════════════════════ */}
        <ContextMenu
          isOpen={contextMenu.isOpen}
          position={contextMenu.position}
          onClose={() => setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, targetItem: null })}
          targetItem={contextMenu.targetItem}
          selectedItems={selectedItems}
          clipboard={clipboard}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onDelete={deleteSelected}
          onDuplicate={duplicateSelected}
          onToggleLock={toggleLock}
          onBringToFront={bringToFront}
          onSendToBack={sendToBack}
          onBringForward={bringForward}
          onSendBackward={sendBackward}
          onGroup={handleGroup}
          onUngroup={handleUngroup}
          onToggleVisibility={toggleVisibility}
          onSelectAll={() => setSelectedItemIds(items.filter(i => !i.locked && !i.hidden).map(i => i.id))}
          onResetTransform={() => updateSelected({ rotation: 0 })}
          onAddItem={addItem}
        />
      </div>
    </TooltipProvider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORT WITH ERROR BOUNDARY & PORTAL
// ═══════════════════════════════════════════════════════════════════════════════
export default function MoodboardEditorV2(props) {
  return createPortal(
    <MoodboardErrorBoundary>
      <MoodboardEditorContent {...props} />
    </MoodboardErrorBoundary>,
    document.body
  );
}
