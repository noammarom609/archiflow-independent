import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { archiflow } from '@/api/archiflow';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  FileText, 
  Send, 
  CheckCircle2, 
  XCircle, 
  Mail, 
  Sparkles,
  Loader2,
  Plus,
  Trash2,
  Eye,
  Upload,
  Download,
  Layout,
  PenTool,
  AlertCircle
} from 'lucide-react';
import { showSuccess, showError } from '../../utils/notifications';
import { addProposalToClientHistory, addStageChangeToClientHistory } from '../../utils/clientHistoryHelper';
import { useNotifications } from '@/hooks/use-notifications';
import TemplateSelectorModal from '../../proposals/TemplateSelectorModal';
import ProposalPreviewCard from '../../proposals/ProposalPreviewCard';
import DigitalSignatureDialog from '../../signature/DigitalSignatureDialog';
import { generatePDFFromElement } from '../../utils/pdfGenerator';
import ProjectMeetingSchedulerModal from '../scheduling/ProjectMeetingSchedulerModal';
import MissingDataDialog from './MissingDataDialog';

const subStages = [
  { id: 'create', label: 'יצירת הצעת מחיר', description: 'יצירה מ-AI, תבנית או ידנית' },
  { id: 'approval', label: 'אישור לקוח', description: 'שליחה וחתימה דיגיטלית' },
];

// Helper to calculate totals
const calculateTotals = (items, discountPercent, vatPercent) => {
  const safeDiscountPercent = Number(discountPercent) || 0;
  const safeVatPercent = (vatPercent !== undefined && vatPercent !== null) ? Number(vatPercent) : 17;
  
  const subtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const discountAmount = (subtotal * safeDiscountPercent) / 100;
  const afterDiscount = subtotal - discountAmount;
  const vatAmount = (afterDiscount * safeVatPercent) / 100;
  const totalAmount = afterDiscount + vatAmount;

  return { 
    subtotal, 
    discount_amount: discountAmount, 
    vat_amount: vatAmount, 
    total_amount: totalAmount 
  };
};

