import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy, Clipboard, Trash2, Lock, Unlock, Layers, ArrowUp, ArrowDown,
  Group, Ungroup, Eye, EyeOff, Edit3, Palette, RotateCcw, FlipHorizontal,
  ChevronRight, Sparkles
} from 'lucide-react';

/**
 * ContextMenu - Right-click menu for canvas and items
 */
export default function ContextMenu({
  isOpen,
  position,
  onClose,
  targetItem,
  selectedItems,
  clipboard,
  onCopy,
  onCut,
  onPaste,
  onDelete,
  onDuplicate,
  onToggleLock,
  onBringToFront,
  onSendToBack,
  onBringForward,
  onSendBackward,
  onGroup,
  onUngroup,
  onToggleVisibility,
  onEdit,
  onSelectAll,
  onResetTransform,
  onAddItem,
}) {
  const menuRef = useRef(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose();
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Adjust position to keep menu in viewport
  const adjustedPosition = { ...position };
  if (typeof window !== 'undefined' && menuRef.current) {
    const rect = menuRef.current.getBoundingClientRect();
    if (position.x + rect.width > window.innerWidth) {
      adjustedPosition.x = window.innerWidth - rect.width - 10;
    }
    if (position.y + rect.height > window.innerHeight) {
      adjustedPosition.y = window.innerHeight - rect.height - 10;
    }
  }

  const hasSelection = selectedItems.length > 0;
  const isMultiSelect = selectedItems.length > 1;
  const isLocked = selectedItems.every(item => item.locked);
  const hasGroup = selectedItems.some(item => item.group_id);
  const canEdit = targetItem && (targetItem.type === 'text' || targetItem.type === 'note');

  const MenuItem = ({ icon: Icon, label, onClick, disabled, danger, shortcut, children }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) {
          onClick?.();
          onClose();
        }
      }}
      disabled={disabled}
      className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors ${
        disabled 
          ? 'text-slate-300 cursor-not-allowed' 
          : danger 
            ? 'text-red-600 hover:bg-red-50' 
            : 'text-slate-700 hover:bg-slate-50'
      }`}
    >
      <span className="flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </span>
      {shortcut && <span className="text-xs text-slate-400">{shortcut}</span>}
      {children}
    </button>
  );

  const MenuDivider = () => <div className="h-px bg-slate-100 my-1" />;

  const SubMenu = ({ icon: Icon, label, children }) => {
    const [isSubOpen, setIsSubOpen] = React.useState(false);
    
    return (
      <div 
        className="relative"
        onMouseEnter={() => setIsSubOpen(true)}
        onMouseLeave={() => setIsSubOpen(false)}
      >
        <button className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
          <span className="flex items-center gap-2">
            {Icon && <Icon className="w-4 h-4" />}
            {label}
          </span>
          <ChevronRight className="w-4 h-4 text-slate-400" />
        </button>
        
        <AnimatePresence>
          {isSubOpen && (
            <motion.div
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -5 }}
              className="absolute left-full top-0 bg-white rounded-lg shadow-xl border border-slate-200 py-1 min-w-[160px] z-50"
            >
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={menuRef}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.1 }}
          className="fixed z-[2000] bg-white rounded-xl shadow-2xl border border-slate-200 py-1 min-w-[200px] overflow-hidden"
          style={{
            left: adjustedPosition.x,
            top: adjustedPosition.y,
          }}
        >
          {/* If right-clicking on item(s) */}
          {hasSelection ? (
            <>
              {/* Edit (for text) */}
              {canEdit && (
                <MenuItem icon={Edit3} label="ערוך טקסט" onClick={onEdit} />
              )}
              
              <MenuItem icon={Copy} label="העתק" onClick={onCopy} shortcut="Ctrl+C" />
              <MenuItem icon={Clipboard} label="שכפל" onClick={onDuplicate} shortcut="Ctrl+D" />
              
              <MenuDivider />
              
              {/* Layer Order */}
              <SubMenu icon={Layers} label="סדר שכבות">
                <MenuItem icon={ArrowUp} label="הבא לחזית" onClick={onBringToFront} />
                <MenuItem icon={ArrowUp} label="הזז קדימה" onClick={onBringForward} />
                <MenuItem icon={ArrowDown} label="הזז אחורה" onClick={onSendBackward} />
                <MenuItem icon={ArrowDown} label="שלח לרקע" onClick={onSendToBack} />
              </SubMenu>
              
              {/* Group/Ungroup */}
              {isMultiSelect && (
                hasGroup ? (
                  <MenuItem icon={Ungroup} label="פרק קבוצה" onClick={onUngroup} />
                ) : (
                  <MenuItem icon={Group} label="קבץ" onClick={onGroup} shortcut="Ctrl+G" />
                )
              )}
              
              <MenuDivider />
              
              {/* Lock */}
              <MenuItem 
                icon={isLocked ? Unlock : Lock} 
                label={isLocked ? 'בטל נעילה' : 'נעל'} 
                onClick={onToggleLock} 
              />
              
              {/* Hide */}
              <MenuItem icon={EyeOff} label="הסתר" onClick={onToggleVisibility} />
              
              {/* Reset Transform */}
              <MenuItem icon={RotateCcw} label="אפס סיבוב" onClick={onResetTransform} />
              
              <MenuDivider />
              
              {/* Effects */}
              <SubMenu icon={Sparkles} label="אפקטים">
                <MenuItem 
                  label="הוסף צל" 
                  onClick={() => {
                    selectedItems.forEach(item => {
                      onAddItem?.(item.id, { style: { ...item.style, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' } });
                    });
                  }} 
                />
                <MenuItem 
                  label="הסר צל" 
                  onClick={() => {
                    selectedItems.forEach(item => {
                      onAddItem?.(item.id, { style: { ...item.style, boxShadow: 'none' } });
                    });
                  }} 
                />
                <MenuDivider />
                <MenuItem 
                  label="פינות מעוגלות" 
                  onClick={() => {
                    selectedItems.forEach(item => {
                      onAddItem?.(item.id, { style: { ...item.style, borderRadius: '16px' } });
                    });
                  }} 
                />
              </SubMenu>
              
              <MenuDivider />
              
              {/* Delete */}
              <MenuItem icon={Trash2} label="מחק" onClick={onDelete} shortcut="Del" danger />
            </>
          ) : (
            /* Canvas context menu (no selection) */
            <>
              <MenuItem 
                icon={Clipboard} 
                label="הדבק" 
                onClick={onPaste} 
                disabled={!clipboard}
                shortcut="Ctrl+V" 
              />
              
              <MenuDivider />
              
              <MenuItem label="בחר הכל" onClick={onSelectAll} shortcut="Ctrl+A" />
              
              <MenuDivider />
              
              <SubMenu label="הוסף אלמנט">
                <MenuItem label="טקסט" onClick={() => onAddItem?.('text', 'טקסט חדש')} />
                <MenuItem label="פתקית" onClick={() => onAddItem?.('note', 'הערה...')} />
                <MenuItem label="מלבן" onClick={() => onAddItem?.('shape', '', { metadata: { shape_type: 'rectangle' } })} />
                <MenuItem label="עיגול" onClick={() => onAddItem?.('shape', '', { metadata: { shape_type: 'circle' } })} />
              </SubMenu>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

