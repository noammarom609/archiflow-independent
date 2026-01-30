import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Image, Send, CheckCircle2, Clock, MessageSquare, PenTool } from 'lucide-react';

export default function RenderingStage() {
  const [status, setStatus] = useState('waiting'); // waiting | approved
  const [signed, setSigned] = useState(false);

  const renderings = [
    { id: 1, name: 'הדמיית סלון', url: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80' },
    { id: 2, name: 'הדמיית מטבח', url: 'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?w=800&q=80' },
    { id: 3, name: 'הדמיית חדר שינה', url: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&q=80' },
  ];

  return (
    <div className="space-y-6">
      {/* Renderings Gallery */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Image className="w-5 h-5 text-indigo-600" />
                הדמיות 3D
              </div>
              <Badge className={status === 'waiting' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}>
                {status === 'waiting' ? 'ממתין לאישור' : 'אושר'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderings.map((rendering, index) => (
                <motion.div
                  key={rendering.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 group"
                >
                  <img
                    src={rendering.url}
                    alt={rendering.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                    <p className="text-white font-medium">{rendering.name}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Status Actions */}
      {status === 'waiting' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-900">
                <Clock className="w-5 h-5" />
                ממתין לאישור לקוח
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-white hover:bg-slate-50 text-slate-900 border border-slate-200 justify-start">
                <MessageSquare className="w-4 h-4 ml-2" />
                שלח עדכון הדמיות (WhatsApp)
              </Button>
              <Button
                onClick={() => setStatus('approved')}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle2 className="w-4 h-4 ml-2" />
                הלקוח אישר את ההדמיות
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Digital Approval */}
      {status === 'approved' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-900">
                <CheckCircle2 className="w-5 h-5" />
                אישור הדמיות דיגיטלי
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!signed ? (
                <>
                  <div className="p-8 border-2 border-dashed border-green-300 rounded-xl bg-white flex flex-col items-center justify-center">
                    <PenTool className="w-12 h-12 text-green-600 mb-3" />
                    <p className="text-sm text-green-700">לוח חתימה לאישור הדמיות</p>
                  </div>
                  <Button
                    onClick={() => setSigned(true)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle2 className="w-4 h-4 ml-2" />
                    חתום ואשר הדמיות
                  </Button>
                </>
              ) : (
                <div className="p-6 bg-white rounded-xl border border-green-300 flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                  <div>
                    <p className="font-semibold text-green-900">הדמיות אושרו בהצלחה! ✅</p>
                    <p className="text-sm text-green-700">ניתן להמשיך לתוכניות העבודה</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}