import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { MessageSquare, Send, User, Paperclip } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { getCurrentUser } from '@/utils/authHelpers';
import { showSuccess, showError } from '../utils/notifications';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function MessagingSystem({ messages }) {
  const [newMessage, setNewMessage] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const queryClient = useQueryClient();

  // Fetch current user for multi-tenant filtering (with bypass support)
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => getCurrentUser(base44),
  });

  const isSuperAdmin = user?.app_role === 'super_admin';

  // Fetch contractors via backend function to avoid 403 permission errors
  const { data: architectData } = useQuery({
    queryKey: ['architectUsers', user?.email],
    queryFn: async () => {
      try {
        const response = await base44.functions.invoke('getArchitectUsers', {});
        return response?.data || response || { contractors: [] };
      } catch (err) {
        console.error('Error fetching architect users:', err);
        return { contractors: [] };
      }
    },
    enabled: !!user,
  });

  // Contractors are already filtered by the backend function
  const contractors = architectData?.contractors || [];

  const sendMessageMutation = useMutation({
    mutationFn: (messageData) => base44.entities.Message.create(messageData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
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
      sender_id: 'architect-1',
      sender_name: 'מנהל הפרויקט',
      sender_type: 'architect',
      recipient_id: selectedRecipient.id,
      recipient_name: selectedRecipient.name,
      recipient_type: 'contractor',
      project_name: 'פרויקט כללי',
    });
  };

  const groupedMessages = messages.reduce((acc, msg) => {
    const key = msg.sender_id === 'architect-1' ? msg.recipient_id : msg.sender_id;
    if (!acc[key]) acc[key] = [];
    acc[key].push(msg);
    return acc;
  }, {});

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Conversations List */}
      <div className="lg:col-span-1">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            <h3 className="font-bold text-slate-900 mb-4">שיחות</h3>
            <div className="space-y-2">
              {contractors.map(contractor => {
                const contractorMessages = groupedMessages[contractor.id] || [];
                const unreadCount = contractorMessages.filter(m => !m.is_read && m.sender_id !== 'architect-1').length;
                const lastMessage = contractorMessages[contractorMessages.length - 1];
                
                return (
                  <motion.div
                    key={contractor.id}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedRecipient(contractor)}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedRecipient?.id === contractor.id
                        ? 'bg-orange-100 border-2 border-orange-600'
                        : 'bg-slate-50 hover:bg-slate-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-orange-200 text-orange-800 text-xs">
                            {contractor.name.slice(0, 2)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold text-sm text-slate-900">{contractor.name}</p>
                          <p className="text-xs text-slate-500">{contractor.specialty}</p>
                        </div>
                      </div>
                      {unreadCount > 0 && (
                        <Badge className="bg-red-500 text-white">{unreadCount}</Badge>
                      )}
                    </div>
                    {lastMessage && (
                      <p className="text-xs text-slate-600 truncate mt-1">
                        {lastMessage.content}
                      </p>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Message Thread */}
      <div className="lg:col-span-2">
        <Card className="border-slate-200">
          <CardContent className="p-4">
            {!selectedRecipient ? (
              <div className="text-center py-20">
                <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-500">בחר שיחה כדי להתחיל</p>
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="border-b border-slate-200 pb-4 mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarFallback className="bg-orange-200 text-orange-800">
                        {selectedRecipient.name.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-slate-900">{selectedRecipient.name}</h3>
                      <p className="text-sm text-slate-500">{selectedRecipient.specialty}</p>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                  {(groupedMessages[selectedRecipient.id] || []).map((msg, index) => {
                    const isFromMe = msg.sender_id === 'architect-1';
                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`flex ${isFromMe ? 'justify-start' : 'justify-end'}`}
                      >
                        <div
                          className={`max-w-md p-3 rounded-lg ${
                            isFromMe
                              ? 'bg-orange-100 text-slate-900'
                              : 'bg-blue-100 text-slate-900'
                          }`}
                        >
                          <p className="text-sm mb-1">{msg.content}</p>
                          <p className="text-xs text-slate-500">
                            {format(new Date(msg.created_date), 'HH:mm', { locale: he })}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Input */}
                <div className="border-t border-slate-200 pt-4">
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
                      className="bg-orange-600 hover:bg-orange-700"
                      disabled={!newMessage.trim()}
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