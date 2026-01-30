import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Clock, FileCheck } from 'lucide-react';

const statusIcons = {
  completed: CheckCircle2,
  active: Clock,
  pending: Circle,
};

const statusColors = {
  completed: 'text-green-600 bg-green-50',
  active: 'text-indigo-600 bg-indigo-50',
  pending: 'text-slate-400 bg-slate-50',
};

export default function TimelineStep({ phase, isLast }) {
  const StatusIcon = statusIcons[phase.status];
  const colorClass = statusColors[phase.status];

  return (
    <div className="relative">
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex items-start gap-4"
      >
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
          <StatusIcon className="w-6 h-6" strokeWidth={2} />
        </div>

        {/* Content */}
        <div className="flex-1 pb-8">
          <div className="bg-white rounded-xl p-5 border border-slate-200 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-lg font-semibold text-slate-900">{phase.title}</h4>
              <span className="text-xs text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                {phase.duration}
              </span>
            </div>
            
            <p className="text-sm text-slate-600 mb-4">{phase.description}</p>

            {/* Deliverables */}
            {phase.deliverables && phase.deliverables.length > 0 && (
              <div className="space-y-2">
                {phase.deliverables.map((deliverable, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-sm text-slate-700 bg-slate-50 px-3 py-2 rounded-lg"
                  >
                    {deliverable.done ? (
                      <CheckCircle2 className="w-4 h-4 text-green-600" strokeWidth={2} />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-400" strokeWidth={2} />
                    )}
                    <span className={deliverable.done ? 'line-through text-slate-500' : ''}>
                      {deliverable.name}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Connector Line */}
      {!isLast && (
        <div className="absolute right-6 top-12 w-0.5 h-8 bg-slate-200" />
      )}
    </div>
  );
}