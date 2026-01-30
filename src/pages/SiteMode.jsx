import React from 'react';
import { motion } from 'framer-motion';
import MobileSimulator from '../components/site/MobileSimulator';

export default function SiteMode() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-indigo-50">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 pb-0"
      >
        <h1 className="text-4xl font-bold text-slate-900 mb-2">מצב אתר בנייה</h1>
        <p className="text-lg text-slate-600">ממשק לקבלנים ועובדי שטח - סימולציית מובייל</p>
      </motion.div>

      {/* Mobile Simulator */}
      <MobileSimulator />

      {/* Info Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center p-8 text-sm text-slate-500"
      >
        <p>הממשק מותאם לנייד ומאפשר לקבלנים גישה מהירה לתוכניות באתר</p>
      </motion.div>
    </div>
  );
}