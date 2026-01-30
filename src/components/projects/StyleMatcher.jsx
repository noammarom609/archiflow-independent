import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Sparkles, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const styleImages = [
  { id: 1, url: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=600&q=80', selected: true },
  { id: 2, url: 'https://images.unsplash.com/photo-1600210491369-e753d80a41f3?w=600&q=80', selected: true },
  { id: 3, url: 'https://images.unsplash.com/photo-1600210492493-0946911123ea?w=600&q=80', selected: false },
  { id: 4, url: 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=600&q=80', selected: true },
  { id: 5, url: 'https://images.unsplash.com/photo-1600566752355-35792bedcfea?w=600&q=80', selected: false },
  { id: 6, url: 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?w=600&q=80', selected: true },
];

export default function StyleMatcher() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const analyzeStyle = () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    setTimeout(() => {
      setAnalysis({
        style: 'נורדי-תעשייתי',
        confidence: 94,
        features: [
          'צבעים נייטרליים עם מבטא עץ',
          'קווים נקיים ומינימליסטיים',
          'שילוב חומרים טבעיים',
          'תאורה תעשייתית',
          'רהיטים פונקציונליים',
        ],
        recommendations: [
          'ריצוף פורצלן דמוי בטון אפור',
          'ארונות מטבח בגוון אלון טבעי',
          'גופי תאורה שחורים מתכתיים',
          'קירות לבנים עם מבטא עץ',
        ],
      });
      setIsAnalyzing(false);
    }, 2500);
  };

  return (
    <div className="space-y-6">
      {/* Images Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {styleImages.map((image, index) => (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            className="relative group"
          >
            <Card className="overflow-hidden border-2 border-slate-200 hover:border-indigo-400 transition-all">
              <div className="aspect-square overflow-hidden bg-slate-100">
                <img
                  src={image.url}
                  alt={`סגנון ${image.id}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              {image.selected && (
                <div className="absolute top-2 left-2 w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center">
                  <Heart className="w-4 h-4 text-white fill-white" />
                </div>
              )}
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Analyze Button */}
      {!analysis && (
        <div className="flex justify-center">
          <Button
            onClick={analyzeStyle}
            disabled={isAnalyzing}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-xl
                       flex items-center gap-3 shadow-lg disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>מנתח סגנון...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>ניתוח סגנון ע״י AI</span>
              </>
            )}
          </Button>
        </div>
      )}

      {/* Analysis Result */}
      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-2 border-indigo-200 bg-gradient-to-bl from-indigo-50 to-white">
              <CardContent className="p-8">
                {/* Style Name */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-sm text-slate-600 mb-2">הסגנון שזוהה</h3>
                    <h2 className="text-3xl font-bold text-indigo-700">{analysis.style}</h2>
                  </div>
                  <div className="text-center">
                    <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center">
                      <span className="text-2xl font-bold text-indigo-700">{analysis.confidence}%</span>
                    </div>
                    <span className="text-xs text-slate-600 mt-2 block">דיוק</span>
                  </div>
                </div>

                {/* Features */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">מאפייני הסגנון</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysis.features.map((feature, index) => (
                      <Badge
                        key={index}
                        className="bg-white border-indigo-200 text-slate-700 px-4 py-2"
                      >
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div>
                  <h4 className="text-sm font-semibold text-slate-900 mb-3">המלצות לפרויקט</h4>
                  <div className="space-y-2">
                    {analysis.recommendations.map((rec, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200"
                      >
                        <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-indigo-700">{index + 1}</span>
                        </div>
                        <span className="text-sm text-slate-900">{rec}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}