export default function ProposalStage({ project, onUpdate, onSubStageChange, currentSubStage }) {
  const queryClient = useQueryClient();
  const { sendTemplate } = useNotifications();
  const [activeSubStage, setActiveSubStage] = useState('create');
  const [completedSubStages, setCompletedSubStages] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [showMeetingScheduler, setShowMeetingScheduler] = useState(false);
  const [clientSignature, setClientSignature] = useState(null);
  const [creationMode, setCreationMode] = useState(null); // 'ai', 'template', 'manual'
  const [showMissingDataDialog, setShowMissingDataDialog] = useState(false);
  const [showClauseLibrary, setShowClauseLibrary] = useState(false);

  // Track if change came from parent to prevent loops
  const isExternalChange = React.useRef(false);

  // Sync from parent Stepper when sub-stage is clicked there
  React.useEffect(() => {
    if (currentSubStage) {
      const reverseMap = {
        'create_proposal': 'create',
        'proposal_approval': 'approval',
        // Legacy mappings for backward compatibility
        'initial_proposal': 'create',
        'formal_proposal': 'create',
      };
      const mappedSubStage = reverseMap[currentSubStage];
      if (mappedSubStage && mappedSubStage !== activeSubStage) {
        isExternalChange.current = true;
        setActiveSubStage(mappedSubStage);
      }
    }
  }, [currentSubStage]);

  // Notify parent of sub-stage changes (only if internal change)
  React.useEffect(() => {
    if (isExternalChange.current) {
      isExternalChange.current = false;
      return;
    }
    if (onSubStageChange) {
      const subStageMap = { create: 'create_proposal', approval: 'proposal_approval' };
      onSubStageChange(subStageMap[activeSubStage] || activeSubStage);
    }
  }, [activeSubStage]);

  const [proposalData, setProposalData] = useState({
    title: project?.name ? `הצעת מחיר - ${project.name}` : 'הצעת מחיר',
    scope_of_work: '',
    items: [
      { description: 'תכנון אדריכלי', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 },
    ],
    subtotal: 0,
    discount_percent: 0,
    discount_amount: 0,
    vat_percent: 17,
    vat_amount: 0,
    total_amount: 0,
    payment_terms: 'שוטף + 30',
    payment_schedule: [],
    validity_days: 30,
    terms_and_conditions: 'ההצעה בתוקף ל-30 יום מתאריך הנפקתה.',
    notes: '',
    template_id: null,
  });

  // Apply template data when selected
  const applyTemplate = (template) => {
    setSelectedTemplate(template);
    
    if (!template) return;

    // Extract data from template sections
    const termsSection = template.sections?.find(s => s.type === 'terms');
    const pricingSection = template.sections?.find(s => s.type === 'pricing');
    const introSection = template.sections?.find(s => s.type === 'intro');
    const servicesSection = template.sections?.find(s => s.type === 'services');

    // Resolve items from template.items (new structure) or pricingSection (legacy/visual structure)
    let templateItems = [];
    if (template.items && template.items.length > 0) {
      templateItems = template.items.map(item => ({
        description: item.title || item.description,
        quantity: Number(item.quantity) || 1,
        unit: 'יח\'',
        unit_price: Number(item.price) || 0,
        total: (Number(item.quantity) || 1) * (Number(item.price) || 0)
      }));
    } else if (pricingSection?.content?.items && pricingSection.content.items.length > 0) {
      templateItems = pricingSection.content.items;
    } else {
        // Fallback if no items found in template
        templateItems = [{ description: 'תכנון אדריכלי', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 }];
    }

    const calculated = calculateTotals(
        templateItems, 
        proposalData.discount_percent, 
        pricingSection?.content?.vat_percent || proposalData.vat_percent
    );

    setProposalData(prev => ({
      ...prev,
      template_id: template.id,
      items: templateItems,
      ...calculated,
      payment_terms: termsSection?.content?.payment_terms || prev.payment_terms,
      terms_and_conditions: termsSection?.content?.validity || prev.terms_and_conditions,
      notes: termsSection?.content?.notes || prev.notes,
      vat_percent: pricingSection?.content?.vat_percent || prev.vat_percent,
      scope_of_work: servicesSection?.content?.description || introSection?.content?.text?.replace(/\{\{.*?\}\}/g, '') || prev.scope_of_work,
    }));

    // Update proposal in DB with all template data immediately
    if (existingProposals.length > 0) {
      updateProposalMutation.mutate({
        id: existingProposals[0].id,
        data: { 
          template_id: template.id,
          items: templateItems,
          scope_of_work: servicesSection?.content?.description || introSection?.content?.text?.replace(/\{\{.*?\}\}/g, '') || proposalData.scope_of_work,
          payment_terms: termsSection?.content?.payment_terms || proposalData.payment_terms,
          terms_and_conditions: termsSection?.content?.validity || proposalData.terms_and_conditions,
          notes: termsSection?.content?.notes || proposalData.notes,
          vat_percent: pricingSection?.content?.vat_percent || proposalData.vat_percent,
          ...calculated
        }
      });
    }

    // Update template usage count
    archiflow.entities.ProposalTemplate.update(template.id, {
      usage_count: (template.usage_count || 0) + 1,
      last_used: new Date().toISOString()
    });

    showSuccess(`תבנית "${template.name}" הוחלה בהצלחה`);
  };

  // Fetch existing proposals for this project
  const { data: existingProposals = [] } = useQuery({
    queryKey: ['proposals', project?.id],
    queryFn: () => project?.id 
      ? archiflow.entities.Proposal.filter({ project_id: project.id }, '-created_date')
      : Promise.resolve([]),
    enabled: !!project?.id,
  });

  // Fetch client data for auto-population
  const { data: clientData } = useQuery({
    queryKey: ['client', project?.client_id],
    queryFn: () => project?.client_id 
      ? archiflow.entities.Client.filter({ id: project.client_id })
      : Promise.resolve([]),
    enabled: !!project?.client_id,
    select: (data) => data?.[0] || null,
  });

  // ✅ Fetch template by ID when proposal has a saved template
  // Get template ID from existing proposal OR current state
  const savedTemplateId = existingProposals[0]?.template_id || proposalData.template_id;
  
  const { data: savedTemplate, isLoading: templateLoading } = useQuery({
    queryKey: ['proposalTemplate', savedTemplateId],
    queryFn: async () => {
      if (!savedTemplateId) return null;
      console.log('📋 Fetching template by ID:', savedTemplateId);
      const templates = await archiflow.entities.ProposalTemplate.filter({ id: savedTemplateId });
      console.log('📋 Fetched template:', templates[0]?.name || 'not found');
      return templates[0] || null;
    },
    // Always fetch if we have an ID - don't prevent based on current selection
    enabled: !!savedTemplateId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // ✅ Set selected template from saved data when it loads (only if not already set by user)
  React.useEffect(() => {
    // Only auto-set template if:
    // 1. We have a saved template from DB
    // 2. User hasn't manually selected a different template in this session
    if (savedTemplate && !selectedTemplate) {
      console.log('✅ Auto-loading saved template:', savedTemplate.name);
      setSelectedTemplate(savedTemplate);
    }
  }, [savedTemplate]); // Removed selectedTemplate from deps to prevent loops

  // ✅ Fetch saved signature from DocumentSignature when proposal is approved
  // Check both project.proposal_signature_id AND the existingProposals for approved status
  const isProposalApproved = existingProposals[0]?.status === 'approved';
  const savedSignatureId = project?.proposal_signature_id;
  
  const { data: savedSignature, isLoading: signatureLoading } = useQuery({
    queryKey: ['proposalSignature', savedSignatureId],
    queryFn: async () => {
      if (!savedSignatureId) return null;
      console.log('🔏 Fetching signature by ID:', savedSignatureId);
      const signatures = await archiflow.entities.DocumentSignature.filter({ id: savedSignatureId });
      console.log('🔏 Fetched signature:', signatures[0] ? 'found' : 'not found');
      return signatures[0] || null;
    },
    // Fetch if we have an ID AND proposal is approved
    enabled: !!savedSignatureId && isProposalApproved,
    staleTime: 5 * 60 * 1000,
  });

  // ✅ Get the actual signature data (image or digital_approval)
  const getSignatureData = () => {
    // Priority 1: Client just signed in this session
    if (clientSignature) {
      console.log('🔏 Using session signature');
      return clientSignature;
    }
    
    // Priority 2: Saved signature from DB with actual image data
    if (savedSignature?.signature_data) {
      const sigData = savedSignature.signature_data;
      // Check if it's a real base64 image (not just the string 'digital_approval')
      if (sigData.startsWith('data:image')) {
        console.log('🔏 Using saved signature image from DB');
        return sigData;
      }
    }
    
    // Priority 3: If proposal is approved but no image, show digital approval badge
    if (isProposalApproved) {
      console.log('🔏 Showing digital approval badge');
      return 'digital_approval';
    }
    
    return null;
  };

  // Fetch clause library
  const { data: clauseLibrary = [] } = useQuery({
    queryKey: ['proposalClauses'],
    queryFn: () => archiflow.entities.ProposalClause.list(),
  });

  // Group clauses by category
  const clausesByCategory = clauseLibrary.reduce((acc, clause) => {
    const cat = clause.category || 'כללי';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(clause);
    return acc;
  }, {});

  // Load existing proposal data if available
  useEffect(() => {
    if (existingProposals.length > 0) {
      const latest = existingProposals[0];
      
      // Recalculate totals to fix any legacy bad data
      const calculated = calculateTotals(
        latest.items || [], 
        latest.discount_percent || 0, 
        latest.vat_percent !== undefined ? latest.vat_percent : 17
      );

      setProposalData(prev => ({
        ...prev,
        title: latest.title || prev.title,
        scope_of_work: latest.scope_of_work || '',
        items: latest.items?.length > 0 ? latest.items : prev.items,
        
        // Use calculated values
        ...calculated,
        
        discount_percent: latest.discount_percent || 0,
        vat_percent: latest.vat_percent !== undefined ? latest.vat_percent : 17,
        
        payment_terms: latest.payment_terms || prev.payment_terms,
        payment_schedule: latest.payment_schedule || [],
        validity_days: latest.validity_days || 30,
        terms_and_conditions: latest.terms_and_conditions || prev.terms_and_conditions,
        notes: latest.notes || '',
        template_id: latest.template_id || prev.template_id,
      }));

      // Set completed stages based on proposal status
      if (latest.status === 'sent' || latest.status === 'viewed' || latest.status === 'approved') {
        setCompletedSubStages(['create']);
        setActiveSubStage('approval');
      } else if (latest.items?.length > 0 && latest.total_amount > 0) {
        // Proposal exists with data - show editor mode
        setCreationMode('manual');
      }
    }
  }, [existingProposals]);

  // Create proposal mutation
  const createProposalMutation = useMutation({
    mutationFn: (data) => archiflow.entities.Proposal.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    },
  });

  // Update proposal mutation
  const updateProposalMutation = useMutation({
    mutationFn: ({ id, data }) => archiflow.entities.Proposal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
    },
  });

  // Update item
  const updateItem = (index, field, value) => {
    const newItems = [...proposalData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Recalculate item total
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }

    const totals = calculateTotals(newItems, proposalData.discount_percent, proposalData.vat_percent);
    setProposalData(prev => ({
      ...prev,
      items: newItems,
      ...totals,
    }));
  };

  // Add item
  const addItem = () => {
    setProposalData(prev => ({
      ...prev,
      items: [...prev.items, { description: '', quantity: 1, unit: 'יח\'', unit_price: 0, total: 0 }],
    }));
  };

  // Add item from clause library
  const addItemFromClause = (clause) => {
    const newItem = {
      description: clause.title + (clause.description ? ` - ${clause.description}` : ''),
      quantity: 1,
      unit: clause.unit || 'יח\'',
      unit_price: clause.default_price || 0,
      total: clause.default_price || 0,
    };
    const newItems = [...proposalData.items, newItem];
    const totals = calculateTotals(newItems, proposalData.discount_percent, proposalData.vat_percent);
    setProposalData(prev => ({
      ...prev,
      items: newItems,
      ...totals,
    }));
    showSuccess(`סעיף "${clause.title}" נוסף להצעה`);
  };

  // Remove item
  const removeItem = (index) => {
    const newItems = proposalData.items.filter((_, i) => i !== index);
    const totals = calculateTotals(newItems, proposalData.discount_percent, proposalData.vat_percent);
    setProposalData(prev => ({
      ...prev,
      items: newItems,
      ...totals,
    }));
  };

  // ✅ Helper to get AI data from new ai_insights or legacy ai_summary
  const getAIData = () => {
    // Prefer new ai_insights structure
    if (project?.ai_insights && Object.keys(project.ai_insights).length > 0) {
      const ins = project.ai_insights;
      return {
        client_needs: (ins.client_needs || []).map(n => n.value || n),
        explicit_needs: (ins.explicit_needs || []).map(n => n.value || n),
        implicit_needs: (ins.implicit_needs || []).map(n => n.value || n),
        style_preferences: (ins.style_preferences || []).map(n => n.value || n),
        budget_estimate: ins.budget_estimate?.value || '',
        timeline_estimate: ins.timeline_estimate?.value || '',
        summary: ins.summary?.value || '',
        hasContent: true
      };
    }
    // Fallback to legacy ai_summary
    if (project?.ai_summary) {
      return {
        client_needs: project.ai_summary.client_needs || [],
        explicit_needs: project.ai_summary.explicit_needs || [],
        implicit_needs: project.ai_summary.implicit_needs || [],
        style_preferences: project.ai_summary.style_preferences || [],
        budget_estimate: project.ai_summary.budget_estimate || '',
        timeline_estimate: project.ai_summary.timeline_estimate || '',
        summary: project.ai_summary.summary || '',
        hasContent: !!(
          project.ai_summary.client_needs?.length > 0 ||
          project.ai_summary.explicit_needs?.length > 0 ||
          project.ai_summary.budget_estimate ||
          project.ai_summary.summary
        )
      };
    }
    return { client_needs: [], explicit_needs: [], implicit_needs: [], style_preferences: [], budget_estimate: '', timeline_estimate: '', summary: '', hasContent: false };
  };

  const aiData = getAIData();

  // Check what's missing for AI generation
  const getMissingDataForAI = () => {
    const missing = [];
    // Only AI content is strictly required now, recording is optional if we have insights
    if (!aiData.hasContent) {
      missing.push('ניתוח AI מהשיחות');
    }
    return missing;
  };

  // Check if AI has actual content
  const hasAISummaryContent = aiData.hasContent;
  
  const canGenerateFromAI = hasAISummaryContent && (project?.first_call_recording_id || project?.first_meeting_recording_id);

  // Handle saving missing data from dialog
  const handleSaveMissingData = async (data) => {
    if (onUpdate) {
      await onUpdate(data);
    }
    // After saving, try to generate again
    setTimeout(() => {
      generateFromAI(true); // Skip missing data check
    }, 500);
  };

  // Generate proposal from AI
  const generateFromAI = async (skipMissingCheck = false) => {
    const missingData = getMissingDataForAI();
    if (!skipMissingCheck && missingData.length > 0) {
      // Show the dialog instead of just an error
      setShowMissingDataDialog(true);
      return;
    }

    setIsGenerating(true);
    try {
      // Merge style preferences from client and project (using new aiData helper)
      const allStylePreferences = [
        ...aiData.style_preferences,
        ...(clientData?.preferences?.styles || []),
      ];
      const uniqueStyles = [...new Set(allStylePreferences)];

      // Merge all needs
      const allNeeds = [...new Set([
        ...aiData.client_needs,
        ...aiData.explicit_needs,
        ...aiData.implicit_needs
      ])];

      // Fetch clause library for AI context
      const allClauses = await archiflow.entities.ProposalClause.list();
      const clausesContext = allClauses.map(c => `- ${c.title}: ${c.description} (קטגוריה: ${c.category})`).join('\n');

      const result = await archiflow.integrations.Core.InvokeLLM({
        prompt: `צור הצעת מחיר לפרויקט אדריכלות בהתבסס על המידע הבא:
        
פרויקט: ${project.name}
סוג פרויקט: ${project.project_type || 'מגורים'}
לקוח: ${project.client}
תקציב משוער: ${aiData.budget_estimate || project.budget || 'לא צוין'}
צרכים ודרישות: ${allNeeds.length > 0 ? allNeeds.join(', ') : 'לא צוינו'}

הנחיה קריטית: עליך לבנות את הצעת המחיר *אך ורק* על בסיס ספריית הסעיפים הבאה. בחר את הסעיפים הרלוונטיים ביותר לפרויקט זה מתוך הרשימה. אל תמציא סעיפים חדשים אלא אם זה הכרחי לחלוטין.

ספריית סעיפים זמינה:
${clausesContext}

הנחיות נוספות:
1. התאם את הכמויות לגודל ומורכבות הפרויקט (למשל, מספר פגישות ליווי).
2. תן הערכת מחיר ריאלית בשקלים לכל סעיף (אם המחיר 0 בספרייה, תן הערכה).
3. סדר את הפריטים בסדר הגיוני (פתיחה, תכנון, ליווי, פיקוח).`,
        response_json_schema: {
          type: 'object',
          properties: {
            scope_of_work: { type: 'string' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  description: { type: 'string' },
                  quantity: { type: 'number' },
                  unit: { type: 'string' },
                  unit_price: { type: 'number' },
                  total: { type: 'number' }
                }
              }
            },
            payment_terms: { type: 'string' },
            notes: { type: 'string' }
          }
        }
      });

      const totals = calculateTotals(result.items || [], 0, proposalData.vat_percent);
      setProposalData(prev => ({
        ...prev,
        scope_of_work: result.scope_of_work || '',
        items: result.items || prev.items,
        payment_terms: result.payment_terms || prev.payment_terms,
        notes: result.notes || '',
        ...totals,
      }));

      showSuccess('הצעת מחיר נוצרה בהצלחה!');
      setCreationMode('ai');

    } catch (error) {
      console.error('Error generating proposal:', error);
      showError('שגיאה ביצירת ההצעה');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save proposal
  const saveProposal = async (status = 'draft') => {
    try {
      const proposalPayload = {
        ...proposalData,
        project_id: project?.id,
        project_name: project?.name,
        client_id: project?.client_id,
        client_name: project?.client,
        client_email: project?.client_email,
        status,
        type: 'formal',
      };

      if (existingProposals.length > 0) {
        await updateProposalMutation.mutateAsync({ 
          id: existingProposals[0].id, 
          data: proposalPayload 
        });
      } else {
        await createProposalMutation.mutateAsync(proposalPayload);
      }

      if (status === 'draft') {
        showSuccess('ההצעה נשמרה!');
      }

      // Update project with proposal ID
      if (project?.id && onUpdate) {
        await onUpdate({ proposal_id: existingProposals[0]?.id });
      }

    } catch (error) {
      console.error('Error saving proposal:', error);
      showError('שגיאה בשמירת ההצעה');
    }
  };

  // Helper to generate and save PDF
  const saveProposalPDF = async (status, filename) => {
    try {
      const pdfFile = await generatePDFFromElement('proposal-preview-container', filename);
      const { file_url } = await archiflow.integrations.Core.UploadFile({ file: pdfFile });
      
      await archiflow.entities.Document.create({
        title: filename.replace('.pdf', ''),
        file_url: file_url,
        file_type: 'pdf',
        category: 'proposal',
        project_id: project?.id ? String(project.id) : undefined,
        project_name: project?.name,
        status: 'active',
        description: `הצעת מחיר ${status === 'sent' ? 'נשלחה' : 'חתומה'} - ${new Date().toLocaleDateString('he-IL')}`
      });
      
      return file_url;
    } catch (error) {
      console.error('Error saving PDF:', error);
      return null; // Don't block flow if PDF fails
    }
  };

  // Send proposal
  const sendProposal = async () => {
    if (!project?.client_email) {
      // Scroll to top so user sees the error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showError('אין כתובת אימייל ללקוח - הוסף אימייל בכרטיס הלקוח');
      return;
    }

    setIsSending(true);
    try {
      await saveProposal('sent');
      
      // Generate and save PDF
      await saveProposalPDF('sent', `הצעת מחיר - ${project?.name}.pdf`);

      // Create approval link for client
      const approvalUrl = `${window.location.origin}/PublicApproval?id=${project.id}&type=proposal&token=${Math.random().toString(36).substring(7)}`;

      await archiflow.integrations.Core.SendEmail({
        to: project.client_email,
        subject: `הצעת מחיר לאישור - ${project.name}`,
        body: `שלום ${project.client},

מצורפת הצעת מחיר עבור פרויקט: ${project.name}

סכום כולל (כולל מע"מ): ₪${proposalData.total_amount.toLocaleString()}
תנאי תשלום: ${proposalData.payment_terms}
תוקף ההצעה: ${proposalData.validity_days} ימים

לצפייה ואישור ההצעה, לחץ על הלינק:
${approvalUrl}

בברכה,
ArchiFlow`
      });

      // Add to client history
      if (project?.client_id && existingProposals[0]) {
        await addProposalToClientHistory(project.client_id, {
          ...existingProposals[0],
          status: 'sent',
          total_amount: proposalData.total_amount
        }, project);
      }

      // Send push notification to client (if they have a user account)
      if (project?.client_id) {
        sendTemplate('proposalSent', project.client_id, {
          projectName: project.name,
          projectId: project.id,
          architectName: project.architect || 'האדריכל',
          amount: proposalData.total_amount?.toLocaleString(),
          approvalUrl
        });
      }

      // Scroll to top so user sees the success message
      window.scrollTo({ top: 0, behavior: 'smooth' });
      showSuccess('הצעת מחיר נשלחה ללקוח עם לינק לאישור!');
      setCompletedSubStages(['create']);
      setActiveSubStage('approval');

    } catch (error) {
      console.error('Error sending proposal:', error);
      showError('שגיאה בשליחת ההצעה');
    } finally {
      setIsSending(false);
    }
  };

  // Mark as approved with signature
  const markAsApproved = async () => {
    try {
      if (existingProposals.length > 0) {
        await updateProposalMutation.mutateAsync({
          id: existingProposals[0].id,
          data: { status: 'approved', approved_date: new Date().toISOString().split('T')[0] }
        });
      }

      // Create signature record
      const signatureRecord = await archiflow.entities.DocumentSignature.create({
        document_id: existingProposals[0]?.id || 'proposal',
        document_title: `הצעת מחיר - ${project?.name}`,
        document_type: 'proposal',
        signer_id: project?.client_id || 'client',
        signer_name: project?.client || 'לקוח',
        signer_role: 'client',
        signature_data: 'digital_approval',
        timestamp: new Date().toISOString(),
        verified: true,
        project_id: project?.id,
        notes: `הצעה אושרה בסכום ₪${proposalData.total_amount.toLocaleString()}`
      });
      
      // Generate and save signed PDF
      await saveProposalPDF('approved', `הצעת מחיר חתומה - ${project?.name}.pdf`);

      // Move to next stage
      if (onUpdate) {
        await onUpdate({ 
          status: 'gantt',
          proposal_signature_id: signatureRecord.id
        });
      }
      
      // Add to client history
      if (project?.client_id) {
        await addStageChangeToClientHistory(project.client_id, 'gantt', project);
      }

      showSuccess('מעולה! ההצעה אושרה וחתומה - ממשיכים ליצירת גנט');
      setCompletedSubStages(['create', 'approval']);

    } catch (error) {
      console.error('Error approving proposal:', error);
      showError('שגיאה באישור ההצעה');
    }
  };

  const formatCurrency = (amount) => `₪${(amount || 0).toLocaleString()}`;

  // Replace template variables with actual data
  const replaceVariables = (text) => {
    if (!text) return text;
    return text
      .replace(/\{\{ClientName\}\}/g, project?.client || '')
      .replace(/\{\{ProjectName\}\}/g, project?.name || '')
      .replace(/\{\{ClientEmail\}\}/g, project?.client_email || '')
      .replace(/\{\{ClientPhone\}\}/g, project?.client_phone || '')
      .replace(/\{\{TotalPrice\}\}/g, formatCurrency(proposalData.total_amount))
      .replace(/\{\{Subtotal\}\}/g, formatCurrency(proposalData.subtotal))
      .replace(/\{\{VAT\}\}/g, formatCurrency(proposalData.vat_amount))
      .replace(/\{\{Date\}\}/g, new Date().toLocaleDateString('he-IL'));
  };

  return (
    <div className="space-y-6">
      {/* Missing Data Dialog */}
      <MissingDataDialog
        isOpen={showMissingDataDialog}
        onClose={() => setShowMissingDataDialog(false)}
        missingFields={getMissingDataForAI()}
        project={project}
        onSave={handleSaveMissingData}
      />

      {/* Meeting Scheduler Modal */}
      <ProjectMeetingSchedulerModal
        isOpen={showMeetingScheduler}
        onClose={() => setShowMeetingScheduler(false)}
        project={project}
        meetingTitle={`פגישת הצגת הצעה - ${project?.name || ''}`}
        meetingContext={`הצגת הצעת מחיר ללקוח ${project?.client || ''}\nסכום: ₪${proposalData.total_amount?.toLocaleString()}`}
      />

      {/* Digital Signature Dialog */}
      <DigitalSignatureDialog
        isOpen={showSignatureDialog}
        onClose={() => setShowSignatureDialog(false)}
        document={{
          id: existingProposals[0]?.id || 'proposal',
          title: proposalData.title,
          file_type: 'proposal',
          project_id: project?.id,
        }}
        signerInfo={{
          id: project?.client_id || 'client',
          name: project?.client || 'לקוח',
          role: 'client',
        }}
        onSignatureComplete={(signatureImageData) => {
          setClientSignature(signatureImageData);
        }}
      />

      {/* Sub-Stage Content - No navigation tabs, controlled by Stepper */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubStage}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {/* Create Proposal - Unified Stage */}
          {activeSubStage === 'create' && (
            <div className="space-y-6">
              {/* Creation Mode Selection - Only show if no mode selected yet */}
              {!creationMode && (
                <Card className="border-slate-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-cyan-600" />
                      יצירת הצעת מחיר
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-slate-600 mb-6">בחר את הדרך בה תרצה ליצור את הצעת המחיר:</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* AI Option */}
                      <div
                        onClick={() => canGenerateFromAI && setCreationMode('ai')}
                        className={`relative rounded-xl p-6 text-center cursor-pointer transition-all border-2 ${
                          canGenerateFromAI 
                            ? 'bg-purple-50 border-purple-200 hover:border-purple-400 hover:shadow-md' 
                            : 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className={`w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center ${canGenerateFromAI ? 'bg-purple-100' : 'bg-slate-200'}`}>
                          <Sparkles className={`w-7 h-7 ${canGenerateFromAI ? 'text-purple-600' : 'text-slate-400'}`} />
                        </div>
                        <h3 className={`font-semibold mb-2 ${canGenerateFromAI ? 'text-purple-900' : 'text-slate-600'}`}>
                          יצירה עם AI
                        </h3>
                        <p className={`text-sm ${canGenerateFromAI ? 'text-purple-700' : 'text-slate-500'}`}>
                          הצעה אוטומטית מניתוח השיחות
                        </p>
                        {!canGenerateFromAI && (
                          <Badge className="absolute top-2 left-2 bg-amber-100 text-amber-700 text-xs">
                            נדרש ניתוח שיחה
                          </Badge>
                        )}
                      </div>

                      {/* Template Option */}
                      <div
                        onClick={() => setShowTemplateSelector(true)}
                        className="rounded-xl p-6 text-center cursor-pointer transition-all border-2 bg-cyan-50 border-cyan-200 hover:border-cyan-400 hover:shadow-md"
                      >
                        <div className="w-14 h-14 bg-cyan-100 rounded-xl mx-auto mb-4 flex items-center justify-center">
                          <Layout className="w-7 h-7 text-cyan-600" />
                        </div>
                        <h3 className="font-semibold text-cyan-900 mb-2">מתבנית</h3>
                        <p className="text-sm text-cyan-700">בחר תבנית מעוצבת מהספרייה</p>
                      </div>

                      {/* Manual Option */}
                      <div
                        onClick={() => setCreationMode('manual')}
                        className="rounded-xl p-6 text-center cursor-pointer transition-all border-2 bg-slate-50 border-slate-200 hover:border-slate-400 hover:shadow-md"
                      >
                        <div className="w-14 h-14 bg-slate-200 rounded-xl mx-auto mb-4 flex items-center justify-center">
                          <PenTool className="w-7 h-7 text-slate-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900 mb-2">יצירה ידנית</h3>
                        <p className="text-sm text-slate-600">מלא את ההצעה בעצמך</p>
                      </div>
                    </div>

                    {/* AI Warning if not available */}
                    {!canGenerateFromAI && (
                      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4 text-right">
                        <p className="font-semibold text-amber-800 mb-2 flex items-center gap-2 justify-end">
                          <span>ליצירה עם AI נדרש:</span>
                          <AlertCircle className="w-4 h-4" />
                        </p>
                        <ul className="text-sm text-amber-700 space-y-1">
                          {!project?.first_call_recording_id && !project?.first_meeting_recording_id && (
                            <li className="flex items-center gap-2 justify-end">
                              <span>העלאת או הקלטת שיחת טלפון / פגישה</span>
                              <span className="w-2 h-2 bg-amber-500 rounded-full" />
                            </li>
                          )}
                          {!hasAISummaryContent && (
                            <li className="flex items-center gap-2 justify-end">
                              <span>ניתוח AI של ההקלטות</span>
                              <span className="w-2 h-2 bg-amber-500 rounded-full" />
                            </li>
                          )}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* AI Generation Mode */}
              {creationMode === 'ai' && !proposalData.items?.some(i => i.total > 0) && (
                <Card className="border-purple-200 bg-purple-50">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-purple-600" />
                        יצירת הצעה עם AI
                      </CardTitle>
                      <Button variant="ghost" size="sm" onClick={() => setCreationMode(null)}>
                        חזור לבחירה
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="text-center py-8">
                    <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-purple-900 mb-2">
                      המערכת תייצר הצעה מותאמת אישית
                    </h3>
                    <p className="text-purple-700 mb-6">
                      בהתבסס על ניתוח השיחות, צרכי הלקוח והעדפותיו
                    </p>
                    <Button
                      onClick={generateFromAI}
                      disabled={isGenerating}
                      className="bg-purple-600 hover:bg-purple-700"
                      size="lg"
                    >
                      {isGenerating ? (
                        <>
                          <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                          מייצר הצעה...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 ml-2" />
                          צור הצעה עכשיו
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Template Selector Modal */}
              <TemplateSelectorModal
                isOpen={showTemplateSelector}
                onClose={() => setShowTemplateSelector(false)}
                onSelectTemplate={(template) => {
                  applyTemplate(template);
                  setCreationMode('template');
                  setShowTemplateSelector(false);
                }}
              />

              {/* Editor - Show when mode is selected and has content or manual/template mode */}
              {(creationMode === 'manual' || creationMode === 'template' || (creationMode === 'ai' && proposalData.items?.some(i => i.total > 0))) && (
                <>
              {/* Back to selection button - Top */}
              <div className="flex justify-end mb-4">
                <Button variant="outline" onClick={() => setCreationMode(null)} className="gap-2">
                  חזור לבחירה
                </Button>
              </div>

              {/* Template Selection Card */}
              <Card className="border-slate-200">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Layout className="w-5 h-5 text-cyan-600" />
                      תבנית הצעה
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowTemplateSelector(true)}
                    >
                      {selectedTemplate ? 'החלף תבנית' : 'בחר תבנית'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {selectedTemplate ? (
                    <div className="flex items-center gap-4 p-3 bg-cyan-50 rounded-xl border border-cyan-200">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: selectedTemplate.styling?.primary_color || '#4338ca' }}
                      >
                        <FileText className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900">{selectedTemplate.name}</h4>
                        <p className="text-sm text-slate-500">
                          {(selectedTemplate.sections?.length || 0) + (selectedTemplate.items?.length || 0)} פריטים • {selectedTemplate.usage_count || 0} שימושים
                        </p>
                      </div>
                      <Badge className="bg-cyan-100 text-cyan-700">נבחרה</Badge>
                    </div>
                  ) : (
                    <div 
                      className="flex items-center gap-4 p-4 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-cyan-300 hover:bg-cyan-50/50 transition-colors"
                      onClick={() => setShowTemplateSelector(true)}
                    >
                      <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                        <Layout className="w-6 h-6 text-slate-400" />
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-700">בחר תבנית להצעת מחיר</h4>
                        <p className="text-sm text-slate-500">לחץ לבחירת תבנית מעוצבת מהספרייה</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>פרטי הצעה</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>כותרת ההצעה</Label>
                    <Input
                      value={proposalData.title}
                      onChange={(e) => setProposalData(prev => ({ ...prev, title: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>היקף העבודה</Label>
                    <Textarea
                      value={proposalData.scope_of_work}
                      onChange={(e) => setProposalData(prev => ({ ...prev, scope_of_work: e.target.value }))}
                      className="mt-1 min-h-[100px]"
                      placeholder="תיאור מפורט של העבודה..."
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>פריטים</CardTitle>
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setShowClauseLibrary(!showClauseLibrary)}
                        className={showClauseLibrary ? 'bg-indigo-50 border-indigo-300' : ''}
                      >
                        <Layout className="w-4 h-4 ml-1" />
                        ספריית סעיפים
                      </Button>
                      <Button size="sm" variant="outline" onClick={addItem}>
                        <Plus className="w-4 h-4 ml-1" />
                        הוסף פריט
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Quick Clause Library Panel */}
                  <AnimatePresence>
                    {showClauseLibrary && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4 overflow-hidden"
                      >
                        <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-indigo-900 flex items-center gap-2">
                              <Layout className="w-4 h-4" />
                              בחר מספריית הסעיפים
                            </h4>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowClauseLibrary(false)}
                              className="text-indigo-600"
                            >
                              סגור
                            </Button>
                          </div>
                          
                          {Object.keys(clausesByCategory).length === 0 ? (
                            <p className="text-sm text-indigo-600 text-center py-4">
                              אין סעיפים בספרייה עדיין
                            </p>
                          ) : (
                            <div className="space-y-3 max-h-[300px] overflow-y-auto">
                              {Object.entries(clausesByCategory).map(([category, clauses]) => (
                                <div key={category}>
                                  <p className="text-xs font-medium text-indigo-700 mb-2">{category}</p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {clauses.map((clause) => (
                                      <div
                                        key={clause.id}
                                        onClick={() => addItemFromClause(clause)}
                                        className="flex items-center justify-between p-2 bg-white rounded-lg border border-indigo-100 hover:border-indigo-300 hover:shadow-sm cursor-pointer transition-all group"
                                      >
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-slate-900 truncate">
                                            {clause.title}
                                          </p>
                                          {clause.default_price > 0 && (
                                            <p className="text-xs text-slate-500">
                                              ₪{clause.default_price.toLocaleString()}
                                            </p>
                                          )}
                                        </div>
                                        <Plus className="w-4 h-4 text-indigo-400 group-hover:text-indigo-600 flex-shrink-0" />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="border rounded-xl overflow-hidden shadow-sm">
                    {/* Table Header */}
                    <div className="grid grid-cols-12 gap-4 bg-slate-50 p-4 border-b text-sm font-medium text-slate-500">
                      <div className="col-span-6">תיאור הסעיף</div>
                      <div className="col-span-2 text-center">כמות</div>
                      <div className="col-span-2">מחיר ליח'</div>
                      <div className="col-span-2">סה"כ</div>
                    </div>

                    {/* Table Body */}
                    <div className="divide-y">
                      {proposalData.items.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 bg-white">
                          אין סעיפים בהצעה. הוסף סעיף חדש או בחר מתבנית.
                        </div>
                      ) : (
                        proposalData.items.map((item, index) => (
                          <div key={index} className="grid grid-cols-12 gap-4 p-4 items-start bg-white hover:bg-slate-50/50 transition-colors group">
                            <div className="col-span-6">
                              <Textarea
                                value={item.description}
                                onChange={(e) => updateItem(index, 'description', e.target.value)}
                                className="resize-none min-h-[2.5rem] border-transparent hover:border-input focus:border-ring bg-transparent"
                                placeholder="תיאור הפריט..."
                              />
                            </div>
                            <div className="col-span-2">
                              <Input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                                className="text-center border-transparent hover:border-input focus:border-ring bg-transparent"
                              />
                            </div>
                            <div className="col-span-2 relative">
                              <span className="absolute left-3 top-2 text-slate-400 text-sm">₪</span>
                              <Input
                                type="number"
                                value={item.unit_price}
                                onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                                className="pl-6 border-transparent hover:border-input focus:border-ring bg-transparent"
                              />
                            </div>
                            <div className="col-span-2 flex items-center justify-between gap-2">
                              <div className="font-medium text-slate-700">
                                {formatCurrency(item.total)}
                              </div>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => removeItem(index)}
                                className="text-slate-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all h-8 w-8"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Totals */}
                  <div className="mt-6 border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">סכום ביניים:</span>
                      <span className="font-medium">{formatCurrency(proposalData.subtotal)}</span>
                    </div>
                    {proposalData.discount_percent > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>הנחה ({proposalData.discount_percent}%):</span>
                        <span>-{formatCurrency(proposalData.discount_amount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-600">מע"מ ({proposalData.vat_percent}%):</span>
                      <span className="font-medium">{formatCurrency(proposalData.vat_amount)}</span>
                    </div>
                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                      <span>סה"כ לתשלום:</span>
                      <span className="text-cyan-700">{formatCurrency(proposalData.total_amount)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200">
                <CardHeader>
                  <CardTitle>תנאי תשלום</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>תנאי תשלום</Label>
                      <Input
                        value={proposalData.payment_terms}
                        onChange={(e) => setProposalData(prev => ({ ...prev, payment_terms: e.target.value }))}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>תוקף ההצעה (ימים)</Label>
                      <Input
                        type="number"
                        value={proposalData.validity_days}
                        onChange={(e) => setProposalData(prev => ({ ...prev, validity_days: parseInt(e.target.value) || 30 }))}
                        className="mt-1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label>הערות</Label>
                    <Textarea
                      value={proposalData.notes}
                      onChange={(e) => setProposalData(prev => ({ ...prev, notes: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setCreationMode(null)} className="gap-2">
                  חזור לבחירה
                </Button>
                <Button variant="outline" onClick={() => saveProposal('draft')} className="flex-1">
                  שמור טיוטה
                </Button>
                <Button
                  onClick={() => {
                    saveProposal('draft');
                    setCompletedSubStages(['create']);
                    setActiveSubStage('approval');
                  }}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700"
                >
                  <Eye className="w-4 h-4 ml-2" />
                  המשך לאישור ושליחה
                </Button>
              </div>
                </>
              )}
            </div>
          )}

          {/* Approval Stage */}
          {activeSubStage === 'approval' && (
            <div className="space-y-6">
              {/* Status & Preview Card */}
              <Card className={`border-2 ${
                existingProposals[0]?.status === 'approved' ? 'border-green-200 bg-green-50' : 
                existingProposals[0]?.status === 'sent' ? 'border-amber-200 bg-amber-50' :
                'border-cyan-200 bg-cyan-50'
              }`}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span>הצעת מחיר לאישור</span>
                      {selectedTemplate && (
                        <Badge variant="outline" className="bg-white/50">
                          <Layout className="w-3 h-3 ml-1" />
                          {selectedTemplate.name}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {existingProposals[0]?.status === 'approved' ? (
                        <Badge className="bg-green-100 text-green-800 border-green-200 px-3 py-1">
                          <CheckCircle2 className="w-4 h-4 ml-1" />
                          אושרה ונחתמה
                        </Badge>
                      ) : existingProposals[0]?.status === 'sent' ? (
                        <Badge className="bg-amber-100 text-amber-800 border-amber-200 px-3 py-1">
                          <Send className="w-4 h-4 ml-1" />
                          נשלחה - ממתין לאישור
                        </Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-800 border-slate-200 px-3 py-1">
                          <FileText className="w-4 h-4 ml-1" />
                          טיוטה - ממתין לשליחה
                        </Badge>
                      )}
                    </div>
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* Actions Bar - Changes based on status */}
                  <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-100 flex flex-wrap gap-3 items-center justify-between">
                    
                    {/* Left Side - Main Actions */}
                    <div className="flex gap-3 flex-1">
                      {existingProposals[0]?.status !== 'approved' && (
                        <>
                          <Button
                            onClick={sendProposal}
                            disabled={isSending}
                            className={`${existingProposals[0]?.status === 'sent' ? 'bg-slate-800' : 'bg-cyan-600'} hover:opacity-90`}
                          >
                            {isSending ? (
                              <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                            ) : existingProposals[0]?.status === 'sent' ? (
                              <Send className="w-4 h-4 ml-2" />
                            ) : (
                              <Send className="w-4 h-4 ml-2" />
                            )}
                            {existingProposals[0]?.status === 'sent' ? 'שלח שוב' : 'שלח הצעה ללקוח'}
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() => {
                              const approvalUrl = `${window.location.origin}/PublicApproval?id=${project.id}&type=proposal`;
                              navigator.clipboard.writeText(approvalUrl);
                              showSuccess('הקישור הועתק ללוח!');
                            }}
                            className="gap-2"
                          >
                            <Layout className="w-4 h-4" />
                            העתק קישור לצפייה
                          </Button>
                        </>
                      )}

                      {existingProposals[0]?.status === 'approved' && (
                         <Button
                            variant="outline"
                            onClick={async () => {
                              try {
                                // First, try to find a saved signed PDF in Documents
                                const signedDocs = await archiflow.entities.Document.filter({
                                  project_id: String(project.id),
                                  category: 'proposal'
                                });
                                
                                // Find the most recent signed proposal PDF
                                const signedPdf = signedDocs.find(doc => 
                                  doc.title?.includes('חתומה') || doc.description?.includes('חתימה')
                                );
                                
                                if (signedPdf?.file_url) {
                                  // Download the saved PDF
                                  showSuccess('מוריד קובץ חתום...');
                                  const link = document.createElement('a');
                                  link.href = signedPdf.file_url;
                                  link.download = signedPdf.title || `הצעה חתומה - ${project.name}.pdf`;
                                  link.target = '_blank';
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                } else {
                                  // Fallback: generate PDF from current view
                                  showSuccess('מייצר PDF...');
                                  const pdfFile = await generatePDFFromElement(
                                    'proposal-preview-container', 
                                    `הצעה חתומה - ${project.name}.pdf`
                                  );
                                  
                                  // Create download link for the generated PDF
                                  const url = URL.createObjectURL(pdfFile);
                                  const link = document.createElement('a');
                                  link.href = url;
                                  link.download = `הצעה חתומה - ${project.name}.pdf`;
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  URL.revokeObjectURL(url);
                                  
                                  showSuccess('PDF הורד בהצלחה!');
                                }
                              } catch (error) {
                                console.error('Error downloading PDF:', error);
                                showError('שגיאה בהורדת PDF: ' + (error.message || 'Unknown error'));
                              }
                            }}
                            className="gap-2"
                          >
                            <Download className="w-4 h-4" />
                            הורד PDF חתום
                          </Button>
                      )}
                    </div>

                    {/* Right Side - Manual Overrides */}
                    {existingProposals[0]?.status !== 'approved' && (
                      <div className="flex gap-2 border-r pr-3 mr-3">
                         <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setShowSignatureDialog(true)}
                          className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                        >
                          <PenTool className="w-4 h-4 ml-2" />
                          החתמה ידנית
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={markAsApproved}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <CheckCircle2 className="w-4 h-4 ml-2" />
                          סמן שאושר
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* The Preview */}
                  <div id="proposal-preview-container" className="shadow-lg rounded-xl overflow-hidden">
                    <ProposalPreviewCard 
                      proposalData={proposalData}
                      project={project}
                      template={selectedTemplate}
                      formatCurrency={formatCurrency}
                      signatureData={getSignatureData()}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}