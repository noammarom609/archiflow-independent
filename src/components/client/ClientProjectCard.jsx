import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, MapPin, ArrowLeft, User } from 'lucide-react';

const statusConfig = {
  sketch: { label: 'סקיצות', color: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  execution: { label: 'בביצוע', color: 'bg-red-100 text-red-800 border-red-200' },
  completion: { label: 'גמר', color: 'bg-green-100 text-green-800 border-green-200' },
};

export default function ClientProjectCard({ project, onClick, index }) {
  const status = statusConfig[project.status] || statusConfig.execution;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ scale: 1.02, y: -4 }}
      onClick={onClick}
    >
      <Card className="overflow-hidden cursor-pointer border-slate-200 hover:shadow-xl transition-all duration-300">
        {/* Image */}
        <div className="relative h-48 overflow-hidden bg-gradient-to-br from-indigo-100 to-indigo-200">
          {project.image ? (
            <img
              src={project.image}
              alt={project.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl font-bold text-indigo-300">
                {project.name.charAt(0)}
              </span>
            </div>
          )}
          <div className="absolute top-3 right-3">
            <Badge className={`${status.color} border font-medium`}>
              {status.label}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <CardContent className="p-5">
          <h3 className="text-xl font-bold text-slate-900 mb-3">
            {project.name}
          </h3>
          
          <div className="space-y-2 text-sm mb-4">
            <div className="flex items-center gap-2 text-slate-600">
              <MapPin className="w-4 h-4" strokeWidth={1.5} />
              <span>{project.location}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-4 h-4" strokeWidth={1.5} />
              <span>{project.timeline}</span>
            </div>
            {project.budget && (
              <div className="flex items-center gap-2 text-slate-600">
                <DollarSign className="w-4 h-4" strokeWidth={1.5} />
                <span className="font-semibold">{project.budget}</span>
              </div>
            )}
            
            {project.client && (
              <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md w-fit mt-2">
                <User className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span className="font-medium text-xs">{project.client}</span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-sm text-slate-500">לחץ לפרטים נוספים</span>
            <ArrowLeft className="w-4 h-4 text-indigo-600" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}