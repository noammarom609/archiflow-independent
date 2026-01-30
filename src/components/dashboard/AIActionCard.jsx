import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Sparkles, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AIActionCard() {
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    
    setIsProcessing(true);
    // Simulate AI processing
    setTimeout(() => {
      setIsProcessing(false);
      setInput('');
    }, 2000);
  };

  return (
    <Card className="border-slate-200 bg-gradient-to-br from-indigo-50 to-white p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" strokeWidth={2} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">מה תרצה לעשות היום, דן?</h3>
          <p className="text-sm text-slate-600">אני כאן לעזור בכל משימה</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="כתוב סיכום פגישה למשפחת לוי..."
          className="w-full min-h-[120px] px-5 py-4 bg-white border-2 border-slate-200 rounded-xl 
                     text-slate-900 placeholder-slate-400 resize-none
                     focus:outline-none focus:border-indigo-400 transition-colors"
          disabled={isProcessing}
        />
        
        <motion.div
          className="absolute bottom-4 left-4"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg
                       flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>מעבד...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>שלח</span>
              </>
            )}
          </Button>
        </motion.div>
      </form>
    </Card>
  );
}