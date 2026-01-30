import React from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin } from 'lucide-react';

const statusConfig = {
  sketch: { label: 'סקיצות', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  execution: { label: 'ביצוע', color: 'bg-red-100 text-red-800 border-red-200' },
  completion: { label: 'גמר', color: 'bg-green-100 text-green-800 border-green-200' },
};

export default function ProjectCard({ project, onClick }) {
  const status = statusConfig[project.status];

  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
    >
      <Card className="overflow-hidden cursor-pointer border-slate-200 hover:shadow-xl transition-shadow duration-300">
        {/* Image */}
        <div className="relative h-48 overflow-hidden bg-slate-100">
          <img
            src={project.image}
            alt={project.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3">
            <Badge className={`${status.color} border font-medium`}>
              {status.label}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            {project.name}
          </h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4" strokeWidth={1.5} />
              <span>{project.location}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-4 h-4" strokeWidth={1.5} />
              <span>{project.timeline}</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">תקציב</span>
            <span className="text-lg font-bold text-indigo-700">{project.budget}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}