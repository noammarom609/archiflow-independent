import React, { useState } from 'react';
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
  ChevronUp
} from 'lucide-react';

const sectionIcons = {
  header: Image,
  intro: MessageSquare,
  client_details: Users,
  services: List,
  pricing: DollarSign,
  terms: FileCheck,
  summary: FileText,
  signature: PenTool,
};

const sectionLabels = {
  header: 'כותרת',
  intro: 'פתיח',
  client_details: 'פרטי לקוח',
  services: 'פירוט שירותים',
  pricing: 'טבלת מחירים',
  terms: 'תנאים והערות',
  summary: 'סיכום',
  signature: 'חתימה',
};

export default function TemplateEditor({ template, onChange }) {
  const [expandedSection, setExpandedSection] = useState(null);
  const [activePanel, setActivePanel] = useState('sections');

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const sections = [...template.sections];
    const [removed] = sections.splice(result.source.index, 1);
    sections.splice(result.destination.index, 0, removed);

    // Update order
    const updatedSections = sections.map((s, idx) => ({ ...s, order: idx }));
    onChange({ ...template, sections: updatedSections });
  };

  const toggleSectionVisibility = (sectionId) => {
    const sections = template.sections.map(s =>
      s.id === sectionId ? { ...s, visible: !s.visible } : s
    );
    onChange({ ...template, sections });
  };

  const duplicateSection = (section) => {
    const newSection = {
      ...section,
      id: `${section.type}_${Date.now()}`,
      title: `${section.title} (העתק)`,
      order: template.sections.length,
    };
    onChange({ ...template, sections: [...template.sections, newSection] });
  };

  const deleteSection = (sectionId) => {
    const sections = template.sections.filter(s => s.id !== sectionId);
    onChange({ ...template, sections });
  };

  const updateSectionContent = (sectionId, content) => {
    const sections = template.sections.map(s =>
      s.id === sectionId ? { ...s, content: { ...s.content, ...content } } : s
    );
    onChange({ ...template, sections });
  };

  const updateSectionTitle = (sectionId, title) => {
    const sections = template.sections.map(s =>
      s.id === sectionId ? { ...s, title } : s
    );
    onChange({ ...template, sections });
  };

  const addVariable = () => {
    const variables = [
      ...template.variables,
      { key: `Custom${template.variables.length + 1}`, label: 'משתנה חדש', default_value: '' }
    ];
    onChange({ ...template, variables });
  };

  const updateVariable = (index, field, value) => {
    const variables = [...template.variables];
    variables[index] = { ...variables[index], [field]: value };
    onChange({ ...template, variables });
  };

  const deleteVariable = (index) => {
    const variables = template.variables.filter((_, i) => i !== index);
    onChange({ ...template, variables });
  };

  const renderSectionEditor = (section) => {
    switch (section.type) {
      case 'header':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">שם החברה</Label>
              <Input
                value={section.content?.company_name || ''}
                onChange={(e) => updateSectionContent(section.id, { company_name: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">סלוגן</Label>
              <Input
                value={section.content?.tagline || ''}
                onChange={(e) => updateSectionContent(section.id, { tagline: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">פרטי קשר</Label>
              <Input
                value={section.content?.contact_info || ''}
                onChange={(e) => updateSectionContent(section.id, { contact_info: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
        );

      case 'intro':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">ברכה</Label>
              <Input
                value={section.content?.greeting || ''}
                onChange={(e) => updateSectionContent(section.id, { greeting: e.target.value })}
                className="mt-1"
                placeholder="שלום {{ClientName}},"
              />
            </div>
            <div>
              <Label className="text-xs">טקסט פתיחה</Label>
              <Textarea
                value={section.content?.text || ''}
                onChange={(e) => updateSectionContent(section.id, { text: e.target.value })}
                className="mt-1 min-h-[80px]"
              />
            </div>
          </div>
        );

      case 'client_details':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">הצג שם</Label>
              <Switch
                checked={section.content?.show_name !== false}
                onCheckedChange={(checked) => updateSectionContent(section.id, { show_name: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">הצג אימייל</Label>
              <Switch
                checked={section.content?.show_email !== false}
                onCheckedChange={(checked) => updateSectionContent(section.id, { show_email: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">הצג טלפון</Label>
              <Switch
                checked={section.content?.show_phone !== false}
                onCheckedChange={(checked) => updateSectionContent(section.id, { show_phone: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">הצג כתובת</Label>
              <Switch
                checked={section.content?.show_address !== false}
                onCheckedChange={(checked) => updateSectionContent(section.id, { show_address: checked })}
              />
            </div>
          </div>
        );

      case 'services':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs">תיאור</Label>
              <Textarea
                value={section.content?.description || ''}
                onChange={(e) => updateSectionContent(section.id, { description: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
        );

      case 'pricing':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">הצג סכום ביניים</Label>
              <Switch
                checked={section.content?.show_subtotal !== false}
                onCheckedChange={(checked) => updateSectionContent(section.id, { show_subtotal: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">הצג מע"מ</Label>
              <Switch
                checked={section.content?.show_vat !== false}
                onCheckedChange={(checked) => updateSectionContent(section.id, { show_vat: checked })}
              />
            </div>
            <div>
              <Label className="text-xs">אחוז מע"מ</Label>
              <Input
                type="number"
                value={section.content?.vat_percent || 17}
                onChange={(e) => updateSectionContent(section.id, { vat_percent: parseInt(e.target.value) || 17 })}
                className="mt-1"
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
                onChange={(e) => updateSectionContent(section.id, { payment_terms: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">תוקף</Label>
              <Input
                value={section.content?.validity || ''}
                onChange={(e) => updateSectionContent(section.id, { validity: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">הערות נוספות</Label>
              <Textarea
                value={section.content?.notes || ''}
                onChange={(e) => updateSectionContent(section.id, { notes: e.target.value })}
                className="mt-1"
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
                onChange={(e) => updateSectionContent(section.id, { text: e.target.value })}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">טקסט כפתור</Label>
              <Input
                value={section.content?.cta_text || ''}
                onChange={(e) => updateSectionContent(section.id, { cta_text: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
        );

      case 'signature':
        return (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-xs">הצג תאריך</Label>
              <Switch
                checked={section.content?.show_date !== false}
                onCheckedChange={(checked) => updateSectionContent(section.id, { show_date: checked })}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-xs">הצג שורת חתימה</Label>
              <Switch
                checked={section.content?.show_signature_line !== false}
                onCheckedChange={(checked) => updateSectionContent(section.id, { show_signature_line: checked })}
              />
            </div>
            <div>
              <Label className="text-xs">תווית חתימה</Label>
              <Input
                value={section.content?.signature_label || ''}
                onChange={(e) => updateSectionContent(section.id, { signature_label: e.target.value })}
                className="mt-1"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full flex">
      {/* Left Panel - Sections List */}
      <div className="w-80 bg-white border-l border-slate-200 flex flex-col">
        <div className="p-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">בלוקים</h3>
          <p className="text-xs text-slate-500">גרור לשינוי סדר</p>
        </div>
        <ScrollArea className="flex-1">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="sections">
              {(provided) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className="p-3 space-y-2"
                >
                  {template.sections
                    .sort((a, b) => a.order - b.order)
                    .map((section, index) => {
                      const Icon = sectionIcons[section.type] || FileText;
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
                                      {renderSectionEditor(section)}
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
      <div className="flex-1 bg-slate-100 p-8 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            {template.sections
              .filter(s => s.visible)
              .sort((a, b) => a.order - b.order)
              .map((section) => (
                <SectionPreview key={section.id} section={section} template={template} />
              ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Settings & Variables */}
      <div className="w-80 bg-white border-r border-slate-200 flex flex-col">
        <Tabs value={activePanel} onValueChange={setActivePanel} className="flex-1 flex flex-col">
          <TabsList className="mx-4 mt-4">
            <TabsTrigger value="sections" className="flex-1">
              <Settings className="w-4 h-4 ml-1" />
              הגדרות
            </TabsTrigger>
            <TabsTrigger value="variables" className="flex-1">
              <Variable className="w-4 h-4 ml-1" />
              משתנים
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sections" className="flex-1 overflow-auto p-4 space-y-4">
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

            <div className="pt-4 border-t">
              <Label className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                עיצוב
              </Label>
              <div className="mt-3 space-y-3">
                <div>
                  <Label className="text-xs">צבע ראשי</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="color"
                      value={template.styling?.primary_color || '#4338ca'}
                      onChange={(e) => onChange({
                        ...template,
                        styling: { ...template.styling, primary_color: e.target.value }
                      })}
                      className="w-12 h-9 p-1"
                    />
                    <Input
                      value={template.styling?.primary_color || '#4338ca'}
                      onChange={(e) => onChange({
                        ...template,
                        styling: { ...template.styling, primary_color: e.target.value }
                      })}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="variables" className="flex-1 overflow-auto p-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>משתנים דינמיים</Label>
                <Button size="sm" variant="outline" onClick={addVariable}>
                  <Plus className="w-3 h-3 ml-1" />
                  הוסף
                </Button>
              </div>
              <p className="text-xs text-slate-500">
                השתמש ב-{`{{שם_המשתנה}}`} בתוך התבנית
              </p>

              {template.variables?.map((variable, index) => (
                <div key={index} className="bg-slate-50 rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="font-mono text-xs">
                      {`{{${variable.key}}}`}
                    </Badge>
                    {index >= 4 && (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 mr-auto"
                        onClick={() => deleteVariable(index)}
                      >
                        <Trash2 className="w-3 h-3 text-red-500" />
                      </Button>
                    )}
                  </div>
                  <Input
                    value={variable.label}
                    onChange={(e) => updateVariable(index, 'label', e.target.value)}
                    placeholder="תווית"
                    className="h-8 text-sm"
                  />
                  <Input
                    value={variable.default_value}
                    onChange={(e) => updateVariable(index, 'default_value', e.target.value)}
                    placeholder="ערך ברירת מחדל"
                    className="h-8 text-sm"
                  />
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

// Section Preview Component
function SectionPreview({ section, template }) {
  const primaryColor = template.styling?.primary_color || '#4338ca';

  switch (section.type) {
    case 'header':
      return (
        <div className="p-8 border-b border-slate-100" style={{ borderBottomColor: primaryColor }}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold" style={{ color: primaryColor }}>
                {section.content?.company_name || 'שם החברה'}
              </h1>
              {section.content?.tagline && (
                <p className="text-slate-600 mt-1">{section.content.tagline}</p>
              )}
            </div>
            <div className="text-left text-sm text-slate-500">
              {section.content?.contact_info || 'פרטי קשר'}
            </div>
          </div>
        </div>
      );

    case 'intro':
      return (
        <div className="p-8">
          <p className="text-lg font-medium text-slate-900 mb-2">
            {section.content?.greeting || 'שלום,'}
          </p>
          <p className="text-slate-600">{section.content?.text || 'טקסט פתיחה...'}</p>
        </div>
      );

    case 'client_details':
      return (
        <div className="px-8 py-6 bg-slate-50">
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
        <div className="p-8">
          <h3 className="font-semibold text-slate-900 mb-3">{section.title}</h3>
          <p className="text-slate-600">{section.content?.description || 'תיאור השירותים...'}</p>
        </div>
      );

    case 'pricing':
      return (
        <div className="p-8">
          <h3 className="font-semibold text-slate-900 mb-4">{section.title}</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-right py-2 font-medium text-slate-600">תיאור</th>
                <th className="text-center py-2 font-medium text-slate-600">כמות</th>
                <th className="text-center py-2 font-medium text-slate-600">מחיר</th>
                <th className="text-left py-2 font-medium text-slate-600">סה"כ</th>
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
        <div className="p-8 bg-slate-50">
          <h3 className="font-semibold text-slate-900 mb-3">{section.title}</h3>
          <div className="space-y-2 text-sm text-slate-600">
            {section.content?.payment_terms && <p>{section.content.payment_terms}</p>}
            {section.content?.validity && <p>{section.content.validity}</p>}
            {section.content?.notes && <p>{section.content.notes}</p>}
          </div>
        </div>
      );

    case 'summary':
      return (
        <div className="p-8 text-center">
          <p className="text-slate-600 mb-6">{section.content?.text || 'טקסט סיכום...'}</p>
          {section.content?.cta_text && (
            <Button style={{ backgroundColor: primaryColor }} className="px-8">
              {section.content.cta_text}
            </Button>
          )}
        </div>
      );

    case 'signature':
      return (
        <div className="p-8 border-t border-slate-200">
          <div className="flex justify-between items-end">
            {section.content?.show_date !== false && (
              <div>
                <p className="text-sm text-slate-500 mb-1">תאריך</p>
                <p className="text-slate-700">{`{{Date}}`}</p>
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

    default:
      return null;
  }
}