import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, FileText, Download } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export default function AIProposalGenerator({ projectName = 'משפחת לוי' }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [proposal, setProposal] = useState(null);
  const [streamedText, setStreamedText] = useState('');

  const fullProposal = {
    intro: 'הצעת מחיר לשיפוץ דופלקס - משפחת לוי, רח׳ דיזנגוף 123, תל אביב',
    items: [
      { name: 'עבודות הריסה והכנה', price: 35000 },
      { name: 'עבודות חשמל מלאות', price: 55000 },
      { name: 'עבודות אינסטלציה ותיקון', price: 48000 },
      { name: 'עבודות גבס ותקרות אקוסטיות', price: 42000 },
      { name: 'ריצוף וחיפוי - פורצלן איטלקי', price: 85000 },
      { name: 'נגרות - ארונות מטבח ואמבטיה', price: 95000 },
      { name: 'צביעה ועבודות גימור', price: 38000 },
      { name: 'דלתות ופרגולות פנימיות', price: 32000 },
      { name: 'תאורה ומתקנים חכמים', price: 20000 },
    ],
    total: 450000,
    notes: 'ההצעה בתוקף ל-30 יום. כוללת חומרים וביצוע. אחריות לשנתיים.',
  };

  const generateProposal = () => {
    setIsGenerating(true);
    setStreamedText('');
    setProposal(null);

    // Simulate streaming text generation
    const fullText = `מכינים הצעת מחיר מפורטת עבור ${projectName}...

✓ מנתח דרישות הפרויקט
✓ מחשב עלויות חומרים
✓ מעריך זמני ביצוע
✓ בודק מחירי שוק נוכחיים
✓ מוסיף המלצות מקצועיות

ההצעה מוכנה!`;

    let index = 0;
    const interval = setInterval(() => {
      if (index < fullText.length) {
        setStreamedText((prev) => prev + fullText[index]);
        index++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsGenerating(false);
          setProposal(fullProposal);
        }, 500);
      }
    }, 30);
  };

  return (
    <div className="space-y-6">
      {/* Generate Button */}
      {!isGenerating && !proposal && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex justify-center"
        >
          <Button
            onClick={generateProposal}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6 text-lg rounded-xl
                       flex items-center gap-3 shadow-lg hover:shadow-xl transition-all"
          >
            <Sparkles className="w-6 h-6" />
            <span>צור הצעת מחיר חכמה</span>
          </Button>
        </motion.div>
      )}

      {/* Streaming Animation */}
      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-indigo-200 bg-indigo-50">
              <CardContent className="p-8">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <div className="flex-1">
                    <pre className="text-sm text-slate-900 font-light whitespace-pre-wrap leading-relaxed">
                      {streamedText}
                      <span className="inline-block w-2 h-4 bg-indigo-600 animate-pulse mr-1" />
                    </pre>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Final Proposal */}
      <AnimatePresence>
        {proposal && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-slate-200 shadow-xl">
              <CardHeader className="bg-gradient-to-l from-slate-50 to-white">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl font-bold text-slate-900">
                    {proposal.intro}
                  </CardTitle>
                  <Button variant="outline" className="gap-2">
                    <Download className="w-4 h-4" />
                    ייצוא PDF
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-8">
                {/* Items */}
                <div className="space-y-3 mb-6">
                  {proposal.items.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between p-4 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                          <span className="text-sm font-bold text-indigo-700">{index + 1}</span>
                        </div>
                        <span className="text-slate-900">{item.name}</span>
                      </div>
                      <span className="text-lg font-semibold text-slate-900">
                        ₪{item.price.toLocaleString()}
                      </span>
                    </motion.div>
                  ))}
                </div>

                <Separator className="my-6" />

                {/* Total */}
                <div className="flex items-center justify-between p-6 bg-indigo-50 rounded-xl">
                  <span className="text-xl font-bold text-slate-900">סה״כ</span>
                  <span className="text-3xl font-bold text-indigo-700">
                    ₪{proposal.total.toLocaleString()}
                  </span>
                </div>

                {/* Notes */}
                <div className="mt-6 p-4 bg-slate-50 rounded-lg">
                  <p className="text-sm text-slate-600">
                    <FileText className="w-4 h-4 inline ml-2" />
                    {proposal.notes}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}