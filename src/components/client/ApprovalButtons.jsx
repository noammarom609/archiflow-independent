import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { archiflow } from '@/api/archiflow';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, XCircle, MessageSquare } from 'lucide-react';

export default function ApprovalButtons({ 
  item, 
  itemType, 
  currentUser, 
  canApprove,
  onApprovalChange 
}) {
  const queryClient = useQueryClient();
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const approveMutation = useMutation({
    mutationFn: async ({ approved, reason }) => {
      const updateData = {
        approval_status: approved ? 'approved' : 'rejected',
        approved_by: currentUser.name,
        approval_date: new Date().toISOString(),
        rejection_reason: reason || null,
      };

      if (itemType === 'task') {
        await archiflow.entities.Task.update(item.id, updateData);
      } else if (itemType === 'document') {
        await archiflow.entities.Document.update(item.id, updateData);
      }

      // Create notification
      await archiflow.entities.Notification.create({
        title: approved ? 'אושר על ידי הלקוח' : 'נדחה על ידי הלקוח',
        message: `${currentUser.name} ${approved ? 'אישר' : 'דחה'} את ${itemType === 'task' ? 'המשימה' : 'המסמך'}: ${item.title}`,
        type: itemType,
        priority: approved ? 'medium' : 'high',
        related_id: item.id,
        related_type: itemType,
        icon: itemType === 'task' ? 'Briefcase' : 'FileText',
      });

      return updateData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientTasks'] });
      queryClient.invalidateQueries({ queryKey: ['clientDocuments'] });
      setShowRejectForm(false);
      setRejectReason('');
      if (onApprovalChange) onApprovalChange();
    },
  });

  const handleApprove = () => {
    approveMutation.mutate({ approved: true });
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      alert('נא להזין סיבת דחייה');
      return;
    }
    approveMutation.mutate({ approved: false, reason: rejectReason });
  };

  if (!canApprove) return null;

  // Already approved or rejected
  if (item.approval_status === 'approved') {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-green-800">
            <CheckCircle2 className="w-5 h-5" />
            <div>
              <p className="font-semibold">אושר</p>
              <p className="text-sm">ע״י {item.approved_by}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (item.approval_status === 'rejected') {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-2 text-red-800">
            <XCircle className="w-5 h-5 mt-0.5" />
            <div>
              <p className="font-semibold">נדחה</p>
              <p className="text-sm">ע״י {item.approved_by}</p>
              {item.rejection_reason && (
                <p className="text-sm mt-2 p-2 bg-white rounded border border-red-200">
                  {item.rejection_reason}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Pending approval
  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardContent className="p-4">
        {!showRejectForm ? (
          <>
            <div className="flex items-center gap-2 text-yellow-800 mb-3">
              <MessageSquare className="w-5 h-5" />
              <p className="font-semibold">דרוש אישור</p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleApprove}
                disabled={approveMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="w-4 h-4 ml-2" />
                אשר
              </Button>
              <Button
                onClick={() => setShowRejectForm(true)}
                disabled={approveMutation.isPending}
                variant="outline"
                className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 ml-2" />
                דחה
              </Button>
            </div>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <p className="text-sm font-semibold text-slate-900 mb-2">סיבת הדחייה:</p>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="הסבר מדוע אתה דוחה..."
              className="mb-3"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleReject}
                disabled={approveMutation.isPending || !rejectReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                שלח דחייה
              </Button>
              <Button
                onClick={() => {
                  setShowRejectForm(false);
                  setRejectReason('');
                }}
                variant="outline"
                className="flex-1"
              >
                ביטול
              </Button>
            </div>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
}