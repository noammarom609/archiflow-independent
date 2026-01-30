import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { archiflow } from '@/api/archiflow';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Settings, 
  Phone, 
  Users, 
  Plus, 
  Trash2, 
  GripVertical,
  Save,
  Loader2,
  RotateCcw,
  ClipboardList
} from 'lucide-react';
import { showSuccess, showError } from '../utils/notifications';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

// Default checklists (fallback if not in DB)
const defaultPhoneCallChecklist = [
  { id: 'intro', item: 'הצגה עצמית והמשרד', order: 0 },
  { id: 'project_type', item: 'סוג הפרויקט (שיפוץ/בניה/עיצוב)', order: 1 },
  { id: 'location', item: 'מיקום הנכס', order: 2 },
  { id: 'size', item: 'גודל הנכס (מ"ר)', order: 3 },
  { id: 'budget_range', item: 'טווח תקציבי משוער', order: 4 },
  { id: 'timeline', item: 'לוח זמנים רצוי', order: 5 },
  { id: 'urgency', item: 'דחיפות הפרויקט', order: 6 },
  { id: 'decision_makers', item: 'מקבלי ההחלטות', order: 7 },
  { id: 'how_found', item: 'איך הגיעו אלינו', order: 8 },
  { id: 'main_goals', item: 'מטרות עיקריות', order: 9 },
  { id: 'concerns', item: 'חששות או שאלות', order: 10 },
  { id: 'next_step', item: 'קביעת פגישה/שלב הבא', order: 11 },
];

const defaultMeetingChecklist = [
  { id: 'budget', item: 'תקציב ומסגרת כספית', order: 0 },
  { id: 'timeline', item: 'לוח זמנים רצוי', order: 1 },
  { id: 'style', item: 'סגנון עיצובי מועדף', order: 2 },
  { id: 'rooms', item: 'חדרים/אזורים לטיפול', order: 3 },
  { id: 'family', item: 'הרכב המשפחה/משתמשים', order: 4 },
  { id: 'special_needs', item: 'צרכים מיוחדים (נגישות, חיות מחמד וכו׳)', order: 5 },
  { id: 'priorities', item: 'סדרי עדיפויות', order: 6 },
  { id: 'references', item: 'רפרנסים והשראות', order: 7 },
  { id: 'colors', item: 'צבעים מועדפים/לא רצויים', order: 8 },
  { id: 'materials', item: 'חומרים מועדפים', order: 9 },
  { id: 'storage', item: 'צרכי אחסון', order: 10 },
  { id: 'lighting', item: 'העדפות תאורה', order: 11 },
];

function ChecklistEditor({ title, icon: Icon, settingKey, defaultItems }) {
  const queryClient = useQueryClient();
  const [items, setItems] = useState([]);
  const [newItemText, setNewItemText] = useState('');

  // Fetch existing setting
  const { data: existingSetting, isLoading } = useQuery({
    queryKey: ['systemSettings', settingKey],
    queryFn: async () => {
      const settings = await archiflow.entities.SystemSettings.filter({ setting_key: settingKey });
      return settings[0] || null;
    }
  });

  // Initialize items from DB or defaults
  useEffect(() => {
    if (existingSetting?.setting_value) {
      setItems(existingSetting.setting_value.sort((a, b) => a.order - b.order));
    } else if (!isLoading) {
      setItems(defaultItems);
    }
  }, [existingSetting, isLoading, defaultItems]);

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async (newItems) => {
      if (existingSetting?.id) {
        return archiflow.entities.SystemSettings.update(existingSetting.id, {
          setting_value: newItems
        });
      } else {
        return archiflow.entities.SystemSettings.create({
          setting_key: settingKey,
          setting_value: newItems,
          description: title
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['systemSettings', settingKey] });
      showSuccess('הצ׳קליסט נשמר בהצלחה!');
    },
    onError: () => showError('שגיאה בשמירה')
  });

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const reordered = Array.from(items);
    const [removed] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, removed);
    
    // Update order numbers
    const withOrder = reordered.map((item, idx) => ({ ...item, order: idx }));
    setItems(withOrder);
  };

  const addItem = () => {
    if (!newItemText.trim()) return;
    const newItem = {
      id: `item_${Date.now()}`,
      item: newItemText.trim(),
      order: items.length
    };
    setItems([...items, newItem]);
    setNewItemText('');
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id).map((item, idx) => ({ ...item, order: idx })));
  };

  const updateItem = (id, newText) => {
    setItems(items.map(item => item.id === id ? { ...item, item: newText } : item));
  };

  const resetToDefaults = () => {
    setItems(defaultItems);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="border-border">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Icon className="w-5 h-5 text-primary" />
          {title}
          <Badge variant="outline" className="mr-auto">{items.length} שאלות</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add new item */}
        <div className="flex gap-2">
          <Input
            placeholder="הוסף שאלה חדשה..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addItem()}
            className="flex-1"
          />
          <Button onClick={addItem} size="icon" variant="outline">
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Draggable list */}
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId={settingKey}>
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="space-y-2 max-h-[400px] overflow-y-auto"
              >
                {items.map((item, index) => (
                  <Draggable key={item.id} draggableId={item.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                          snapshot.isDragging 
                            ? 'bg-primary/10 border-primary shadow-lg' 
                            : 'bg-card border-border hover:border-primary/50'
                        }`}
                      >
                        <div {...provided.dragHandleProps} className="cursor-grab">
                          <GripVertical className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <span className="w-6 h-6 bg-primary/10 rounded-full flex items-center justify-center text-xs font-bold text-primary">
                          {index + 1}
                        </span>
                        <Input
                          value={item.item}
                          onChange={(e) => updateItem(item.id, e.target.value)}
                          className="flex-1 border-0 bg-transparent focus-visible:ring-0 p-0 h-auto"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => removeItem(item.id)}
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

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-border">
          <Button
            variant="outline"
            onClick={resetToDefaults}
            className="gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            איפוס לברירת מחדל
          </Button>
          <Button
            onClick={() => saveMutation.mutate(items)}
            disabled={saveMutation.isPending}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <Save className="w-4 h-4 ml-2" />
            )}
            שמור שינויים
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SystemSettingsTab() {
  const [activeChecklist, setActiveChecklist] = useState('phone');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
          <ClipboardList className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-foreground">ניהול צ׳קליסטים</h2>
          <p className="text-sm text-muted-foreground">התאם את שאלות הבירור לשיחת טלפון ופגישה ראשונה</p>
        </div>
      </div>

      <Tabs value={activeChecklist} onValueChange={setActiveChecklist}>
        <TabsList className="bg-muted/50 p-1 mb-6">
          <TabsTrigger value="phone" className="gap-2 data-[state=active]:bg-background">
            <Phone className="w-4 h-4" />
            שיחת טלפון ראשונה
          </TabsTrigger>
          <TabsTrigger value="meeting" className="gap-2 data-[state=active]:bg-background">
            <Users className="w-4 h-4" />
            פגישה ראשונה
          </TabsTrigger>
        </TabsList>

        <TabsContent value="phone">
          <ChecklistEditor
            title="צ׳קליסט שיחת טלפון ראשונה"
            icon={Phone}
            settingKey="phone_call_checklist"
            defaultItems={defaultPhoneCallChecklist}
          />
        </TabsContent>

        <TabsContent value="meeting">
          <ChecklistEditor
            title="צ׳קליסט פגישה ראשונה"
            icon={Users}
            settingKey="first_meeting_checklist"
            defaultItems={defaultMeetingChecklist}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}