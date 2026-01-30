import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { archiflow } from '@/api/archiflow';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, User, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

const roleLabels = {
  client: 'לקוח',
  architect: 'אדריכל',
  contractor: 'קבלן',
};

const roleColors = {
  client: 'bg-blue-100 text-blue-800',
  architect: 'bg-purple-100 text-purple-800',
  contractor: 'bg-green-100 text-green-800',
};

export default function CommentSection({ relatedId, relatedType, projectId, currentUser }) {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  const { data: comments = [], isLoading } = useQuery({
    queryKey: ['comments', relatedId, relatedType],
    queryFn: () => 
      archiflow.entities.Comment.filter({ 
        related_id: relatedId,
        related_type: relatedType,
        is_internal: false
      }, '-created_date'),
  });

  const addCommentMutation = useMutation({
    mutationFn: (data) => archiflow.entities.Comment.create(data),
    onSuccess: async () => {
      queryClient.invalidateQueries({ queryKey: ['comments'] });
      setNewComment('');
      
      // Notify other stakeholders about the new comment
      try {
        // Get project to find who to notify
        if (projectId) {
          const projects = await archiflow.entities.Project.filter({ id: projectId });
          const project = projects[0];
          
          if (project) {
            // Determine who to notify based on who left the comment
            const notifyIds = [];
            if (currentUser.role === 'client' && project.created_by) {
              // Client commented -> notify architect
              notifyIds.push(project.created_by);
            } else if (currentUser.role === 'architect' && project.client_id) {
              // Architect commented -> notify client
              notifyIds.push(project.client_id);
            } else if (currentUser.role === 'contractor') {
              // Contractor commented -> notify architect
              if (project.created_by) notifyIds.push(project.created_by);
            }
            
            // Create notifications for each recipient
            for (const userId of notifyIds) {
              await archiflow.entities.Notification.create({
                user_id: userId,
                title: '💬 תגובה חדשה',
                message: `${currentUser.name} הוסיף תגובה בפרויקט "${project.name}"`,
                type: relatedType === 'document' ? 'document' : 'comment',
                priority: 'medium',
                link: `/Projects?id=${projectId}`,
                is_read: false,
                created_date: new Date().toISOString()
              });
              
              // Send push notification
              archiflow.functions.invoke('sendPushNotification', {
                userId: userId,
                title: '💬 תגובה חדשה',
                body: `${currentUser.name}: ${newComment.substring(0, 50)}${newComment.length > 50 ? '...' : ''}`,
                url: `/Projects?id=${projectId}`,
                tag: 'comment'
              }).catch(err => console.error('Push notification error:', err));
            }
          }
        }
      } catch (err) {
        console.error('Failed to send comment notification:', err);
        // Don't fail the comment submission if notification fails
      }
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    addCommentMutation.mutate({
      content: newComment,
      author_name: currentUser.name,
      author_email: currentUser.email,
      author_role: currentUser.role,
      related_id: relatedId,
      related_type: relatedType,
      project_id: projectId,
      is_internal: false,
    });
  };

  return (
    <Card className="border-slate-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-indigo-600" />
            תגובות והערות
            {comments.length > 0 && (
              <Badge className="bg-slate-100 text-slate-700">
                {comments.length}
              </Badge>
            )}
          </CardTitle>
          {comments.length > 3 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'הצג פחות' : `הצג הכל (${comments.length})`}
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Comments List */}
        {isLoading ? (
          <div className="text-center py-4">
            <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : comments.length > 0 ? (
          <div className="space-y-3 max-h-96 overflow-y-auto">
            <AnimatePresence>
              {(isExpanded ? comments : comments.slice(0, 3)).map((comment, index) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="p-4 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-100 to-indigo-200 rounded-full flex items-center justify-center flex-shrink-0">
                      <User className="w-5 h-5 text-indigo-700" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-slate-900">
                          {comment.author_name}
                        </span>
                        <Badge className={`${roleColors[comment.author_role]} text-xs`}>
                          {roleLabels[comment.author_role]}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-700 mb-2">{comment.content}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3 h-3" />
                        {format(new Date(comment.created_date), 'dd/MM/yy HH:mm', { locale: he })}
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-8">
            <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-600">עדיין אין תגובות</p>
          </div>
        )}

        {/* Add Comment Form */}
        <form onSubmit={handleSubmit} className="pt-4 border-t border-slate-200">
          <Textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="הוסף תגובה או שאלה..."
            className="mb-3 min-h-[80px]"
          />
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={!newComment.trim() || addCommentMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              {addCommentMutation.isPending ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-2" />
              ) : (
                <Send className="w-4 h-4 ml-2" />
              )}
              שלח
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}