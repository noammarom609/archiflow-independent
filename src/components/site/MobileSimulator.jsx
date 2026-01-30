import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { QrCode, FileText, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const plans = [
  { name: 'תוכנית חשמל', version: 'v3', status: 'current', size: '2.4 MB' },
  { name: 'תוכנית אינסטלציה', version: 'v2', status: 'current', size: '1.8 MB' },
  { name: 'תוכנית ריצוף', version: 'v1', status: 'current', size: '3.1 MB' },
  { name: 'תוכנית הריסה', version: 'v2', status: 'outdated', size: '1.2 MB' },
];

export default function MobileSimulator() {
  return (
    <div className="flex justify-center items-center min-h-[calc(100vh-200px)] p-8">
      {/* Mobile Device Frame */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="relative"
      >
        {/* Device Shadow */}
        <div className="absolute inset-0 bg-slate-900/10 blur-3xl transform translate-y-8" />

        {/* Device Frame */}
        <div className="relative w-[400px] bg-slate-900 rounded-[3rem] p-3 shadow-2xl">
          {/* Screen */}
          <div className="bg-white rounded-[2.5rem] overflow-hidden">
            {/* Status Bar */}
            <div className="bg-slate-900 h-8 flex items-center justify-between px-8 text-white text-xs">
              <span>9:41</span>
              <div className="flex items-center gap-1">
                <div className="w-4 h-3 border border-white rounded-sm" />
                <div className="w-1 h-3 bg-white rounded-sm" />
              </div>
            </div>

            {/* App Content */}
            <div className="bg-slate-50 min-h-[700px] overflow-auto">
              {/* Header */}
              <div className="bg-indigo-600 text-white p-6 pb-8">
                <h1 className="text-2xl font-bold mb-1">אתר בנייה</h1>
                <p className="text-indigo-100 text-sm">פנטהאוז משפחת לוי</p>
              </div>

              {/* QR Code Section */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="px-6 -mt-6 mb-6"
              >
                <Card className="shadow-xl border-0">
                  <CardContent className="p-6 text-center">
                    <div className="w-48 h-48 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 border-4 border-slate-100">
                      <QrCode className="w-32 h-32 text-slate-900" strokeWidth={1} />
                    </div>
                    <p className="text-sm text-slate-600 mb-2">סרוק לגישה מהירה</p>
                    <Badge className="bg-indigo-100 text-indigo-700">
                      קוד QR פעיל
                    </Badge>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Alert Banner */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="px-6 mb-6"
              >
                <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-orange-900 mb-1">
                      שים לב!
                    </p>
                    <p className="text-sm text-orange-700">
                      קיימת גרסה חדשה לתוכנית הריסה
                    </p>
                  </div>
                </div>
              </motion.div>

              {/* Plans List */}
              <div className="px-6 pb-6">
                <h2 className="text-lg font-bold text-slate-900 mb-4">תוכניות ביצוע</h2>
                <div className="space-y-3">
                  {plans.map((plan, index) => (
                    <motion.div
                      key={index}
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 + index * 0.1 }}
                    >
                      <Card className={`
                        border-2 hover:shadow-lg transition-shadow cursor-pointer
                        ${plan.status === 'outdated' ? 'border-orange-200 bg-orange-50' : 'border-slate-200'}
                      `}>
                        <CardContent className="p-5">
                          <div className="flex items-center gap-4">
                            <div className={`
                              w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0
                              ${plan.status === 'outdated' ? 'bg-orange-100' : 'bg-indigo-100'}
                            `}>
                              <FileText className={`
                                w-7 h-7
                                ${plan.status === 'outdated' ? 'text-orange-600' : 'text-indigo-600'}
                              `} strokeWidth={1.5} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-base font-semibold text-slate-900 truncate">
                                  {plan.name}
                                </h3>
                                {plan.status === 'current' && (
                                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-3 text-xs text-slate-600">
                                <span className="font-medium">{plan.version}</span>
                                <span>•</span>
                                <span>{plan.size}</span>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="flex-shrink-0"
                            >
                              <Download className="w-5 h-5" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Home Indicator */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white rounded-full" />
        </div>
      </motion.div>
    </div>
  );
}