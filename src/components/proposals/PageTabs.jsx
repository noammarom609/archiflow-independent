import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  X,
  GripVertical,
  Copy,
  MoreVertical,
  FileText,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useLanguage } from '@/components/providers/LanguageProvider';

const MAX_PAGES = 20;

export default function PageTabs({
  pages,
  currentPageIndex,
  onPageSelect,
  onAddPage,
  t: tFromParent,
  onDeletePage,
  onDuplicatePage,
  onRenamePage,
  onReorderPages
}) {
  const [editingPageId, setEditingPageId] = React.useState(null);
  const [editingName, setEditingName] = React.useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [pageToDelete, setPageToDelete] = React.useState(null);
  const scrollRef = React.useRef(null);

  const handleStartRename = (page) => {
    setEditingPageId(page.id);
    setEditingName(page.name);
  };

  const handleFinishRename = () => {
    if (editingPageId && editingName.trim()) {
      onRenamePage(editingPageId, editingName.trim());
    }
    setEditingPageId(null);
    setEditingName('');
  };

  const handleDeleteClick = (page) => {
    if (pages.length === 1) return; // Don't allow deleting last page
    setPageToDelete(page);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (pageToDelete) {
      onDeletePage(pageToDelete.id);
    }
    setDeleteConfirmOpen(false);
    setPageToDelete(null);
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    onReorderPages(result.source.index, result.destination.index);
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -150, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 150, behavior: 'smooth' });
    }
  };

  return (
    <>
      <div className="bg-white border-b border-slate-200 flex items-center">
        {/* Scroll Left Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-8 shrink-0 rounded-none border-l"
          onClick={scrollLeft}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>

        {/* Tabs Container */}
        <div className="flex-1 overflow-hidden">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="pages" direction="horizontal">
              {(provided) => (
                <div
                  ref={(el) => {
                    provided.innerRef(el);
                    scrollRef.current = el;
                  }}
                  {...provided.droppableProps}
                  className="flex items-center overflow-x-auto scrollbar-hide"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  {pages.map((page, index) => (
                    <Draggable key={page.id} draggableId={page.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`
                            flex items-center gap-1 px-3 py-2 border-l border-slate-200 min-w-[120px] max-w-[180px]
                            cursor-pointer transition-colors shrink-0
                            ${currentPageIndex === index 
                              ? 'bg-indigo-50 border-b-2 border-b-indigo-600' 
                              : 'hover:bg-slate-50'
                            }
                            ${snapshot.isDragging ? 'shadow-lg bg-white z-50' : ''}
                          `}
                          onClick={() => onPageSelect(index)}
                        >
                          <div {...provided.dragHandleProps} className="cursor-grab">
                            <GripVertical className="w-3 h-3 text-slate-400" />
                          </div>
                          
                          <FileText className={`w-4 h-4 shrink-0 ${currentPageIndex === index ? 'text-indigo-600' : 'text-slate-400'}`} />
                          
                          {editingPageId === page.id ? (
                            <Input
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onBlur={handleFinishRename}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleFinishRename();
                                if (e.key === 'Escape') {
                                  setEditingPageId(null);
                                  setEditingName('');
                                }
                              }}
                              className="h-6 text-xs px-1 w-20"
                              autoFocus
                              onClick={(e) => e.stopPropagation()}
                            />
                          ) : (
                            <span 
                              className={`text-sm truncate ${currentPageIndex === index ? 'font-medium text-indigo-900' : 'text-slate-700'}`}
                              onDoubleClick={(e) => {
                                e.stopPropagation();
                                handleStartRename(page);
                              }}
                            >
                              {page.name}
                            </span>
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                              <Button variant="ghost" size="icon" className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100" aria-label={t('a11y.openMenu')} title={t('a11y.openMenu')}>
                                <MoreVertical className="w-3 h-3" aria-hidden />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                handleStartRename(page);
                              }}>
                                שנה שם
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => {
                                e.stopPropagation();
                                onDuplicatePage(page.id);
                              }}>
                                <Copy className="w-3 h-3 ml-2" />
                                שכפל דף
                              </DropdownMenuItem>
                              {pages.length > 1 && (
                                <DropdownMenuItem 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(page);
                                  }}
                                  className="text-red-600"
                                >
                                  <X className="w-3 h-3 ml-2" />
                                  מחק דף
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>

        {/* Scroll Right Button */}
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-8 shrink-0 rounded-none border-r"
          onClick={scrollRight}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        {/* Add Page Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={onAddPage}
          disabled={pages.length >= MAX_PAGES}
          className="h-10 px-4 rounded-none border-r gap-1 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
        >
          <Plus className="w-4 h-4" />
          <span className="text-xs">דף חדש</span>
        </Button>

        {/* Page Counter */}
        <div className="px-3 text-xs text-slate-500">
          {pages.length}/{MAX_PAGES}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>מחיקת דף</AlertDialogTitle>
            <AlertDialogDescription>
              האם אתה בטוח שברצונך למחוק את הדף "{pageToDelete?.name}"?
              פעולה זו לא ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              מחק
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}