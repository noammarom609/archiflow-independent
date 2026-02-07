import React, { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '@/components/providers/LanguageProvider';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  GripVertical,
  Eye,
  EyeOff,
  Copy,
  Trash2,
  Plus,
  Settings,
  Palette,
  Variable,
  FileText,
  Image,
  Users,
  List,
  DollarSign,
  FileCheck,
  MessageSquare,
  PenTool,
  ChevronDown,
  ChevronUp,
  Code,
  Type,
  Square,
  Columns,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Sparkles,
  Paintbrush,
  Upload,
  Loader2,
  Link,
  Lock,
  Unlock,
  Move,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid3X3
} from 'lucide-react';
import { archiflow } from '@/api/archiflow';
import PageTabs from './PageTabs';
import { AIGenerateButton, AIImageGenerator } from './AIContentGenerator';

// Available block types
const blockTypes = [
  { type: 'header', label: 'כותרת', icon: Image, category: 'layout' },
  { type: 'intro', label: 'פתיח', icon: MessageSquare, category: 'content' },
  { type: 'client_details', label: 'פרטי לקוח', icon: Users, category: 'content' },
  { type: 'services', label: 'פירוט שירותים', icon: List, category: 'content' },
  { type: 'pricing', label: 'טבלת מחירים', icon: DollarSign, category: 'content' },
  { type: 'terms', label: 'תנאים והערות', icon: FileCheck, category: 'content' },
  { type: 'summary', label: 'סיכום', icon: FileText, category: 'content' },
  { type: 'signature', label: 'חתימה', icon: PenTool, category: 'content' },
  { type: 'text_block', label: 'טקסט חופשי', icon: Type, category: 'custom' },
  { type: 'image_block', label: 'תמונה', icon: Image, category: 'custom' },
  { type: 'divider', label: 'קו מפריד', icon: Square, category: 'layout' },
  { type: 'spacer', label: 'רווח', icon: Columns, category: 'layout' },
];

const fontFamilies = [
  { value: 'Heebo', label: 'Heebo (עברית)' },
  { value: 'Assistant', label: 'Assistant' },
  { value: 'Rubik', label: 'Rubik' },
];

const colorPresets = [
  '#4338ca', '#7c3aed', '#db2777', '#dc2626', '#ea580c',
  '#ca8a04', '#16a34a', '#0891b2', '#2563eb', '#475569'
];

