import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet,
  Download,
  Eye,
  Share2,
  Tag
} from 'lucide-react';

const fileTypeIcons = {
  pdf: FileText,
  image: ImageIcon,
  excel: FileSpreadsheet,
  word: FileText,
  dwg: FileText,
  other: FileText,
};

const fileTypeColors = {
  pdf: 'bg-red-100 text-red-700',
  image: 'bg-blue-100 text-blue-700',
  excel: 'bg-green-100 text-green-700',
  word: 'bg-indigo-100 text-indigo-700',
  dwg: 'bg-purple-100 text-purple-700',
  other: 'bg-slate-100 text-slate-700',
};

const categoryLabels = {
  plan: 'תוכנית',
  contract: 'חוזה',
  permit: 'היתר',
  invoice: 'חשבונית',
  report: 'דוח',
  photo: 'תמונה',
  specification: 'מפרט',
  other: 'אחר',
};

export default function DocumentCard({ document, onShare, index }) {
  const FileIcon = fileTypeIcons[document.file_type] || FileText;
  const fileColor = fileTypeColors[document.file_type] || fileTypeColors.other;
  const categoryLabel = categoryLabels[document.category] || document.category;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="border-slate-200 hover:shadow-lg transition-all group">
        <CardContent className="p-5">
          {/* Icon and Title */}
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-12 h-12 rounded-xl ${fileColor} flex items-center justify-center flex-shrink-0`}>
              <FileIcon className="w-6 h-6" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-900 mb-1 truncate group-hover:text-indigo-700 transition-colors">
                {document.title}
              </h3>
              {document.description && (
                <p className="text-sm text-slate-600 line-clamp-2 mb-2">
                  {document.description}
                </p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="bg-slate-100 text-slate-700 text-xs">
                  {categoryLabel}
                </Badge>
                {document.version && (
                  <Badge variant="outline" className="text-xs">
                    v{document.version}
                  </Badge>
                )}
                {document.file_size && (
                  <span className="text-xs text-slate-500">{document.file_size}</span>
                )}
              </div>
            </div>
          </div>

          {/* Project Info */}
          {document.project_name && (
            <div className="flex items-center gap-2 mb-4 text-sm text-slate-600">
              <Tag className="w-4 h-4" strokeWidth={1.5} />
              <span>{document.project_name}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => window.open(document.file_url, '_blank')}
            >
              <Eye className="w-4 h-4 ml-2" />
              צפייה
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => window.open(document.file_url, '_blank')}
            >
              <Download className="w-4 h-4 ml-2" />
              הורדה
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onShare && onShare(document)}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Shared With */}
          {document.shared_with && document.shared_with.length > 0 && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-1">משותף עם:</p>
              <div className="flex items-center gap-1">
                {document.shared_with.slice(0, 3).map((id, idx) => (
                  <div
                    key={idx}
                    className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-medium text-indigo-700"
                  >
                    {idx + 1}
                  </div>
                ))}
                {document.shared_with.length > 3 && (
                  <span className="text-xs text-slate-500">
                    +{document.shared_with.length - 3}
                  </span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}