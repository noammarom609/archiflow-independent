import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { archiflow } from '@/api/archiflow';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from '@/utils/authHelpers';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  Search,
  FileText,
  Star,
  Clock,
  MoreVertical,
  Eye,
  Pencil,
  Trash2,
  Copy,
  Loader2,
  Filter,
  ChevronLeft,
  Shield
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import UnifiedTemplateEditor from '../components/proposals/UnifiedTemplateEditor';
import TemplatePreview from '../components/proposals/TemplatePreview';
import { showSuccess, showError } from '../components/utils/notifications';
import { seedAllProposalTemplates } from '../utils/seedProposalTemplates';

const statusLabels = {
  draft: { label: 'טיוטה', color: 'bg-slate-100 text-slate-700' },
  active: { label: 'פעילה', color: 'bg-green-100 text-green-700' },
  archived: { label: 'בארכיון', color: 'bg-amber-100 text-amber-700' },
};

const defaultSections = [
  {
    id: 'header',
    type: 'header',
    title: 'כותרת',
    visible: true,
    order: 0,
    content: {
      logo_url: '',
      company_name: 'שם החברה',
      tagline: 'סלוגן או תיאור קצר',
      contact_info: 'טלפון | אימייל | כתובת'
    }
  },
  {
    id: 'intro',
    type: 'intro',
    title: 'פתיח',
    visible: true,
    order: 1,
    content: {
      greeting: 'שלום {{ClientName}},',
      text: 'תודה על פנייתך אלינו. להלן הצעת המחיר עבור {{ProjectName}}.'
    }
  },
  {
    id: 'client_details',
    type: 'client_details',
    title: 'פרטי לקוח',
    visible: true,
    order: 2,
    content: {
      show_name: true,
      show_email: true,
      show_phone: true,
      show_address: true
    }
  },
  {
    id: 'services',
    type: 'services',
    title: 'פירוט שירותים',
    visible: true,
    order: 3,
    content: {
      description: 'להלן פירוט השירותים והעבודות הכלולים בהצעה זו:',
      items: []
    }
  },
  {
    id: 'pricing',
    type: 'pricing',
    title: 'טבלת מחירים',
    visible: true,
    order: 4,
    content: {
      items: [
        { description: 'תכנון אדריכלי', quantity: 1, unit: 'יח\'', price: 0 }
      ],
      show_subtotal: true,
      show_vat: true,
      vat_percent: 17
    }
  },
  {
    id: 'terms',
    type: 'terms',
    title: 'תנאים והערות',
    visible: true,
    order: 5,
    content: {
      payment_terms: 'תנאי תשלום: שוטף + 30',
      validity: 'ההצעה בתוקף ל-30 יום מתאריך הנפקתה.',
      notes: ''
    }
  },
  {
    id: 'summary',
    type: 'summary',
    title: 'סיכום',
    visible: true,
    order: 6,
    content: {
      text: 'נשמח לעמוד לרשותך לכל שאלה או הבהרה.',
      cta_text: 'לאישור ההצעה'
    }
  },
  {
    id: 'signature',
    type: 'signature',
    title: 'חתימה',
    visible: true,
    order: 7,
    content: {
      show_date: true,
      show_signature_line: true,
      signature_label: 'חתימת הלקוח'
    }
  }
];

const defaultVariables = [
  { key: 'ClientName', label: 'שם הלקוח', default_value: '' },
  { key: 'ProjectName', label: 'שם הפרויקט', default_value: '' },
  { key: 'TotalPrice', label: 'סכום כולל', default_value: '0' },
  { key: 'Date', label: 'תאריך', default_value: new Date().toLocaleDateString('he-IL') },
];

