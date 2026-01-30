import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ClipboardList, 
  Plus, 
  Trash2, 
  GripVertical, 
  Save, 
  RefreshCw,
  Home,
  Building,
  Building2,
  Briefcase,
  CheckCircle2,
  Phone,
  Users,
  Loader2
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { base44 } from '@/api/base44Client';
import { showSuccess, showError } from '../utils/notifications';
import {
  PROJECT_TYPES,
  loadChecklist,
  saveChecklist,
  defaultPhoneCallChecklist,
  defaultRenovationApartmentChecklist,
  defaultNewBuildApartmentChecklist,
  defaultRenovationOfficeChecklist,
  defaultNewBuildOfficeChecklist
} from '../utils/checklistLoader';

// Icon mapping
const projectTypeIcons = {
  renovation_apartment: Home,
  new_build_apartment: Building,
  renovation_office: Briefcase,
  new_build_office: Building2
};

// All checklist types config
const CHECKLIST_CONFIGS = [
  {
    key: 'phone_call_checklist',
    label: 'שיחה טלפונית ראשונה',
    icon: Phone,
    description: 'צ\'קליסט לשיחת ההיכרות הראשונה עם הלקוח',
    defaultItems: defaultPhoneCallChecklist
  },
  {
    key: 'first_meeting_checklist_renovation_apartment',
    label: PROJECT_TYPES.renovation_apartment.label,
    icon: Home,
    description: 'צ\'קליסט לפגישה ראשונה - פרויקט שיפוץ דירה',
    defaultItems: defaultRenovationApartmentChecklist
  },
  {
    key: 'first_meeting_checklist_new_build_apartment',
    label: PROJECT_TYPES.new_build_apartment.label,
    icon: Building,
    description: 'צ\'קליסט לפגישה ראשונה - בנייה חדשה דירה',
    defaultItems: defaultNewBuildApartmentChecklist
  },
  {
    key: 'first_meeting_checklist_renovation_office',
    label: PROJECT_TYPES.renovation_office.label,
    icon: Briefcase,
    description: 'צ\'קליסט לפגישה ראשונה - שיפוץ משרד',
    defaultItems: defaultRenovationOfficeChecklist
  },
  {
    key: 'first_meeting_checklist_new_build_office',
    label: PROJECT_TYPES.new_build_office.label,
    icon: Building2,
    description: 'צ\'קליסט לפגישה ראשונה - בנייה חדשה משרד',
    defaultItems: defaultNewBuildOfficeChecklist
  }
];