export default function UnifiedTemplateEditor({ template, onChange }) {
  const [expandedSection, setExpandedSection] = useState(null);
  const [activePanel, setActivePanel] = useState('sections');
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [previewScale, setPreviewScale] = useState(80);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [showGrid, setShowGrid] = useState(false);
  const [selectedFreeBlockId, setSelectedFreeBlockId] = useState(null);
  
  const canvasRef = useRef(null);

  // Pages management
  const pages = React.useMemo(() => {
    if (template.pages && template.pages.length > 0) {
      return template.pages;
    }
    
    // If sections are empty but we have items, generate default sections
    let sectionsToUse = template.sections || [];
    if (sectionsToUse.length === 0 && template.items && template.items.length > 0) {
        // Import defaultSections from ProposalTemplates if possible, but for now hardcode basic structure
        sectionsToUse = [
            { id: 'header', type: 'header', title: 'כותרת', visible: true, order: 0, content: { company_name: 'שם החברה', tagline: '', contact_info: '' } },
            { id: 'intro', type: 'intro', title: 'פתיח', visible: true, order: 1, content: { greeting: 'שלום {{ClientName}},', text: template.description || 'הצעת מחיר' } },
            { 
                id: 'pricing', 
                type: 'pricing', 
                title: 'פירוט מחירים', 
                visible: true, 
                order: 2, 
                content: { 
                    items: template.items.map(i => ({ description: i.title, quantity: i.quantity || 1, unit: 'יח\'', price: i.price || 0 })),
                    show_subtotal: true,
                    show_vat: true,
                    vat_percent: 17
                } 
            },
            { id: 'terms', type: 'terms', title: 'תנאים', visible: true, order: 3, content: { payment_terms: 'שוטף + 30', validity: '30 יום' } },
            { id: 'signature', type: 'signature', title: 'חתימה', visible: true, order: 4, content: { show_date: true, show_signature_line: true } }
        ];
    }

    return [{
      id: 'page_1',
      name: 'דף 1',
      order: 0,
      sections: sectionsToUse,
    }];
  }, [template.pages, template.sections, template.items, template.description]);

  const currentPage = pages[currentPageIndex] || pages[0];
  const currentSections = currentPage?.sections || [];

  // Update pages
  const updatePages = useCallback((newPages) => {
    onChange({ ...template, pages: newPages, sections: newPages[0]?.sections || [] });
  }, [template, onChange]);

  // Page management functions
  const handleAddPage = useCallback(() => {
    if (pages.length >= 20) return;
    const newPage = {
      id: `page_${Date.now()}`,
      name: `דף ${pages.length + 1}`,
      order: pages.length,
      sections: [],
    };
    updatePages([...pages, newPage]);
    setCurrentPageIndex(pages.length);
  }, [pages, updatePages]);

  const handleDeletePage = useCallback((pageId) => {
    if (pages.length <= 1) return;
    const pageIndex = pages.findIndex(p => p.id === pageId);
    const newPages = pages.filter(p => p.id !== pageId).map((p, idx) => ({ ...p, order: idx }));
    updatePages(newPages);
    if (currentPageIndex >= newPages.length) {
      setCurrentPageIndex(newPages.length - 1);
    }
  }, [pages, currentPageIndex, updatePages]);

  const handleDuplicatePage = useCallback((pageId) => {
    if (pages.length >= 20) return;
    const pageToDuplicate = pages.find(p => p.id === pageId);
    if (!pageToDuplicate) return;
    const newPage = {
      ...pageToDuplicate,
      id: `page_${Date.now()}`,
      name: `${pageToDuplicate.name} (העתק)`,
      order: pages.length,
      sections: pageToDuplicate.sections.map(s => ({ ...s, id: `${s.id}_${Date.now()}` }))
    };
    updatePages([...pages, newPage]);
    setCurrentPageIndex(pages.length);
  }, [pages, updatePages]);

  const handleRenamePage = useCallback((pageId, newName) => {
    const newPages = pages.map(p => p.id === pageId ? { ...p, name: newName } : p);
    updatePages(newPages);
  }, [pages, updatePages]);

  const handleReorderPages = useCallback((sourceIndex, destinationIndex) => {
    const newPages = [...pages];
    const [removed] = newPages.splice(sourceIndex, 1);
    newPages.splice(destinationIndex, 0, removed);
    updatePages(newPages.map((p, idx) => ({ ...p, order: idx })));
    if (currentPageIndex === sourceIndex) {
      setCurrentPageIndex(destinationIndex);
    }
  }, [pages, currentPageIndex, updatePages]);

  // Update sections for current page
  const updateCurrentPageSections = useCallback((newSections) => {
    const newPages = pages.map((p, idx) => 
      idx === currentPageIndex ? { ...p, sections: newSections } : p
    );
    updatePages(newPages);
  }, [pages, currentPageIndex, updatePages]);

  // Drag and drop for list order
  const handleDragEnd = useCallback((result) => {
    if (!result.destination) return;
    const sections = [...currentSections];
    const [removed] = sections.splice(result.source.index, 1);
    sections.splice(result.destination.index, 0, removed);
    updateCurrentPageSections(sections.map((s, idx) => ({ ...s, order: idx })));
  }, [currentSections, updateCurrentPageSections]);

  // Section operations
  const toggleSectionVisibility = useCallback((sectionId) => {
    const sections = currentSections.map(s =>
      s.id === sectionId ? { ...s, visible: !s.visible } : s
    );
    updateCurrentPageSections(sections);
  }, [currentSections, updateCurrentPageSections]);

  const toggleSectionFreeMode = useCallback((sectionId) => {
    const sections = currentSections.map(s => {
      if (s.id === sectionId) {
        const isFree = !s.freePosition;
        return {
          ...s,
          freePosition: isFree ? { x: 50, y: 50, width: 600, height: 150 } : null
        };
      }
      return s;
    });
    updateCurrentPageSections(sections);
    if (sections.find(s => s.id === sectionId)?.freePosition) {
      setSelectedFreeBlockId(sectionId);
    } else {
      setSelectedFreeBlockId(null);
    }
  }, [currentSections, updateCurrentPageSections]);

  const duplicateSection = useCallback((section) => {
    const newSection = {
      ...section,
      id: `${section.type}_${Date.now()}`,
      title: `${section.title} (העתק)`,
      order: currentSections.length,
      freePosition: section.freePosition ? {
        ...section.freePosition,
        x: (section.freePosition.x || 50) + 20,
        y: (section.freePosition.y || 50) + 20,
      } : null,
    };
    updateCurrentPageSections([...currentSections, newSection]);
  }, [currentSections, updateCurrentPageSections]);

  const deleteSection = useCallback((sectionId) => {
    updateCurrentPageSections(currentSections.filter(s => s.id !== sectionId));
    if (selectedFreeBlockId === sectionId) setSelectedFreeBlockId(null);
  }, [currentSections, updateCurrentPageSections, selectedFreeBlockId]);

  const updateSectionContent = useCallback((sectionId, content) => {
    const sections = currentSections.map(s =>
      s.id === sectionId ? { ...s, content: { ...s.content, ...content } } : s
    );
    updateCurrentPageSections(sections);
  }, [currentSections, updateCurrentPageSections]);

  const updateSectionStyling = useCallback((sectionId, styling) => {
    const sections = currentSections.map(s =>
      s.id === sectionId ? { ...s, styling: { ...s.styling, ...styling } } : s
    );
    updateCurrentPageSections(sections);
  }, [currentSections, updateCurrentPageSections]);

  const updateSectionTitle = useCallback((sectionId, title) => {
    const sections = currentSections.map(s =>
      s.id === sectionId ? { ...s, title } : s
    );
    updateCurrentPageSections(sections);
  }, [currentSections, updateCurrentPageSections]);

  const updateSectionFreePosition = useCallback((sectionId, position) => {
    const sections = currentSections.map(s =>
      s.id === sectionId ? { ...s, freePosition: { ...s.freePosition, ...position } } : s
    );
    updateCurrentPageSections(sections);
  }, [currentSections, updateCurrentPageSections]);

  // Add new block
  const addBlock = useCallback((blockType) => {
    const blockConfig = blockTypes.find(b => b.type === blockType);
    const newSection = {
      id: `${blockType}_${Date.now()}`,
      type: blockType,
      title: blockConfig?.label || 'בלוק חדש',
      visible: true,
      order: currentSections.length,
      content: getDefaultContent(blockType),
      styling: getDefaultStyling(blockType),
      freePosition: null, // Starts in list mode
    };
    updateCurrentPageSections([...currentSections, newSection]);
    setShowAddBlock(false);
  }, [currentSections, updateCurrentPageSections]);

  // Global styling
  const updateGlobalStyling = useCallback((styling) => {
    onChange({ ...template, styling: { ...template.styling, ...styling } });
  }, [template, onChange]);

  // Separate blocks into list and free
  const listBlocks = currentSections.filter(s => !s.freePosition).sort((a, b) => a.order - b.order);
  const freeBlocks = currentSections.filter(s => s.freePosition);

  return (
    <div className="h-full flex flex-col">
      {/* Page Tabs */}
      <PageTabs
        pages={pages}
        currentPageIndex={currentPageIndex}
        onPageSelect={setCurrentPageIndex}
        onAddPage={handleAddPage}
        onDeletePage={handleDeletePage}
        onDuplicatePage={handleDuplicatePage}
        onRenamePage={handleRenamePage}
        onReorderPages={handleReorderPages}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Blocks List */}
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">בלוקים - {currentPage?.name}</h3>
                <p className="text-xs text-slate-500">גרור לשינוי סדר | לחץ על 🔓 לגרירה חופשית</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setShowAddBlock(true)} className="h-8">
                <Plus className="w-3.5 h-3.5 ml-1" />
                הוסף
              </Button>
            </div>
          </div>

          {/* Add Block Modal */}
          <AnimatePresence>
            {showAddBlock && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="border-b border-slate-100 overflow-hidden"
              >
                <div className="p-4 bg-slate-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-sm text-slate-900">הוסף בלוק חדש</h4>
                    <Button size="sm" variant="ghost" onClick={() => setShowAddBlock(false)} className="h-6 w-6 p-0">×</Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {blockTypes.map((block) => {
                      const Icon = block.icon;
                      return (
                        <button
                          key={block.type}
                          onClick={() => addBlock(block.type)}
                          className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-right"
                        >
                          <Icon className="w-4 h-4 text-slate-500" />
                          <span className="text-xs text-slate-700">{block.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ScrollArea className="flex-1">
            <DragDropContext onDragEnd={handleDragEnd}>
              <Droppable droppableId="sections">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="p-3 space-y-2">
                    {/* List Blocks */}
                    {listBlocks.map((section, index) => (
                      <BlockListItem
                        key={section.id}
                        section={section}
                        index={index}
                        isExpanded={expandedSection === section.id}
                        onExpand={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                        onToggleVisibility={() => toggleSectionVisibility(section.id)}
                        onToggleFreeMode={() => toggleSectionFreeMode(section.id)}
                        onDuplicate={() => duplicateSection(section)}
                        onDelete={() => deleteSection(section.id)}
                        onUpdateContent={(content) => updateSectionContent(section.id, content)}
                        onUpdateStyling={(styling) => updateSectionStyling(section.id, styling)}
                        onUpdateTitle={(title) => updateSectionTitle(section.id, title)}
                        globalStyling={template.styling}
                      />
                    ))}
                    {provided.placeholder}
                    
                    {/* Free Blocks Section */}
                    {freeBlocks.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <div className="flex items-center gap-2 mb-2 px-1">
                          <Move className="w-4 h-4 text-indigo-500" />
                          <span className="text-xs font-medium text-slate-600">בלוקים בגרירה חופשית</span>
                        </div>
                        {freeBlocks.map((section) => (
                          <FreeBlockListItem
                            key={section.id}
                            section={section}
                            isSelected={selectedFreeBlockId === section.id}
                            onSelect={() => setSelectedFreeBlockId(section.id)}
                            onToggleFreeMode={() => toggleSectionFreeMode(section.id)}
                            onDelete={() => deleteSection(section.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          </ScrollArea>
        </div>

        {/* Center - Live Preview */}
        <div className="flex-1 bg-slate-100 flex flex-col overflow-hidden">
          {/* Preview Controls */}
          <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant={showGrid ? 'default' : 'outline'}
                size="sm"
                className="h-8"
                onClick={() => setShowGrid(!showGrid)}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500">זום:</span>
                <Slider
                  value={[previewScale]}
                  onValueChange={([val]) => setPreviewScale(val)}
                  min={50}
                  max={120}
                  step={10}
                  className="w-24"
                />
                <span className="text-sm text-slate-700 w-10">{previewScale}%</span>
              </div>
            </div>
            <Badge variant="outline" className="text-xs">
              <Sparkles className="w-3 h-3 ml-1" />
              תצוגה מקדימה בזמן אמת
            </Badge>
          </div>

          {/* Preview Area */}
          <div className="flex-1 p-8 overflow-auto">
            <div 
              ref={canvasRef}
              className="mx-auto transition-transform origin-top relative"
              style={{ 
                transform: `scale(${previewScale / 100})`,
                width: '800px',
              }}
            >
              <UnifiedPreview
                template={template}
                listBlocks={listBlocks}
                freeBlocks={freeBlocks}
                showGrid={showGrid}
                selectedFreeBlockId={selectedFreeBlockId}
                onSelectFreeBlock={setSelectedFreeBlockId}
                onUpdateFreePosition={updateSectionFreePosition}
                scale={previewScale / 100}
              />
            </div>
          </div>
        </div>

        {/* Right Panel - Global Settings */}
        <GlobalSettingsPanel
          template={template}
          onChange={onChange}
          activePanel={activePanel}
          setActivePanel={setActivePanel}
          updateGlobalStyling={updateGlobalStyling}
        />
      </div>
    </div>
  );
}

// Block List Item Component
function BlockListItem({
  section,
  index,
  isExpanded,
  onExpand,
  onToggleVisibility,
  onToggleFreeMode,
  onDuplicate,
  onDelete,
  onUpdateContent,
  onUpdateStyling,
  onUpdateTitle,
  globalStyling,
}) {
  const { t } = useLanguage();
  const blockConfig = blockTypes.find(b => b.type === section.type);
  const Icon = blockConfig?.icon || FileText;

  return (
    <Draggable draggableId={section.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`rounded-xl border transition-all ${
            snapshot.isDragging
              ? 'shadow-lg border-indigo-300 bg-indigo-50'
              : section.visible
              ? 'border-slate-200 bg-white'
              : 'border-slate-100 bg-slate-50 opacity-60'
          }`}
        >
          <div className="flex items-center gap-2 p-3">
            <div {...provided.dragHandleProps} className="cursor-grab">
              <GripVertical className="w-4 h-4 text-slate-400" />
            </div>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${section.visible ? 'bg-indigo-100' : 'bg-slate-100'}`}>
              <Icon className={`w-4 h-4 ${section.visible ? 'text-indigo-600' : 'text-slate-400'}`} />
            </div>
            <div className="flex-1 min-w-0">
              <Input
                value={section.title}
                onChange={(e) => onUpdateTitle(e.target.value)}
                className="h-7 text-sm font-medium border-0 p-0 focus-visible:ring-0"
              />
            </div>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={onToggleFreeMode}
                title={t('a11y.freeDrag')}
                aria-label={t('a11y.freeDrag')}
              >
                <Unlock className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-500" aria-hidden />
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onToggleVisibility} aria-label={t('a11y.toggleVisibility')} aria-pressed={section.visible}>
                {section.visible ? <Eye className="w-3.5 h-3.5 text-slate-500" aria-hidden /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" aria-hidden />}
              </Button>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={onExpand} aria-label={t('a11y.toggleExpand')} aria-pressed={isExpanded}>
                {isExpanded ? <ChevronUp className="w-3.5 h-3.5" aria-hidden /> : <ChevronDown className="w-3.5 h-3.5" aria-hidden />}
              </Button>
            </div>
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="px-3 pb-3 pt-1 border-t border-slate-100">
                  <Tabs defaultValue="content" className="w-full">
                    <TabsList className="w-full h-8 mb-3">
                      <TabsTrigger value="content" className="flex-1 text-xs h-7">תוכן</TabsTrigger>
                      <TabsTrigger value="style" className="flex-1 text-xs h-7">עיצוב</TabsTrigger>
                    </TabsList>
                    <TabsContent value="content" className="mt-0">
                      <BlockContentEditor section={section} onUpdate={onUpdateContent} />
                    </TabsContent>
                    <TabsContent value="style" className="mt-0">
                      <BlockStyleEditor section={section} globalStyling={globalStyling} onUpdate={onUpdateStyling} />
                    </TabsContent>
                  </Tabs>
                  <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                    <Button size="sm" variant="ghost" className="text-xs h-7" onClick={onDuplicate}>
                      <Copy className="w-3 h-3 ml-1" />שכפל
                    </Button>
                    <Button size="sm" variant="ghost" className="text-xs h-7 text-red-600 hover:bg-red-50" onClick={onDelete}>
                      <Trash2 className="w-3 h-3 ml-1" />מחק
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </Draggable>
  );
}

// Free Block List Item
function FreeBlockListItem({ section, isSelected, onSelect, onToggleFreeMode, onDelete }) {
  const { t } = useLanguage();
  const blockConfig = blockTypes.find(b => b.type === section.type);
  const Icon = blockConfig?.icon || FileText;

  return (
    <div
      onClick={onSelect}
      className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${
        isSelected ? 'bg-indigo-100 border border-indigo-300' : 'bg-slate-50 border border-slate-200 hover:bg-slate-100'
      }`}
    >
      <Move className="w-3.5 h-3.5 text-indigo-500" />
      <Icon className="w-4 h-4 text-slate-500" />
      <span className="text-xs text-slate-700 flex-1">{section.title}</span>
      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={(e) => { e.stopPropagation(); onToggleFreeMode(); }} title={t('a11y.backToList')} aria-label={t('a11y.lock')}>
        <Lock className="w-3 h-3 text-slate-400" aria-hidden />
      </Button>
      <Button size="icon" variant="ghost" className="h-6 w-6 text-red-500" onClick={(e) => { e.stopPropagation(); onDelete(); }} aria-label={t('a11y.delete')}>
        <Trash2 className="w-3 h-3" aria-hidden />
      </Button>
    </div>
  );
}

// Unified Preview Component
function UnifiedPreview({
  template,
  listBlocks,
  freeBlocks,
  showGrid,
  selectedFreeBlockId,
  onSelectFreeBlock,
  onUpdateFreePosition,
  scale,
}) {
  const styling = template.styling || {};
  const primaryColor = styling.primary_color || '#4338ca';

  return (
    <div
      className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden relative"
      style={{ 
        backgroundColor: styling.background_color || '#ffffff',
        fontFamily: styling.font_family || 'Heebo',
        minHeight: '1100px',
      }}
      onClick={() => onSelectFreeBlock(null)}
    >
      {/* Grid */}
      {showGrid && (
        <div 
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: 'linear-gradient(to right, #cbd5e1 1px, transparent 1px), linear-gradient(to bottom, #cbd5e1 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />
      )}

      {/* Custom CSS */}
      {styling.custom_css && <style dangerouslySetInnerHTML={{ __html: styling.custom_css }} />}

      {/* List Blocks - Rendered in order */}
      <div className="relative z-10">
        {listBlocks.filter(s => s.visible).map((section) => (
          <SectionPreview key={section.id} section={section} styling={styling} />
        ))}
      </div>

      {/* Free Blocks - Absolute positioned */}
      {freeBlocks.filter(s => s.visible).map((section) => (
        <DraggableFreeBlock
          key={section.id}
          section={section}
          styling={styling}
          isSelected={selectedFreeBlockId === section.id}
          onSelect={() => onSelectFreeBlock(section.id)}
          onUpdatePosition={(pos) => onUpdateFreePosition(section.id, pos)}
          scale={scale}
        />
      ))}
    </div>
  );
}

// Draggable Free Block
function DraggableFreeBlock({ section, styling, isSelected, onSelect, onUpdatePosition, scale }) {
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementStart, setElementStart] = useState({ x: 0, y: 0, width: 0, height: 0 });

  const pos = section.freePosition || { x: 50, y: 50, width: 600, height: 150 };

  const handleMouseDown = (e) => {
    if (e.target.closest('.resize-handle')) return;
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setElementStart({ ...pos });
  };

  const handleResizeMouseDown = (e) => {
    e.stopPropagation();
    onSelect();
    setIsResizing(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setElementStart({ ...pos });
  };

  useEffect(() => {
    if (!isDragging && !isResizing) return;

    const handleMouseMove = (e) => {
      const deltaX = (e.clientX - dragStart.x) / scale;
      const deltaY = (e.clientY - dragStart.y) / scale;

      if (isDragging) {
        onUpdatePosition({
          x: Math.max(0, elementStart.x + deltaX),
          y: Math.max(0, elementStart.y + deltaY),
        });
      } else if (isResizing) {
        onUpdatePosition({
          width: Math.max(100, elementStart.width + deltaX),
          height: Math.max(50, elementStart.height + deltaY),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, elementStart, scale, onUpdatePosition]);

  return (
    <div
      className={`absolute cursor-move ${isSelected ? 'ring-2 ring-indigo-500 ring-offset-2' : ''}`}
      style={{
        left: pos.x,
        top: pos.y,
        width: pos.width,
        height: pos.height,
        zIndex: isSelected ? 100 : 50,
      }}
      onMouseDown={handleMouseDown}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
    >
      <div className="w-full h-full bg-white rounded-lg shadow-lg border border-slate-200 overflow-hidden">
        <SectionPreview section={section} styling={styling} isCompact />
      </div>

      {isSelected && (
        <>
          <div
            className="resize-handle absolute -bottom-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full cursor-se-resize"
            onMouseDown={handleResizeMouseDown}
          />
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs px-2 py-1 rounded">
            {Math.round(pos.width)} × {Math.round(pos.height)}
          </div>
        </>
      )}
    </div>
  );
}

// Section Preview (supports both list and free modes)
function SectionPreview({ section, styling, isCompact = false }) {
  const primaryColor = styling?.primary_color || '#4338ca';
  const sectionStyling = section.styling || {};
  const sectionSpacing = isCompact ? 16 : (styling?.section_spacing || 24);

  const sectionStyle = {
    background: sectionStyling.background || 'transparent',
    padding: isCompact ? 12 : sectionSpacing,
    textAlign: sectionStyling.text_align || 'right',
  };

  switch (section.type) {
    case 'header':
      return (
        <div style={{ ...sectionStyle, borderBottom: `4px solid ${primaryColor}` }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {section.content?.logo_url && (
                <img src={section.content.logo_url} alt="Logo" className="h-12 w-auto object-contain" />
              )}
              <div>
                <h1 className={`font-bold ${isCompact ? 'text-lg' : 'text-2xl'}`} style={{ color: primaryColor }}>
                  {section.content?.company_name || 'שם החברה'}
                </h1>
                {section.content?.tagline && <p className="text-slate-600 mt-1">{section.content.tagline}</p>}
              </div>
            </div>
            <div className="text-sm text-slate-500 text-left whitespace-pre-wrap">{section.content?.contact_info || 'פרטי קשר'}</div>
          </div>
        </div>
      );

    case 'intro':
      return (
        <div style={sectionStyle}>
          <p className="text-lg font-medium text-slate-900 mb-2">{section.content?.greeting || 'שלום,'}</p>
          <div className="text-slate-600 whitespace-pre-wrap">{section.content?.text || 'טקסט פתיחה...'}</div>
        </div>
      );

    case 'pricing':
      const items = section.content?.items || [];
      const showSubtotal = section.content?.show_subtotal !== false;
      const showVat = section.content?.show_vat !== false;
      const vatPercent = section.content?.vat_percent || 17;
      
      const subtotal = items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.price || 0)), 0);
      const vatAmount = (subtotal * vatPercent) / 100;
      const total = subtotal + vatAmount;

      return (
        <div style={sectionStyle}>
          <h3 className="font-semibold text-slate-900 mb-4">{section.title}</h3>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr style={{ backgroundColor: primaryColor }}>
                <th className="text-right py-2 px-3 text-white first:rounded-tr-lg last:rounded-tl-lg">תיאור</th>
                <th className="text-center py-2 px-2 text-white w-20">כמות</th>
                <th className="text-center py-2 px-2 text-white w-24">מחיר</th>
                <th className="text-left py-2 px-3 text-white last:rounded-tl-lg w-24">סה"כ</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr className="border-b border-slate-100">
                  <td colSpan="4" className="py-4 text-center text-slate-400 italic">אין סעיפים להצגה</td>
                </tr>
              ) : (
                items.map((item, idx) => (
                  <tr key={idx} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 px-3">{item.description || 'ללא תיאור'}</td>
                    <td className="py-2 text-center">{item.quantity || 0}</td>
                    <td className="py-2 text-center">₪{(item.price || 0).toLocaleString()}</td>
                    <td className="py-2 px-3 text-left font-medium">₪{((item.quantity || 0) * (item.price || 0)).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
            {(showSubtotal || showVat) && (
              <tfoot>
                {showSubtotal && (
                  <tr>
                    <td colSpan="3" className="pt-4 pb-1 text-left pl-4 font-medium text-slate-600">סכום ביניים:</td>
                    <td className="pt-4 pb-1 text-left px-3">₪{subtotal.toLocaleString()}</td>
                  </tr>
                )}
                {showVat && (
                  <tr>
                    <td colSpan="3" className="py-1 text-left pl-4 font-medium text-slate-600">מע"מ ({vatPercent}%):</td>
                    <td className="py-1 text-left px-3">₪{vatAmount.toLocaleString()}</td>
                  </tr>
                )}
                <tr>
                  <td colSpan="3" className="pt-2 text-left pl-4 font-bold text-slate-900">סה"כ לתשלום:</td>
                  <td className="pt-2 text-left px-3 font-bold" style={{ color: primaryColor }}>₪{total.toLocaleString()}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      );

    case 'signature':
      return (
        <div style={{ ...sectionStyle, borderTop: '1px solid #e2e8f0' }}>
          <div className="flex justify-between items-end">
            {section.content?.show_date !== false && (
              <div>
                <p className="text-sm text-slate-500 mb-1">תאריך</p>
                <p className="text-slate-700">{new Date().toLocaleDateString('he-IL')}</p>
              </div>
            )}
            {section.content?.show_signature_line !== false && (
              <div className="text-center">
                <div className="w-48 border-b-2 border-slate-300 mb-2" />
                <p className="text-sm text-slate-500">{section.content?.signature_label || 'חתימה'}</p>
              </div>
            )}
          </div>
        </div>
      );

    case 'text_block':
      return (
        <div style={sectionStyle}>
          <p className="text-slate-600 whitespace-pre-wrap">{section.content?.text || 'טקסט חופשי...'}</p>
        </div>
      );

    case 'divider':
      return (
        <div style={sectionStyle}>
          <hr className="border-slate-200" style={{ borderStyle: section.content?.style || 'solid' }} />
        </div>
      );

    case 'spacer':
      return <div style={{ height: section.content?.height || 24 }} />;

    case 'terms':
      return (
        <div style={sectionStyle}>
          <h3 className="font-semibold text-slate-900 mb-3">{section.title}</h3>
          <div className="space-y-2 text-sm text-slate-600">
            {section.content?.payment_terms && (
              <div className="flex gap-2">
                <span className="font-medium text-slate-800">תנאי תשלום:</span>
                <span>{section.content.payment_terms}</span>
              </div>
            )}
            {section.content?.validity && (
              <div className="flex gap-2">
                <span className="font-medium text-slate-800">תוקף ההצעה:</span>
                <span>{section.content.validity}</span>
              </div>
            )}
            {section.content?.notes && (
              <div className="mt-2 pt-2 border-t border-slate-100 whitespace-pre-wrap">
                {section.content.notes}
              </div>
            )}
          </div>
        </div>
      );

    case 'services':
      return (
        <div style={sectionStyle}>
          <h3 className="font-semibold text-slate-900 mb-2">{section.title}</h3>
          <div className="text-slate-600 whitespace-pre-wrap">{section.content?.description || 'תיאור השירותים...'}</div>
        </div>
      );

    case 'client_details':
      return (
        <div style={sectionStyle}>
          <h3 className="font-semibold text-slate-900 mb-3">{section.title}</h3>
          <div className="space-y-1 text-sm text-slate-600">
            {section.content?.show_name !== false && <p><strong>שם:</strong> [שם הלקוח]</p>}
            {section.content?.show_email !== false && <p><strong>אימייל:</strong> [אימייל הלקוח]</p>}
            {section.content?.show_phone !== false && <p><strong>טלפון:</strong> [טלפון הלקוח]</p>}
            {section.content?.show_address !== false && <p><strong>כתובת:</strong> [כתובת הלקוח]</p>}
          </div>
        </div>
      );

    case 'summary':
      return (
        <div style={sectionStyle}>
          <h3 className="font-semibold text-slate-900 mb-2">{section.title}</h3>
          <div className="text-slate-600 whitespace-pre-wrap">{section.content?.text || 'סיכום...'}</div>
          {section.content?.cta_text && (
            <div className="mt-4">
              <span className="inline-block px-6 py-2 bg-slate-900 text-white rounded-lg font-medium">
                {section.content.cta_text}
              </span>
            </div>
          )}
        </div>
      );

    case 'image_block':
      return (
        <div style={sectionStyle}>
          {section.content?.image_url ? (
            <img 
              src={section.content.image_url} 
              alt={section.content.alt_text || ''} 
              className="max-w-full h-auto rounded-lg"
              style={{ maxHeight: '400px' }} 
            />
          ) : (
            <div className="w-full h-40 bg-slate-100 flex items-center justify-center text-slate-400 border-2 border-dashed border-slate-200 rounded-lg">
              <Image className="w-8 h-8" />
            </div>
          )}
        </div>
      );

    default:
      return (
        <div style={sectionStyle}>
          <h3 className="font-semibold text-slate-900 mb-2">{section.title}</h3>
          <p className="text-slate-500 text-sm">תוכן {section.type}</p>
        </div>
      );
  }
}

// Global Settings Panel
function GlobalSettingsPanel({ template, onChange, activePanel, setActivePanel, updateGlobalStyling }) {
  return (
    <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
      <Tabs value={activePanel} onValueChange={setActivePanel} className="flex-1 flex flex-col">
        <TabsList className="mx-4 mt-4 h-9">
          <TabsTrigger value="sections" className="flex-1 text-xs">
            <Settings className="w-3.5 h-3.5 ml-1" />כללי
          </TabsTrigger>
          <TabsTrigger value="styling" className="flex-1 text-xs">
            <Paintbrush className="w-3.5 h-3.5 ml-1" />עיצוב
          </TabsTrigger>
          <TabsTrigger value="css" className="flex-1 text-xs">
            <Code className="w-3.5 h-3.5 ml-1" />CSS
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="sections" className="p-4 space-y-4 mt-0">
            <div>
              <Label>שם התבנית</Label>
              <Input value={template.name} onChange={(e) => onChange({ ...template, name: e.target.value })} className="mt-1" />
            </div>
            <div>
              <Label>תיאור פנימי</Label>
              <Textarea value={template.description || ''} onChange={(e) => onChange({ ...template, description: e.target.value })} className="mt-1" placeholder="תיאור לשימוש פנימי..." />
            </div>
            <div className="flex items-center justify-between">
              <Label>תבנית ברירת מחדל</Label>
              <Switch checked={template.is_default || false} onCheckedChange={(checked) => onChange({ ...template, is_default: checked })} />
            </div>
            <div>
              <Label>סטטוס</Label>
              <div className="flex gap-2 mt-2">
                {['draft', 'active', 'archived'].map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={template.status === status ? 'default' : 'outline'}
                    onClick={() => onChange({ ...template, status })}
                    className={template.status === status ? 'bg-indigo-600' : ''}
                  >
                    {status === 'draft' && 'טיוטה'}
                    {status === 'active' && 'פעילה'}
                    {status === 'archived' && 'ארכיון'}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="styling" className="p-4 space-y-4 mt-0">
            <div>
              <Label className="flex items-center gap-2 mb-2"><Palette className="w-4 h-4" />צבע ראשי</Label>
              <div className="flex gap-2 mb-2">
                <Input type="color" value={template.styling?.primary_color || '#4338ca'} onChange={(e) => updateGlobalStyling({ primary_color: e.target.value })} className="w-12 h-9 p-1" />
                <Input value={template.styling?.primary_color || '#4338ca'} onChange={(e) => updateGlobalStyling({ primary_color: e.target.value })} className="flex-1" />
              </div>
              <div className="flex flex-wrap gap-1">
                {colorPresets.map((color) => (
                  <button
                    key={color}
                    onClick={() => updateGlobalStyling({ primary_color: color })}
                    className={`w-6 h-6 rounded-md border-2 transition-all ${template.styling?.primary_color === color ? 'border-slate-900 scale-110' : 'border-transparent hover:scale-105'}`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-2 block">גופן</Label>
              <Select value={template.styling?.font_family || 'Heebo'} onValueChange={(val) => updateGlobalStyling({ font_family: val })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {fontFamilies.map((font) => (
                    <SelectItem key={font.value} value={font.value}>{font.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-2 block">צבע רקע</Label>
              <div className="flex gap-2">
                <Input type="color" value={template.styling?.background_color || '#ffffff'} onChange={(e) => updateGlobalStyling({ background_color: e.target.value })} className="w-12 h-9 p-1" />
                <Input value={template.styling?.background_color || '#ffffff'} onChange={(e) => updateGlobalStyling({ background_color: e.target.value })} className="flex-1" />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="css" className="p-4 mt-0">
            <Label className="flex items-center gap-2 mb-2"><Code className="w-4 h-4" />CSS מותאם אישית</Label>
            <Textarea
              value={template.styling?.custom_css || ''}
              onChange={(e) => updateGlobalStyling({ custom_css: e.target.value })}
              className="font-mono text-xs min-h-[300px]"
              placeholder="/* CSS מותאם אישית */"
            />
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}

// Block Content Editor
function BlockContentEditor({ section, onUpdate }) {
  switch (section.type) {
    case 'header':
      return (
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">שם החברה</Label>
              <AIGenerateButton fieldType="heading" onGenerate={(text) => onUpdate({ company_name: text })} />
            </div>
            <Input value={section.content?.company_name || ''} onChange={(e) => onUpdate({ company_name: e.target.value })} className="mt-1 h-8 text-sm" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">סלוגן</Label>
              <AIGenerateButton fieldType="heading" onGenerate={(text) => onUpdate({ tagline: text })} />
            </div>
            <Input value={section.content?.tagline || ''} onChange={(e) => onUpdate({ tagline: e.target.value })} className="mt-1 h-8 text-sm" />
          </div>
          <div><Label className="text-xs">פרטי קשר</Label><Input value={section.content?.contact_info || ''} onChange={(e) => onUpdate({ contact_info: e.target.value })} className="mt-1 h-8 text-sm" /></div>
        </div>
      );
    case 'intro':
      return (
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">ברכה</Label>
              <AIGenerateButton fieldType="intro" onGenerate={(text) => onUpdate({ greeting: text })} />
            </div>
            <Input value={section.content?.greeting || ''} onChange={(e) => onUpdate({ greeting: e.target.value })} className="mt-1 h-8 text-sm" placeholder="שלום {{ClientName}}," />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">טקסט פתיחה</Label>
              <AIGenerateButton fieldType="intro" onGenerate={(text) => onUpdate({ text: text })} />
            </div>
            <Textarea value={section.content?.text || ''} onChange={(e) => onUpdate({ text: e.target.value })} className="mt-1 text-sm min-h-[60px]" />
          </div>
        </div>
      );
    case 'services':
      return (
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">תיאור שירותים</Label>
              <AIGenerateButton fieldType="description" onGenerate={(text) => onUpdate({ description: text })} />
            </div>
            <Textarea value={section.content?.description || ''} onChange={(e) => onUpdate({ description: e.target.value })} className="mt-1 text-sm min-h-[80px]" placeholder="תאר את השירותים..." />
          </div>
        </div>
      );
    case 'terms':
      return (
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">תנאי תשלום</Label>
              <AIGenerateButton fieldType="terms" onGenerate={(text) => onUpdate({ payment_terms: text })} />
            </div>
            <Input value={section.content?.payment_terms || ''} onChange={(e) => onUpdate({ payment_terms: e.target.value })} className="mt-1 h-8 text-sm" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">תוקף ההצעה</Label>
              <AIGenerateButton fieldType="terms" onGenerate={(text) => onUpdate({ validity: text })} />
            </div>
            <Input value={section.content?.validity || ''} onChange={(e) => onUpdate({ validity: e.target.value })} className="mt-1 h-8 text-sm" />
          </div>
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">הערות נוספות</Label>
              <AIGenerateButton fieldType="terms" onGenerate={(text) => onUpdate({ notes: text })} />
            </div>
            <Textarea value={section.content?.notes || ''} onChange={(e) => onUpdate({ notes: e.target.value })} className="mt-1 text-sm min-h-[60px]" />
          </div>
        </div>
      );
    case 'summary':
      return (
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">טקסט סיכום</Label>
              <AIGenerateButton fieldType="summary" onGenerate={(text) => onUpdate({ text: text })} />
            </div>
            <Textarea value={section.content?.text || ''} onChange={(e) => onUpdate({ text: e.target.value })} className="mt-1 text-sm min-h-[60px]" />
          </div>
          <div><Label className="text-xs">טקסט כפתור</Label><Input value={section.content?.cta_text || ''} onChange={(e) => onUpdate({ cta_text: e.target.value })} className="mt-1 h-8 text-sm" /></div>
        </div>
      );
    case 'text_block':
      return (
        <div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">תוכן</Label>
            <AIGenerateButton fieldType="text" onGenerate={(text) => onUpdate({ text: text })} />
          </div>
          <Textarea value={section.content?.text || ''} onChange={(e) => onUpdate({ text: e.target.value })} className="mt-1 text-sm min-h-[100px]" placeholder="הזן טקסט חופשי..." />
        </div>
      );
    case 'image_block':
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">כתובת תמונה (URL)</Label>
            <Input value={section.content?.image_url || ''} onChange={(e) => onUpdate({ image_url: e.target.value })} className="mt-1 h-8 text-sm" placeholder="https://..." />
          </div>
          <div className="flex items-center gap-2">
            <AIImageGenerator 
              onImageGenerated={(url) => onUpdate({ image_url: url })} 
              currentImageUrl={section.content?.image_url}
            />
          </div>
          {section.content?.image_url && (
            <div className="rounded-lg overflow-hidden border border-slate-200">
              <img src={section.content.image_url} alt="" className="w-full h-24 object-cover" />
            </div>
          )}
          <div><Label className="text-xs">טקסט חלופי</Label><Input value={section.content?.alt_text || ''} onChange={(e) => onUpdate({ alt_text: e.target.value })} className="mt-1 h-8 text-sm" /></div>
        </div>
      );
    case 'signature':
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between"><Label className="text-xs">הצג תאריך</Label><Switch checked={section.content?.show_date !== false} onCheckedChange={(checked) => onUpdate({ show_date: checked })} /></div>
          <div className="flex items-center justify-between"><Label className="text-xs">הצג שורת חתימה</Label><Switch checked={section.content?.show_signature_line !== false} onCheckedChange={(checked) => onUpdate({ show_signature_line: checked })} /></div>
          <div><Label className="text-xs">תווית חתימה</Label><Input value={section.content?.signature_label || ''} onChange={(e) => onUpdate({ signature_label: e.target.value })} className="mt-1 h-8 text-sm" /></div>
        </div>
      );
    case 'client_details':
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between"><Label className="text-xs">הצג שם</Label><Switch checked={section.content?.show_name !== false} onCheckedChange={(checked) => onUpdate({ show_name: checked })} /></div>
          <div className="flex items-center justify-between"><Label className="text-xs">הצג אימייל</Label><Switch checked={section.content?.show_email !== false} onCheckedChange={(checked) => onUpdate({ show_email: checked })} /></div>
          <div className="flex items-center justify-between"><Label className="text-xs">הצג טלפון</Label><Switch checked={section.content?.show_phone !== false} onCheckedChange={(checked) => onUpdate({ show_phone: checked })} /></div>
          <div className="flex items-center justify-between"><Label className="text-xs">הצג כתובת</Label><Switch checked={section.content?.show_address !== false} onCheckedChange={(checked) => onUpdate({ show_address: checked })} /></div>
        </div>
      );
    case 'pricing':
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs font-semibold">סעיפי הצעת המחיר</Label>
            <div className="space-y-2">
              {(section.content?.items || []).map((item, idx) => (
                <div key={idx} className="flex flex-col gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200">
                  <Input 
                    placeholder="תיאור הסעיף"
                    value={item.description || ''} 
                    onChange={(e) => {
                      const newItems = [...(section.content?.items || [])];
                      newItems[idx] = { ...item, description: e.target.value };
                      onUpdate({ items: newItems });
                    }} 
                    className="h-7 text-sm"
                  />
                  <div className="flex gap-2">
                    <Input 
                      type="number" 
                      placeholder="כמות"
                      value={item.quantity || 1} 
                      onChange={(e) => {
                        const newItems = [...(section.content?.items || [])];
                        newItems[idx] = { ...item, quantity: parseFloat(e.target.value) || 0 };
                        onUpdate({ items: newItems });
                      }} 
                      className="h-7 text-sm flex-1"
                    />
                    <Input 
                      type="number" 
                      placeholder="מחיר"
                      value={item.price || 0} 
                      onChange={(e) => {
                        const newItems = [...(section.content?.items || [])];
                        newItems[idx] = { ...item, price: parseFloat(e.target.value) || 0 };
                        onUpdate({ items: newItems });
                      }} 
                      className="h-7 text-sm flex-1"
                    />
                    <Button 
                      size="icon" 
                      variant="ghost" 
                      className="h-7 w-7 text-red-500 hover:bg-red-50"
                      onClick={() => {
                        const newItems = [...(section.content?.items || [])].filter((_, i) => i !== idx);
                        onUpdate({ items: newItems });
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
              <Button 
                size="sm" 
                variant="outline" 
                className="w-full text-xs"
                onClick={() => {
                  const newItems = [...(section.content?.items || []), { description: 'סעיף חדש', quantity: 1, price: 0, unit: "יח'" }];
                  onUpdate({ items: newItems });
                }}
              >
                <Plus className="w-3 h-3 ml-1" />
                הוסף סעיף
              </Button>
            </div>
          </div>
          
          <div className="h-px bg-slate-100 my-2" />
          
          <div className="space-y-2">
            <div className="flex items-center justify-between"><Label className="text-xs">הצג סכום ביניים</Label><Switch checked={section.content?.show_subtotal !== false} onCheckedChange={(checked) => onUpdate({ show_subtotal: checked })} /></div>
            <div className="flex items-center justify-between"><Label className="text-xs">הצג מע"מ</Label><Switch checked={section.content?.show_vat !== false} onCheckedChange={(checked) => onUpdate({ show_vat: checked })} /></div>
            <div><Label className="text-xs">אחוז מע"מ</Label><Input type="number" value={section.content?.vat_percent || 17} onChange={(e) => onUpdate({ vat_percent: parseInt(e.target.value) || 17 })} className="mt-1 h-8 text-sm" /></div>
          </div>
        </div>
      );
    default:
      return <p className="text-xs text-slate-500">אין אפשרויות עריכה זמינות</p>;
  }
}

// Block Style Editor
function BlockStyleEditor({ section, globalStyling, onUpdate }) {
  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">רקע</Label>
        <div className="flex gap-2 mt-1">
          <Input type="color" value={section.styling?.background || '#ffffff'} onChange={(e) => onUpdate({ background: e.target.value })} className="w-10 h-8 p-1" />
          <Input value={section.styling?.background || ''} onChange={(e) => onUpdate({ background: e.target.value })} className="flex-1 h-8 text-sm" placeholder="transparent" />
        </div>
      </div>
      <div>
        <Label className="text-xs">יישור טקסט</Label>
        <div className="flex gap-1 mt-1">
          {[{ value: 'right', icon: AlignRight }, { value: 'center', icon: AlignCenter }, { value: 'left', icon: AlignLeft }].map(({ value, icon: Icon }) => (
            <Button key={value} size="sm" variant={section.styling?.text_align === value ? 'default' : 'outline'} onClick={() => onUpdate({ text_align: value })} className="flex-1 h-8">
              <Icon className="w-4 h-4" />
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper functions
function getDefaultContent(blockType) {
  const defaults = {
    header: { company_name: 'שם החברה', tagline: '', contact_info: '', logo_url: '' },
    intro: { greeting: 'שלום {{ClientName}},', text: '' },
    client_details: { show_name: true, show_email: true, show_phone: true, show_address: true },
    services: { description: '' },
    pricing: { items: [], show_subtotal: true, show_vat: true, vat_percent: 17 },
    terms: { payment_terms: '', validity: '', notes: '' },
    summary: { text: '', cta_text: '' },
    signature: { show_date: true, show_signature_line: true, signature_label: 'חתימה' },
    text_block: { text: '' },
    image_block: { image_url: '', alt_text: '' },
    divider: { style: 'solid' },
    spacer: { height: 24 },
  };
  return defaults[blockType] || {};
}

function getDefaultStyling(blockType) {
  return { background: 'transparent', text_align: 'right' };
}