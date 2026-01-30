import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  Eye, 
  EyeOff, 
  Lock, 
  Unlock, 
  GripVertical, 
  Image as ImageIcon, 
  Type, 
  Square, 
  StickyNote, 
  Palette, 
  Box, 
  ShoppingBag 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

const getItemIcon = (type) => {
  switch (type) {
    case 'image': return ImageIcon;
    case 'text': return Type;
    case 'shape': return Square;
    case 'note': return StickyNote;
    case 'color': return Palette;
    case 'material_card': return Box;
    case 'item_card': return ShoppingBag;
    default: return Square;
  }
};

const getItemLabel = (item) => {
  if (item.type === 'text' || item.type === 'note') {
    return item.content || 'טקסט ללא תוכן';
  }
  if (item.type === 'image') {
    return 'תמונה';
  }
  if (item.type === 'shape') {
    return item.metadata?.shape_type === 'circle' ? 'עיגול' : 
           item.metadata?.shape_type === 'line' ? 'קו' : 'מלבן';
  }
  return item.type;
};

export default function LayersPanel({ items, selectedIds, onSelect, onToggleLock, onToggleVisibility, onReorder }) {
  // We need items sorted by z-index descending (top first) for the list
  // But standard z-index 1 is bottom. 
  // Let's assume the passed 'items' are already sorted or we sort them here.
  // Actually, standard layer lists show TOP item at the TOP of the list.
  // So we should sort by z-index DESC.
  
  const sortedItems = [...items].sort((a, b) => (b.position.z || 0) - (a.position.z || 0));

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;

    // We are reordering the SORTED list.
    // sourceIndex is the index in the sorted list (0 is top z-index).
    // destinationIndex is the new index.
    
    const newItems = Array.from(sortedItems);
    const [reorderedItem] = newItems.splice(sourceIndex, 1);
    newItems.splice(destinationIndex, 0, reorderedItem);
    
    // Now we need to recalculate Z-indices for ALL items based on this new order.
    // The item at index 0 should have the highest z-index.
    // The item at index length-1 should have the lowest z-index.
    
    const updates = newItems.map((item, index) => ({
      id: item.id,
      z: newItems.length - index // Highest Z for lowest index
    }));
    
    onReorder(updates);
  };

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="p-4 border-b border-slate-100">
        <h3 className="font-bold text-slate-900">שכבות</h3>
      </div>
      
      <ScrollArea className="flex-1">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="layers-list">
            {(provided) => (
              <div 
                {...provided.droppableProps} 
                ref={provided.innerRef}
                className="p-2 space-y-1"
              >
                {sortedItems.map((item, index) => {
                  const Icon = getItemIcon(item.type);
                  const isSelected = selectedIds.includes(item.id);
                  
                  return (
                    <Draggable key={item.id} draggableId={item.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`
                            group flex items-center gap-2 p-2 rounded-lg text-sm transition-colors border border-transparent
                            ${isSelected ? 'bg-indigo-50 border-indigo-100' : 'hover:bg-slate-50'}
                            ${snapshot.isDragging ? 'shadow-lg bg-white ring-2 ring-indigo-500 z-50' : ''}
                          `}
                          onClick={(e) => onSelect(item.id, e.shiftKey)}
                        >
                          <div 
                            {...provided.dragHandleProps}
                            className="text-slate-400 cursor-grab hover:text-slate-600"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                          
                          <div className={`
                            w-8 h-8 rounded bg-slate-100 flex items-center justify-center text-slate-500
                            ${isSelected ? 'bg-indigo-100 text-indigo-600' : ''}
                          `}>
                            <Icon className="w-4 h-4" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className={`truncate font-medium ${isSelected ? 'text-indigo-900' : 'text-slate-700'}`}>
                              {getItemLabel(item)}
                            </p>
                          </div>
                          
                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => { e.stopPropagation(); onToggleLock(item); }}
                              className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600"
                              title={item.locked ? "שחרר נעילה" : "נעל"}
                            >
                              {item.locked ? <Lock className="w-3.5 h-3.5 text-red-500" /> : <Unlock className="w-3.5 h-3.5" />}
                            </button>
                            
                            <button
                              onClick={(e) => { e.stopPropagation(); onToggleVisibility(item); }}
                              className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600"
                              title={item.hidden ? "הצג" : "הסתר"}
                            >
                              {item.hidden ? <EyeOff className="w-3.5 h-3.5 text-slate-400" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </ScrollArea>
    </div>
  );
}