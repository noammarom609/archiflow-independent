import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { PenTool, Loader2, CheckCircle2, AlertCircle, Trash2 } from 'lucide-react';
import { archiflow } from '@/api/archiflow';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { showSuccess, showError } from '../utils/notifications';

export default function DigitalSignatureDialog({ isOpen, onClose, document, signerInfo, onSignatureComplete }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [notes, setNotes] = useState('');
  const [isSigning, setIsSigning] = useState(false);
  const queryClient = useQueryClient();

  const signatureMutation = useMutation({
    mutationFn: (signatureData) => archiflow.entities.DocumentSignature.create(signatureData),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['documentSignatures'] });
      queryClient.invalidateQueries({ queryKey: ['contractorDocuments'] });
      showSuccess('מסמך נחתם בהצלחה ✓');
      // Pass signature image data back to parent
      if (onSignatureComplete && variables.signature_data) {
        onSignatureComplete(variables.signature_data);
      }
      onClose();
    },
    onError: () => {
      showError('שגיאה בחתימת מסמך');
    },
  });

  // Initialize canvas
  React.useEffect(() => {
    if (isOpen && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [isOpen]);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    ctx.beginPath();
    ctx.moveTo(
      e.clientX - rect.left,
      e.clientY - rect.top
    );
    setIsDrawing(true);
    setIsEmpty(false);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    
    ctx.lineTo(
      e.clientX - rect.left,
      e.clientY - rect.top
    );
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
  };

  const handleSign = async () => {
    if (isEmpty) {
      showError('אנא חתום על המסמך');
      return;
    }

    setIsSigning(true);
    try {
      const canvas = canvasRef.current;
      const signatureData = canvas.toDataURL('image/png');

      await signatureMutation.mutateAsync({
        entity_type: 'document',
        entity_id: document.id,
        signer_name: signerInfo.name,
        signer_email: signerInfo.email || '',
        signature_type: 'drawn',
        signature_data: signatureData,
        signed_at: new Date().toISOString(),
        verified: true,
        project_id: document.project_id,
        architect_email: signerInfo.architect_email || '',
        notes: notes,
      });
    } catch (error) {
      showError('שגיאה בחתימה');
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <PenTool className="w-5 h-5 text-indigo-600" />
            חתימה דיגיטלית
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Document Info */}
          <Alert className="border-indigo-200 bg-indigo-50">
            <AlertCircle className="w-4 h-4 text-indigo-600" />
            <AlertDescription className="text-indigo-900">
              <p className="font-semibold mb-1">מסמך: {document?.title}</p>
              <p className="text-sm">חותם: {signerInfo?.name} ({signerInfo?.role === 'architect' ? 'אדריכל' : 'קבלן'})</p>
            </AlertDescription>
          </Alert>

          {/* Signature Canvas */}
          <div>
            <Label className="mb-2 block">חתימה</Label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-2 bg-white">
              <canvas
                ref={canvasRef}
                width={600}
                height={200}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                className="w-full cursor-crosshair bg-slate-50 rounded"
              />
            </div>
            <div className="flex justify-end mt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={clearSignature}
                disabled={isEmpty}
              >
                <Trash2 className="w-4 h-4 ml-2" />
                נקה חתימה
              </Button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="signature-notes">הערות (אופציונלי)</Label>
            <Textarea
              id="signature-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="הערות לחתימה..."
              rows={2}
              className="mt-2"
            />
          </div>

          {/* Legal Notice */}
          <Alert>
            <CheckCircle2 className="w-4 h-4" />
            <AlertDescription className="text-sm">
              בחתימתך על מסמך זה, אתה מאשר שקראת והבנת את תוכן המסמך, והחתימה מחייבת משפטית.
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isSigning}
            >
              ביטול
            </Button>
            <Button
              onClick={handleSign}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700"
              disabled={isEmpty || isSigning}
            >
              {isSigning ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  חותם...
                </>
              ) : (
                <>
                  <PenTool className="w-4 h-4 ml-2" />
                  חתום על המסמך
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}