import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FolderPlus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { showSuccess, showError } from '../utils/notifications';

const COLORS = [
  { name: 'אינדיגו', value: 'indigo' },
  { name: 'סגול', value: 'purple' },
  { name: 'כחול', value: 'blue' },
  { name: 'ירוק', value: 'green' },
  { name: 'צהוב', value: 'yellow' },
  { name: 'כתום', value: 'orange' },
  { name: 'אדום', value: 'red' },
  { name: 'ורוד', value: 'pink' },
];

export default function CreateFolderDialog({ isOpen, onClose }) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('indigo');

  const createFolderMutation = useMutation({
    mutationFn: (data) => base44.entities.RecordingFolder.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recording-folders'] });
      showSuccess('תיקייה נוצרה בהצלחה');
      resetForm();
      onClose();
    },
    onError: () => showError('שגיאה ביצירת התיקייה'),
  });

  const resetForm = () => {
    setName('');
    setDescription('');
    setColor('indigo');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      showError('נא להזין שם תיקייה');
      return;
    }
    createFolderMutation.mutate({ name, description, color });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <FolderPlus className="w-5 h-5 text-indigo-600" />
            תיקייה חדשה
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="folder-name">שם התיקייה</Label>
            <Input
              id="folder-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="למשל: פגישות לקוחות"
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="folder-description">תיאור (אופציונלי)</Label>
            <Textarea
              id="folder-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="תיאור קצר של התיקייה"
              className="mt-1"
              rows={2}
            />
          </div>

          <div>
            <Label>צבע</Label>
            <div className="grid grid-cols-4 gap-2 mt-2">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={`h-10 rounded-lg transition-all ${
                    color === c.value 
                      ? 'ring-2 ring-offset-2 ring-indigo-600 scale-105' 
                      : 'hover:scale-105'
                  }`}
                  style={{
                    backgroundColor: `var(--${c.value}-500, #6366f1)`,
                  }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="flex-1"
            >
              ביטול
            </Button>
            <Button
              type="submit"
              disabled={createFolderMutation.isPending}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
            >
              {createFolderMutation.isPending ? 'יוצר...' : 'צור תיקייה'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}