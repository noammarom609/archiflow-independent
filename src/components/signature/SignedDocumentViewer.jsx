import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Download, Shield } from 'lucide-react';
import { motion } from 'framer-motion';
import SignatureHistory from './SignatureHistory';

export default function SignedDocumentViewer({ document, signatures, onDownload }) {
  const allSigned = signatures.length > 0;
  const lastSignature = signatures[signatures.length - 1];

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-xl mb-2">{document.title}</CardTitle>
            <div className="flex items-center gap-2">
              {allSigned && (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle2 className="w-3 h-3 ml-1" />
                  מסמך חתום
                </Badge>
              )}
              <Badge variant="outline">
                {signatures.length} חתימות
              </Badge>
            </div>
          </div>
          <Button onClick={onDownload} variant="outline">
            <Download className="w-4 h-4 ml-2" />
            הורד PDF
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Security Notice */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-indigo-50 border border-indigo-200 rounded-lg p-4"
          >
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-indigo-600 mt-0.5" />
              <div>
                <p className="font-semibold text-indigo-900 mb-1">מסמך מאובטח</p>
                <p className="text-sm text-indigo-700">
                  מסמך זה נחתם דיגיטלית ומאומת. כל שינוי במסמך יבטל את תוקף החתימות.
                </p>
              </div>
            </div>
          </motion.div>

          {/* Signatures */}
          <SignatureHistory signatures={signatures} documentTitle={document.title} />

          {/* Document Preview */}
          <div className="border-2 border-slate-200 rounded-lg p-4 bg-slate-50">
            <p className="text-sm text-slate-600 mb-2">קובץ מקורי:</p>
            <div className="flex items-center justify-between bg-white p-3 rounded border border-slate-200">
              <span className="font-medium text-slate-900">{document.title}</span>
              <span className="text-sm text-slate-500">{document.file_size}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}