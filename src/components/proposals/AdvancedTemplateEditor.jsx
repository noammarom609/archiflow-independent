import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Bold,
  Italic,
  Underline,
  LayoutGrid,
  Sparkles,
  Paintbrush,
  Layers,
  Upload,
  Loader2,
  Link,
  FilePlus,
  MousePointer,
  Move
} from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PageTabs from './PageTabs';
import FreeformCanvas from './canvas/FreeformCanvas';
import ElementPropertiesPanel from './canvas/ElementPropertiesPanel';

// Available block types with metadata
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
  { type: 'columns', label: 'עמודות', icon: LayoutGrid, category: 'layout' },
];

const fontFamilies = [
  { value: 'Heebo', label: 'Heebo (עברית)' },
  { value: 'Assistant', label: 'Assistant' },
  { value: 'Rubik', label: 'Rubik' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Roboto', label: 'Roboto' },
];

const colorPresets = [
  '#4338ca', '#7c3aed', '#db2777', '#dc2626', '#ea580c',
  '#ca8a04', '#16a34a', '#0891b2', '#2563eb', '#475569'
];

export default function AdvancedTemplateEditor({ template, onChange }) {
  const [expandedSection, setExpandedSection] = useState(null);
  const [activePanel, setActivePanel] = useState('sections');
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [previewScale, setPreviewScale] = useState(100);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [editorMode, setEditorMode] = useState('blocks'); // 'blocks' | 'freeform'
  const [selectedElementId, setSelectedElementId] = useState(null);

  // Migrate old format (sections) to new format (pages) if needed
  const pages = React.useMemo(() => {
    if (template.pages && template.pages.length > 0) {
      return template.pages;
    }
    // Convert old format to new format
    return [{
      id: 'page_1',
      name: 'דף 1',
      order: 0,
      sections: template.sections || [],
      styling: {}
    }];
  }, [template.pages, template.sections]);

  const currentPage = pages[currentPageIndex] || pages[0];
  const currentSections = currentPage?.sections || [];

  // Update template with pages format
  const updatePages = useCallback((newPages) => {
    onChange({ ...template, pages: newPages, sections: newPages[0]?.sections || [] });
  }, [template, onChange]);

  // Add new page
  const handleAddPage = useCallback(() => {
    if (pages.length >= 20) return;
    const newPage = {
      id: `page_${Date.now()}`,
      name: `דף ${pages.length + 1}`,
      order: pages.length,
      sections: [],
      styling: {}
    };
    const newPages = [...pages, newPage];
    updatePages(newPages);
    setCurrentPageIndex(newPages.length - 1);
  }, [pages, updatePages]);

  // Delete page
  const handleDeletePage = useCallback((pageId) => {
    if (pages.length <= 1) return;
    const pageIndex = pages.findIndex(p => p.id === pageId);
    const newPages = pages.filter(p => p.id !== pageId).map((p, idx) => ({ ...p, order: idx }));
    updatePages(newPages);
    if (currentPageIndex >= newPages.length) {
      setCurrentPageIndex(newPages.length - 1);
    } else if (currentPageIndex > pageIndex) {
      setCurrentPageIndex(currentPageIndex - 1);
    }
  }, [pages, currentPageIndex, updatePages]);

  // Duplicate page
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
    const newPages = [...pages, newPage];
    updatePages(newPages);
    setCurrentPageIndex(newPages.length - 1);
  }, [pages, updatePages]);

  // Rename page
  const handleRenamePage = useCallback((pageId, newName) => {
    const newPages = pages.map(p => p.id === pageId ? { ...p, name: newName } : p);
    updatePages(newPages);
  }, [pages, updatePages]);

  // Reorder pages
  const handleReorderPages = useCallback((sourceIndex, destinationIndex) => {
    const newPages = [...pages];
    const [removed] = newPages.splice(sourceIndex, 1);
    newPages.splice(destinationIndex, 0, removed);
    const reorderedPages = newPages.map((p, idx) => ({ ...p, order: idx }));
    updatePages(reorderedPages);
    
    // Update current page index
    if (currentPageIndex === sourceIndex) {
      setCurrentPageIndex(destinationIndex);
    } else if (sourceIndex < currentPageIndex && destinationIndex >= currentPageIndex) {
      setCurrentPageIndex(currentPageIndex - 1);
    } else if (sourceIndex > currentPageIndex && destinationIndex <= currentPageIndex) {
      setCurrentPageIndex(currentPageIndex + 1);
    }
  }, [pages, currentPageIndex, updatePages]);

  // Freeform canvas - update elements
  const currentPageElements = currentPage?.elements || [];
  
  const handleElementsChange = useCallback((newElements) => {
    const newPages = pages.map((p, idx) => 
      idx === currentPageIndex ? { ...p, elements: newElements } : p
    );
    updatePages(newPages);
  }, [pages, currentPageIndex, updatePages]);

  const handleAddElement = useCallback((newElement) => {
    const newElements = [...currentPageElements, newElement];
    handleElementsChange(newElements);
  }, [currentPageElements, handleElementsChange]);

  const handleUpdateElement = useCallback((elementId, updates) => {
    const newElements = currentPageElements.map(el => 
      el.id === elementId ? { ...el, ...updates } : el
    );
    handleElementsChange(newElements);
  }, [currentPageElements, handleElementsChange]);

  const handleDeleteElement = useCallback((elementId) => {
    const newElements = currentPageElements.filter(el => el.id !== elementId);
    handleElementsChange(newElements);
    setSelectedElementId(null);
  }, [currentPageElements, handleElementsChange]);

  const handleDuplicateElement = useCallback((elementId) => {
    const element = currentPageElements.find(el => el.id === elementId);
    if (!element) return;
    const newElement = {
      ...element,
      id: `element_${Date.now()}`,
      x: (element.x || 0) + 20,
      y: (element.y || 0) + 20,
    };
    handleElementsChange([...currentPageElements, newElement]);
    setSelectedElementId(newElement.id);
  }, [currentPageElements, handleElementsChange]);

  const selectedElement = currentPageElements.find(el => el.id === selectedElementId);

  // Update sections for current page
  const updateCurrentPageSections = useCallback((newSections) => {
    const newPages = pages.map((p, idx) => 
      idx === currentPageIndex ? { ...p, sections: newSections } : p
    );
    updatePages(newPages);
  }, [pages, currentPageIndex, updatePages]);

  // Handle drag and drop reordering
  const handleDragEnd = useCallback((result) => {
    if (!result.destination) return;

    const sections = [...currentSections];
    const [removed] = sections.splice(result.source.index, 1);
    sections.splice(result.destination.index, 0, removed);

    const updatedSections = sections.map((s, idx) => ({ ...s, order: idx }));
    updateCurrentPageSections(updatedSections);
  }, [currentSections, updateCurrentPageSections]);

  // Toggle section visibility
  const toggleSectionVisibility = useCallback((sectionId) => {
    const sections = currentSections.map(s =>
      s.id === sectionId ? { ...s, visible: !s.visible } : s
    );
    updateCurrentPageSections(sections);
  }, [currentSections, updateCurrentPageSections]);

  // Duplicate section
  const duplicateSection = useCallback((section) => {
    const newSection = {
      ...section,
      id: `${section.type}_${Date.now()}`,
      title: `${section.title} (העתק)`,
      order: currentSections.length,
    };
    updateCurrentPageSections([...currentSections, newSection]);
  }, [currentSections, updateCurrentPageSections]);

  // Delete section
  const deleteSection = useCallback((sectionId) => {
    const sections = currentSections.filter(s => s.id !== sectionId);
    updateCurrentPageSections(sections);
  }, [currentSections, updateCurrentPageSections]);

  // Update section content
  const updateSectionContent = useCallback((sectionId, content) => {
    const sections = currentSections.map(s =>
      s.id === sectionId ? { ...s, content: { ...s.content, ...content } } : s
    );
    updateCurrentPageSections(sections);
  }, [currentSections, updateCurrentPageSections]);

  // Update section styling
  const updateSectionStyling = useCallback((sectionId, styling) => {
    const sections = currentSections.map(s =>
      s.id === sectionId ? { ...s, styling: { ...s.styling, ...styling } } : s
    );
    updateCurrentPageSections(sections);
  }, [currentSections, updateCurrentPageSections]);

  // Update section title
  const updateSectionTitle = useCallback((sectionId, title) => {
    const sections = currentSections.map(s =>
      s.id === sectionId ? { ...s, title } : s
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
    };
    updateCurrentPageSections([...currentSections, newSection]);
    setShowAddBlock(false);
  }, [currentSections, updateCurrentPageSections]);

  // Update global styling
  const updateGlobalStyling = useCallback((styling) => {
    onChange({
      ...template,
      styling: { ...template.styling, ...styling }
    });
  }, [template, onChange]);

  // Update custom CSS
  const updateCustomCSS = useCallback((css) => {
    onChange({
      ...template,
      styling: { ...template.styling, custom_css: css }
    });
  }, [template, onChange]);

  return (
    <div className="h-full flex flex-col">
      {/* Editor Mode Toggle + Page Tabs */}
      <div className="bg-white border-b border-slate-200 flex items-center justify-between px-4">
        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 my-2">
          <Button
            variant={editorMode === 'blocks' ? 'default' : 'ghost'}
            size="sm"
            className={`h-8 px-3 gap-1.5 ${editorMode === 'blocks' ? 'bg-white shadow-sm' : ''}`}
            onClick={() => setEditorMode('blocks')}
          >
            <LayoutGrid className="w-4 h-4" />
            בלוקים
          </Button>
          <Button
            variant={editorMode === 'freeform' ? 'default' : 'ghost'}
            size="sm"
            className={`h-8 px-3 gap-1.5 ${editorMode === 'freeform' ? 'bg-white shadow-sm' : ''}`}
            onClick={() => setEditorMode('freeform')}
          >
            <MousePointer className="w-4 h-4" />
            עיצוב חופשי
          </Button>
        </div>
        <Badge variant="outline" className="text-xs">
          <Sparkles className="w-3 h-3 ml-1" />
          {editorMode === 'freeform' ? 'מצב Canva' : 'מצב בלוקים'}
        </Badge>
      </div>

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
        {/* Freeform Mode */}
        {editorMode === 'freeform' ? (
          <>
            <FreeformCanvas
              elements={currentPageElements}
              onElementsChange={handleElementsChange}
              pageWidth={800}
              pageHeight={1100}
              styling={template.styling}
              onAddElement={handleAddElement}
            />
            <AnimatePresence>
              {selectedElement && (
                <ElementPropertiesPanel
                  element={selectedElement}
                  onUpdate={handleUpdateElement}
                  onDelete={handleDeleteElement}
                  onDuplicate={handleDuplicateElement}
                  onClose={() => setSelectedElementId(null)}
                />
              )}
            </AnimatePresence>
          </>
        ) : (
        <>
        {/* Left Panel - Blocks List */}
        <div className="w-80 bg-white border-l border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-slate-900">בלוקים - {currentPage?.name}</h3>
                <p className="text-xs text-slate-500">גרור לשינוי סדר</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowAddBlock(true)}
                className="h-8"
              >
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
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowAddBlock(false)}
                    className="h-6 w-6 p-0"
                  >
                    ×
                  </Button>
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
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="p-3 space-y-2"
                >
                  {currentSections
                    .sort((a, b) => a.order - b.order)
                    .map((section, index) => {
                      const blockConfig = blockTypes.find(b => b.type === section.type);
                      const Icon = blockConfig?.icon || FileText;
                      const isExpanded = expandedSection === section.id;

                      return (
                        <Draggable key={section.id} draggableId={section.id} index={index}>
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
                              {/* Section Header */}
                              <div className="flex items-center gap-2 p-3">
                                <div {...provided.dragHandleProps} className="cursor-grab">
                                  <GripVertical className="w-4 h-4 text-slate-400" />
                                </div>
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                  section.visible ? 'bg-indigo-100' : 'bg-slate-100'
                                }`}>
                                  <Icon className={`w-4 h-4 ${section.visible ? 'text-indigo-600' : 'text-slate-400'}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <Input
                                    value={section.title}
                                    onChange={(e) => updateSectionTitle(section.id, e.target.value)}
                                    className="h-7 text-sm font-medium border-0 p-0 focus-visible:ring-0"
                                  />
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => toggleSectionVisibility(section.id)}
                                  >
                                    {section.visible ? (
                                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                                    ) : (
                                      <EyeOff className="w-3.5 h-3.5 text-slate-400" />
                                    )}
                                  </Button>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7"
                                    onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="w-3.5 h-3.5 text-slate-500" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                                    )}
                                  </Button>
                                </div>
                              </div>

                              {/* Section Content Editor */}
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
                                          <TabsTrigger value="content" className="flex-1 text-xs h-7">
                                            תוכן
                                          </TabsTrigger>
                                          <TabsTrigger value="style" className="flex-1 text-xs h-7">
                                            עיצוב
                                          </TabsTrigger>
                                        </TabsList>
                                        <TabsContent value="content" className="mt-0">
                                          <BlockContentEditor
                                            section={section}
                                            onUpdate={(content) => updateSectionContent(section.id, content)}
                                          />
                                        </TabsContent>
                                        <TabsContent value="style" className="mt-0">
                                          <BlockStyleEditor
                                            section={section}
                                            globalStyling={template.styling}
                                            onUpdate={(styling) => updateSectionStyling(section.id, styling)}
                                          />
                                        </TabsContent>
                                      </Tabs>
                                      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="text-xs h-7"
                                          onClick={() => duplicateSection(section)}
                                        >
                                          <Copy className="w-3 h-3 ml-1" />
                                          שכפל
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="ghost"
                                          className="text-xs h-7 text-red-600 hover:text-red-700 hover:bg-red-50"
                                          onClick={() => deleteSection(section.id)}
                                        >
                                          <Trash2 className="w-3 h-3 ml-1" />
                                          מחק
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
                    })}
                  {provided.placeholder}
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
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">זום:</span>
            <Slider
              value={[previewScale]}
              onValueChange={([val]) => setPreviewScale(val)}
              min={50}
              max={150}
              step={10}
              className="w-32"
            />
            <span className="text-sm text-slate-700 w-10">{previewScale}%</span>
          </div>
          <Badge variant="outline" className="text-xs">
            <Sparkles className="w-3 h-3 ml-1" />
            תצוגה מקדימה בזמן אמת
          </Badge>
        </div>

        {/* Preview Area */}
        <div className="flex-1 p-8 overflow-auto">
          <div 
            className="mx-auto transition-transform origin-top"
            style={{ 
              transform: `scale(${previewScale / 100})`,
              width: '800px',
            }}
          >
            <LivePreview 
              template={template} 
              currentPageIndex={currentPageIndex}
              pages={pages}
            />
          </div>
        </div>
      </div>

      {/* Right Panel - Global Settings */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
        <Tabs value={activePanel} onValueChange={setActivePanel} className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-4 h-9">
            <TabsTrigger value="sections" className="flex-1 text-xs">
              <Settings className="w-3.5 h-3.5 ml-1" />
              כללי
            </TabsTrigger>
            <TabsTrigger value="styling" className="flex-1 text-xs">
              <Paintbrush className="w-3.5 h-3.5 ml-1" />
              עיצוב
            </TabsTrigger>
            <TabsTrigger value="css" className="flex-1 text-xs">
              <Code className="w-3.5 h-3.5 ml-1" />
              CSS
            </TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="sections" className="p-4 space-y-4 mt-0">
              <div>
                <Label>שם התבנית</Label>
                <Input
                  value={template.name}
                  onChange={(e) => onChange({ ...template, name: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label>תיאור פנימי</Label>
                <Textarea
                  value={template.description || ''}
                  onChange={(e) => onChange({ ...template, description: e.target.value })}
                  className="mt-1"
                  placeholder="תיאור לשימוש פנימי..."
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>תבנית ברירת מחדל</Label>
                <Switch
                  checked={template.is_default || false}
                  onCheckedChange={(checked) => onChange({ ...template, is_default: checked })}
                />
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

              {/* Variables */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <Label className="flex items-center gap-2">
                    <Variable className="w-4 h-4" />
                    משתנים דינמיים
                  </Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const variables = [
                        ...template.variables,
                        { key: `Custom${template.variables.length + 1}`, label: 'משתנה חדש', default_value: '' }
                      ];
                      onChange({ ...template, variables });
                    }}
                    className="h-7 text-xs"
                  >
                    <Plus className="w-3 h-3 ml-1" />
                    הוסף
                  </Button>
                </div>
                <p className="text-xs text-slate-500 mb-3">
                  השתמש ב-{`{{שם_המשתנה}}`} בתוך התבנית
                </p>
                <div className="space-y-2">
                  {template.variables?.map((variable, index) => (
                    <div key={index} className="bg-slate-50 rounded-lg p-2 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Badge variant="outline" className="font-mono text-xs">
                          {`{{${variable.key}}}`}
                        </Badge>
                        {index >= 4 && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-5 w-5"
                            onClick={() => {
                              const variables = template.variables.filter((_, i) => i !== index);
                              onChange({ ...template, variables });
                            }}
                          >
                            <Trash2 className="w-3 h-3 text-red-500" />
                          </Button>
                        )}
                      </div>
                      <Input
                        value={variable.label}
                        onChange={(e) => {
                          const variables = [...template.variables];
                          variables[index] = { ...variables[index], label: e.target.value };
                          onChange({ ...template, variables });
                        }}
                        placeholder="תווית"
                        className="h-7 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="styling" className="p-4 space-y-4 mt-0">
              {/* Primary Color */}
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Palette className="w-4 h-4" />
                  צבע ראשי
                </Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    type="color"
                    value={template.styling?.primary_color || '#4338ca'}
                    onChange={(e) => updateGlobalStyling({ primary_color: e.target.value })}
                    className="w-12 h-9 p-1"
                  />
                  <Input
                    value={template.styling?.primary_color || '#4338ca'}
                    onChange={(e) => updateGlobalStyling({ primary_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {colorPresets.map((color) => (
                    <button
                      key={color}
                      onClick={() => updateGlobalStyling({ primary_color: color })}
                      className={`w-6 h-6 rounded-md border-2 transition-all ${
                        template.styling?.primary_color === color
                          ? 'border-slate-900 scale-110'
                          : 'border-transparent hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Secondary Color */}
              <div>
                <Label className="mb-2 block">צבע משני</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={template.styling?.secondary_color || '#64748b'}
                    onChange={(e) => updateGlobalStyling({ secondary_color: e.target.value })}
                    className="w-12 h-9 p-1"
                  />
                  <Input
                    value={template.styling?.secondary_color || '#64748b'}
                    onChange={(e) => updateGlobalStyling({ secondary_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Font Family */}
              <div>
                <Label className="mb-2 block">גופן</Label>
                <Select
                  value={template.styling?.font_family || 'Heebo'}
                  onValueChange={(val) => updateGlobalStyling({ font_family: val })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fontFamilies.map((font) => (
                      <SelectItem key={font.value} value={font.value}>
                        {font.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Font Sizes */}
              <div>
                <Label className="mb-2 block">גודל כותרת ראשית</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[template.styling?.heading_size || 24]}
                    onValueChange={([val]) => updateGlobalStyling({ heading_size: val })}
                    min={16}
                    max={48}
                    step={2}
                    className="flex-1"
                  />
                  <span className="text-sm text-slate-600 w-10">
                    {template.styling?.heading_size || 24}px
                  </span>
                </div>
              </div>

              <div>
                <Label className="mb-2 block">גודל טקסט</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[template.styling?.body_size || 14]}
                    onValueChange={([val]) => updateGlobalStyling({ body_size: val })}
                    min={12}
                    max={20}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm text-slate-600 w-10">
                    {template.styling?.body_size || 14}px
                  </span>
                </div>
              </div>

              {/* Background */}
              <div>
                <Label className="mb-2 block">צבע רקע</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={template.styling?.background_color || '#ffffff'}
                    onChange={(e) => updateGlobalStyling({ background_color: e.target.value })}
                    className="w-12 h-9 p-1"
                  />
                  <Input
                    value={template.styling?.background_color || '#ffffff'}
                    onChange={(e) => updateGlobalStyling({ background_color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>

              {/* Border Radius */}
              <div>
                <Label className="mb-2 block">עיגול פינות</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[template.styling?.border_radius || 8]}
                    onValueChange={([val]) => updateGlobalStyling({ border_radius: val })}
                    min={0}
                    max={24}
                    step={2}
                    className="flex-1"
                  />
                  <span className="text-sm text-slate-600 w-10">
                    {template.styling?.border_radius || 8}px
                  </span>
                </div>
              </div>

              {/* Spacing */}
              <div>
                <Label className="mb-2 block">ריווח בין בלוקים</Label>
                <div className="flex items-center gap-2">
                  <Slider
                    value={[template.styling?.section_spacing || 24]}
                    onValueChange={([val]) => updateGlobalStyling({ section_spacing: val })}
                    min={8}
                    max={48}
                    step={4}
                    className="flex-1"
                  />
                  <span className="text-sm text-slate-600 w-10">
                    {template.styling?.section_spacing || 24}px
                  </span>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="css" className="p-4 mt-0">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Code className="w-4 h-4" />
                  CSS מותאם אישית
                </Label>
                <p className="text-xs text-slate-500 mb-3">
                  הוסף CSS מותאם אישית לעיצוב מתקדם
                </p>
                <Textarea
                  value={template.styling?.custom_css || ''}
                  onChange={(e) => updateCustomCSS(e.target.value)}
                  className="font-mono text-xs min-h-[300px]"
                  placeholder={`/* דוגמה */
.proposal-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.pricing-table th {
  background-color: var(--primary-color);
}

.signature-line {
  border-bottom: 2px dashed #ccc;
}`}
                />
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </div>
        </>
        )}
      </div>
    </div>
  );
}

// Block Content Editor Component
function BlockContentEditor({ section, onUpdate }) {
  switch (section.type) {
    case 'header':
      return (
        <HeaderBlockEditor section={section} onUpdate={onUpdate} />
      );

    case 'intro':
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">ברכה</Label>
            <Input
              value={section.content?.greeting || ''}
              onChange={(e) => onUpdate({ greeting: e.target.value })}
              className="mt-1 h-8 text-sm"
              placeholder="שלום {{ClientName}},"
            />
          </div>
          <div>
            <Label className="text-xs">טקסט פתיחה</Label>
            <Textarea
              value={section.content?.text || ''}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="mt-1 text-sm min-h-[60px]"
            />
          </div>
        </div>
      );

    case 'client_details':
      return (
        <div className="space-y-2">
          {[
            { key: 'show_name', label: 'הצג שם' },
            { key: 'show_email', label: 'הצג אימייל' },
            { key: 'show_phone', label: 'הצג טלפון' },
            { key: 'show_address', label: 'הצג כתובת' },
          ].map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between">
              <Label className="text-xs">{label}</Label>
              <Switch
                checked={section.content?.[key] !== false}
                onCheckedChange={(checked) => onUpdate({ [key]: checked })}
              />
            </div>
          ))}
        </div>
      );

    case 'services':
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">תיאור</Label>
            <Textarea
              value={section.content?.description || ''}
              onChange={(e) => onUpdate({ description: e.target.value })}
              className="mt-1 text-sm min-h-[60px]"
            />
          </div>
        </div>
      );

    case 'pricing':
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">הצג סכום ביניים</Label>
            <Switch
              checked={section.content?.show_subtotal !== false}
              onCheckedChange={(checked) => onUpdate({ show_subtotal: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">הצג מע"מ</Label>
            <Switch
              checked={section.content?.show_vat !== false}
              onCheckedChange={(checked) => onUpdate({ show_vat: checked })}
            />
          </div>
          <div>
            <Label className="text-xs">אחוז מע"מ</Label>
            <Input
              type="number"
              value={section.content?.vat_percent || 17}
              onChange={(e) => onUpdate({ vat_percent: parseInt(e.target.value) || 17 })}
              className="mt-1 h-8 text-sm"
            />
          </div>
        </div>
      );

    case 'terms':
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">תנאי תשלום</Label>
            <Input
              value={section.content?.payment_terms || ''}
              onChange={(e) => onUpdate({ payment_terms: e.target.value })}
              className="mt-1 h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">תוקף</Label>
            <Input
              value={section.content?.validity || ''}
              onChange={(e) => onUpdate({ validity: e.target.value })}
              className="mt-1 h-8 text-sm"
            />
          </div>
          <div>
            <Label className="text-xs">הערות נוספות</Label>
            <Textarea
              value={section.content?.notes || ''}
              onChange={(e) => onUpdate({ notes: e.target.value })}
              className="mt-1 text-sm min-h-[60px]"
            />
          </div>
        </div>
      );

    case 'summary':
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">טקסט סיכום</Label>
            <Textarea
              value={section.content?.text || ''}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="mt-1 text-sm min-h-[60px]"
            />
          </div>
          <div>
            <Label className="text-xs">טקסט כפתור</Label>
            <Input
              value={section.content?.cta_text || ''}
              onChange={(e) => onUpdate({ cta_text: e.target.value })}
              className="mt-1 h-8 text-sm"
            />
          </div>
        </div>
      );

    case 'signature':
      return (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs">הצג תאריך</Label>
            <Switch
              checked={section.content?.show_date !== false}
              onCheckedChange={(checked) => onUpdate({ show_date: checked })}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">הצג שורת חתימה</Label>
            <Switch
              checked={section.content?.show_signature_line !== false}
              onCheckedChange={(checked) => onUpdate({ show_signature_line: checked })}
            />
          </div>
          <div>
            <Label className="text-xs">תווית חתימה</Label>
            <Input
              value={section.content?.signature_label || ''}
              onChange={(e) => onUpdate({ signature_label: e.target.value })}
              className="mt-1 h-8 text-sm"
            />
          </div>
        </div>
      );

    case 'text_block':
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">תוכן</Label>
            <Textarea
              value={section.content?.text || ''}
              onChange={(e) => onUpdate({ text: e.target.value })}
              className="mt-1 text-sm min-h-[100px]"
              placeholder="הזן טקסט חופשי..."
            />
          </div>
        </div>
      );

    case 'image_block':
      return (
        <ImageBlockEditor section={section} onUpdate={onUpdate} />
      );

    case 'divider':
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">סגנון</Label>
            <Select
              value={section.content?.style || 'solid'}
              onValueChange={(val) => onUpdate({ style: val })}
            >
              <SelectTrigger className="h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="solid">קו רציף</SelectItem>
                <SelectItem value="dashed">קו מקווקו</SelectItem>
                <SelectItem value="dotted">נקודות</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );

    case 'spacer':
      return (
        <div className="space-y-3">
          <div>
            <Label className="text-xs">גובה (פיקסלים)</Label>
            <Input
              type="number"
              value={section.content?.height || 24}
              onChange={(e) => onUpdate({ height: parseInt(e.target.value) || 24 })}
              className="mt-1 h-8 text-sm"
            />
          </div>
        </div>
      );

    default:
      return <p className="text-xs text-slate-500">אין אפשרויות עריכה זמינות</p>;
  }
}

// Block Style Editor Component - Enhanced with Dynamic Controls
function BlockStyleEditor({ section, globalStyling, onUpdate }) {
  const isImageBlock = section.type === 'image_block';
  const isHeaderBlock = section.type === 'header';
  const isTextBlock = section.type === 'text_block' || section.type === 'intro' || section.type === 'services';
  
  return (
    <div className="space-y-3">
      {/* Background */}
      <div>
        <Label className="text-xs">רקע</Label>
        <div className="flex gap-2 mt-1">
          <Input
            type="color"
            value={section.styling?.background || 'transparent'}
            onChange={(e) => onUpdate({ background: e.target.value })}
            className="w-10 h-8 p-1"
          />
          <Input
            value={section.styling?.background || ''}
            onChange={(e) => onUpdate({ background: e.target.value })}
            className="flex-1 h-8 text-sm"
            placeholder="transparent"
          />
        </div>
      </div>

      {/* Padding */}
      <div>
        <Label className="text-xs">ריפוד (padding)</Label>
        <div className="grid grid-cols-4 gap-1 mt-1">
          {['top', 'right', 'bottom', 'left'].map((side) => (
            <Input
              key={side}
              type="number"
              value={section.styling?.[`padding_${side}`] || 0}
              onChange={(e) => onUpdate({ [`padding_${side}`]: parseInt(e.target.value) || 0 })}
              className="h-8 text-xs text-center"
              placeholder={side[0].toUpperCase()}
            />
          ))}
        </div>
        <p className="text-xs text-slate-400 mt-1">עליון | ימין | תחתון | שמאל</p>
      </div>

      {/* Text Alignment */}
      <div>
        <Label className="text-xs">יישור טקסט</Label>
        <div className="flex gap-1 mt-1">
          {[
            { value: 'right', icon: AlignRight },
            { value: 'center', icon: AlignCenter },
            { value: 'left', icon: AlignLeft },
          ].map(({ value, icon: Icon }) => (
            <Button
              key={value}
              size="sm"
              variant={section.styling?.text_align === value ? 'default' : 'outline'}
              onClick={() => onUpdate({ text_align: value })}
              className="flex-1 h-8"
            >
              <Icon className="w-4 h-4" />
            </Button>
          ))}
        </div>
      </div>

      {/* Image-specific controls */}
      {isImageBlock && (
        <>
          <div>
            <Label className="text-xs">רוחב תמונה (%)</Label>
            <div className="flex items-center gap-2 mt-1">
              <Slider
                value={[section.styling?.image_width || 100]}
                onValueChange={([val]) => onUpdate({ image_width: val })}
                min={20}
                max={100}
                step={5}
                className="flex-1"
              />
              <span className="text-xs text-slate-600 w-10">
                {section.styling?.image_width || 100}%
              </span>
            </div>
          </div>
          <div>
            <Label className="text-xs">גובה מקסימלי (px)</Label>
            <div className="flex items-center gap-2 mt-1">
              <Slider
                value={[section.styling?.max_height || 400]}
                onValueChange={([val]) => onUpdate({ max_height: val })}
                min={100}
                max={800}
                step={50}
                className="flex-1"
              />
              <span className="text-xs text-slate-600 w-14">
                {section.styling?.max_height || 400}px
              </span>
            </div>
          </div>
          <div>
            <Label className="text-xs">התאמת תמונה</Label>
            <Select
              value={section.styling?.object_fit || 'contain'}
              onValueChange={(val) => onUpdate({ object_fit: val })}
            >
              <SelectTrigger className="h-8 text-xs mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contain">התאמה לגבולות</SelectItem>
                <SelectItem value="cover">מילוי מלא</SelectItem>
                <SelectItem value="fill">מתיחה</SelectItem>
                <SelectItem value="none">ללא שינוי</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">עיגול פינות תמונה</Label>
            <div className="flex items-center gap-2 mt-1">
              <Slider
                value={[section.styling?.image_border_radius || 8]}
                onValueChange={([val]) => onUpdate({ image_border_radius: val })}
                min={0}
                max={50}
                step={2}
                className="flex-1"
              />
              <span className="text-xs text-slate-600 w-10">
                {section.styling?.image_border_radius || 8}px
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label className="text-xs">צל לתמונה</Label>
            <Switch
              checked={section.styling?.image_shadow || false}
              onCheckedChange={(checked) => onUpdate({ image_shadow: checked })}
            />
          </div>
        </>
      )}

      {/* Header-specific controls */}
      {isHeaderBlock && (
        <>
          <div>
            <Label className="text-xs">גודל לוגו (px)</Label>
            <div className="flex items-center gap-2 mt-1">
              <Slider
                value={[section.styling?.logo_size || 48]}
                onValueChange={([val]) => onUpdate({ logo_size: val })}
                min={24}
                max={120}
                step={4}
                className="flex-1"
              />
              <span className="text-xs text-slate-600 w-10">
                {section.styling?.logo_size || 48}px
              </span>
            </div>
          </div>
          <div>
            <Label className="text-xs">מיקום לוגו</Label>
            <Select
              value={section.styling?.logo_position || 'right'}
              onValueChange={(val) => onUpdate({ logo_position: val })}
            >
              <SelectTrigger className="h-8 text-xs mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="right">ימין</SelectItem>
                <SelectItem value="left">שמאל</SelectItem>
                <SelectItem value="center">מרכז (מעל)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">סגנון כותרת</Label>
            <Select
              value={section.styling?.header_style || 'standard'}
              onValueChange={(val) => onUpdate({ header_style: val })}
            >
              <SelectTrigger className="h-8 text-xs mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">סטנדרטי</SelectItem>
                <SelectItem value="gradient">גרדיאנט</SelectItem>
                <SelectItem value="bordered">עם מסגרת</SelectItem>
                <SelectItem value="minimal">מינימלי</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Text-specific controls */}
      {isTextBlock && (
        <>
          <div>
            <Label className="text-xs">גודל פונט</Label>
            <div className="flex items-center gap-2 mt-1">
              <Slider
                value={[section.styling?.font_size || 14]}
                onValueChange={([val]) => onUpdate({ font_size: val })}
                min={10}
                max={24}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-slate-600 w-10">
                {section.styling?.font_size || 14}px
              </span>
            </div>
          </div>
          <div>
            <Label className="text-xs">גובה שורה</Label>
            <div className="flex items-center gap-2 mt-1">
              <Slider
                value={[section.styling?.line_height || 1.6]}
                onValueChange={([val]) => onUpdate({ line_height: val })}
                min={1}
                max={2.5}
                step={0.1}
                className="flex-1"
              />
              <span className="text-xs text-slate-600 w-10">
                {section.styling?.line_height || 1.6}
              </span>
            </div>
          </div>
        </>
      )}

      {/* Border */}
      <div className="flex items-center justify-between">
        <Label className="text-xs">גבול</Label>
        <Switch
          checked={section.styling?.show_border || false}
          onCheckedChange={(checked) => onUpdate({ show_border: checked })}
        />
      </div>

      {section.styling?.show_border && (
        <>
          <div>
            <Label className="text-xs">צבע גבול</Label>
            <div className="flex gap-2 mt-1">
              <Input
                type="color"
                value={section.styling?.border_color || '#e2e8f0'}
                onChange={(e) => onUpdate({ border_color: e.target.value })}
                className="w-10 h-8 p-1"
              />
              <Input
                value={section.styling?.border_color || '#e2e8f0'}
                onChange={(e) => onUpdate({ border_color: e.target.value })}
                className="flex-1 h-8 text-sm"
              />
            </div>
          </div>
          <div>
            <Label className="text-xs">עובי גבול</Label>
            <div className="flex items-center gap-2 mt-1">
              <Slider
                value={[section.styling?.border_width || 1]}
                onValueChange={([val]) => onUpdate({ border_width: val })}
                min={1}
                max={8}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-slate-600 w-10">
                {section.styling?.border_width || 1}px
              </span>
            </div>
          </div>
        </>
      )}

      {/* Block Border Radius */}
      <div>
        <Label className="text-xs">עיגול פינות בלוק</Label>
        <div className="flex items-center gap-2 mt-1">
          <Slider
            value={[section.styling?.block_border_radius || 0]}
            onValueChange={([val]) => onUpdate({ block_border_radius: val })}
            min={0}
            max={32}
            step={2}
            className="flex-1"
          />
          <span className="text-xs text-slate-600 w-10">
            {section.styling?.block_border_radius || 0}px
          </span>
        </div>
      </div>

      {/* Shadow */}
      <div className="flex items-center justify-between">
        <Label className="text-xs">צל לבלוק</Label>
        <Switch
          checked={section.styling?.show_shadow || false}
          onCheckedChange={(checked) => onUpdate({ show_shadow: checked })}
        />
      </div>

      {section.styling?.show_shadow && (
        <div>
          <Label className="text-xs">עוצמת צל</Label>
          <Select
            value={section.styling?.shadow_size || 'md'}
            onValueChange={(val) => onUpdate({ shadow_size: val })}
          >
            <SelectTrigger className="h-8 text-xs mt-1">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">קטן</SelectItem>
              <SelectItem value="md">בינוני</SelectItem>
              <SelectItem value="lg">גדול</SelectItem>
              <SelectItem value="xl">גדול מאוד</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}

// Live Preview Component
function LivePreview({ template, currentPageIndex = 0, pages = [] }) {
  const styling = template.styling || {};
  const primaryColor = styling.primary_color || '#4338ca';
  const secondaryColor = styling.secondary_color || '#64748b';
  const fontFamily = styling.font_family || 'Heebo';
  const headingSize = styling.heading_size || 24;
  const bodySize = styling.body_size || 14;
  const backgroundColor = styling.background_color || '#ffffff';
  const borderRadius = styling.border_radius || 8;
  const sectionSpacing = styling.section_spacing || 24;

  // Get current page sections
  const currentPage = pages[currentPageIndex];
  const sectionsToRender = currentPage?.sections || template.sections || [];

  const cssVariables = {
    '--primary-color': primaryColor,
    '--secondary-color': secondaryColor,
    '--font-family': fontFamily,
    '--heading-size': `${headingSize}px`,
    '--body-size': `${bodySize}px`,
    '--background-color': backgroundColor,
    '--border-radius': `${borderRadius}px`,
    '--section-spacing': `${sectionSpacing}px`,
  };

  return (
    <div
      className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden"
      style={{ 
        ...cssVariables,
        fontFamily,
        backgroundColor,
      }}
    >
      {styling.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: styling.custom_css }} />
      )}
      
      {/* Page indicator */}
      {pages.length > 1 && (
        <div className="bg-slate-100 px-4 py-2 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            {currentPage?.name || `דף ${currentPageIndex + 1}`}
          </span>
          <span className="text-xs text-slate-400">
            {currentPageIndex + 1} / {pages.length}
          </span>
        </div>
      )}
      
      {sectionsToRender.length === 0 ? (
        <div className="p-16 text-center text-slate-400">
          <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>דף ריק</p>
          <p className="text-sm mt-1">הוסף בלוקים מהפאנל השמאלי</p>
        </div>
      ) : (
        sectionsToRender
          .filter(s => s.visible)
          .sort((a, b) => a.order - b.order)
          .map((section) => (
            <SectionPreview
              key={section.id}
              section={section}
              styling={styling}
              sectionSpacing={sectionSpacing}
            />
          ))
      )}
    </div>
  );
}

// Section Preview Component - Enhanced with Dynamic Styling
function SectionPreview({ section, styling, sectionSpacing }) {
  const primaryColor = styling?.primary_color || '#4338ca';
  const sectionStyling = section.styling || {};
  
  // Shadow mapping
  const shadowMap = {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
    md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
    lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
    xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  };
  
  const sectionStyle = {
    background: sectionStyling.background || 'transparent',
    paddingTop: sectionStyling.padding_top ?? sectionSpacing,
    paddingRight: sectionStyling.padding_right ?? 32,
    paddingBottom: sectionStyling.padding_bottom ?? sectionSpacing,
    paddingLeft: sectionStyling.padding_left ?? 32,
    textAlign: sectionStyling.text_align || 'right',
    border: sectionStyling.show_border 
      ? `${sectionStyling.border_width || 1}px solid ${sectionStyling.border_color || '#e2e8f0'}` 
      : 'none',
    borderRadius: sectionStyling.block_border_radius || 0,
    boxShadow: sectionStyling.show_shadow ? shadowMap[sectionStyling.shadow_size || 'md'] : 'none',
    fontSize: sectionStyling.font_size ? `${sectionStyling.font_size}px` : undefined,
    lineHeight: sectionStyling.line_height || undefined,
  };

  switch (section.type) {
    case 'header':
      const logoSize = sectionStyling.logo_size || 48;
      const logoPosition = sectionStyling.logo_position || 'right';
      const headerStyle = sectionStyling.header_style || 'standard';
      
      const headerBgStyle = headerStyle === 'gradient' 
        ? { background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)` }
        : headerStyle === 'bordered'
        ? { border: `2px solid ${primaryColor}`, borderBottom: `4px solid ${primaryColor}` }
        : { borderBottom: `4px solid ${primaryColor}` };
      
      const headerTextColor = headerStyle === 'gradient' ? '#ffffff' : primaryColor;
      
      return (
        <div 
          className="proposal-header" 
          style={{ 
            ...sectionStyle, 
            ...headerBgStyle,
          }}
        >
          {logoPosition === 'center' ? (
            <div className="flex flex-col items-center text-center">
              {section.content?.logo_url && (
                <img 
                  src={section.content.logo_url} 
                  alt="Logo" 
                  style={{ height: logoSize, objectFit: 'contain' }}
                  className="mb-3"
                />
              )}
              <h1 className="text-2xl font-bold" style={{ color: headerTextColor }}>
                {section.content?.company_name || 'שם החברה'}
              </h1>
              {section.content?.tagline && (
                <p className={`mt-1 ${headerStyle === 'gradient' ? 'text-white/80' : 'text-slate-600'}`}>
                  {section.content.tagline}
                </p>
              )}
              <div className={`text-sm mt-2 ${headerStyle === 'gradient' ? 'text-white/70' : 'text-slate-500'}`}>
                {section.content?.contact_info || 'פרטי קשר'}
              </div>
            </div>
          ) : (
            <div className={`flex items-center justify-between ${logoPosition === 'left' ? 'flex-row-reverse' : ''}`}>
              <div className={`flex items-center gap-4 ${logoPosition === 'left' ? 'flex-row-reverse' : ''}`}>
                {section.content?.logo_url && (
                  <img 
                    src={section.content.logo_url} 
                    alt="Logo" 
                    style={{ height: logoSize, objectFit: 'contain' }}
                  />
                )}
                <div>
                  <h1 className="text-2xl font-bold" style={{ color: headerTextColor }}>
                    {section.content?.company_name || 'שם החברה'}
                  </h1>
                  {section.content?.tagline && (
                    <p className={`mt-1 ${headerStyle === 'gradient' ? 'text-white/80' : 'text-slate-600'}`}>
                      {section.content.tagline}
                    </p>
                  )}
                </div>
              </div>
              <div className={`text-sm ${headerStyle === 'gradient' ? 'text-white/70' : 'text-slate-500'} ${logoPosition === 'left' ? 'text-right' : 'text-left'}`}>
                {section.content?.contact_info || 'פרטי קשר'}
              </div>
            </div>
          )}
        </div>
      );

    case 'intro':
      return (
        <div style={sectionStyle}>
          <p className="text-lg font-medium text-slate-900 mb-2">
            {section.content?.greeting || 'שלום,'}
          </p>
          <p className="text-slate-600">{section.content?.text || 'טקסט פתיחה...'}</p>
        </div>
      );

    case 'client_details':
      return (
        <div style={{ ...sectionStyle, background: sectionStyling.background || '#f8fafc' }}>
          <h3 className="font-semibold text-slate-900 mb-3">פרטי לקוח</h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {section.content?.show_name !== false && (
              <div><span className="text-slate-500">שם:</span> <span className="text-slate-400">{`{{ClientName}}`}</span></div>
            )}
            {section.content?.show_email !== false && (
              <div><span className="text-slate-500">אימייל:</span> <span className="text-slate-400">{`{{ClientEmail}}`}</span></div>
            )}
            {section.content?.show_phone !== false && (
              <div><span className="text-slate-500">טלפון:</span> <span className="text-slate-400">{`{{ClientPhone}}`}</span></div>
            )}
            {section.content?.show_address !== false && (
              <div><span className="text-slate-500">כתובת:</span> <span className="text-slate-400">{`{{ClientAddress}}`}</span></div>
            )}
          </div>
        </div>
      );

    case 'services':
      return (
        <div style={sectionStyle}>
          <h3 className="font-semibold text-slate-900 mb-3">{section.title}</h3>
          <p className="text-slate-600">{section.content?.description || 'תיאור השירותים...'}</p>
        </div>
      );

    case 'pricing':
      return (
        <div className="pricing-table" style={sectionStyle}>
          <h3 className="font-semibold text-slate-900 mb-4">{section.title}</h3>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: primaryColor }}>
                <th className="text-right py-2 px-3 font-medium text-white rounded-tr-lg">תיאור</th>
                <th className="text-center py-2 px-2 font-medium text-white">כמות</th>
                <th className="text-center py-2 px-2 font-medium text-white">מחיר</th>
                <th className="text-left py-2 px-3 font-medium text-white rounded-tl-lg">סה"כ</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-slate-100">
                <td className="py-3 text-slate-700">פריט לדוגמה</td>
                <td className="py-3 text-center text-slate-600">1</td>
                <td className="py-3 text-center text-slate-600">₪0</td>
                <td className="py-3 text-left font-medium">₪0</td>
              </tr>
            </tbody>
          </table>
          {section.content?.show_subtotal && (
            <div className="flex justify-between mt-4 pt-4 border-t border-slate-200">
              <span className="text-slate-600">סכום ביניים</span>
              <span className="font-medium">{`{{Subtotal}}`}</span>
            </div>
          )}
          {section.content?.show_vat && (
            <div className="flex justify-between mt-2">
              <span className="text-slate-600">מע"מ ({section.content?.vat_percent || 17}%)</span>
              <span className="font-medium">{`{{VAT}}`}</span>
            </div>
          )}
          <div className="flex justify-between mt-4 pt-4 border-t-2 border-slate-300">
            <span className="text-lg font-bold">סה"כ לתשלום</span>
            <span className="text-lg font-bold" style={{ color: primaryColor }}>{`{{TotalPrice}}`}</span>
          </div>
        </div>
      );

    case 'terms':
      return (
        <div style={{ ...sectionStyle, background: sectionStyling.background || '#fefce8' }}>
          <h3 className="font-semibold text-slate-900 mb-3">{section.title}</h3>
          <div className="space-y-2 text-sm text-slate-600">
            {section.content?.payment_terms && <p>• {section.content.payment_terms}</p>}
            {section.content?.validity && <p>• {section.content.validity}</p>}
            {section.content?.notes && <p>• {section.content.notes}</p>}
          </div>
        </div>
      );

    case 'summary':
      return (
        <div style={{ ...sectionStyle, textAlign: 'center' }}>
          <p className="text-slate-600 mb-6">{section.content?.text || 'טקסט סיכום...'}</p>
          {section.content?.cta_text && (
            <button 
              className="px-8 py-2 text-white rounded-lg"
              style={{ backgroundColor: primaryColor }}
            >
              {section.content.cta_text}
            </button>
          )}
        </div>
      );

    case 'signature':
      return (
        <div className="signature-section" style={{ ...sectionStyle, borderTop: '1px solid #e2e8f0' }}>
          <div className="flex justify-between items-end">
            {section.content?.show_date !== false && (
              <div>
                <p className="text-sm text-slate-500 mb-1">תאריך</p>
                <p className="text-slate-700">{`{{Date}}`}</p>
              </div>
            )}
            {section.content?.show_signature_line !== false && (
              <div className="text-center">
                <div className="signature-line w-48 border-b-2 border-slate-300 mb-2" />
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

    case 'image_block':
      const imageWidth = sectionStyling.image_width || 100;
      const maxHeight = sectionStyling.max_height || 400;
      const objectFit = sectionStyling.object_fit || 'contain';
      const imageBorderRadius = sectionStyling.image_border_radius || 8;
      const imageShadow = sectionStyling.image_shadow;
      
      return (
        <div style={{ ...sectionStyle, textAlign: sectionStyling.text_align || 'center' }}>
          {section.content?.image_url ? (
            <img 
              src={section.content.image_url} 
              alt={section.content?.alt_text || ''} 
              style={{
                width: `${imageWidth}%`,
                maxHeight: maxHeight,
                objectFit: objectFit,
                borderRadius: imageBorderRadius,
                boxShadow: imageShadow ? '0 10px 25px -5px rgb(0 0 0 / 0.15), 0 8px 10px -6px rgb(0 0 0 / 0.1)' : 'none',
                display: 'inline-block',
              }}
            />
          ) : (
            <div 
              className="bg-slate-100 flex items-center justify-center mx-auto"
              style={{
                width: `${imageWidth}%`,
                height: 150,
                borderRadius: imageBorderRadius,
              }}
            >
              <Image className="w-8 h-8 text-slate-300" />
            </div>
          )}
        </div>
      );

    case 'divider':
      const dividerStyle = section.content?.style || 'solid';
      return (
        <div style={sectionStyle}>
          <hr 
            className="border-slate-200" 
            style={{ borderStyle: dividerStyle }}
          />
        </div>
      );

    case 'spacer':
      return (
        <div style={{ height: section.content?.height || 24 }} />
      );

    default:
      return null;
  }
}

// Image Upload Editor Component
function ImageBlockEditor({ section, onUpdate }) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [inputMode, setInputMode] = React.useState('upload'); // 'upload' or 'url'
  const fileInputRef = React.useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onUpdate({ image_url: file_url });
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs mb-2 block">תמונה</Label>
        <Tabs value={inputMode} onValueChange={setInputMode} className="w-full">
          <TabsList className="w-full h-7 mb-2">
            <TabsTrigger value="upload" className="flex-1 text-xs h-6">
              <Upload className="w-3 h-3 ml-1" />
              העלה
            </TabsTrigger>
            <TabsTrigger value="url" className="flex-1 text-xs h-6">
              <Link className="w-3 h-3 ml-1" />
              קישור
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="mt-0">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full h-8 text-xs"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3 h-3 ml-1 animate-spin" />
                  מעלה...
                </>
              ) : (
                <>
                  <Upload className="w-3 h-3 ml-1" />
                  בחר תמונה
                </>
              )}
            </Button>
          </TabsContent>
          
          <TabsContent value="url" className="mt-0">
            <Input
              value={section.content?.image_url || ''}
              onChange={(e) => onUpdate({ image_url: e.target.value })}
              className="h-8 text-sm"
              placeholder="https://..."
            />
          </TabsContent>
        </Tabs>
      </div>
      
      {section.content?.image_url && (
        <div className="rounded-lg border border-slate-200 p-2">
          <img 
            src={section.content.image_url} 
            alt="תצוגה מקדימה" 
            className="w-full h-20 object-contain rounded"
          />
        </div>
      )}
      
      <div>
        <Label className="text-xs">טקסט חלופי</Label>
        <Input
          value={section.content?.alt_text || ''}
          onChange={(e) => onUpdate({ alt_text: e.target.value })}
          className="mt-1 h-8 text-sm"
        />
      </div>
    </div>
  );
}

// Header Block Editor with Logo Upload
function HeaderBlockEditor({ section, onUpdate }) {
  const [isUploading, setIsUploading] = React.useState(false);
  const [logoInputMode, setLogoInputMode] = React.useState('upload');
  const fileInputRef = React.useRef(null);

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      onUpdate({ logo_url: file_url });
    } catch (error) {
      console.error('Error uploading logo:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">שם החברה</Label>
        <Input
          value={section.content?.company_name || ''}
          onChange={(e) => onUpdate({ company_name: e.target.value })}
          className="mt-1 h-8 text-sm"
        />
      </div>
      <div>
        <Label className="text-xs">סלוגן</Label>
        <Input
          value={section.content?.tagline || ''}
          onChange={(e) => onUpdate({ tagline: e.target.value })}
          className="mt-1 h-8 text-sm"
        />
      </div>
      <div>
        <Label className="text-xs">פרטי קשר</Label>
        <Input
          value={section.content?.contact_info || ''}
          onChange={(e) => onUpdate({ contact_info: e.target.value })}
          className="mt-1 h-8 text-sm"
        />
      </div>
      <div>
        <Label className="text-xs mb-2 block">לוגו</Label>
        <Tabs value={logoInputMode} onValueChange={setLogoInputMode} className="w-full">
          <TabsList className="w-full h-7 mb-2">
            <TabsTrigger value="upload" className="flex-1 text-xs h-6">
              <Upload className="w-3 h-3 ml-1" />
              העלה
            </TabsTrigger>
            <TabsTrigger value="url" className="flex-1 text-xs h-6">
              <Link className="w-3 h-3 ml-1" />
              קישור
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="mt-0">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleLogoUpload}
              accept="image/*"
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="w-full h-8 text-xs"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-3 h-3 ml-1 animate-spin" />
                  מעלה...
                </>
              ) : (
                <>
                  <Upload className="w-3 h-3 ml-1" />
                  בחר לוגו
                </>
              )}
            </Button>
          </TabsContent>
          
          <TabsContent value="url" className="mt-0">
            <Input
              value={section.content?.logo_url || ''}
              onChange={(e) => onUpdate({ logo_url: e.target.value })}
              className="h-8 text-sm"
              placeholder="https://..."
            />
          </TabsContent>
        </Tabs>
        
        {section.content?.logo_url && (
          <div className="mt-2 rounded-lg border border-slate-200 p-2">
            <img 
              src={section.content.logo_url} 
              alt="לוגו" 
              className="h-10 object-contain"
            />
          </div>
        )}
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
    pricing: { show_subtotal: true, show_vat: true, vat_percent: 17 },
    terms: { payment_terms: '', validity: '', notes: '' },
    summary: { text: '', cta_text: '' },
    signature: { show_date: true, show_signature_line: true, signature_label: 'חתימה' },
    text_block: { text: '' },
    image_block: { image_url: '', alt_text: '' },
    divider: { style: 'solid' },
    spacer: { height: 24 },
    columns: { columns: 2 },
  };
  return defaults[blockType] || {};
}

function getDefaultStyling(blockType) {
  return {
    background: 'transparent',
    padding_top: 24,
    padding_right: 32,
    padding_bottom: 24,
    padding_left: 32,
    text_align: 'right',
    show_border: false,
    border_color: '#e2e8f0',
  };
}