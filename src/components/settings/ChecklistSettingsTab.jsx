import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ClipboardList, 
  Save, 
  Plus, 
  Trash2, 
  GripVertical,
  Home,
  Building,
  Building2,
  Briefcase,
  RotateCcw,
  Loader2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { 
  PROJECT_TYPES, 
  loadChecklist, 
  saveChecklist,
  defaultRenovationApartmentChecklist,
  defaultNewBuildApartmentChecklist,
  defaultRenovationOfficeChecklist,
  defaultNewBuildOfficeChecklist,
  defaultPhoneCallChecklist
} from '../utils/checklistLoader';
import { showSuccess, showError } from '../utils/notifications';

/**
 * ChecklistSettingsTab - Admin interface for editing project-type checklists
 * Allows editing, reordering, and resetting checklists for each project type
 */
export default function ChecklistSettingsTab() {
  const [activeTab, setActiveTab] = useState('renovation_apartment');
  const [checklists, setChecklists] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState({});
  const [hasChanges, setHasChanges] = useState({});

  // Load all checklists on mount
  useEffect(() => {
    loadAllChecklists();
  }, []);

  const loadAllChecklists = async () => {
    setIsLoading(true);
    try {
      const loaded = {};
      
      // Load phone call checklist
      loaded.phone_call = await loadChecklist('phone_call_checklist');
      
      // Load checklist for each tab
      // Some tabs might map to the same PROJECT_TYPE config (e.g. renovation_private_house might use same as renovation_apartment if not explicitly defined)
      // But here we want to ensure we have data for every tab key
      const tabsToLoad = [
        'renovation_apartment', 'new_build_apartment', 
        'renovation_private_house', 'new_build_private_house',
        'renovation_villa', 'new_build_villa',
        'renovation_office', 'new_build_office',
        'renovation_restaurant', 'new_build_restaurant',
        'renovation_retail', 'new_build_retail',
        'custom_project'
      ];

      for (const key of tabsToLoad) {
        // Construct a unique key for each if not defined in PROJECT_TYPES
        // If PROJECT_TYPES[key] exists use it, otherwise use a default naming convention
        const settingKey = PROJECT_TYPES[key]?.checklistKey || `${key}_checklist`;
        loaded[key] = await loadChecklist(settingKey);
      }
      
      setChecklists(loaded);
    } catch (error) {
      console.error('Error loading checklists:', error);
      showError('שגיאה בטעינת הצ׳קליסטים');
    } finally {
      setIsLoading(false);
    }
  };

  const handleItemChange = (checklistKey, itemIndex, field, value) => {
    setChecklists(prev => {
      const updated = { ...prev };
      updated[checklistKey] = [...updated[checklistKey]];
      updated[checklistKey][itemIndex] = {
        ...updated[checklistKey][itemIndex],
        [field]: value
      };
      return updated;
    });
    setHasChanges(prev => ({ ...prev, [checklistKey]: true }));
  };

  const handleAddItem = (checklistKey) => {
    const newId = `custom_${Date.now()}`;
    setChecklists(prev => ({
      ...prev,
      [checklistKey]: [
        ...prev[checklistKey],
        { id: newId, item: '', checked: false, notes: '' }
      ]
    }));
    setHasChanges(prev => ({ ...prev, [checklistKey]: true }));
  };

  const handleRemoveItem = (checklistKey, itemIndex) => {
    setChecklists(prev => ({
      ...prev,
      [checklistKey]: prev[checklistKey].filter((_, idx) => idx !== itemIndex)
    }));
    setHasChanges(prev => ({ ...prev, [checklistKey]: true }));
  };

  const handleDragEnd = (result, checklistKey) => {
    if (!result.destination) return;
    
    const items = Array.from(checklists[checklistKey]);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setChecklists(prev => ({
      ...prev,
      [checklistKey]: items
    }));
    setHasChanges(prev => ({ ...prev, [checklistKey]: true }));
  };

  const handleSave = async (checklistKey) => {
    setIsSaving(prev => ({ ...prev, [checklistKey]: true }));
    
    try {
      // Determine the setting key
      let settingKey;
      if (checklistKey === 'phone_call') {
        settingKey = 'phone_call_checklist';
      } else {
        // Fallback to generated key if not in PROJECT_TYPES map
        settingKey = PROJECT_TYPES[checklistKey]?.checklistKey || `${checklistKey}_checklist`;
      }
      
      // Filter out empty items
      const validItems = checklists[checklistKey].filter(item => item.item.trim());
      
      await saveChecklist(settingKey, validItems, getChecklistDescription(checklistKey));
      
      setHasChanges(prev => ({ ...prev, [checklistKey]: false }));
      showSuccess('הצ׳קליסט נשמר בהצלחה!');
    } catch (error) {
      console.error('Error saving checklist:', error);
      showError('שגיאה בשמירת הצ׳קליסט');
    } finally {
      setIsSaving(prev => ({ ...prev, [checklistKey]: false }));
    }
  };

  const handleReset = (checklistKey) => {
    if (!window.confirm('האם לאפס את הצ׳קליסט לברירת המחדל?')) return;
    
    let defaultChecklist;
    switch (checklistKey) {
      case 'phone_call':
        defaultChecklist = defaultPhoneCallChecklist;
        break;
      case 'renovation_apartment':
        defaultChecklist = defaultRenovationApartmentChecklist;
        break;
      case 'new_build_apartment':
        defaultChecklist = defaultNewBuildApartmentChecklist;
        break;
      case 'renovation_office':
        defaultChecklist = defaultRenovationOfficeChecklist;
        break;
      case 'new_build_office':
        defaultChecklist = defaultNewBuildOfficeChecklist;
        break;
      default:
        // Fallback to renovation apartment if no specific default
        defaultChecklist = defaultRenovationApartmentChecklist;
        break;
    }
    
    setChecklists(prev => ({
      ...prev,
      [checklistKey]: [...defaultChecklist]
    }));
    setHasChanges(prev => ({ ...prev, [checklistKey]: true }));
    showSuccess('הצ׳קליסט אופס לברירת המחדל');
  };

  const getChecklistDescription = (key) => {
    const descriptions = {
      phone_call: 'צ׳קליסט שיחת טלפון ראשונה',
      renovation_apartment: 'צ׳קליסט פגישה ראשונה - שיפוץ דירה',
      new_build_apartment: 'צ׳קליסט פגישה ראשונה - בנייה חדשה דירה',
      renovation_private_house: 'צ׳קליסט פגישה ראשונה - שיפוץ בית פרטי',
      new_build_private_house: 'צ׳קליסט פגישה ראשונה - בנייה חדשה בית פרטי',
      renovation_villa: 'צ׳קליסט פגישה ראשונה - שיפוץ וילה',
      new_build_villa: 'צ׳קליסט פגישה ראשונה - בנייה חדשה וילה',
      renovation_office: 'צ׳קליסט פגישה ראשונה - שיפוץ משרד',
      new_build_office: 'צ׳קליסט פגישה ראשונה - בנייה חדשה משרד',
      renovation_restaurant: 'צ׳קליסט פגישה ראשונה - שיפוץ מסעדה',
      new_build_restaurant: 'צ׳קליסט פגישה ראשונה - בנייה חדשה מסעדה',
      renovation_retail: 'צ׳קליסט פגישה ראשונה - שיפוץ חנות',
      new_build_retail: 'צ׳קליסט פגישה ראשונה - בנייה חדשה חנות',
      custom_project: 'צ׳קליסט פגישה ראשונה - פרויקט מותאם אישית',
    };
    return descriptions[key] || `צ׳קליסט פגישה ראשונה - ${key}`;
  };

  const getTabIcon = (key) => {
    if (key === 'phone_call') return ClipboardList;
    if (key.includes('apartment')) return Home;
    if (key.includes('office')) return Briefcase;
    if (key.includes('restaurant')) return RotateCcw; // Using rotate as placeholder or any other icon
    if (key.includes('retail')) return Building;
    return Building2;
  };

  const tabs = [
    { key: 'phone_call', label: 'שיחת טלפון' },
    { key: 'renovation_apartment', label: 'שיפוץ דירה' },
    { key: 'new_build_apartment', label: 'בנייה דירה' },
    { key: 'renovation_private_house', label: 'שיפוץ בית פרטי' },
    { key: 'new_build_private_house', label: 'בנייה בית פרטי' },
    { key: 'renovation_office', label: 'שיפוץ משרד' },
    { key: 'new_build_office', label: 'בנייה משרד' },
    { key: 'renovation_villa', label: 'שיפוץ וילה' },
    { key: 'new_build_villa', label: 'בנייה וילה' },
    { key: 'renovation_restaurant', label: 'שיפוץ מסעדה' },
    { key: 'new_build_restaurant', label: 'בנייה מסעדה' },
    { key: 'renovation_retail', label: 'שיפוץ חנות' },
    { key: 'new_build_retail', label: 'בנייה חנות' },
    { key: 'custom_project', label: 'פרויקט מותאם' },
  ];

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
          <span className="mr-3 text-slate-600">טוען צ׳קליסטים...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
            ניהול צ׳קליסטים לפי סוג פרויקט
          </CardTitle>
          <CardDescription>
            ערוך את הצ׳קליסטים המוצגים בשלבי שיחה ראשונה ופגישה ראשונה לכל סוג פרויקט
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="overflow-x-auto pb-2 mb-4">
              <TabsList className="inline-flex h-auto p-1 gap-2 min-w-max">
                {tabs.map(tab => {
                  const Icon = getTabIcon(tab.key);
                  return (
                    <TabsTrigger
                      key={tab.key}
                      value={tab.key}
                      className="flex items-center gap-2 py-2 px-4 data-[state=active]:bg-indigo-100 whitespace-nowrap"
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{tab.label}</span>
                      {hasChanges[tab.key] && (
                        <span className="w-2 h-2 bg-amber-500 rounded-full ml-1" />
                      )}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </div>

            {tabs.map(tab => (
              <TabsContent key={tab.key} value={tab.key}>
                <ChecklistEditor
                  checklistKey={tab.key}
                  items={checklists[tab.key] || []}
                  onChange={(idx, field, value) => handleItemChange(tab.key, idx, field, value)}
                  onAdd={() => handleAddItem(tab.key)}
                  onRemove={(idx) => handleRemoveItem(tab.key, idx)}
                  onDragEnd={(result) => handleDragEnd(result, tab.key)}
                  onSave={() => handleSave(tab.key)}
                  onReset={() => handleReset(tab.key)}
                  isSaving={isSaving[tab.key]}
                  hasChanges={hasChanges[tab.key]}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * ChecklistEditor - Editable list with drag-drop reordering
 */
function ChecklistEditor({ 
  checklistKey, 
  items, 
  onChange, 
  onAdd, 
  onRemove, 
  onDragEnd,
  onSave,
  onReset,
  isSaving,
  hasChanges
}) {
  return (
    <div className="space-y-4">
      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {items.length} פריטים
          </Badge>
          {hasChanges && (
            <Badge className="bg-amber-100 text-amber-800">
              <AlertCircle className="w-3 h-3 ml-1" />
              יש שינויים לא שמורים
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onReset}
            className="text-slate-600"
          >
            <RotateCcw className="w-4 h-4 ml-2" />
            אפס לברירת מחדל
          </Button>
          <Button
            onClick={onSave}
            disabled={isSaving || !hasChanges}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 ml-2" />
            )}
            שמור שינויים
          </Button>
        </div>
      </div>

      {/* Draggable List */}
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId={checklistKey}>
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {items.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`
                        flex items-center gap-3 p-3 rounded-lg border-2 transition-all
                        ${snapshot.isDragging 
                          ? 'border-indigo-400 bg-indigo-50 shadow-lg' 
                          : 'border-slate-200 bg-white hover:border-slate-300'
                        }
                      `}
                    >
                      {/* Drag Handle */}
                      <div
                        {...provided.dragHandleProps}
                        className="cursor-grab text-slate-400 hover:text-slate-600"
                      >
                        <GripVertical className="w-5 h-5" />
                      </div>

                      {/* Index Badge */}
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-600 flex-shrink-0">
                        {index + 1}
                      </div>

                      {/* Item Input */}
                      <Input
                        value={item.item}
                        onChange={(e) => onChange(index, 'item', e.target.value)}
                        placeholder="תוכן הפריט..."
                        className="flex-1"
                      />

                      {/* Delete Button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemove(index)}
                        className="text-slate-400 hover:text-red-500 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add Item Button */}
      <Button
        variant="outline"
        onClick={onAdd}
        className="w-full border-dashed border-2 hover:border-indigo-400 hover:bg-indigo-50"
      >
        <Plus className="w-4 h-4 ml-2" />
        הוסף פריט חדש
      </Button>
    </div>
  );
}