import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from './card';

// Shimmer animation keyframes are in globals.css

export function SkeletonCard({ count = 1 }) {
  return (
    <>
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
        >
          <Card className="border-slate-200 overflow-hidden relative">
            {/* Shimmer overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: i * 0.2 }}
            />
            
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                {/* Image skeleton with pulse */}
                <motion.div 
                  className="w-16 h-16 bg-gradient-to-br from-slate-200 to-slate-300 rounded-xl flex-shrink-0"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                
                <div className="flex-1 space-y-3">
                  {/* Title */}
                  <motion.div 
                    className="h-5 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-3/4"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.1 }}
                  />
                  
                  {/* Subtitle */}
                  <motion.div 
                    className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-1/2"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  />
                  
                  {/* Details */}
                  <div className="flex gap-2">
                    <motion.div 
                      className="h-6 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-20"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
                    />
                    <motion.div 
                      className="h-6 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-24"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="relative overflow-hidden">
      {/* Shimmer overlay */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-3 mb-3">
        <div className="flex gap-4">
          {[...Array(cols)].map((_, i) => (
            <motion.div 
              key={i} 
              className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded flex-1"
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: i * 0.1, type: "spring" }}
            />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      {[...Array(rows)].map((_, i) => (
        <motion.div 
          key={i} 
          className="border-b border-slate-100 py-3"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: i * 0.08, type: "spring" }}
        >
          <div className="flex gap-4">
            {[...Array(cols)].map((_, j) => (
              <motion.div 
                key={j} 
                className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded flex-1"
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: (i + j) * 0.1 }}
              />
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}

export function SkeletonList({ items = 5 }) {
  return (
    <div className="space-y-3">
      {[...Array(items)].map((_, i) => (
        <motion.div 
          key={i} 
          className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg relative overflow-hidden"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
        >
          {/* Shimmer */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear", delay: i * 0.15 }}
          />
          
          <motion.div 
            className="w-12 h-12 bg-gradient-to-br from-slate-200 to-slate-300 rounded-lg flex-shrink-0"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
          />
          <div className="flex-1 space-y-2">
            <motion.div 
              className="h-4 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-2/3"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            />
            <motion.div 
              className="h-3 bg-gradient-to-r from-slate-200 to-slate-300 rounded w-1/2"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
            />
          </div>
          <motion.div 
            className="w-20 h-8 bg-gradient-to-r from-slate-200 to-slate-300 rounded"
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
          />
        </motion.div>
      ))}
    </div>
  );
}