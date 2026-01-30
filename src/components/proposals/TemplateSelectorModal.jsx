import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { archiflow } from '@/api/archiflow';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  FileText, 
  Search, 
  Star, 
  Check, 
  Loader2,
  Layout
} from 'lucide-react';

export default function TemplateSelectorModal({ isOpen, onClose, onSelectTemplate }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);

  // Fetch templates
  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['proposalTemplates', 'active'],
    queryFn: () => archiflow.entities.ProposalTemplate.filter({ status: 'active' }, '-usage_count'),
    enabled: isOpen,
  });

  const filteredTemplates = templates.filter(t =>
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelect = () => {
    const template = templates.find(t => t.id === selectedTemplateId);
    if (template) {
      onSelectTemplate(template);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5 text-cyan-600" />
            בחירת תבנית הצעת מחיר
          </DialogTitle>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="חיפוש תבניות..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10"
          />
        </div>

        {/* Templates Grid */}
        <ScrollArea className="flex-1 -mx-6 px-6">
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-cyan-600" />
            </div>
          ) : filteredTemplates.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-500">
                {searchQuery ? 'לא נמצאו תבניות תואמות' : 'אין תבניות זמינות'}
              </p>
              <p className="text-sm text-slate-400 mt-2">
                צור תבניות חדשות בספריית העיצוב
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 py-4">
              {filteredTemplates.map((template, index) => {
                const isSelected = selectedTemplateId === template.id;
                return (
                  <motion.div
                    key={template.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => setSelectedTemplateId(template.id)}
                    className={`relative cursor-pointer rounded-xl border-2 overflow-hidden transition-all ${
                      isSelected
                        ? 'border-cyan-500 ring-2 ring-cyan-200'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Preview Thumbnail */}
                    <div 
                      className="h-32 bg-gradient-to-br from-slate-50 to-slate-100 relative"
                      style={{ 
                        borderBottom: `3px solid ${template.styling?.primary_color || '#4338ca'}` 
                      }}
                    >
                      <div className="absolute inset-3 bg-white rounded-lg shadow-sm border border-slate-100 p-2 overflow-hidden">
                        <div 
                          className="h-1.5 w-12 rounded mb-1.5"
                          style={{ backgroundColor: template.styling?.primary_color || '#4338ca' }}
                        />
                        <div className="h-1 w-full bg-slate-100 rounded mb-0.5" />
                        <div className="h-1 w-3/4 bg-slate-100 rounded mb-2" />
                        <div className="h-6 bg-slate-50 rounded" />
                      </div>
                      
                      {/* Selection Indicator */}
                      {isSelected && (
                        <div className="absolute top-2 left-2 w-6 h-6 bg-cyan-500 rounded-full flex items-center justify-center">
                          <Check className="w-4 h-4 text-white" />
                        </div>
                      )}

                      {/* Default Badge */}
                      {template.is_default && (
                        <div className="absolute top-2 right-2">
                          <Badge className="bg-amber-100 text-amber-700 text-xs">
                            <Star className="w-3 h-3 ml-1" />
                            ברירת מחדל
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-3">
                      <h3 className="font-semibold text-slate-900 text-sm truncate">
                        {template.name}
                      </h3>
                      {template.description && (
                        <p className="text-xs text-slate-500 mt-1 line-clamp-1">
                          {template.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                        <span>{(template.sections?.length || 0) + (template.items?.length || 0)} פריטים</span>
                        <span>•</span>
                        <span>{template.usage_count || 0} שימושים</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1">
            ביטול
          </Button>
          <Button
            onClick={handleSelect}
            disabled={!selectedTemplateId}
            className="flex-1 bg-cyan-600 hover:bg-cyan-700"
          >
            <Check className="w-4 h-4 ml-2" />
            בחר תבנית
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}