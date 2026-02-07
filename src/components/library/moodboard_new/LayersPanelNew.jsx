import React, { useState, useRef } from 'react';
import { motion, Reorder, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, Lock, Unlock, Trash2, Copy, MoreVertical,
  Image as ImageIcon, Type, StickyNote, Square, Circle, Minus,
  Palette, ChevronDown, ChevronRight, Layers, GripVertical
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useLanguage } from '@/components/providers/LanguageProvider';

/**
 * LayersPanelNew - Advanced layers management with drag-to-reorder
 * Features:
 * - Drag to reorder layers
 * - Visual previews
 * - Lock/Visibility toggles
 * - Quick actions
 * - Group support
 */

// Icon mapping for item types
const getItemIcon = (type, metadata) => {
  switch (type) {
    case 'image': return ImageIcon;
    case 'text': return Type;
    case 'note': return StickyNote;
    case 'color': return Palette;
    case 'shape':
      const shape = metadata?.shape_type;
      if (shape === 'circle') return Circle;
      if (shape === 'line') return Minus;
      return Square;
    default: return Layers;
  }
};

// Get display name for item
const getItemName = (item) => {
  switch (item.type) {
    case 'text': 
    case 'note':
      return item.content.slice(0, 20) + (item.content.length > 20 ? '...' : '');
    case 'image':
      return 'תמונה';
    case 'color':
      return item.content; // hex color
    case 'shape':
      const shapes = { rectangle: 'מלבן', circle: 'עיגול', line: 'קו' };
      return shapes[item.metadata?.shape_type] || 'צורה';
    default:
      return 'אלמנט';
  }
};

// Single Layer Item Component
function LayerItem({ 
  item, 
  isSelected, 
  onSelect, 
  onToggleLock, 
  onToggleVisibility, 
  onDelete,
  onDuplicate,
}) {
  const { t } = useLanguage();
  const Icon = getItemIcon(item.type, item.metadata);
  const isLocked = item.locked;
  const isHidden = item.hidden;
  
  return (
    <Reorder.Item
      value={item}
      id={item.id}
      className={`group relative flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-all ${
        isSelected 
          ? 'bg-primary/10 ring-1 ring-primary' 
          : 'hover:bg-slate-50'
      } ${isHidden ? 'opacity-50' : ''}`}
      onClick={(e) => onSelect(item.id, e.shiftKey || e.ctrlKey)}
      whileDrag={{ 
        scale: 1.02, 
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        backgroundColor: 'white',
        borderRadius: '8px',
      }}
    >
      {/* Drag Handle */}
      <div className="cursor-grab active:cursor-grabbing text-slate-300 hover:text-slate-500 transition-colors">
        <GripVertical className="w-4 h-4" />
      </div>
      
      {/* Preview Thumbnail */}
      <div 
        className="w-8 h-8 rounded flex items-center justify-center shrink-0 border border-slate-100"
        style={{
          backgroundColor: item.type === 'color' ? item.content : '#f8fafc',
        }}
      >
        {item.type === 'image' ? (
          <img 
            src={item.content} 
            alt="" 
            className="w-full h-full object-cover rounded" 
          />
        ) : item.type === 'color' ? null : (
          <Icon 
            className="w-4 h-4" 
            style={{ color: item.style?.color || '#64748b' }}
          />
        )}
      </div>
      
      {/* Name */}
      <span className={`flex-1 text-xs truncate ${isSelected ? 'font-medium' : ''}`}>
        {getItemName(item)}
      </span>
      
      {/* Quick Actions (visible on hover) */}
      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(item); }}
          aria-label={isHidden ? t('a11y.show') : t('a11y.hide')} title={isHidden ? t('a11y.show') : t('a11y.hide')}
        >
          {isHidden ? <EyeOff className="w-3 h-3" aria-hidden /> : <Eye className="w-3 h-3" aria-hidden />}
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={(e) => { e.stopPropagation(); onToggleLock(item); }}
          aria-label={isLocked ? t('a11y.unlock') : t('a11y.lock')} title={isLocked ? t('a11y.unlock') : t('a11y.lock')}
        >
          {isLocked ? <Lock className="w-3 h-3" aria-hidden /> : <Unlock className="w-3 h-3" aria-hidden />}
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={(e) => e.stopPropagation()}
              aria-label={t('a11y.openMenu')} title={t('a11y.openMenu')}
            >
              <MoreVertical className="w-3 h-3" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[120px]">
            <DropdownMenuItem onClick={() => onDuplicate(item)}>
              <Copy className="w-3 h-3 ml-2" /> שכפל
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onDelete(item)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="w-3 h-3 ml-2" /> מחק
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Status Indicators */}
      <div className="flex gap-1 shrink-0">
        {isLocked && (
          <Lock className="w-3 h-3 text-slate-400" />
        )}
      </div>
    </Reorder.Item>
  );
}