export default function ProposalTemplates({ onBack }) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [isSeeding, setIsSeeding] = useState(false);

  // Fetch current user (with bypass support)
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(archiflow),
  });

  // Fetch templates - Multi-tenant: Show system templates + own templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['proposalTemplates', user?.email],
    queryFn: async () => {
      const all = await archiflow.entities.ProposalTemplate.list('-updated_date');
      
      if (user?.app_role === 'super_admin') return all;
      
      // Show system templates (is_system=true) + own templates
      return all.filter(t => t.is_system === true || t.created_by === user?.email);
    },
    enabled: !!user,
  });

  // Create template mutation
  const createMutation = useMutation({
    mutationFn: (data) => archiflow.entities.ProposalTemplate.create(data),
    onSuccess: (newTemplate) => {
      queryClient.invalidateQueries({ queryKey: ['proposalTemplates'] });
      setSelectedTemplateId(newTemplate.id);
      setEditingTemplate(newTemplate);
      setIsEditing(true);
      showSuccess('תבנית חדשה נוצרה');
    },
    onError: () => showError('שגיאה ביצירת תבנית'),
  });

  // Update template mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => archiflow.entities.ProposalTemplate.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposalTemplates'] });
      showSuccess('התבנית נשמרה');
    },
    onError: () => showError('שגיאה בשמירת התבנית'),
  });

  // Delete template mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => archiflow.entities.ProposalTemplate.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposalTemplates'] });
      setSelectedTemplateId(null);
      setEditingTemplate(null);
      setIsEditing(false);
      showSuccess('התבנית נמחקה');
    },
    onError: () => showError('שגיאה במחיקת התבנית'),
  });

  // Filter templates
  const filteredTemplates = templates.filter(t => {
    const matchesSearch = t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         t.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
    return matchesSearch && matchesStatus;
  });



  // Create new template
  const handleCreateTemplate = () => {
    createMutation.mutate({
      name: 'תבנית חדשה',
      description: '',
      status: 'draft',
      sections: defaultSections,
      variables: defaultVariables,
      styling: {
        primary_color: '#4338ca',
        font_family: 'Heebo',
        logo_url: ''
      }
    });
  };

  // Duplicate template
  const handleDuplicate = (template) => {
    createMutation.mutate({
      ...template,
      id: undefined,
      name: `${template.name} (העתק)`,
      is_default: false,
      usage_count: 0,
      created_date: undefined,
      updated_date: undefined,
    });
  };

  // ✅ Seed all 13 project type templates
  const handleSeedTemplates = async () => {
    setIsSeeding(true);
    try {
      const results = await seedAllProposalTemplates();
      queryClient.invalidateQueries({ queryKey: ['proposalTemplates'] });
      
      if (results.success > 0) {
        showSuccess(`נוצרו ${results.success} תבניות בהצלחה!`);
      }
      if (results.failed > 0) {
        showError(`${results.failed} תבניות נכשלו`);
      }
    } catch (error) {
      console.error('Error seeding templates:', error);
      showError('שגיאה ביצירת תבניות');
    } finally {
      setIsSeeding(false);
    }
  };

  // Select template for editing
  const handleSelectTemplate = (template) => {
    setSelectedTemplateId(template.id);
    setEditingTemplate(template);
    setIsEditing(true);
    setIsPreview(false);
  };

  // Save template changes
  const handleSaveTemplate = (updatedTemplate) => {
    updateMutation.mutate({
      id: selectedTemplateId,
      data: updatedTemplate
    });
  };

  // Back to list
  const handleBackToList = () => {
    setSelectedTemplateId(null);
    setEditingTemplate(null);
    setIsEditing(false);
    setIsPreview(false);
  };

  // Notify layout to collapse sidebar when editing
  useEffect(() => {
    if (isEditing) {
      window.dispatchEvent(new CustomEvent('proposalEditorActive', { detail: { active: true } }));
    } else {
      window.dispatchEvent(new CustomEvent('proposalEditorActive', { detail: { active: false } }));
    }
    return () => {
      window.dispatchEvent(new CustomEvent('proposalEditorActive', { detail: { active: false } }));
    };
  }, [isEditing]);

  // If editing/previewing a template, show the editor
  if (isEditing && editingTemplate) {
    return (
      <div className="h-screen bg-slate-50 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={handleBackToList}>
              <ChevronLeft className="w-4 h-4 ml-1" />
              חזרה לתבניות
            </Button>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <h1 className="text-lg font-semibold text-slate-900">{editingTemplate.name}</h1>
              <p className="text-xs text-slate-500">עריכת תבנית</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant={isPreview ? 'default' : 'outline'}
              onClick={() => setIsPreview(!isPreview)}
            >
              <Eye className="w-4 h-4 ml-2" />
              {isPreview ? 'חזור לעריכה' : 'תצוגה מקדימה'}
            </Button>
            <Button
              onClick={() => handleSaveTemplate(editingTemplate)}
              disabled={updateMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : null}
              שמור תבנית
            </Button>
          </div>
        </div>

        {/* Editor / Preview */}
        <div className="flex-1 overflow-hidden">
          {isPreview ? (
            <TemplatePreview template={editingTemplate} />
          ) : (
            <UnifiedTemplateEditor
              template={editingTemplate}
              onChange={setEditingTemplate}
            />
          )}
        </div>
      </div>
    );
  }

  // Templates List View
  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Button 
              variant="ghost" 
              onClick={() => onBack ? onBack() : window.history.back()}
              className="mb-4 -mr-2 text-muted-foreground hover:text-foreground"
            >
              <ChevronLeft className="w-4 h-4 ml-1" />
              חזרה לספריית עיצוב
            </Button>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">תבניות הצעת מחיר</h1>
            <p className="text-slate-600">צור ונהל תבניות מקצועיות להצעות מחיר</p>
          </div>
          <div className="flex gap-2">
            {/* Seed Templates Button - show if less than 13 templates */}
            {templates?.length < 13 && (
              <Button
                onClick={handleSeedTemplates}
                disabled={isSeeding}
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                {isSeeding ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 ml-2" />
                )}
                צור תבניות בסיסיות
              </Button>
            )}
            
            <Button
              onClick={handleCreateTemplate}
              disabled={createMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
              ) : (
                <Plus className="w-4 h-4 ml-2" />
              )}
              תבנית חדשה
            </Button>
          </div>

        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="חיפוש תבניות..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Filter className="w-4 h-4 ml-2" />
                {statusFilter === 'all' ? 'כל הסטטוסים' : statusLabels[statusFilter]?.label}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setStatusFilter('all')}>
                כל הסטטוסים
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('active')}>
                פעילות
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('draft')}>
                טיוטות
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setStatusFilter('archived')}>
                בארכיון
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Templates Grid */}
        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              {searchQuery || statusFilter !== 'all' ? 'לא נמצאו תבניות' : 'אין תבניות עדיין'}
            </h3>
            <p className="text-slate-500 mb-6">
              {searchQuery || statusFilter !== 'all'
                ? 'נסה לשנות את החיפוש או הסינון'
                : 'צור את התבנית הראשונה שלך ותתחיל לשלוח הצעות מקצועיות'}
            </p>
            {!searchQuery && statusFilter === 'all' && (
              <div className="flex flex-col items-center gap-3">
                <Button onClick={handleCreateTemplate} className="bg-indigo-600 hover:bg-indigo-700">
                  <Plus className="w-4 h-4 ml-2" />
                  צור תבנית ראשונה
                </Button>
                <span className="text-slate-400">או</span>
                <Button 
                  onClick={handleSeedTemplates} 
                  disabled={isSeeding}
                  variant="outline"
                  className="border-purple-300 text-purple-700 hover:bg-purple-50"
                >
                  {isSeeding ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 ml-2" />
                  )}
                  צור 13 תבניות בסיסיות (לכל סוגי הפרויקטים)
                </Button>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredTemplates.map((template, index) => (
              <motion.div
                key={template.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card
                  className="group overflow-hidden border-slate-200 hover:shadow-lg hover:border-indigo-200 transition-all cursor-pointer"
                  onClick={() => handleSelectTemplate(template)}
                >
                  {/* Preview Thumbnail */}
                  <div className="h-40 bg-gradient-to-br from-slate-100 to-slate-50 relative overflow-hidden">
                    <div className="absolute inset-4 bg-white rounded-lg shadow-sm border border-slate-100 p-3">
                      <div className="h-2 w-16 bg-slate-200 rounded mb-2" />
                      <div className="h-1.5 w-full bg-slate-100 rounded mb-1" />
                      <div className="h-1.5 w-3/4 bg-slate-100 rounded mb-3" />
                      <div className="h-8 bg-slate-50 rounded" />
                    </div>
                    {template.is_system && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                          <Shield className="w-3 h-3 ml-1" />
                          תבנית מערכת
                        </Badge>
                      </div>
                    )}
                    {template.is_default && !template.is_system && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                          <Star className="w-3 h-3 ml-1" />
                          ברירת מחדל
                        </Badge>
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <Badge className={statusLabels[template.status]?.color}>
                        {statusLabels[template.status]?.label}
                      </Badge>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors">
                        {template.name}
                      </h3>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleSelectTemplate(template); }}>
                            <Pencil className="w-4 h-4 ml-2" />
                            ערוך
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDuplicate(template); }}>
                            <Copy className="w-4 h-4 ml-2" />
                            שכפל
                          </DropdownMenuItem>
                          {!template.is_system && (
                            <DropdownMenuItem
                              onClick={(e) => { e.stopPropagation(); deleteMutation.mutate(template.id); }}
                              className="text-red-600"
                            >
                              <Trash2 className="w-4 h-4 ml-2" />
                              מחק
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    {template.description && (
                      <p className="text-sm text-slate-500 mb-3 line-clamp-2">{template.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {template.usage_count || 0} שימושים
                      </span>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}