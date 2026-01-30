import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { archiflow } from '@/api/archiflow';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { 
  Link2, 
  Mail, 
  Phone, 
  Copy, 
  Check, 
  Send, 
  Clock,
  User,
  Calendar,
  X,
  Loader2,
  Paperclip,
  Image,
  Video,
  Type,
  FileText,
  Plus,
  Trash2,
  Video as VideoIcon,
  ExternalLink
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { showSuccess, showError } from '../../utils/notifications';
import ContentSelectorModal from './ContentSelectorModal';

/**
 * CreateMeetingLinkDialog - Dialog ליצירת קישור תיאום פגישה
 * 
 * @param {boolean} isOpen - האם הדיאלוג פתוח
 * @param {function} onClose - פונקציה לסגירה
 * @param {array} selectedSlots - חלונות הזמן שנבחרו
 * @param {number} duration - משך הפגישה בדקות
 * @param {string} projectId - מזהה פרויקט (legacy)
 * @param {string} projectName - שם פרויקט (legacy)
 * @param {string} clientName - שם לקוח (legacy)
 * @param {string} clientEmail - אימייל לקוח (legacy)
 * @param {string} clientPhone - טלפון לקוח (legacy)
 * @param {object} prefilledData - נתונים ממולאים מראש (חדש - מקבל עדיפות)
 *   - title, client_name, client_email, client_phone, project_id, project_name, notes, stage
 */

// הודעות וואטסאפ מותאמות לפי שלב הפרויקט
const getWhatsAppMessageByStage = (stage, clientName, link, meetingTitle) => {
  const name = clientName || '';
  const greeting = name ? `היי ${name}` : 'שלום';
  
  const messages = {
    'first_call': `${greeting}, שמחתי לשוחח איתך! 🙂\nהנה קישור לקביעת פגישת היכרות ותיאום ציפיות:\n${link}`,
    'first_meeting': `${greeting}, תודה על השיחה הנעימה!\nהנה קישור לקביעת פגישה ראשונה במשרד:\n${link}`,
    'proposal': `${greeting},\nהנה קישור לקביעת פגישה להצגת הצעת המחיר:\n${link}`,
    'survey': `${greeting},\nהנה קישור לתיאום ביקור מדידות בנכס:\n${link}`,
    'concept': `${greeting},\nהנה קישור לקביעת פגישת הצגת קונספט:\n${link}`,
    'sketches': `${greeting},\nהנה קישור לקביעת פגישת הצגת סקיצות:\n${link}`,
    'rendering': `${greeting},\nהנה קישור לקביעת פגישת הצגת הדמיות:\n${link}`,
    'technical': `${greeting},\nהנה קישור לקביעת פגישת סקירת תוכניות עבודה:\n${link}`,
    'selections': `${greeting},\nהנה קישור לקביעת פגישת בחירות וריכוז כמויות:\n${link}`,
    'execution': `${greeting},\nהנה קישור לקביעת פגישת מעקב ביצוע:\n${link}`,
    'completion': `${greeting},\nהנה קישור לקביעת פגישת סיום ומסירה:\n${link}`,
  };
  
  return messages[stage] || `${greeting},\nמזמינים אותך לקבוע פגישה${meetingTitle ? ` - ${meetingTitle}` : ''}:\n${link}`;
};
export default function CreateMeetingLinkDialog({ 
  isOpen, 
  onClose, 
  selectedSlots,
  duration,
  projectId,
  projectName,
  clientName: initialClientName,
  clientEmail: initialClientEmail,
  clientPhone: initialClientPhone,
  prefilledData = {}
}) {
  const queryClient = useQueryClient();
  
  // Merge legacy props with new prefilledData (prefilledData takes priority)
  const defaultTitle = prefilledData.title || '';
  const defaultClientName = prefilledData.client_name || initialClientName || '';
  const defaultClientEmail = prefilledData.client_email || initialClientEmail || '';
  const defaultClientPhone = prefilledData.client_phone || initialClientPhone || '';
  const defaultProjectId = prefilledData.project_id || projectId || '';
  const defaultProjectName = prefilledData.project_name || projectName || '';
  const defaultNotes = prefilledData.notes || '';
  const projectStage = prefilledData.stage || '';
  
  const [title, setTitle] = useState(defaultTitle);
  const [clientName, setClientName] = useState(defaultClientName);
  const [clientEmail, setClientEmail] = useState(defaultClientEmail);
  const [clientPhone, setClientPhone] = useState(defaultClientPhone);
  const [notes, setNotes] = useState(defaultNotes);
  const [sendMethod, setSendMethod] = useState('manual');
  const [copied, setCopied] = useState(false);
  const [createdLink, setCreatedLink] = useState(null);
  const [attachedContentIds, setAttachedContentIds] = useState([]);
  const [showContentSelector, setShowContentSelector] = useState(false);
  const [attachedContentItems, setAttachedContentItems] = useState([]);
  // Zoom integration
  const [createZoomMeeting, setCreateZoomMeeting] = useState(false);
  const [zoomMeetingLink, setZoomMeetingLink] = useState(null);
  const [isCreatingZoom, setIsCreatingZoom] = useState(false);
  
  // Validation based on send method
  const isEmailRequired = sendMethod === 'email' || sendMethod === 'both';
  const isPhoneRequired = sendMethod === 'whatsapp' || sendMethod === 'both';
  const isFormValid = (!isEmailRequired || clientEmail) && (!isPhoneRequired || clientPhone);
  
  // Reset state only when dialog opens (not on every render)
  const prevIsOpen = React.useRef(false);
  React.useEffect(() => {
    if (isOpen && !prevIsOpen.current) {
      // Dialog just opened - reset fields
      setTitle(prefilledData.title || '');
      setClientName(prefilledData.client_name || initialClientName || '');
      setClientEmail(prefilledData.client_email || initialClientEmail || '');
      setClientPhone(prefilledData.client_phone || initialClientPhone || '');
      setNotes(prefilledData.notes || '');
      setCreatedLink(null);
      setCopied(false);
      setAttachedContentIds([]);
      setAttachedContentItems([]);
      // Reset Zoom state
      setCreateZoomMeeting(false);
      setZoomMeetingLink(null);
      setIsCreatingZoom(false);
    }
    prevIsOpen.current = isOpen;
  }, [isOpen]);

  // Create Google Meet function (called when client books a time, not here)
  // This is just a placeholder - the actual Meet creation happens in PublicMeetingBooking
  // when the client confirms their time slot selection

  // Fetch attached content items when IDs change
  React.useEffect(() => {
    const fetchContent = async () => {
      if (attachedContentIds.length === 0) {
        setAttachedContentItems([]);
        return;
      }
      try {
        const allItems = await archiflow.entities.ContentItem.list();
        const filtered = allItems.filter(item => attachedContentIds.includes(item.id));
        setAttachedContentItems(filtered);
      } catch (e) {
        console.error('Error fetching content:', e);
      }
    };
    fetchContent();
  }, [attachedContentIds]);

  // Generate unique token
  const generateToken = () => {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  };

  // Create meeting slot mutation
  const createMeetingSlotMutation = useMutation({
    mutationFn: async (data) => {
      return await archiflow.entities.MeetingSlot.create(data);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['meetingSlots'] });
      const link = `${window.location.origin}/PublicMeetingBooking?token=${data.link_token}`;
      setCreatedLink(link);
      showSuccess('קישור התיאום נוצר בהצלחה!');
    },
    onError: (error) => {
      console.error('Error creating meeting slot:', error);
      showError('שגיאה ביצירת קישור התיאום');
    }
  });

  const handleCreate = async () => {
    const token = generateToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // Expires in 7 days

    const result = await createMeetingSlotMutation.mutateAsync({
      title: title || 'פגישה עם לקוח',
      link_token: token,
      duration_minutes: duration,
      available_slots: selectedSlots,
      client_name: clientName || undefined,
      client_email: clientEmail || undefined,
      client_phone: clientPhone || undefined,
      project_id: defaultProjectId || undefined,
      project_name: defaultProjectName || undefined,
      notes: notes || undefined,
      status: 'pending_selection',
      send_method: sendMethod,
      expires_at: expiresAt.toISOString(),
      attached_content_ids: attachedContentIds.length > 0 ? attachedContentIds : undefined,
      // Zoom integration
      zoom_enabled: createZoomMeeting
    });

    // Auto-send based on selected method
    const link = `${window.location.origin}/PublicMeetingBooking?token=${result.link_token}`;
    
    if (sendMethod === 'email' || sendMethod === 'both') {
      if (clientEmail) {
        try {
          await archiflow.integrations.Core.SendEmail({
            to: clientEmail,
            subject: `הזמנה לתיאום פגישה - ${title || 'פגישה'}`,
            body: `שלום ${clientName || ''},\n\nמזמינים אותך לבחור זמן נוח לפגישה.\n\nלחץ/י על הקישור הבא לבחירת מועד:\n${link}\n\nבברכה`
          });
          showSuccess('האימייל נשלח בהצלחה!');
        } catch (error) {
          showError('שגיאה בשליחת האימייל');
        }
      }
    }
    
    if (sendMethod === 'whatsapp' || sendMethod === 'both') {
      if (clientPhone) {
        const message = getWhatsAppMessageByStage(projectStage, clientName, link, title);
        window.open(`https://wa.me/${clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
      }
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(createdLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    showSuccess('הקישור הועתק!');
  };

  const handleSendEmail = async () => {
    if (!clientEmail) {
      showError('יש להזין כתובת אימייל');
      return;
    }
    
    try {
      await archiflow.integrations.Core.SendEmail({
        to: clientEmail,
        subject: `הזמנה לתיאום פגישה - ${title || 'פגישה'}`,
        body: `
          שלום ${clientName || ''},
          
          מזמינים אותך לבחור זמן נוח לפגישה.
          
          לחץ/י על הקישור הבא לבחירת מועד:
          ${createdLink}
          
          בברכה
        `
      });
      showSuccess('ההזמנה נשלחה בהצלחה!');
    } catch (error) {
      showError('שגיאה בשליחת האימייל');
    }
  };

  const handleClose = () => {
    setTitle('');
    setClientName('');
    setClientEmail('');
    setClientPhone('');
    setNotes('');
    setSendMethod('manual');
    setCreatedLink(null);
    onClose();
  };

  const contentTypeLabels = {
    image: 'תמונה',
    video: 'סרטון', 
    text: 'טקסט',
    post: 'פוסט'
  };

  return (
    <>
    <ContentSelectorModal
      isOpen={showContentSelector}
      onClose={() => setShowContentSelector(false)}
      selectedIds={attachedContentIds}
      onSelect={setAttachedContentIds}
    />
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" />
            יצירת קישור תיאום פגישה
          </DialogTitle>
          <DialogDescription>
            צור קישור לתיאום פגישה עם הזמנים שבחרת
          </DialogDescription>
        </DialogHeader>

        {!createdLink ? (
          <div className="space-y-4 py-4">
            {/* Selected Slots Summary */}
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">חלונות זמן שנבחרו ({selectedSlots.length})</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {selectedSlots.map((slot, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {format(new Date(slot.date), 'EEE d/M', { locale: he })} {slot.start_time}-{slot.end_time}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                <Clock className="w-3 h-3" />
                משך פגישה: {duration} דקות
              </div>
            </div>

            {/* Title */}
            <div>
              <Label>נושא הפגישה (אופציונלי)</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="פגישת היכרות / סקירת תכנון..."
              />
            </div>

            {/* Client Details */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4" />
                פרטי הלקוח (אופציונלי)
              </Label>
              
              <Input
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="שם הלקוח"
              />
              
              <div className="grid grid-cols-2 gap-2">
              <div>
                <Input
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="אימייל"
                  dir="ltr"
                  className={isEmailRequired && !clientEmail ? 'border-red-300 focus:border-red-500' : ''}
                />
                {isEmailRequired && !clientEmail && (
                  <span className="text-xs text-red-500 mt-1">חובה לשליחה במייל</span>
                )}
              </div>
              <div>
                <Input
                  type="tel"
                  value={clientPhone}
                  onChange={(e) => setClientPhone(e.target.value)}
                  placeholder="טלפון"
                  dir="ltr"
                  className={isPhoneRequired && !clientPhone ? 'border-red-300 focus:border-red-500' : ''}
                />
                {isPhoneRequired && !clientPhone && (
                  <span className="text-xs text-red-500 mt-1">חובה לשליחה בוואטסאפ</span>
                )}
              </div>
              </div>
            </div>

            {/* Google Meet Option */}
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <VideoIcon className="w-5 h-5 text-green-600" />
                  <div>
                    <Label className="font-medium text-green-900">צור פגישת Google Meet</Label>
                    <p className="text-xs text-green-600">יצירה אוטומטית של קישור Meet</p>
                  </div>
                </div>
                <Switch
                  checked={createZoomMeeting}
                  onCheckedChange={setCreateZoomMeeting}
                />
              </div>
              {createZoomMeeting && (
                <div className="mt-2 pt-2 border-t border-green-200">
                  <p className="text-xs text-green-700">
                    קישור Google Meet ייווצר אוטומטית כשהלקוח יבחר מועד
                  </p>
                </div>
              )}
            </div>

            {/* Send Method */}
            <div>
              <Label className="mb-2 block">אופן שליחה</Label>
              <RadioGroup value={sendMethod} onValueChange={setSendMethod}>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="manual" id="manual" />
                    <Label htmlFor="manual" className="text-sm cursor-pointer">העתקת קישור</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="email" id="email" />
                    <Label htmlFor="email" className="text-sm cursor-pointer">שליחה במייל</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="whatsapp" id="whatsapp" />
                    <Label htmlFor="whatsapp" className="text-sm cursor-pointer text-green-700">שליחה בוואטסאפ</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="both" id="both" />
                    <Label htmlFor="both" className="text-sm cursor-pointer">מייל + וואטסאפ</Label>
                  </div>
                </div>
              </RadioGroup>
            </div>

            {/* Notes (from context) */}
            {notes && (
              <div className="bg-slate-50 rounded-lg p-3 text-sm">
                <span className="text-muted-foreground">הקשר: </span>
                <span className="text-slate-700">{notes}</span>
              </div>
            )}

            {/* Project Link */}
            {defaultProjectName && (
              <div className="bg-blue-50 rounded-lg p-3 text-sm">
                <span className="text-muted-foreground">מקושר לפרויקט: </span>
                <span className="font-medium text-blue-700">{defaultProjectName}</span>
              </div>
            )}

            {/* Attached Content */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-3">
                <Label className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4" />
                  תכנים מצורפים
                </Label>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setShowContentSelector(true)}
                  className="gap-1"
                >
                  <Plus className="w-3 h-3" />
                  הוסף תוכן
                </Button>
              </div>

              {attachedContentItems.length > 0 ? (
                <div className="space-y-2">
                  {attachedContentItems.map(item => {
                    const typeConfig = {
                      image: { icon: Image, color: 'bg-blue-100 text-blue-700' },
                      video: { icon: Video, color: 'bg-purple-100 text-purple-700' },
                      text: { icon: Type, color: 'bg-green-100 text-green-700' },
                      post: { icon: FileText, color: 'bg-orange-100 text-orange-700' }
                    };
                    const config = typeConfig[item.type] || typeConfig.post;
                    const TypeIcon = config.icon;
                    
                    return (
                      <div 
                        key={item.id}
                        className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg"
                      >
                        {item.type === 'image' && item.file_url ? (
                          <img src={item.thumbnail_url || item.file_url} alt="" className="w-10 h-10 rounded object-cover" />
                        ) : (
                          <div className={`w-10 h-10 rounded flex items-center justify-center ${config.color}`}>
                            <TypeIcon className="w-5 h-5" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{typeConfig[item.type]?.label || item.type}</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-red-600"
                          onClick={() => setAttachedContentIds(prev => prev.filter(id => id !== item.id))}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-4 bg-muted/30 rounded-lg">
                  <Paperclip className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    ניתן לצרף תכנים מהספרייה שיוצגו ללקוח
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={handleClose}>
                ביטול
              </Button>
              <Button 
                onClick={handleCreate}
                disabled={createMeetingSlotMutation.isPending || !isFormValid}
                className="gap-2"
              >
                {createMeetingSlotMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Link2 className="w-4 h-4" />
                )}
                צור קישור
              </Button>
            </div>
          </div>
        ) : (
          /* Link Created View */
          <div className="space-y-4 py-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
              <Check className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-800">הקישור נוצר בהצלחה!</h3>
            </div>

            {/* Link Display */}
            <div className="bg-muted rounded-lg p-3">
              <Label className="text-xs text-muted-foreground mb-1 block">קישור התיאום:</Label>
              <div className="flex items-center gap-2">
                <Input 
                  value={createdLink} 
                  readOnly 
                  className="text-xs bg-white" 
                  dir="ltr"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={handleCopyLink}
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Send Options */}
            {(clientEmail || clientPhone) && (
              <div className="space-y-2">
                {clientEmail && (
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    onClick={handleSendEmail}
                  >
                    <Mail className="w-4 h-4" />
                    שלח למייל ({clientEmail})
                  </Button>
                )}
                {clientPhone && (
                  <Button 
                    variant="outline" 
                    className="w-full gap-2 text-green-700 border-green-300 hover:bg-green-50"
                    onClick={() => {
                      const message = getWhatsAppMessageByStage(projectStage, clientName, createdLink, title);
                      window.open(`https://wa.me/${clientPhone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`, '_blank');
                    }}
                  >
                    <Phone className="w-4 h-4" />
                    שלח בוואטסאפ ({clientPhone})
                  </Button>
                )}
              </div>
            )}

            <Button onClick={handleClose} className="w-full">
              סיום
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
    </>
  );
}