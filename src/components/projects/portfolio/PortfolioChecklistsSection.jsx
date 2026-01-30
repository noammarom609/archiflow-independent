import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Phone, 
  Users, 
  CheckCircle2, 
  Circle,
  Save,
  Plus,
  Trash2,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { showSuccess, showError } from '@/components/utils/notifications';

export default function PortfolioChecklistsSection({ project, onUpdate }) {
  const [activeTab, setActiveTab] = useState('phone_call');
  const [phoneCallChecklist, setPhoneCallChecklist] = useState(project?.phone_call_checklist || []);
  const [clientNeedsChecklist, setClientNeedsChecklist] = useState(project?.client_needs_checklist || []);
  const [expandedItems, setExpandedItems] = useState({});
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync with project when it changes
  React.useEffect(() => {
    if (project?.phone_call_checklist) {
      setPhoneCallChecklist(project.phone_call_checklist);
    }
    if (project?.client_needs_checklist) {
      setClientNeedsChecklist(project.client_needs_checklist);
    }
  }, [project?.phone_call_checklist, project?.client_needs_checklist]);

  // Sort checklist: checked items first, then unchecked
  const sortChecklist = (checklist) => {
    return [...checklist].sort((a, b) => {
      if (a.checked && !b.checked) return -1;
      if (!a.checked && b.checked) return 1;
      return 0;
    });
  };

  const sortedPhoneCallChecklist = useMemo(() => sortChecklist(phoneCallChecklist), [phoneCallChecklist]);
  const sortedClientNeedsChecklist = useMemo(() => sortChecklist(clientNeedsChecklist), [clientNeedsChecklist]);

  const toggleExpanded = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const handleCheckChange = (checklistType, itemId, checked) => {
    if (checklistType === 'phone_call') {
      setPhoneCallChecklist(prev => 
        prev.map(item => item.id === itemId ? { ...item, checked } : item)
      );
    } else {
      setClientNeedsChecklist(prev => 
        prev.map(item => item.id === itemId ? { ...item, checked } : item)
      );
    }
    setHasChanges(true);
  };

  const handleNotesChange = (checklistType, itemId, notes) => {
    if (checklistType === 'phone_call') {
      setPhoneCallChecklist(prev => 
        prev.map(item => item.id === itemId ? { ...item, notes } : item)
      );
    } else {
      setClientNeedsChecklist(prev => 
        prev.map(item => item.id === itemId ? { ...item, notes } : item)
      );
    }
    setHasChanges(true);
  };

  const handleAddItem = (checklistType) => {
    const newItem = {
      id: `item_${Date.now()}`,
      item: '',
      checked: false,
      notes: ''
    };
    
    if (checklistType === 'phone_call') {
      setPhoneCallChecklist(prev => [...prev, newItem]);
    } else {
      setClientNeedsChecklist(prev => [...prev, newItem]);
    }
    setHasChanges(true);
    setExpandedItems(prev => ({ ...prev, [newItem.id]: true }));
  };

  const handleItemTextChange = (checklistType, itemId, text) => {
    if (checklistType === 'phone_call') {
      setPhoneCallChecklist(prev => 
        prev.map(item => item.id === itemId ? { ...item, item: text } : item)
      );
    } else {
      setClientNeedsChecklist(prev => 
        prev.map(item => item.id === itemId ? { ...item, item: text } : item)
      );
    }
    setHasChanges(true);
  };

  const handleDeleteItem = (checklistType, itemId) => {
    if (checklistType === 'phone_call') {
      setPhoneCallChecklist(prev => prev.filter(item => item.id !== itemId));
    } else {
      setClientNeedsChecklist(prev => prev.filter(item => item.id !== itemId));
    }
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!project?.id || !onUpdate) return;
    
    setSaving(true);
    try {
      const updateData = {};
      
      if (activeTab === 'phone_call' || hasChanges) {
        updateData.phone_call_checklist = phoneCallChecklist.map(item => ({
          id: item.id,
          item: item.item || '',
          checked: Boolean(item.checked),
          notes: item.notes || ''
        }));
      }
      
      if (activeTab === 'client_needs' || hasChanges) {
        updateData.client_needs_checklist = clientNeedsChecklist.map(item => ({
          id: item.id,
          item: item.item || '',
          checked: Boolean(item.checked),
          notes: item.notes || ''
        }));
      }
      
      await onUpdate(updateData);
      setHasChanges(false);
      showSuccess('הצ׳קליסטים נשמרו בהצלחה!');
    } catch (error) {
      console.error('Error saving checklists:', error);
      showError('שגיאה בשמירת הצ׳קליסטים');
    } finally {
      setSaving(false);
    }
  };

  const renderChecklistItem = (item, checklistType) => {
    const isExpanded = expandedItems[item.id];
    
    return (
      <motion.div
        key={item.id}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={`border rounded-xl p-4 transition-all ${
          item.checked 
            ? 'bg-green-50 border-green-200' 
            : 'bg-white border-slate-200 hover:border-slate-300'
        }`}
      >
        <div className="flex items-start gap-3">
          <Checkbox
            checked={item.checked}
            onCheckedChange={(checked) => handleCheckChange(checklistType, item.id, checked)}
            className="mt-1"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <Input
                value={item.item}
                onChange={(e) => handleItemTextChange(checklistType, item.id, e.target.value)}
                placeholder="תיאור הפריט..."
                className={`flex-1 border-0 p-0 h-auto text-sm font-medium bg-transparent focus-visible:ring-0 ${
                  item.checked ? 'text-green-800 line-through' : 'text-slate-900'
                }`}
              />
              
              {item.checked && (
                <Badge className="bg-green-100 text-green-700 text-xs">
                  <CheckCircle2 className="w-3 h-3 ml-1" />
                  הושלם
                </Badge>
              )}
            </div>
            
            {/* Notes toggle */}
            <button
              onClick={() => toggleExpanded(item.id)}
              className="flex items-center gap-1 mt-2 text-xs text-slate-500 hover:text-slate-700 transition-colors"
            >
              <MessageSquare className="w-3 h-3" />
              {item.notes ? 'הצג/ערוך הערות' : 'הוסף הערות'}
              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
            
            {/* Notes section */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <Textarea
                    value={item.notes || ''}
                    onChange={(e) => handleNotesChange(checklistType, item.id, e.target.value)}
                    placeholder="הוסף הערות..."
                    className="mt-2 text-sm min-h-[60px] resize-none"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => handleDeleteItem(checklistType, item.id)}
            className="text-slate-400 hover:text-red-500 h-8 w-8"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </motion.div>
    );
  };

  const renderChecklist = (checklist, checklistType, title, Icon, emptyMessage) => {
    const checkedCount = checklist.filter(item => item.checked).length;
    const totalCount = checklist.length;
    const progress = totalCount > 0 ? (checkedCount / totalCount) * 100 : 0;
    
    return (
      <div className="space-y-4">
        {/* Progress header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              checklistType === 'phone_call' ? 'bg-indigo-100' : 'bg-purple-100'
            }`}>
              <Icon className={`w-5 h-5 ${
                checklistType === 'phone_call' ? 'text-indigo-600' : 'text-purple-600'
              }`} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">{title}</h3>
              <p className="text-sm text-slate-500">
                {checkedCount} מתוך {totalCount} הושלמו ({Math.round(progress)}%)
              </p>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddItem(checklistType)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            הוסף פריט
          </Button>
        </div>
        
        {/* Progress bar */}
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${
              checklistType === 'phone_call' ? 'bg-indigo-500' : 'bg-purple-500'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        
        {/* Checklist items */}
        <div className="space-y-3">
          <AnimatePresence>
            {checklist.length > 0 ? (
              (checklistType === 'phone_call' ? sortedPhoneCallChecklist : sortedClientNeedsChecklist)
                .map(item => renderChecklistItem(item, checklistType))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-8 text-slate-500"
              >
                <Circle className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>{emptyMessage}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddItem(checklistType)}
                  className="mt-3 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  הוסף פריט ראשון
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with save button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900">צ׳קליסטים</h2>
          <p className="text-sm text-slate-500">מעקב אחר התקדמות השלבים הראשוניים</p>
        </div>
        
        <Button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="gap-2"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {saving ? 'שומר...' : 'שמור שינויים'}
        </Button>
      </div>
      
      {/* Tabs for different checklists */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="phone_call" className="gap-2">
            <Phone className="w-4 h-4" />
            שיחת טלפון
            {phoneCallChecklist.length > 0 && (
              <Badge variant="secondary" className="mr-2">
                {phoneCallChecklist.filter(i => i.checked).length}/{phoneCallChecklist.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="client_needs" className="gap-2">
            <Users className="w-4 h-4" />
            בירור צרכים
            {clientNeedsChecklist.length > 0 && (
              <Badge variant="secondary" className="mr-2">
                {clientNeedsChecklist.filter(i => i.checked).length}/{clientNeedsChecklist.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="phone_call" className="mt-6">
          {renderChecklist(
            phoneCallChecklist,
            'phone_call',
            'צ׳קליסט שיחת טלפון ראשונה',
            Phone,
            'אין פריטים בצ׳קליסט שיחת הטלפון'
          )}
        </TabsContent>
        
        <TabsContent value="client_needs" className="mt-6">
          {renderChecklist(
            clientNeedsChecklist,
            'client_needs',
            'צ׳קליסט בירור צרכי לקוח',
            Users,
            'אין פריטים בצ׳קליסט בירור הצרכים'
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}