// Group Header Component
function GroupHeader({ groupId, items, isExpanded, onToggle, onUngroup }) {
  return (
    <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-100 rounded-lg cursor-pointer hover:bg-slate-150">
      <button onClick={onToggle} className="text-slate-500">
        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>
      <Layers className="w-4 h-4 text-slate-500" />
      <span className="flex-1 text-xs font-medium">קבוצה ({items.length})</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-6 text-xs"
        onClick={onUngroup}
      >
        פרק
      </Button>
    </div>
  );
}

export default function LayersPanelNew({
  items,
  selectedIds,
  onSelect,
  onToggleLock,
  onToggleVisibility,
  onReorder,
  onDelete,
  onDuplicate,
  onUngroup,
}) {
  const [expandedGroups, setExpandedGroups] = useState(new Set());
  
  // Sort items by z-index (highest first for visual layer order)
  const sortedItems = [...items].sort((a, b) => (b.position.z || 0) - (a.position.z || 0));
  
  // Group items by group_id
  const groupedItems = sortedItems.reduce((acc, item) => {
    const groupId = item.group_id || 'ungrouped';
    if (!acc[groupId]) acc[groupId] = [];
    acc[groupId].push(item);
    return acc;
  }, {});
  
  // Handle reorder
  const handleReorder = (newOrder) => {
    const updates = newOrder.map((item, index) => ({
      id: item.id,
      z: newOrder.length - index // Reverse index for z-order
    }));
    onReorder(updates);
  };
  
  const toggleGroup = (groupId) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">שכבות</h3>
        <span className="text-xs text-slate-400">{items.length} פריטים</span>
      </div>
      
      {/* Layers List */}
      <div className="flex-1 overflow-y-auto p-2">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-slate-400">
            <Layers className="w-8 h-8 mb-2 opacity-50" />
            <span className="text-xs">אין פריטים בלוח</span>
          </div>
        ) : (
          <Reorder.Group 
            axis="y" 
            values={sortedItems} 
            onReorder={handleReorder}
            className="space-y-1"
          >
            <AnimatePresence>
              {Object.entries(groupedItems).map(([groupId, groupItems]) => {
                if (groupId === 'ungrouped') {
                  // Render ungrouped items directly
                  return groupItems.map(item => (
                    <LayerItem
                      key={item.id}
                      item={item}
                      isSelected={selectedIds.includes(item.id)}
                      onSelect={onSelect}
                      onToggleLock={onToggleLock}
                      onToggleVisibility={onToggleVisibility}
                      onDelete={() => onDelete([item.id])}
                      onDuplicate={() => onDuplicate(item)}
                    />
                  ));
                }
                
                // Render group with header
                const isExpanded = expandedGroups.has(groupId);
                return (
                  <motion.div
                    key={groupId}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-1"
                  >
                    <GroupHeader
                      groupId={groupId}
                      items={groupItems}
                      isExpanded={isExpanded}
                      onToggle={() => toggleGroup(groupId)}
                      onUngroup={() => onUngroup(groupItems)}
                    />
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="pr-4 space-y-1"
                        >
                          {groupItems.map(item => (
                            <LayerItem
                              key={item.id}
                              item={item}
                              isSelected={selectedIds.includes(item.id)}
                              onSelect={onSelect}
                              onToggleLock={onToggleLock}
                              onToggleVisibility={onToggleVisibility}
                              onDelete={() => onDelete([item.id])}
                              onDuplicate={() => onDuplicate(item)}
                            />
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </Reorder.Group>
        )}
      </div>
      
      {/* Selection Info */}
      {selectedIds.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">{selectedIds.length} נבחרו</span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-6 text-xs"
                onClick={() => onDelete(selectedIds)}
              >
                <Trash2 className="w-3 h-3 ml-1" /> מחק
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

