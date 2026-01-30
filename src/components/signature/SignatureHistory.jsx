import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle2, User, Calendar, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';

export default function SignatureHistory({ signatures, documentTitle }) {
  if (!signatures || signatures.length === 0) {
    return (
      <Card className="border-slate-200">
        <CardContent className="p-8 text-center">
          <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">טרם נחתם</p>
        </CardContent>
      </Card>
    );
  }

  const roleLabels = {
    architect: 'אדריכל',
    contractor: 'קבלן',
    client: 'לקוח',
  };

  return (
    <Card className="border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-green-600" />
          היסטוריית חתימות
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {signatures.map((signature, index) => (
          <motion.div
            key={signature.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="border-r-4 border-green-500 bg-green-50 p-4 rounded-lg"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-green-200 text-green-800">
                    {signature.signer_name.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-bold text-slate-900">{signature.signer_name}</p>
                  <p className="text-sm text-slate-600">
                    {roleLabels[signature.signer_role]}
                  </p>
                </div>
              </div>
              {signature.verified && (
                <Badge className="bg-green-600 text-white">
                  <CheckCircle2 className="w-3 h-3 ml-1" />
                  מאומת
                </Badge>
              )}
            </div>

            {/* Signature Image */}
            <div className="mb-3 bg-white rounded-lg p-3 border border-slate-200">
              <img
                src={signature.signature_data}
                alt="חתימה דיגיטלית"
                className="h-20 mx-auto"
              />
            </div>

            {/* Details */}
            <div className="space-y-1 text-sm text-slate-600">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>
                  {format(new Date(signature.timestamp || signature.created_date), 'dd/MM/yyyy HH:mm', {
                    locale: he,
                  })}
                </span>
              </div>
              {signature.notes && (
                <div className="mt-2 text-sm text-slate-700 bg-white p-2 rounded">
                  <strong>הערות:</strong> {signature.notes}
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}