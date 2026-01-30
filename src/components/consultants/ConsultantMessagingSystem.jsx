import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send, HardHat } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '@/utils/authHelpers';
import { showSuccess, showError } from '../utils/notifications';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

// Consultant type labels
const CONSULTANT_TYPE_LABELS = {
  structural: 'קונסטרוקטור',
  electrical: 'יועץ חשמל',
  plumbing: 'יועץ אינסטלציה',
  hvac: 'יועץ מיזוג',
  lighting: 'יועץ תאורה',
  civil_defense: 'יועץ הג"א',
  acoustics: 'יועץ אקוסטיקה',
  hydrology: 'הידרולוג',
  surveyor: 'מודד',
  fire_safety: 'יועץ בטיחות אש',
  accessibility: 'יועץ נגישות',
  other: 'יועץ',
};

export default function ConsultantMessagingSystem({ messages }) {
  const [newMessage, setNewMessage] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const queryClient = useQueryClient();

  // Fetch current user for multi-tenant filtering (with bypass support)
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(base44),
  });

  const isSuperAdmin = user?.app_role === 'super_admin';

  // Fetch consultants via backend function to avoid 403 permission errors
  const { data: architectData } = useQuery({
    queryKey: ['architectUsers', user?.email],
    queryFn: async () => {
      try {
        const response = await base44.functions.invoke('getArchitectUsers', {});
        return response?.data || response || { consultants: [] };
      } catch (err) {
        console.error('Error fetching architect users:', err);
        return { consultants: [] };
      }
    },
    enabled: !!user,
  });

  // Consultants are already filtered by the backend function
  const consultants = architectData?.consultants || [];

  const sendMessageMutation = useMutation({
    mutationFn: (messageData) => base44.entities.ConsultantMessage.create(messageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['consultantMessages'] });
      showSuccess('הודעה נשלחה');
      setNewMessage('');
    },
    onError: () => {
      showError('שגיאה בשליחת הודעה');
    },
  });

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedRecipient) {
      showError('אנא בחר נמען והזן הודעה');
      return;
    }

    sendMessageMutation.mutate({
      content: newMessage,
      sender_id: user?.id || 'architect-1',
      sender_name: user?.full_name || 'מנהל הפרויקט',
      sender_type: 'architect',
      recipient_id: selectedRecipient.id,
      recipient_name: selectedRecipient.name,
      recipient_type: 'consultant',
      project_name: 'פרויקט כללי',
    });
  };

  const groupedMessages = messages.reduce((acc, msg) => {
    const key = msg.sender_type === 'architect' ? msg.recipient_id : msg.sender_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(msg);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Conversations List */}
      <div className="lg:col-span-1">
        <Card className="border-border">
          <CardContent className="p-4">
            <h3 className="font-bold text-foreground mb-4">שיחות עם יועצים</h3>
            <div className="space-y-2">
              {consultants.length === 0 ? (
                <div className="text-center py-8">
                  <HardHat className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">אין יועצים זמינים</p>
                </div>
              ) : (
                consultants.map(consultant => {
                  const consultantMessages = groupedMessages[consultant.id] || [];
                  const unreadCount = consultantMessages.filter(m => !m.is_read && m.sender_type !== 'architect').length;
                  const lastMessage = consultantMessages[consultantMessages.length - 1];
                  
                  return (
                    <motion.div
                      key={consultant.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedRecipient(consultant)}
                      className={`p-3 rounded-lg cursor-pointer transition-all ${
                        selectedRecipient?.id === consultant.id
                          ? 'bg-primary/10 border-2 border-primary'
                          : 'bg-accent hover:bg-accent/80 border-2 border-transparent'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-8 h-8">
                            <AvatarFallback className="bg-secondary/20 text-secondary text-xs">
                              {consultant.name?.slice(0, 2) || 'יו'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-semibold text-sm text-foreground">{consultant.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {CONSULTANT_TYPE_LABELS[consultant.consultant_type] || 'יועץ'}
                            </p>
                          </div>
                        </div>
                        {unreadCount > 0 && (
                          <Badge className="bg-destructive text-destructive-foreground">{unreadCount}</Badge>
                        )}
                      </div>
                      {lastMessage && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {lastMessage.content}
                        </p>
                      )}
                    </motion.div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message Thread */}
      <div className="lg:col-span-2">
        <Card className="border-border">
          <CardContent className="p-4">
            {!selectedRecipient ? (
              <div className="text-center py-20">
                <MessageSquare className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">בחר יועץ כדי להתחיל שיחה</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="border-b border-border pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-secondary/20 text-secondary">
                        {selectedRecipient.name?.slice(0, 2) || 'יו'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-foreground">{selectedRecipient.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {CONSULTANT_TYPE_LABELS[selectedRecipient.consultant_type] || 'יועץ'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                  {(groupedMessages[selectedRecipient.id] || []).length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground text-sm">אין הודעות עדיין. שלח הודעה ראשונה!</p>
                    </div>
                  ) : (
                    (groupedMessages[selectedRecipient.id] || []).map((msg, index) => {
                      const isFromMe = msg.sender_type === 'architect';
                      return (
                        <motion.div
                          key={msg.id || index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className={`flex ${isFromMe ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-md p-3 rounded-lg ${
                              isFromMe
                                ? 'bg-primary/10 text-foreground'
                                : 'bg-secondary/10 text-foreground'
                            }`}
                          >
                            <p className="text-sm mb-1">{msg.content}</p>
                            <p className="text-xs text-muted-foreground">
                              {msg.created_date ? format(new Date(msg.created_date), 'HH:mm', { locale: he }) : ''}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </div>

                {/* Input */}
                <div className="border-t border-border pt-4">
                  <div className="flex gap-2">
                    <Textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="הקלד הודעה..."
                      className="flex-1"
                      rows={2}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                    />
                    <Button
                      onClick={handleSendMessage}
                      className="bg-primary hover:bg-primary/90"
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