export default function ChecklistsSettingsTab() {
  const [activeTab, setActiveTab] = useState('phone_call_checklist');
  const [checklists, setChecklists] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState({});

  // Load all checklists on mount
  useEffect(() => {
    loadAllChecklists();
  }, []);

  const loadAllChecklists = async () => {
    setLoading(true);
    try {
      const loaded = {};
      for (const config of CHECKLIST_CONFIGS) {
        const items = await loadChecklist(config.key);
        loaded[config.key] = items;
      }
      setChecklists(loaded);
      setHasChanges({});
    } catch (error) {
      console.error('Error loading checklists:', error);
      showError('שגיאה בטעינת הצ\'קליסטים');
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = (checklistKey) => (result) => {
    if (!result.destination) return;
    
    const items = Array.from(checklists[checklistKey]);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setChecklists(prev => ({ ...prev, [checklistKey]: items }));
    setHasChanges(prev => ({ ...prev, [checklistKey]: true }));
  };

  const addItem = (checklistKey) => {
    const newItem = {
      id: `item_${Date.now()}`,
      item: '',
      checked: false,
      notes: ''
    };
    setChecklists(prev => ({
      ...prev,
      [checklistKey]: [...(prev[checklistKey] || []), newItem]
    }));
    setHasChanges(prev => ({ ...prev, [checklistKey]: true }));
  };

  const removeItem = (checklistKey, itemId) => {
    setChecklists(prev => ({
      ...prev,
      [checklistKey]: prev[checklistKey].filter(item => item.id !== itemId)
    }));
    setHasChanges(prev => ({ ...prev, [checklistKey]: true }));
  };

  const updateItem = (checklistKey, itemId, newText) => {
    setChecklists(prev => ({
      ...prev,
      [checklistKey]: prev[checklistKey].map(item =>
        item.id === itemId ? { ...item, item: newText } : item
      )
    }));
    setHasChanges(prev => ({ ...prev, [checklistKey]: true }));
  };

  const saveCurrentChecklist = async (checklistKey) => {
    setSaving(true);
    try {
      const config = CHECKLIST_CONFIGS.find(c => c.key === checklistKey);
      await saveChecklist(checklistKey, checklists[checklistKey], config?.description || '');
      setHasChanges(prev => ({ ...prev, [checklistKey]: false }));
      showSuccess('הצ\'קליסט נשמר בהצלחה!');
    } catch (error) {
      console.error('Error saving checklist:', error);
      showError('שגיאה בשמירת הצ\'קליסט');
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = (checklistKey) => {
    const config = CHECKLIST_CONFIGS.find(c => c.key === checklistKey);
    if (config) {
      setChecklists(prev => ({ ...prev, [checklistKey]: [...config.defaultItems] }));
      setHasChanges(prev => ({ ...prev, [checklistKey]: true }));
      showSuccess('הצ\'קליסט אופס לברירת המחדל');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">ניהול צ'קליסטים</h2>
          <p className="text-slate-600 mt-1">
            ערוך את צ'קליסטים של בירור צרכים לפי סוג פרויקט
          </p>
        </div>
        <Button variant="outline" onClick={loadAllChecklists}>
          <RefreshCw className="w-4 h-4 ml-2" />
          טען מחדש
        </Button>
      </div>

      {/* Tabs for different checklist types */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-2 bg-slate-100 p-2 rounded-xl">
          {CHECKLIST_CONFIGS.map((config) => {
            const Icon = config.icon;
            return (
              <TabsTrigger
                key={config.key}
                value={config.key}
                className="flex items-center gap-2 px-4 py-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg"
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{config.label}</span>
                {hasChanges[config.key] && (
                  <Badge className="bg-amber-500 text-white text-[10px] px-1 py-0">שונה</Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {CHECKLIST_CONFIGS.map((config) => {
          const Icon = config.icon;
          const items = checklists[config.key] || [];
          
          return (
            <TabsContent key={config.key} value={config.key} className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                        <Icon className="w-6 h-6 text-indigo-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{config.label}</CardTitle>
                        <CardDescription>{config.description}</CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">
                      {items.length} פריטים
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Draggable List */}
                  <DragDropContext onDragEnd={handleDragEnd(config.key)}>
                    <Droppable droppableId={config.key}>
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="space-y-2 mb-4"
                        >
                          {items.map((item, index) => (
                            <Draggable key={item.id} draggableId={item.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className={`flex items-center gap-3 p-3 bg-white border rounded-xl transition-all ${
                                    snapshot.isDragging ? 'shadow-lg border-indigo-300' : 'border-slate-200'
                                  }`}
                                >
                                  <div
                                    {...provided.dragHandleProps}
                                    className="cursor-grab text-slate-400 hover:text-slate-600"
                                  >
                                    <GripVertical className="w-5 h-5" />
                                  </div>
                                  <span className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center text-sm font-bold text-slate-600">
                                    {index + 1}
                                  </span>
                                  <Input
                                    value={item.item}
                                    onChange={(e) => updateItem(config.key, item.id, e.target.value)}
                                    placeholder="הזן פריט בצ'קליסט..."
                                    className="flex-1 border-0 bg-transparent focus:ring-0"
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeItem(config.key, item.id)}
                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50"
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
                    onClick={() => addItem(config.key)}
                    className="w-full border-dashed border-2 text-slate-600 hover:text-indigo-600 hover:border-indigo-300"
                  >
                    <Plus className="w-4 h-4 ml-2" />
                    הוסף פריט
                  </Button>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-6 pt-6 border-t">
                    <Button
                      variant="outline"
                      onClick={() => resetToDefault(config.key)}
                      className="text-slate-600"
                    >
                      <RefreshCw className="w-4 h-4 ml-2" />
                      אפס לברירת מחדל
                    </Button>
                    <Button
                      onClick={() => saveCurrentChecklist(config.key)}
                      disabled={saving || !hasChanges[config.key]}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4 ml-2" />
                      )}
                      שמור שינויים
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}
      </Tabs>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <ClipboardList className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-semibold text-blue-900">איך זה עובד?</h4>
              <p className="text-sm text-blue-800 mt-1">
                כל סוג פרויקט מקבל צ'קליסט בירור צרכים מותאם. בעת יצירת פרויקט חדש, נבחר הצ'קליסט המתאים לפי סוג הפרויקט.
                בתוך הפגישה הראשונה, ניתן גם לשנות את סוג הצ'קליסט בכל רגע.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}