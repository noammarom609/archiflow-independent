import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Loader2, FileText } from 'lucide-react';
import { archiflow } from '@/api/archiflow';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { showSuccess, showError } from '../utils/notifications';

export default function ContractorDocumentUpload({ isOpen, onClose }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    file_type: 'quote',
    contractor_id: '',
    contractor_name: '',
    project_id: '',
    project_name: '',
    notes: '',
  });

  const queryClient = useQueryClient();

  // Fetch contractors
  const { data: contractors = [] } = useQuery({
    queryKey: ['contractors'],
    queryFn: () => archiflow.entities.Contractor.list('-created_date', 100),
  });

  const uploadMutation = useMutation({
    mutationFn: (docData) => archiflow.entities.ContractorDocument.create(docData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractorDocuments'] });
      showSuccess('מסמך הועלה בהצלחה');
      handleReset();
      onClose();
    },
    onError: () => {
      showError('שגיאה בהעלאת מסמך');
    },
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (!formData.title) {
        setFormData({ ...formData, title: selectedFile.name });
      }
    }
  };

  const handleContractorChange = (contractorId) => {
    const contractor = contractors.find(c => c.id === contractorId);
    if (contractor) {
      setFormData({
        ...formData,
        contractor_id: contractorId,
        contractor_name: contractor.name,
      });
    }
  };

  const handleUpload = async () => {
    if (!file) {
      showError('אנא בחר קובץ');
      return;
    }

    if (!formData.contractor_id || !formData.title) {
      showError('אנא מלא את כל השדות הנדרשים');
      return;
    }

    setUploading(true);
    try {
      // Upload file to storage
      const { file_url } = await archiflow.integrations.Core.UploadFile({ file });

      // Create document record
      await uploadMutation.mutateAsync({
        ...formData,
        file_url,
        file_size: `${(file.size / 1024 / 1024).toFixed(2)} MB`,
        status: 'pending',
      });
    } catch (error) {
      showError('שגיאה בהעלאת קובץ');
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setFormData({
      title: '',
      file_type: 'quote',
      contractor_id: '',
      contractor_name: '',
      project_id: '',
      project_name: '',
      notes: '',
    });
  };

  const fileTypes = [
    { value: 'quote', label: 'הצעת מחיר' },
    { value: 'certificate', label: 'תעודה' },
    { value: 'invoice', label: 'חשבונית' },
    { value: 'contract', label: 'חוזה' },
    { value: 'insurance', label: 'ביטוח' },
    { value: 'other', label: 'אחר' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">העלאת מסמך</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* File Upload */}
          <div>
            <Label>קובץ</Label>
            <div className="mt-2 border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-orange-400 transition-colors cursor-pointer">
              <input
                type="file"
                onChange={handleFileChange}
                className="hidden"
                id="file-upload-contractor"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
              <label htmlFor="file-upload-contractor" className="cursor-pointer">
                {file ? (
                  <div className="flex items-center justify-center gap-2">
                    <FileText className="w-8 h-8 text-orange-600" />
                    <div className="text-right">
                      <p className="text-sm font-semibold text-slate-900">{file.name}</p>
                      <p className="text-xs text-slate-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Upload className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                    <p className="text-sm text-slate-600 mb-1">לחץ לבחירת קובץ</p>
                    <p className="text-xs text-slate-500">PDF, Word, תמונות</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="title">כותרת המסמך *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="למשל: הצעת מחיר - עבודות חשמל"
              className="mt-2"
            />
          </div>

          {/* File Type */}
          <div>
            <Label>סוג המסמך *</Label>
            <Select
              value={formData.file_type}
              onValueChange={(value) => setFormData({ ...formData, file_type: value })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fileTypes.map(type => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Contractor */}
          <div>
            <Label>קבלן *</Label>
            <Select
              value={formData.contractor_id}
              onValueChange={handleContractorChange}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="בחר קבלן" />
              </SelectTrigger>
              <SelectContent>
                {contractors.map(contractor => (
                  <SelectItem key={contractor.id} value={contractor.id}>
                    {contractor.name} - {contractor.specialty}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Project Name */}
          <div>
            <Label htmlFor="project_name">שם הפרויקט (אופציונלי)</Label>
            <Input
              id="project_name"
              value={formData.project_name}
              onChange={(e) => setFormData({ ...formData, project_name: e.target.value })}
              placeholder="שם הפרויקט הקשור"
              className="mt-2"
            />
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">הערות (אופציונלי)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="הערות נוספות..."
              className="mt-2"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onClose} className="flex-1" disabled={uploading}>
              ביטול
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1 bg-orange-600 hover:bg-orange-700"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  מעלה...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 ml-2" />
                  העלה מסמך
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}