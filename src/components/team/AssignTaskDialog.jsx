import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, UserPlus, Users } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

export default function AssignTaskDialog({ isOpen, onClose, task }) {
  const queryClient = useQueryClient();
  const [selectedMembers, setSelectedMembers] = useState([]);

  // Fetch team members
  const { data: teamMembers = [] } = useQuery({
    queryKey: ['teamMembers'],
    queryFn: () => base44.entities.TeamMember.list('-created_date'),
    enabled: isOpen,
  });

  // Filter to only show relevant team members (not clients)
  const availableMembers = teamMembers.filter(
    member => member.role !== 'client' && member.status === 'active'
  );

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, data }) => base44.entities.Task.update(taskId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
    },
  });

  const handleAssign = () => {
    if (!task || selectedMembers.length === 0) return;
    
    updateTaskMutation.mutate({
      taskId: task.id,
      data: {
        assigned_to: selectedMembers,
      },
    });
  };

  const toggleMember = (memberId) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  if (!isOpen || !task) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
        />

        {/* Dialog */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative w-full max-w-lg max-h-[80vh] overflow-y-auto"
        >
          <Card className="border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100">
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                הקצה משימה
              </CardTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              {/* Task Info */}
              <div className="mb-6 p-4 bg-slate-50 rounded-lg">
                <h3 className="font-semibold text-slate-900 mb-1">{task.title}</h3>
                <p className="text-sm text-slate-600">{task.project_name}</p>
              </div>

              {/* Team Members List */}
              <div className="space-y-3 mb-6">
                <h4 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  בחר חברי צוות
                </h4>
                
                {availableMembers.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => toggleMember(member.id)}
                  >
                    <Checkbox
                      checked={selectedMembers.includes(member.id)}
                      onCheckedChange={() => toggleMember(member.id)}
                    />
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center flex-shrink-0">
                      {member.avatar_url ? (
                        <img
                          src={member.avatar_url}
                          alt={member.full_name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        <span className="text-sm font-bold text-indigo-700">
                          {member.full_name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">{member.full_name}</p>
                      <p className="text-xs text-slate-600">{member.email}</p>
                    </div>
                    {member.role === 'project_manager' && (
                      <Badge className="bg-indigo-100 text-indigo-800 text-xs">מנהל</Badge>
                    )}
                  </div>
                ))}
              </div>

              {/* Selected Count */}
              {selectedMembers.length > 0 && (
                <div className="mb-4 p-3 bg-indigo-50 rounded-lg">
                  <p className="text-sm font-medium text-indigo-900">
                    נבחרו {selectedMembers.length} חברי צוות
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1"
                >
                  ביטול
                </Button>
                <Button
                  onClick={handleAssign}
                  disabled={selectedMembers.length === 0 || updateTaskMutation.isPending}
                  className="flex-1 bg-indigo-600 hover:bg-indigo-700"
                >
                  {updateTaskMutation.isPending ? 'מקצה...' : 'הקצה משימה'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}