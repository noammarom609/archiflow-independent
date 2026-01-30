import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Image, CheckCircle2, PenTool, Link as LinkIcon, FileSignature } from 'lucide-react';
import { useProjectData } from '../ProjectDataContext';
import { sendWhatsApp } from '../../utils/integrations';
import { showSuccess } from '../../utils/notifications';

const moodboardImages = [
  'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&q=80',
  'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=400&q=80',
  'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&q=80',
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400&q=80',
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400&q=80',
  'https://images.unsplash.com/photo-1600607687644-c7171b42498b?w=400&q=80',
];

export default function SketchStage() {
  const { projectData, updateStage } = useProjectData();
  const { selectedImages = [], signed = false, signatureMode = null } = projectData.sketch;
  const [isDrawing, setIsDrawing] = useState(false);
  const canvasRef = React.useRef(null);

  const toggleImage = (index) => {
    const newSelected = selectedImages.includes(index)
      ? selectedImages.filter(i => i !== index)
      : [...selectedImages, index];
    updateStage('sketch', { selectedImages: newSelected });
  };

  const startDrawing = (e) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="space-y-6">
      {/* Style Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="w-5 h-5 text-indigo-600" />
              בורר סגנון - Moodboard
            </CardTitle>
            <p className="text-sm text-slate-600 mt-2">
              הלקוח יבחר את התמונות המועדפות עליו
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {moodboardImages.map((img, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-4 transition-all ${
                    selectedImages.includes(index)
                      ? 'border-indigo-600 shadow-lg'
                      : 'border-transparent hover:border-slate-300'
                  }`}
                  onClick={() => toggleImage(index)}
                >
                  <img
                    src={img}
                    alt={`Style ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  {selectedImages.includes(index) && (
                    <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                      <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
                        <CheckCircle2 className="w-7 h-7 text-white" strokeWidth={2.5} />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {selectedImages.length > 0 && (
              <div className="mt-4 p-4 bg-indigo-50 rounded-lg">
                <p className="text-sm font-medium text-indigo-900">
                  נבחרו {selectedImages.length} תמונות
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Digital Signature */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSignature className="w-5 h-5 text-indigo-600" />
              אישור סקיצה דיגיטלי
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!signed && !signatureMode && (
              <div className="space-y-3">
                <p className="text-sm text-slate-600 mb-4">בחר שיטת אישור:</p>
                <Button
                  onClick={() => {
                    updateStage('sketch', { signatureMode: 'link' });
                    const signLink = `https://archiflow.app/sign/${Math.random().toString(36).substr(2, 9)}`;
                    sendWhatsApp('', `שלום! אנא חתמו על הסקיצות בקישור הבא:\n${signLink}`);
                    showSuccess('קישור לחתימה נשלח ללקוח');
                  }}
                  variant="outline"
                  className="w-full justify-start h-16"
                >
                  <LinkIcon className="w-5 h-5 ml-3" />
                  <div className="text-right">
                    <p className="font-semibold">שלח לינק לחתימה</p>
                    <p className="text-xs text-slate-500">הלקוח יקבל SMS/Email עם קישור לחתימה</p>
                  </div>
                </Button>
                <Button
                  onClick={() => updateStage('sketch', { signatureMode: 'canvas' })}
                  variant="outline"
                  className="w-full justify-start h-16"
                >
                  <PenTool className="w-5 h-5 ml-3" />
                  <div className="text-right">
                    <p className="font-semibold">חתום כאן במקום</p>
                    <p className="text-xs text-slate-500">חתימה באמצעות עכבר או מסך מגע</p>
                  </div>
                </Button>
              </div>
            )}

            {signatureMode === 'link' && !signed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="p-6 bg-blue-50 rounded-xl border border-blue-200">
                  <div className="flex items-center gap-3 mb-3">
                    <LinkIcon className="w-5 h-5 text-blue-600" />
                    <p className="font-semibold text-blue-900">קישור נשלח ללקוח</p>
                  </div>
                  <p className="text-sm text-blue-700">
                    הקישור נשלח ל-client@example.com
                  </p>
                </div>
                <Button
                  onClick={() => {
                    updateStage('sketch', { signed: true });
                    showSuccess('הסקיצות אושרו בהצלחה! ✅');
                  }}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                  סמן כאושר (סימולציה)
                </Button>
                <Button
                  variant="outline"
                  onClick={() => updateStage('sketch', { signatureMode: null })}
                  className="w-full"
                >
                  חזור
                </Button>
              </motion.div>
            )}

            {signatureMode === 'canvas' && !signed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4"
              >
                <div className="border-2 border-slate-900 rounded-xl p-4 bg-white">
                  <p className="text-xs text-slate-600 mb-2 text-center">
                    חתום כאן למטה (ניתן לחתום בעכבר או באצבע)
                  </p>
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={200}
                    className="w-full border-2 border-dashed border-slate-300 rounded cursor-crosshair bg-slate-50"
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                  />
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-xs text-slate-500">חתימה משפטית מחייבת</span>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearCanvas}
                      >
                        נקה
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          updateStage('sketch', { signed: true });
                          showSuccess('החתימה נשמרה בהצלחה! ✅');
                        }}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="w-4 h-4 ml-2" />
                        אשר חתימה
                      </Button>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => updateStage('sketch', { signatureMode: null })}
                  className="w-full"
                >
                  חזור
                </Button>
              </motion.div>
            )}

            {signed && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 bg-green-50 rounded-xl border-2 border-green-200 flex items-center gap-3"
              >
                <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <FileSignature className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-green-900">סקיצה אושרה בהצלחה! ✅</p>
                  <p className="text-sm text-green-700">
                    מסמך חתום • {new Date().toLocaleDateString('he-IL')}
                  </p>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}