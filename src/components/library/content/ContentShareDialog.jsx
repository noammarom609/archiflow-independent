import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { archiflow } from '@/api/archiflow';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Send,
  Mail,
  MessageCircle,
  Link,
  Copy,
  Check,
  Loader2,
  ExternalLink,
  Palette,
} from 'lucide-react';
import { showSuccess, showError } from '../../utils/notifications';

export default function ContentShareDialog({ item, onClose }) {
  const [sendMethod, setSendMethod] = useState('email');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [recipientPhone, setRecipientPhone] = useState('');
  const [message, setMessage] = useState('');
  const [includeWithMeeting, setIncludeWithMeeting] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isGeneratingLink, setIsGeneratingLink] = useState(false);

  // Display style options
  const [showStyleOptions, setShowStyleOptions] = useState(false);
  const [backgroundColor, setBackgroundColor] = useState('#1a1a2e');
  const [accentColor, setAccentColor] = useState('#4338ca');
  const [showLogo, setShowLogo] = useState(true);
  const [customLogoUrl, setCustomLogoUrl] = useState('');
  const [expirationDays, setExpirationDays] = useState(30);

  const queryClient = useQueryClient();

  const generateShareLink = async () => {
    setIsGeneratingLink(true);
    try {
      const shareToken = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Update item with share settings
      await archiflow.entities.ContentItem.update(item.id, {
        share_settings: {
          is_shared: true,
          share_token: shareToken,
          share_expires: new Date(Date.now() + expirationDays * 24 * 60 * 60 * 1000).toISOString(),
          view_count: 0,
          display_style: {
            background_color: backgroundColor,
            accent_color: accentColor,
            show_logo: showLogo,
            logo_url: customLogoUrl || null,
          }
        }
      });

      const link = `${window.location.origin}/PublicContent?token=${shareToken}`;
      setShareLink(link);
      queryClient.invalidateQueries({ queryKey: ['contentItems'] });
      showSuccess('קישור נוצר בהצלחה');
    } catch (error) {
      showError('שגיאה ביצירת קישור');
    }
    setIsGeneratingLink(false);
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    showSuccess('הקישור הועתק');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = async () => {
    if (sendMethod === 'email' && !recipientEmail) {
      showError('יש להזין אימייל');
      return;
    }
    if (sendMethod === 'whatsapp' && !recipientPhone) {
      showError('יש להזין מספר טלפון');
      return;
    }

    setIsSending(true);

    try {
      // Generate link if not exists
      if (!shareLink) {
        await generateShareLink();
      }

      const linkToSend = shareLink || `${window.location.origin}/PublicContent?token=${Date.now()}`;

      if (sendMethod === 'email') {
        await archiflow.integrations.Core.SendEmail({
          to: recipientEmail,
          subject: `תוכן: ${item.title}`,
          body: `
            <div dir="rtl" style="font-family: Arial, sans-serif;">
              <h2>${item.title}</h2>
              ${message ? `<p>${message}</p>` : ''}
              <p><a href="${linkToSend}" style="background: ${accentColor}; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block;">צפה בתוכן</a></p>
            </div>
          `
        });
        showSuccess('התוכן נשלח במייל');
      } else if (sendMethod === 'whatsapp') {
        const whatsappMessage = `${item.title}\n${message ? message + '\n' : ''}\nצפה כאן: ${linkToSend}`;
        const cleanPhone = recipientPhone.replace(/\D/g, '');
        const phoneWithCountry = cleanPhone.startsWith('972') ? cleanPhone : `972${cleanPhone.startsWith('0') ? cleanPhone.slice(1) : cleanPhone}`;
        window.open(`https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(whatsappMessage)}`, '_blank');
        showSuccess('נפתח WhatsApp');
      }

      onClose();
    } catch (error) {
      showError('שגיאה בשליחה');
    }
    setIsSending(false);
  };

  const isMultiple = item?.multiple?.length > 0;

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="w-5 h-5" />
            {isMultiple ? `שליחת ${item.multiple.length} פריטים` : `שליחת: ${item.title}`}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Send Method */}
          <div>
            <Label className="mb-2 block">שיטת שליחה</Label>
            <RadioGroup value={sendMethod} onValueChange={setSendMethod} className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="email" id="email" />
                <Label htmlFor="email" className="flex items-center gap-1 cursor-pointer">
                  <Mail className="w-4 h-4" />
                  אימייל
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="whatsapp" id="whatsapp" />
                <Label htmlFor="whatsapp" className="flex items-center gap-1 cursor-pointer">
                  <MessageCircle className="w-4 h-4" />
                  WhatsApp
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="link" id="link" />
                <Label htmlFor="link" className="flex items-center gap-1 cursor-pointer">
                  <Link className="w-4 h-4" />
                  קישור בלבד
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Recipient */}
          {sendMethod === 'email' && (
            <div>
              <Label>אימייל נמען</Label>
              <Input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="email@example.com"
              />
            </div>
          )}

          {sendMethod === 'whatsapp' && (
            <div>
              <Label>מספר טלפון</Label>
              <Input
                type="tel"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="050-1234567"
                dir="ltr"
              />
            </div>
          )}

          {/* Message */}
          {sendMethod !== 'link' && (
            <div>
              <Label>הודעה (אופציונלי)</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="הוסף הודעה אישית..."
                rows={3}
              />
            </div>
          )}

          {/* Style Options */}
          <div className="border-t pt-4">
            <Button 
              variant="ghost" 
              className="w-full justify-between"
              onClick={() => setShowStyleOptions(!showStyleOptions)}
            >
              <span className="flex items-center gap-2">
                <Palette className="w-4 h-4" />
                עיצוב דף הצפייה
              </span>
              <span>{showStyleOptions ? '▲' : '▼'}</span>
            </Button>
            
            {showStyleOptions && (
              <div className="space-y-3 mt-3 p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <Label>צבע רקע</Label>
                  <div className="flex items-center gap-2">
                    {['#1a1a2e', '#f8fafc', '#0f172a', '#fef3c7', '#ecfdf5'].map(color => (
                      <button
                        key={color}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${backgroundColor === color ? 'border-primary scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setBackgroundColor(color)}
                      />
                    ))}
                    <input
                      type="color"
                      value={backgroundColor}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>צבע דגש</Label>
                  <div className="flex items-center gap-2">
                    {['#4338ca', '#984E39', '#059669', '#dc2626', '#7c3aed'].map(color => (
                      <button
                        key={color}
                        className={`w-6 h-6 rounded-full border-2 transition-all ${accentColor === color ? 'border-primary scale-110' : 'border-transparent'}`}
                        style={{ backgroundColor: color }}
                        onClick={() => setAccentColor(color)}
                      />
                    ))}
                    <input
                      type="color"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="w-6 h-6 rounded cursor-pointer"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>הצג לוגו</Label>
                  <Switch
                    checked={showLogo}
                    onCheckedChange={setShowLogo}
                  />
                </div>
                {showLogo && (
                  <div>
                    <Label className="text-xs text-muted-foreground">לוגו מותאם (URL)</Label>
                    <Input
                      value={customLogoUrl}
                      onChange={(e) => setCustomLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="text-xs mt-1"
                      dir="ltr"
                    />
                  </div>
                )}
                <div className="flex items-center justify-between">
                  <Label>תוקף הקישור</Label>
                  <select
                    value={expirationDays}
                    onChange={(e) => setExpirationDays(Number(e.target.value))}
                    className="px-3 py-1 rounded-md border text-sm"
                  >
                    <option value={7}>7 ימים</option>
                    <option value={30}>30 ימים</option>
                    <option value={90}>90 ימים</option>
                    <option value={365}>שנה</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Generated Link */}
          {(sendMethod === 'link' || shareLink) && (
            <div className="border-t pt-4">
              {shareLink ? (
                <div className="flex gap-2">
                  <Input 
                    value={shareLink} 
                    readOnly 
                    className="flex-1 text-xs"
                    dir="ltr"
                  />
                  <Button variant="outline" onClick={copyToClipboard}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <Button variant="outline" onClick={() => window.open(shareLink, '_blank')}>
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={generateShareLink}
                  disabled={isGeneratingLink}
                >
                  {isGeneratingLink ? (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  ) : (
                    <Link className="w-4 h-4 ml-2" />
                  )}
                  צור קישור לשיתוף
                </Button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              ביטול
            </Button>
            {sendMethod !== 'link' && (
              <Button onClick={handleSend} disabled={isSending}>
                {isSending ? (
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                ) : (
                  <Send className="w-4 h-4 ml-2" />
                )}
                שלח
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}